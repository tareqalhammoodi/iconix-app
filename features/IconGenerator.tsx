"use client";

import { useState } from "react";
import ActionButton from "@/components/ActionButton";
import UploadDropZone from "@/components/UploadDropZone";
import PlatformSelector from "@/components/PlatformSelector";
import PreviewGrid from "@/components/PreviewGrid";
import { Card } from "@/components/ui/card";
import { useIconGenerator, type GeneratedAsset } from "@/hooks/useIconGenerator";
import { useImagePreview } from "@/hooks/useImagePreview";
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

export default function IconGenerator() {
  const { generate } = useIconGenerator();
  const [file, setFile] = useState<File | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformKey[]>(defaultPlatforms);
  const [assets, setAssets] = useState<GeneratedAsset[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { previewUrl, resolution } = useImagePreview(file);

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
    <>
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
              After generating, download will start automatically.
            </p>
          </div>
          <div className="w-full sm:w-auto">
            <ActionButton
              onClick={handleGenerate}
              disabled={!file || selectedPlatforms.length === 0}
              isLoading={isGenerating}
              loadingLabel="Generating..."
              label="Generate & Download"
              size="lg"
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
    </>
  );
}
