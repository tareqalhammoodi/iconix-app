"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState } from "react";
import { saveAs } from "file-saver";
import ActionButton from "@/components/ActionButton";
import UploadDropZone from "@/components/UploadDropZone";
import { Card } from "@/components/ui/card";
import { useImagePreview, useObjectUrl } from "@/hooks/useImagePreview";
import { convertImageToWebp } from "@/utils/webp";

interface ConvertedAsset {
  blob: Blob;
  width: number;
  height: number;
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
  const [converted, setConverted] = useState<ConvertedAsset | null>(null);
  const [quality, setQuality] = useState(92);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const runId = useRef(0);
  const { previewUrl, resolution } = useImagePreview(file);
  const convertedPreviewUrl = useObjectUrl(converted?.blob ?? null);

  const handleConvert = useCallback(async () => {
    if (!file) return;

    const currentRun = (runId.current += 1);
    setIsConverting(true);
    setError(null);

    try {
      const result = await convertImageToWebp(file, quality);

      if (runId.current !== currentRun) return;

      setConverted(result);
    } catch (conversionError) {
      if (runId.current !== currentRun) return;
      console.error(conversionError);
      setConverted(null);
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
      setConverted(null);
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
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Upload Image</h2>
              <span className="text-[11px] text-muted">PNG, JPG, GIF, BMP, TIFF, SVG</span>
            </div>
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
                hint="Drop an image in and it will convert to WebP automatically."
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

          <div className="grid gap-3">
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

            <div className="rounded-2xl border border-border bg-white/4 p-3.25">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="pb-2 text-base font-semibold text-white">Quick Result</h2>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-surface-strong p-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted/70">
                    Original
                  </p>
                  <p className="text-sm font-semibold text-white">
                    {file ? formatBytes(file.size) : "—"}
                  </p>
                  <p className="text-[11px] text-muted">
                    {resolution ? `${resolution.width}×${resolution.height}` : "No file selected"}
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-surface-strong p-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-muted/70">WebP</p>
                  <p className="text-sm font-semibold text-white">
                    {converted ? formatBytes(converted.blob.size) : "—"}
                  </p>
                  <p className="text-[11px] text-muted">
                    {converted ? `${converted.width}×${converted.height}` : "Preview pending"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Preview</h2>
              <p className="mt-1 text-xs text-muted">
                Compare the uploaded image with the converted WebP output below.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <ActionButton
                onClick={() => void handleConvert()}
                disabled={!file || isConverting}
                variant="secondary"
                isLoading={isConverting}
                loadingLabel="Converting..."
                label="Refresh Preview"
                size="lg"
                className="sm:min-w-45"
              />
              <ActionButton
                onClick={handleDownload}
                disabled={!converted || isConverting}
                label="Download WebP"
                size="lg"
                className="sm:min-w-45"
              />
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
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
                {convertedPreviewUrl ? (
                  <img
                    src={convertedPreviewUrl}
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
      </Card>
    </div>
  );
}
