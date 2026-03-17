"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import UploadDropZone from "@/components/UploadDropZone";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { rasterToSvg } from "@/utils/vectorize";

export default function PngToSvgConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resolution, setResolution] = useState<{ width: number; height: number } | null>(null);
  const [threshold, setThreshold] = useState(160);
  const [smoothing, setSmoothing] = useState(1.2);
  const [maxSize, setMaxSize] = useState(768);
  const [invert, setInvert] = useState(false);
  const [svg, setSvg] = useState<string | null>(null);
  const [stats, setStats] = useState<{ width: number; height: number; paths: number } | null>(
    null
  );
  const [isConverting, setIsConverting] = useState(false);
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

  const handleConvert = useCallback(async () => {
    if (!file) return;
    const currentRun = (runId.current += 1);
    setIsConverting(true);
    try {
      const result = await rasterToSvg(file, {
        threshold,
        smoothing,
        maxSize,
        invert,
        fill: "#0b0b0b"
      });
      if (runId.current !== currentRun) return;
      setSvg(result.svg);
      setStats({ width: result.width, height: result.height, paths: result.paths });
    } catch (error) {
      if (runId.current !== currentRun) return;
      console.error(error);
      setSvg(null);
      setStats(null);
    } finally {
      if (runId.current === currentRun) {
        setIsConverting(false);
      }
    }
  }, [file, threshold, smoothing, maxSize, invert]);

  useEffect(() => {
    if (!file) {
      setSvg(null);
      setStats(null);
      return;
    }
    const timer = window.setTimeout(() => {
      void handleConvert();
    }, 300);
    return () => window.clearTimeout(timer);
  }, [file, threshold, smoothing, maxSize, invert, handleConvert]);

  const svgUrl = useMemo(() => {
    if (!svg) return null;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }, [svg]);

  const handleDownload = useCallback(() => {
    if (!svg || !file) return;
    const name = file.name.replace(/\.png$/i, "");
    const blob = new Blob([svg], { type: "image/svg+xml" });
    import("file-saver").then((module) => {
      const saver =
        "saveAs" in module && typeof module.saveAs === "function"
          ? module.saveAs
          : typeof module.default === "function"
            ? module.default
            : null;
      if (saver) {
        saver(blob, `${name}.svg`);
      } else {
        console.error("file-saver export missing saveAs function.");
      }
    });
  }, [svg, file]);

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-6">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Upload PNG</h2>
              <span className="text-[11px] text-muted">PNG only</span>
            </div>
            <div className="mt-4">
              <UploadDropZone
                file={file}
                previewUrl={previewUrl}
                resolution={resolution}
                accept="image/png"
                allowedExtensions={[".png"]}
                prompt="Drag & drop PNG"
                promptActive="Upload another PNG"
                hint="High contrast PNGs vectorize best."
                onFileSelect={(selected) => {
                  setFile(selected);
                }}
                onClear={() => {
                  setFile(null);
                  setSvg(null);
                  setStats(null);
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Vector Settings</h2>
              <span className="text-[11px] text-muted">Live trace</span>
            </div>
            <p className="mt-2 text-xs text-muted">
              Adjust the threshold and smoothing to match your PNG. Updates run automatically.
            </p>
            <div className="mt-4 grid gap-4">
              <label className="grid gap-2 text-xs text-white">
                <span className="flex items-center justify-between text-[11px] text-muted">
                  Threshold
                  <span className="text-white">{threshold}</span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={255}
                  value={threshold}
                  onChange={(event) => setThreshold(Number(event.target.value))}
                  className="h-2 w-full cursor-pointer accent-accent"
                />
              </label>

              <label className="grid gap-2 text-xs text-white">
                <span className="flex items-center justify-between text-[11px] text-muted">
                  Smoothing
                  <span className="text-white">{smoothing.toFixed(1)}</span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={6}
                  step={0.2}
                  value={smoothing}
                  onChange={(event) => setSmoothing(Number(event.target.value))}
                  className="h-2 w-full cursor-pointer accent-accent"
                />
              </label>

              <label className="grid gap-2 text-xs text-white">
                <span className="flex items-center justify-between text-[11px] text-muted">
                  Trace Detail
                  <span className="text-white">{maxSize}px</span>
                </span>
                <input
                  type="range"
                  min={256}
                  max={1400}
                  step={64}
                  value={maxSize}
                  onChange={(event) => setMaxSize(Number(event.target.value))}
                  className="h-2 w-full cursor-pointer accent-accent"
                />
              </label>

              <label className="flex items-center justify-between rounded-2xl border border-border bg-white/4 px-4 py-2 text-xs text-white">
                <span>Invert colors</span>
                <Checkbox checked={invert} onCheckedChange={() => setInvert((value) => !value)} />
              </label>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">SVG Preview</h2>
            <p className="mt-1 text-xs text-muted">
              Download the vector once it looks right.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button
              variant="secondary"
              onClick={() => void handleConvert()}
              disabled={!file || isConverting}
              size="lg"
              className="w-full sm:min-w-[180px]"
            >
              {isConverting ? "Tracing..." : "Re-Trace"}
            </Button>
            <Button
              onClick={handleDownload}
              disabled={!svg || isConverting}
              size="lg"
              className="w-full sm:min-w-[180px]"
            >
              Download SVG
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.6fr]">
          <div className="flex min-h-56 items-center justify-center rounded-2xl border border-border bg-white/4 p-4">
            {svgUrl ? (
              <img src={svgUrl} alt="SVG preview" className="max-h-64 w-auto" />
            ) : (
              <p className="text-xs text-muted">Upload a PNG to generate the SVG preview.</p>
            )}
          </div>
          <div className="grid gap-3 rounded-2xl border border-border bg-white/4 p-4 text-xs text-muted">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted/70">
                Output Details
              </p>
              <div className="mt-2 grid gap-1 text-xs text-white">
                <span>{stats ? `${stats.width}×${stats.height}` : "—"}</span>
                <span>{stats ? `${stats.paths} path${stats.paths === 1 ? "" : "s"}` : "—"}</span>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-surface-strong px-3 py-2 text-[10px] text-muted">
              {svg ? svg.slice(0, 240) + (svg.length > 240 ? "…" : "") : "SVG markup preview."}
            </div>
            <p className="text-[11px] text-muted">
              Tip: Reduce smoothing to keep sharp corners. Increase threshold to capture light
              details.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
