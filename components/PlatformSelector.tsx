"use client";

import { motion } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { platformLabels, type PlatformKey } from "@/lib/icon-presets";

interface PlatformSelectorProps {
  selected: PlatformKey[];
  onToggle: (platform: PlatformKey) => void;
}

const platforms: PlatformKey[] = [
  "iphone",
  "ipad",
  "watchos",
  "macos",
  "android",
  "web",
  "flutter"
];

export default function PlatformSelector({ selected, onToggle }: PlatformSelectorProps) {
  return (
    <div className="grid gap-2 md:grid-cols-2">
      {platforms.map((platform, index) => (
        <motion.label
          key={platform}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.03 }}
          className="flex items-center justify-between rounded-2xl border border-border bg-white/4 px-4 py-2.5 text-xs text-white"
        >
          <span>{platformLabels[platform]}</span>
          <Checkbox
            checked={selected.includes(platform)}
            onCheckedChange={() => onToggle(platform)}
          />
        </motion.label>
      ))}
    </div>
  );
}
