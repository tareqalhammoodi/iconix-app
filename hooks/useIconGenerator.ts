import { useCallback } from "react";
import pica from "pica";
import {
  platformTargets,
  flutterIosSpecs,
  type IconTarget,
  type PlatformKey
} from "@/lib/icon-presets";
import { createIcoFromPngs } from "@/utils/ico";

export type GeneratedAsset = IconTarget & {
  dataUrl: string;
  blob: Blob;
};

export type GeneratedFile = {
  path: string;
  blob: Blob;
  platform: PlatformKey;
  kind: "image" | "json" | "ico";
  label: string;
  size?: number;
};

const picaInstance = pica();
const svgMime = "image/svg+xml";

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  const isSvg = file.type === svgMime || file.name.toLowerCase().endsWith(".svg");
  let objectUrl = "";

  const src = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    if (isSvg) {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
  });

  const imageSrc = isSvg
    ? (() => {
        const blob = new Blob([src], { type: svgMime });
        objectUrl = URL.createObjectURL(blob);
        return objectUrl;
      })()
    : src;

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = imageSrc;
  });

  if (objectUrl) {
    URL.revokeObjectURL(objectUrl);
  }

  return image;
}

function createSquareCanvas(image: HTMLImageElement): HTMLCanvasElement {
  const safeWidth = image.naturalWidth || 1024;
  const safeHeight = image.naturalHeight || 1024;
  const size = Math.max(safeWidth, safeHeight);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, size, size);
    const offsetX = (size - safeWidth) / 2;
    const offsetY = (size - safeHeight) / 2;
    ctx.drawImage(image, offsetX, offsetY, safeWidth, safeHeight);
  }
  return canvas;
}

async function resizeToBlob(
  source: HTMLCanvasElement,
  size: number
): Promise<{ blob: Blob; dataUrl: string }> {
  const pixelSize = Math.max(1, Math.round(size));
  const canvas = document.createElement("canvas");
  canvas.width = pixelSize;
  canvas.height = pixelSize;

  await picaInstance.resize(source, canvas, {
    unsharpAmount: 80,
    unsharpRadius: 0.6,
    unsharpThreshold: 2
  });

  const blob = await picaInstance.toBlob(canvas, "image/png");
  const dataUrl = await blobToDataUrl(blob);
  return { blob, dataUrl };
}

function flutterContentsJson(
  items: { filename: string; size: number; scale: number; idiom: string }[]
) {
  return {
    images: items.map((item) => ({
      filename: item.filename,
      idiom: item.idiom,
      scale: `${item.scale}x`,
      size: `${item.size}x${item.size}`
    })),
    info: {
      author: "xcode",
      version: 1
    }
  };
}

export function useIconGenerator() {
  const generate = useCallback(
    async (
      file: File,
      platforms: PlatformKey[]
    ): Promise<{ assets: GeneratedAsset[]; files: GeneratedFile[] }> => {
      // Decode and normalize the source image into a centered square canvas.
      const image = await loadImage(file);
      const baseCanvas = createSquareCanvas(image);

      const targets: IconTarget[] = platforms.flatMap(
        (platform) => platformTargets[platform] || []
      );

      const assets: GeneratedAsset[] = [];
      const files: GeneratedFile[] = [];

      // Generate PNGs for every selected platform/size.
      for (const target of targets) {
        const { blob, dataUrl } = await resizeToBlob(baseCanvas, target.size);
        assets.push({ ...target, blob, dataUrl });
        files.push({
          path: `${target.directory}/${target.filename}`,
          blob,
          platform: target.platform,
          kind: "image",
          label: target.label,
          size: target.size
        });
      }

      if (platforms.includes("web")) {
        // Build a favicon.ico using the 16px and 32px PNGs.
        const faviconSources = files.filter(
          (file) => file.platform === "web" && (file.size === 16 || file.size === 32)
        );

        if (faviconSources.length > 0) {
          const icoBlob = await createIcoFromPngs(
            faviconSources.map((file) => ({
              size: file.size ?? 16,
              blob: file.blob
            }))
          );

          files.push({
            path: "web/favicon.ico",
            blob: icoBlob,
            platform: "web",
            kind: "ico",
            label: "favicon.ico"
          });
        }

        const manifest = {
          name: "Iconix - Icon Maker",
          short_name: "Iconix",
          icons: [
            {
              src: "android-chrome-192x192.png",
              sizes: "192x192",
              type: "image/png"
            },
            {
              src: "android-chrome-512x512.png",
              sizes: "512x512",
              type: "image/png"
            }
          ],
          theme_color: "#0a0a0a",
          background_color: "#0a0a0a",
          display: "standalone"
        };

        const manifestBlob = new Blob([JSON.stringify(manifest, null, 2)], {
          type: "application/json"
        });
        files.push({
          path: "web/manifest.json",
          blob: manifestBlob,
          platform: "web",
          kind: "json",
          label: "manifest.json"
        });

        const siteManifestBlob = new Blob(
          [JSON.stringify({ name: "Iconix - Icon Maker", short_name: "Iconix" }, null, 2)],
          { type: "application/manifest+json" }
        );
        files.push({
          path: "web/site.webmanifest",
          blob: siteManifestBlob,
          platform: "web",
          kind: "json",
          label: "site.webmanifest"
        });
      }

      if (platforms.includes("flutter")) {
        // Create the iOS AppIcon.appiconset + Contents.json for Flutter projects.
        const flutterIosItems: {
          filename: string;
          size: number;
          scale: number;
          idiom: string;
          blob: Blob;
        }[] = [];

        for (const spec of flutterIosSpecs) {
          const pixelSize = spec.size * spec.scale;
          const { blob } = await resizeToBlob(baseCanvas, pixelSize);
          const filename = `Icon-App-${spec.size}x${spec.size}@${spec.scale}x.png`;
          const idiom = spec.size === 1024 ? "ios-marketing" : spec.size >= 76 ? "ipad" : "iphone";
          flutterIosItems.push({
            filename,
            size: spec.size,
            scale: spec.scale,
            idiom,
            blob
          });

          files.push({
            path: `flutter/ios/Runner/Assets.xcassets/AppIcon.appiconset/${filename}`,
            blob,
            platform: "flutter",
            kind: "image",
            label: filename,
            size: pixelSize
          });
        }

        const contents = flutterContentsJson(flutterIosItems);
        const contentsBlob = new Blob([JSON.stringify(contents, null, 2)], {
          type: "application/json"
        });
        files.push({
          path: "flutter/ios/Runner/Assets.xcassets/AppIcon.appiconset/Contents.json",
          blob: contentsBlob,
          platform: "flutter",
          kind: "json",
          label: "Contents.json"
        });
      }

      return { assets, files };
    },
    []
  );

  return { generate };
}
