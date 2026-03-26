"use client";

import { useEffect, useState } from "react";

export interface ImageResolution {
  width: number;
  height: number;
}

export function useObjectUrl(source: Blob | MediaSource | null) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!source) {
      setUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(source);
    setUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [source]);

  return url;
}

export function useImagePreview(file: File | null) {
  const previewUrl = useObjectUrl(file);
  const [resolution, setResolution] = useState<ImageResolution | null>(null);

  useEffect(() => {
    if (!previewUrl) {
      setResolution(null);
      return;
    }

    let isActive = true;
    const image = new Image();

    image.onload = () => {
      if (!isActive) return;
      setResolution({ width: image.naturalWidth, height: image.naturalHeight });
    };

    image.onerror = () => {
      if (!isActive) return;
      setResolution(null);
    };

    image.src = previewUrl;

    return () => {
      isActive = false;
    };
  }, [previewUrl]);

  return { previewUrl, resolution };
}
