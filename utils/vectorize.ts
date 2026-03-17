type Point = { x: number; y: number };

export type VectorizeOptions = {
  threshold: number;
  maxSize: number;
  smoothing: number;
  invert?: boolean;
  fill?: string;
};

export type VectorizeResult = {
  svg: string;
  width: number;
  height: number;
  paths: number;
};

const svgNamespace = "http://www.w3.org/2000/svg";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function pointsEqual(a: Point, b: Point) {
  return a.x === b.x && a.y === b.y;
}

function formatNumber(value: number) {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? `${rounded}` : `${rounded}`;
}

function simplifyRdp(points: Point[], epsilon: number) {
  if (points.length <= 2 || epsilon <= 0) return points;
  const sqEpsilon = epsilon * epsilon;
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;

  const stack: Array<[number, number]> = [[0, points.length - 1]];

  const getSqSegDist = (p: Point, a: Point, b: Point) => {
    let x = a.x;
    let y = a.y;
    let dx = b.x - a.x;
    let dy = b.y - a.y;

    if (dx !== 0 || dy !== 0) {
      const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy);
      if (t > 1) {
        x = b.x;
        y = b.y;
      } else if (t > 0) {
        x += dx * t;
        y += dy * t;
      }
    }

    dx = p.x - x;
    dy = p.y - y;
    return dx * dx + dy * dy;
  };

  while (stack.length > 0) {
    const [first, last] = stack.pop() as [number, number];
    let maxSqDist = 0;
    let index = 0;
    const start = points[first];
    const end = points[last];

    for (let i = first + 1; i < last; i += 1) {
      const sqDist = getSqSegDist(points[i], start, end);
      if (sqDist > maxSqDist) {
        index = i;
        maxSqDist = sqDist;
      }
    }

    if (maxSqDist > sqEpsilon) {
      keep[index] = 1;
      stack.push([first, index], [index, last]);
    }
  }

  return points.filter((_, index) => keep[index] === 1);
}

async function loadRasterImage(file: File): Promise<HTMLImageElement> {
  const src = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

function buildSegments(mask: Uint8Array, width: number, height: number) {
  const segments: Array<{ start: Point; end: Point }> = [];
  const get = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return 0;
    return mask[y * width + x];
  };

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (get(x, y) !== 1) continue;
      if (get(x, y - 1) === 0) {
        segments.push({ start: { x, y }, end: { x: x + 1, y } });
      }
      if (get(x + 1, y) === 0) {
        segments.push({
          start: { x: x + 1, y },
          end: { x: x + 1, y: y + 1 }
        });
      }
      if (get(x, y + 1) === 0) {
        segments.push({
          start: { x: x + 1, y: y + 1 },
          end: { x, y: y + 1 }
        });
      }
      if (get(x - 1, y) === 0) {
        segments.push({ start: { x, y: y + 1 }, end: { x, y } });
      }
    }
  }

  return segments;
}

function segmentsToPaths(segments: Array<{ start: Point; end: Point }>) {
  const startMap = new Map<string, Array<{ start: Point; end: Point }>>();
  const key = (point: Point) => `${point.x},${point.y}`;

  segments.forEach((segment) => {
    const startKey = key(segment.start);
    const list = startMap.get(startKey);
    if (list) {
      list.push(segment);
    } else {
      startMap.set(startKey, [segment]);
    }
  });

  const used = new Set<{ start: Point; end: Point }>();
  const paths: Point[][] = [];

  for (const segment of segments) {
    if (used.has(segment)) continue;
    used.add(segment);

    const points: Point[] = [segment.start, segment.end];
    let current = segment.end;
    const start = segment.start;

    while (!pointsEqual(current, start)) {
      const list = startMap.get(key(current));
      if (!list || list.length === 0) break;
      const next = list.pop();
      if (!next || used.has(next)) continue;
      used.add(next);
      points.push(next.end);
      current = next.end;
    }

    if (points.length > 2 && pointsEqual(points[0], points[points.length - 1])) {
      paths.push(points);
    }
  }

  return paths;
}

export async function rasterToSvg(
  file: File,
  options: VectorizeOptions
): Promise<VectorizeResult> {
  const image = await loadRasterImage(file);
  const width = image.naturalWidth || 1;
  const height = image.naturalHeight || 1;
  const maxSize = Math.max(16, options.maxSize);
  const scale = Math.min(1, maxSize / Math.max(width, height));
  const scaledWidth = Math.max(1, Math.round(width * scale));
  const scaledHeight = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = scaledWidth;
  canvas.height = scaledHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas not supported.");
  }

  ctx.drawImage(image, 0, 0, scaledWidth, scaledHeight);

  const imageData = ctx.getImageData(0, 0, scaledWidth, scaledHeight);
  const mask = new Uint8Array(scaledWidth * scaledHeight);
  const threshold = clamp(options.threshold, 0, 255);
  const invert = options.invert ?? false;

  for (let i = 0; i < imageData.data.length; i += 4) {
    const r = imageData.data[i];
    const g = imageData.data[i + 1];
    const b = imageData.data[i + 2];
    const a = imageData.data[i + 3] / 255;
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const isOpaque = a > 0.05;
    const isDark = luminance < threshold;
    const value = isOpaque && (invert ? !isDark : isDark);
    mask[i / 4] = value ? 1 : 0;
  }

  const segments = buildSegments(mask, scaledWidth, scaledHeight);
  const paths = segmentsToPaths(segments);

  const scaleUp = 1 / scale;
  const smoothing = clamp(options.smoothing, 0, 6);
  const fill = options.fill ?? "#0b0b0b";

  const pathData = paths
    .map((path) => {
      const closed = pointsEqual(path[0], path[path.length - 1]);
      const rawPoints = closed ? path.slice(0, -1) : path;
      const simplified = simplifyRdp(rawPoints, smoothing);
      if (simplified.length < 3) return "";
      const scaled = simplified.map((point) => ({
        x: point.x * scaleUp,
        y: point.y * scaleUp
      }));
      const commands = scaled
        .map((point, index) =>
          `${index === 0 ? "M" : "L"} ${formatNumber(point.x)} ${formatNumber(point.y)}`
        )
        .join(" ");
      return `${commands} Z`;
    })
    .filter(Boolean);

  const pathString = pathData.join(" ");
  const svg = `<svg xmlns="${svgNamespace}" viewBox="0 0 ${formatNumber(
    width
  )} ${formatNumber(height)}" width="${formatNumber(width)}" height="${formatNumber(
    height
  )}" fill="${fill}" fill-rule="evenodd" shape-rendering="geometricPrecision">${
    pathString ? `<path d="${pathString}" />` : ""
  }</svg>`;

  return {
    svg,
    width,
    height,
    paths: pathData.length
  };
}
