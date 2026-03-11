"use client";

import JSZip from "jszip";
import { saveAs } from "file-saver";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { GeneratedFile } from "@/hooks/useIconGenerator";

interface DownloadZipButtonProps {
  files: GeneratedFile[];
}

export default function DownloadZipButton({ files }: DownloadZipButtonProps) {
  const handleDownload = async () => {
    const zip = new JSZip();
    files.forEach((file) => {
      zip.file(file.path, file.blob);
    });
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "icons.zip");
  };

  return (
    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
      <Button
        onClick={handleDownload}
        variant="secondary"
        size="lg"
        className="w-full"
        disabled={files.length === 0}
      >
        Download ZIP ({files.length} files)
      </Button>
    </motion.div>
  );
}
