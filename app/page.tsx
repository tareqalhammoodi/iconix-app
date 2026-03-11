"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import UploadDropZone from "@/components/UploadDropZone";
import PlatformSelector from "@/components/PlatformSelector";
import PreviewGrid from "@/components/PreviewGrid";
import GenerateButton from "@/components/GenerateButton";
import { Card } from "@/components/ui/card";
import { useIconGenerator, type GeneratedAsset } from "@/hooks/useIconGenerator";
import { type PlatformKey } from "@/lib/icon-presets";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const defaultPlatforms: PlatformKey[] = [
  "iphone",
  "ipad",
  "watchos",
  "macos",
  "android",
  "web",
  "flutter"
];

export default function HomePage() {
  const { generate } = useIconGenerator();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resolution, setResolution] = useState<{ width: number; height: number } | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformKey[]>(defaultPlatforms);
  const [assets, setAssets] = useState<GeneratedAsset[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

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

  const handleGenerate = async () => {
    if (!file || selectedPlatforms.length === 0) return;
    setIsGenerating(true);
    try {
      const result = await generate(file, selectedPlatforms);
      setAssets(result.assets);
      const zip = new JSZip();
      result.files.forEach((file) => {
        zip.file(file.path, file.blob);
      });
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, "icons.zip");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen px-5 pb-14 pt-8 md:px-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <Header />

        <Card className="p-6">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-white">Upload</h2>
                <span className="text-[11px] text-muted">PNG or SVG</span>
              </div>
              <div className="mt-4">
                <UploadDropZone
                  file={file}
                  previewUrl={previewUrl}
                  resolution={resolution}
                  onFileSelect={(selected) => {
                    setFile(selected);
                    setAssets([]);
                  }}
                  onClear={() => {
                    setFile(null);
                    setAssets([]);
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-white">Platforms</h2>
                <span className="text-[11px] text-muted">
                  {selectedPlatforms.length} selected
                </span>
              </div>
              <p className="mt-2 text-xs text-muted">
                Choose the outputs you need. ZIP folders follow common generator conventions.
              </p>
              <div className="mt-4">
                <PlatformSelector
                  selected={selectedPlatforms}
                  onToggle={(platform) => {
                    setSelectedPlatforms((current) =>
                      current.includes(platform)
                        ? current.filter((item) => item !== platform)
                        : [...current, platform]
                    );
                  }}
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Preview</h2>
              <p className="mt-1 text-xs text-muted">
                Generate once. Download starts automatically.
              </p>
            </div>
            <div className="w-full sm:w-auto">
              <GenerateButton
                onClick={handleGenerate}
                disabled={!file || selectedPlatforms.length === 0}
                isLoading={isGenerating}
              />
            </div>
          </div>
          <div className="mt-5">
            <PreviewGrid
              assets={assets}
              selectedPlatforms={selectedPlatforms}
              isGenerating={isGenerating}
            />
          </div>
          <div className="mt-4 text-[11px] text-muted">
            {file ? "Tip: 1024×1024 assets give the best results." : "Upload a file to begin."}
          </div>
        </Card>

        <Footer />
      </div>
    </div>
  );
}
