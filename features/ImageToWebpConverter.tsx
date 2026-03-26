"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState } from "react";
import { saveAs } from "file-saver";
import UploadDropZone from "@/components/UploadDropZone";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ConvertedAsset {
  blob: Blob;
  previewUrl: string;
  width: number;
  height: number;
}

async function loadImageElement(file: File) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const nextImage = new Image();
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = () => reject(new Error("The selected image could not be loaded."));
      nextImage.src = objectUrl;
    });

    return {
      image,
      width: image.naturalWidth,
      height: image.naturalHeight
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getDownloadName(file: File) {
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return `${baseName || "converted-image"}.webp`;
}

export default function ImageToWebpConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resolution, setResolution] = useState<{ width: number; height: number } | null>(null);
  const [converted, setConverted] = useState<ConvertedAsset | null>(null);
  const [quality, setQuality] = useState(92);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const runId = useRef(0);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      setResolution(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    const img = new Image();
    img.onload = () => {
      setResolution({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = url;

    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    return () => {
      if (converted?.previewUrl) {
        URL.revokeObjectURL(converted.previewUrl);
      }
    };
  }, [converted]);

  const handleConvert = useCallback(async () => {
    if (!file) return;

    const currentRun = (runId.current += 1);
    setIsConverting(true);
    setError(null);

    try {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Canvas is not available in this browser.");
      }

      if (typeof createImageBitmap === "function") {
        const bitmap = await createImageBitmap(file);
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        context.drawImage(bitmap, 0, 0);
        bitmap.close();
      } else {
        const image = await loadImageElement(file);
        canvas.width = image.width;
        canvas.height = image.height;
        context.drawImage(image.image, 0, 0, image.width, image.height);
      }

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((nextBlob) => resolve(nextBlob), "image/webp", quality / 100);
      });

      if (!blob) {
        throw new Error("WebP conversion failed. Try another image.");
      }

      if (runId.current !== currentRun) return;

      setConverted((current) => {
        if (current?.previewUrl) {
          URL.revokeObjectURL(current.previewUrl);
        }

        return {
          blob,
          previewUrl: URL.createObjectURL(blob),
          width: canvas.width,
          height: canvas.height
        };
      });
    } catch (conversionError) {
      if (runId.current !== currentRun) return;
      console.error(conversionError);
      setConverted((current) => {
        if (current?.previewUrl) {
          URL.revokeObjectURL(current.previewUrl);
        }
        return null;
      });
      setError(
        conversionError instanceof Error
          ? conversionError.message
          : "Something went wrong while converting the image."
      );
    } finally {
      if (runId.current === currentRun) {
        setIsConverting(false);
      }
    }
  }, [file, quality]);

  useEffect(() => {
    if (!file) {
      setConverted((current) => {
        if (current?.previewUrl) {
          URL.revokeObjectURL(current.previewUrl);
        }
        return null;
      });
      setError(null);
      return;
    }

    const timer = window.setTimeout(() => {
      void handleConvert();
    }, 180);

    return () => window.clearTimeout(timer);
  }, [file, quality, handleConvert]);

  const handleDownload = useCallback(() => {
    if (!file || !converted) return;
    saveAs(converted.blob, getDownloadName(file));
  }, [converted, file]);

  const savings =
    file && converted ? Math.round((1 - converted.blob.size / file.size) * 100) : null;
  const qualityLabel =
    quality >= 95 ? "Best detail" : quality >= 80 ? "Balanced" : "Smaller file";

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-6">
        <div className="grid gap-6">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-white">Upload Image</h2>
                <span className="text-[11px] text-muted">PNG, JPG, GIF, BMP, TIFF, SVG</span>
              </div>
              <p className="mt-2 text-xs text-muted">
                Drop an image in and it will convert to WebP automatically.
              </p>
              <div className="mt-4">
                <UploadDropZone
                  file={file}
                  previewUrl={previewUrl}
                  resolution={resolution}
                  accept="image/png,image/jpeg,image/jpg,image/gif,image/bmp,image/tiff,image/svg+xml"
                  allowedExtensions={[
                    ".png",
                    ".jpg",
                    ".jpeg",
                    ".gif",
                    ".bmp",
                    ".tif",
                    ".tiff",
                    ".svg"
                  ]}
                  prompt="Drag & drop an image"
                  promptActive="Upload another image"
                  hint="Fast conversion with no extra setup."
                  onFileSelect={(selected) => {
                    setFile(selected);
                    setError(null);
                  }}
                  onClear={() => {
                    setFile(null);
                    setError(null);
                  }}
                />
              </div>
            </div>

            <div className="grid gap-4">
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-white">WebP Settings</h2>
                  <span className="text-[11px] text-muted">{quality}% quality</span>
                </div>
                <p className="mt-2 text-xs text-muted">
                  Adjust the quality to balance file size and image detail. Updates run
                  automatically.
                </p>

                <div className="mt-4 grid gap-4">
                  <label className="grid gap-2 text-xs text-white">
                    <span className="flex items-center justify-between text-[11px] text-muted">
                      Quality
                      <span className="text-white">{qualityLabel}</span>
                    </span>
                    <input
                      type="range"
                      min={40}
                      max={100}
                      step={1}
                      value={quality}
                      onChange={(event) => setQuality(Number(event.target.value))}
                      className="h-2 w-full cursor-pointer accent-accent"
                    />
                  </label>

                  <div className="flex items-center justify-between rounded-2xl border border-border bg-white/4 px-4 py-3 text-[11px] text-muted">
                    <span>Smaller size</span>
                    <span className="text-white">{quality}%</span>
                    <span>Sharper image</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-white/4 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-white pb-2">Quick Result</h2>
                  </div>
                  <div className="rounded-full border border-border bg-surface-strong px-3 py-1 text-[11px] text-muted">
                    {isConverting ? "Processing..." : converted ? "Ready" : "Waiting"}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-surface-strong p-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted/70">
                      Original
                    </p>
                    <p className="mt-2 text-sm font-semibold text-white">
                      {file ? formatBytes(file.size) : "—"}
                    </p>
                    <p className="mt-1 text-[11px] text-muted">
                      {resolution ? `${resolution.width}×${resolution.height}` : "No file selected"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border bg-surface-strong p-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted/70">WebP</p>
                    <p className="mt-2 text-sm font-semibold text-white">
                      {converted ? formatBytes(converted.blob.size) : "—"}
                    </p>
                    <p className="mt-1 text-[11px] text-muted">
                      {converted ? `${converted.width}×${converted.height}` : "Preview pending"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 rounded-2xl border border-border bg-white/4 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">Preview</h2>
                <p className="mt-1 text-xs text-muted">
                  Compare the uploaded image with the converted WebP output below.
                </p>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <Button
                  onClick={() => void handleConvert()}
                  disabled={!file || isConverting}
                  variant="secondary"
                  size="lg"
                  className="w-full sm:min-w-45"
                >
                  {isConverting ? "Converting..." : "Refresh Preview"}
                </Button>
                <Button
                  onClick={handleDownload}
                  disabled={!converted || isConverting}
                  size="lg"
                  className="w-full sm:min-w-45"
                >
                  Download WebP
                </Button>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-border bg-surface-strong p-4">
                <p className="text-sm font-semibold text-white">Original</p>
                <div className="mt-3 flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-border bg-white/4 p-4">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Original preview"
                      className="max-h-72 w-auto rounded-xl object-contain"
                    />
                  ) : (
                    <p className="max-w-xs text-center text-xs text-muted">
                      Upload an image to preview the original file.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-surface-strong p-4">
                <p className="text-sm font-semibold text-white">Converted WebP</p>
                <div className="mt-3 flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-border bg-white/4 p-4">
                  {converted?.previewUrl ? (
                    <img
                      src={converted.previewUrl}
                      alt="Converted WebP preview"
                      className="max-h-72 w-auto rounded-xl object-contain"
                    />
                  ) : (
                    <p className="max-w-xs text-center text-xs text-muted">
                      Upload an image to see the converted WebP preview here.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface-strong p-3 text-[11px] text-muted">
              {error
                ? error
                : savings !== null
                  ? savings >= 0
                    ? `Estimated size reduction: ${savings}% smaller than the original file at ${quality}% quality.`
                    : `Converted file is ${Math.abs(savings)}% larger than the original at ${quality}% quality, but it is ready in WebP format.`
                  : "One click is all it takes once the preview is ready."}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
