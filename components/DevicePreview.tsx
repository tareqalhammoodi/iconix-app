/* eslint-disable @next/next/no-img-element */
"use client";

import { motion } from "framer-motion";

interface DevicePreviewProps {
  iconUrl?: string | null;
}

export default function DevicePreview({ iconUrl }: DevicePreviewProps) {
  if (!iconUrl) {
    return (
      <div className="rounded-2xl border border-border bg-white/5 p-6 text-center text-sm text-muted">
        Generate icons to preview them on devices.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {[
        { label: "iPhone Home", frame: "rounded-[26px]", size: "h-40 w-28" },
        { label: "Android Launcher", frame: "rounded-[20px]", size: "h-40 w-28" },
        { label: "Browser Favicon", frame: "rounded-2xl", size: "h-40 w-full" },
        { label: "macOS Dock", frame: "rounded-2xl", size: "h-40 w-full" }
      ].map((device) => (
        <motion.div
          key={device.label}
          whileHover={{ y: -4 }}
          className="rounded-2xl border border-border bg-white/5 p-4"
        >
          <div
            className={`mx-auto flex items-center justify-center border border-border bg-surface-strong ${device.frame} ${device.size}`}
          >
            <img src={iconUrl} alt={device.label} className="h-14 w-14 rounded-xl" />
          </div>
          <p className="mt-3 text-center text-xs text-muted">{device.label}</p>
        </motion.div>
      ))}
    </div>
  );
}
