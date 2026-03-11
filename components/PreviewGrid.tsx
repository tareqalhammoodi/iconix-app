/* eslint-disable @next/next/no-img-element */
"use client";

import { motion } from "framer-motion";
import { platformLabels, type PlatformKey } from "@/lib/icon-presets";
import type { GeneratedAsset } from "@/hooks/useIconGenerator";

interface PreviewGridProps {
  assets: GeneratedAsset[];
  selectedPlatforms: PlatformKey[];
  isGenerating: boolean;
}

export default function PreviewGrid({ assets, selectedPlatforms, isGenerating }: PreviewGridProps) {
  if (selectedPlatforms.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-white/4 p-5 text-center text-xs text-muted">
        Select at least one platform to preview icons.
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="rounded-2xl border border-border bg-white/4 p-5 text-center text-xs text-muted">
        Generating icons…
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-white/4 p-5 text-center text-xs text-muted">
        Upload a logo and click Generate to preview icons.
      </div>
    );
  }

  const grouped = selectedPlatforms.map((platform) => ({
    platform,
    assets: assets.filter((asset) => asset.platform === platform)
  }));

  return (
    <div className="space-y-5">
      {grouped.map((group) => (
        <div key={group.platform}>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              {platformLabels[group.platform]}
            </h3>
            <span className="text-[10px] text-muted">{group.assets.length} icons</span>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-8">
            {group.assets.map((asset, index) => (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.015 }}
                className="flex flex-col items-center gap-1 rounded-xl border border-border/70 bg-white/3 p-2"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-strong">
                  <img
                    src={asset.dataUrl}
                    alt={asset.label}
                    className="h-8 w-8 rounded-md object-contain"
                  />
                </div>
                <p className="text-[10px] text-muted">{asset.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
