"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { saveAs } from "file-saver";
import ActionButton from "@/components/ActionButton";
import { Card } from "@/components/ui/card";
import UploadDropZone from "@/components/UploadDropZone";
import { Checkbox } from "@/components/ui/checkbox";
import { useImagePreview } from "@/hooks/useImagePreview";
import { rasterToSvg } from "@/utils/vectorize";

type VectorSettings = {
  threshold: number;
  smoothing: number;
  maxSize: number;
  invert: boolean;
};

type SvgResult = {
  markup: string;
  width: number;
  height: number;
  paths: number;
};

const defaultSettings: VectorSettings = {
  threshold: 160,
  smoothing: 1.2,
  maxSize: 768,
  invert: false
};

export default function PngToSvgConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [settings, setSettings] = useState<VectorSettings>(defaultSettings);
  const [result, setResult] = useState<SvgResult | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const runId = useRef(0);
  const { previewUrl, resolution } = useImagePreview(file);

  const updateSetting = useCallback(
    <K extends keyof VectorSettings>(key: K, value: VectorSettings[K]) => {
      setSettings((current) => ({ ...current, [key]: value }));
    },
    []
  );

  const handleConvert = useCallback(async () => {
    if (!file) return;
    const currentRun = (runId.current += 1);
    setIsConverting(true);
    try {
      const result = await rasterToSvg(file, {
        threshold: settings.threshold,
        smoothing: settings.smoothing,
        maxSize: settings.maxSize,
        invert: settings.invert,
        fill: "#0b0b0b"
      });
      if (runId.current !== currentRun) return;
      setResult({
        markup: result.svg,
        width: result.width,
        height: result.height,
        paths: result.paths
      });
    } catch (error) {
      if (runId.current !== currentRun) return;
      console.error(error);
      setResult(null);
    } finally {
      if (runId.current === currentRun) {
        setIsConverting(false);
      }
    }
  }, [file, settings]);

  useEffect(() => {
    if (!file) {
      setResult(null);
      return;
    }
    const timer = window.setTimeout(() => {
      void handleConvert();
    }, 300);
    return () => window.clearTimeout(timer);
  }, [file, settings, handleConvert]);

  const svgUrl = useMemo(() => {
    if (!result?.markup) return null;
    return `data:image/svg+xml;utf8,${encodeURIComponent(result.markup)}`;
  }, [result]);

  const handleDownload = useCallback(() => {
    if (!result?.markup || !file) return;
    const name = file.name.replace(/\.png$/i, "");
    const blob = new Blob([result.markup], { type: "image/svg+xml" });
    saveAs(blob, `${name}.svg`);
  }, [result, file]);

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
                  setResult(null);
                }}
                onClear={() => {
                  setFile(null);
                  setResult(null);
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
                  <span className="text-white">{settings.threshold}</span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={255}
                  value={settings.threshold}
                  onChange={(event) => updateSetting("threshold", Number(event.target.value))}
                  className="h-2 w-full cursor-pointer accent-accent"
                />
              </label>

              <label className="grid gap-2 text-xs text-white">
                <span className="flex items-center justify-between text-[11px] text-muted">
                  Smoothing
                  <span className="text-white">{settings.smoothing.toFixed(1)}</span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={6}
                  step={0.2}
                  value={settings.smoothing}
                  onChange={(event) => updateSetting("smoothing", Number(event.target.value))}
                  className="h-2 w-full cursor-pointer accent-accent"
                />
              </label>

              <label className="grid gap-2 text-xs text-white">
                <span className="flex items-center justify-between text-[11px] text-muted">
                  Trace Detail
                  <span className="text-white">{settings.maxSize}px</span>
                </span>
                <input
                  type="range"
                  min={256}
                  max={1400}
                  step={64}
                  value={settings.maxSize}
                  onChange={(event) => updateSetting("maxSize", Number(event.target.value))}
                  className="h-2 w-full cursor-pointer accent-accent"
                />
              </label>

              <label className="flex items-center justify-between rounded-2xl border border-border bg-white/4 px-4 py-2 text-xs text-white">
                <span>Invert colors</span>
                <Checkbox
                  checked={settings.invert}
                  onCheckedChange={() => updateSetting("invert", !settings.invert)}
                />
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
            <ActionButton
              variant="secondary"
              onClick={() => void handleConvert()}
              disabled={!file || isConverting}
              isLoading={isConverting}
              loadingLabel="Tracing..."
              label="Re-Trace"
              size="lg"
              className="sm:min-w-45"
            />
            <ActionButton
              onClick={handleDownload}
              disabled={!result || isConverting}
              label="Download SVG"
              size="lg"
              className="sm:min-w-45"
            />
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
                <span>{result ? `${result.width}×${result.height}` : "—"}</span>
                <span>
                  {result ? `${result.paths} path${result.paths === 1 ? "" : "s"}` : "—"}
                </span>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-surface-strong px-3 py-2 text-[10px] text-muted">
              {result?.markup
                ? result.markup.slice(0, 240) + (result.markup.length > 240 ? "…" : "")
                : "SVG markup preview."}
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
