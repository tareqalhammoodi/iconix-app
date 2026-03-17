/* eslint-disable @next/next/no-img-element */
"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

interface UploadDropZoneProps {
  file?: File | null;
  previewUrl?: string | null;
  resolution?: { width: number; height: number } | null;
  accept?: string;
  allowedExtensions?: string[];
  prompt?: string;
  promptActive?: string;
  hint?: string;
  onFileSelect: (file: File) => void;
  onClear: () => void;
}

export default function UploadDropZone({
  file,
  previewUrl,
  resolution,
  accept,
  allowedExtensions,
  prompt,
  promptActive,
  hint,
  onFileSelect,
  onClear
}: UploadDropZoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const extensions = (allowedExtensions ?? [".png", ".svg"]).map((item) =>
    item.toLowerCase()
  );

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const next = files[0];
    if (!next.type.startsWith("image/")) return;
    if (!extensions.some((extension) => next.name.toLowerCase().endsWith(extension))) {
      return;
    }
    onFileSelect(next);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className={cn(
        "rounded-2xl border border-dashed border-border bg-white/4 p-6 transition-colors",
        isDragging && "border-accent/70 bg-accent/10"
      )}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        handleFiles(event.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept ?? "image/png,image/svg+xml"}
        onChange={(event) => handleFiles(event.target.files)}
      />

      <div className="flex min-h-57.5 flex-col items-center justify-center gap-3 text-center">
        <div>
          <p className="text-sm font-semibold text-white">
            {previewUrl
              ? promptActive ?? "Upload another logo"
              : prompt ?? "Drag & drop PNG or SVG"}
          </p>
          <p className="text-[11px] text-muted">
            {hint ?? "Recommended 1024×1024 with transparent background."}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button variant="secondary">Choose File</Button>
          {file && (
            <Button
              variant="ghost"
              onClick={(event) => {
                event.stopPropagation();
                onClear();
              }}
            >
              Remove
            </Button>
          )}
        </div>

        {previewUrl && (
          <div className="mt-2 flex items-center gap-4 rounded-2xl border border-border bg-white/5 px-4 py-3">
            <img
              src={previewUrl}
              alt="Uploaded preview"
              className="h-12 w-12 rounded-xl border border-border object-contain"
            />
            <div className="text-left">
              <p className="text-sm font-semibold text-white">{file?.name}</p>
              <p className="text-[11px] text-muted">
                {resolution ? `${resolution.width}×${resolution.height}` : "Resolution pending"}
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
