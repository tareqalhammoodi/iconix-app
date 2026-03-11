export type PlatformKey =
  | "iphone"
  | "ipad"
  | "watchos"
  | "macos"
  | "android"
  | "web"
  | "flutter";

export type IconTarget = {
  id: string;
  size: number;
  label: string;
  filename: string;
  directory: string;
  platform: PlatformKey;
};

export type FlutterIosIconSpec = {
  size: number;
  scale: 1 | 2 | 3;
};

export const platformLabels: Record<PlatformKey, string> = {
  iphone: "iPhone",
  ipad: "iPad",
  watchos: "watchOS",
  macos: "macOS",
  android: "Android",
  web: "Web",
  flutter: "Flutter"
};

const iosIphoneSizes = [20, 29, 40, 60, 1024];
const iosIpadSizes = [20, 29, 40, 76, 83.5, 1024];
const watchSizes = [48, 55, 58, 80, 87, 1024];
const macSizes = [16, 32, 64, 128, 256, 512, 1024];
const androidSizes = [48, 72, 96, 144, 192];

export const webNamedTargets = [
  { size: 16, filename: "favicon-16x16.png" },
  { size: 32, filename: "favicon-32x32.png" },
  { size: 180, filename: "apple-touch-icon.png" },
  { size: 192, filename: "android-chrome-192x192.png" },
  { size: 512, filename: "android-chrome-512x512.png" }
];

export const platformTargets: Record<PlatformKey, IconTarget[]> = {
  iphone: iosIphoneSizes.map((size) => ({
    id: `iphone-${size}`,
    size,
    label: `${size}x${size}`,
    filename: `iphone-${size}x${size}.png`,
    directory: "native/iphone",
    platform: "iphone"
  })),
  ipad: iosIpadSizes.map((size) => ({
    id: `ipad-${size}`,
    size,
    label: `${size}x${size}`,
    filename: `ipad-${size}x${size}.png`,
    directory: "native/ipad",
    platform: "ipad"
  })),
  watchos: watchSizes.map((size) => ({
    id: `watchos-${size}`,
    size,
    label: `${size}x${size}`,
    filename: `watchos-${size}x${size}.png`,
    directory: "native/watchos",
    platform: "watchos"
  })),
  macos: macSizes.map((size) => ({
    id: `macos-${size}`,
    size,
    label: `${size}x${size}`,
    filename: `macos-${size}x${size}.png`,
    directory: "native/macos",
    platform: "macos"
  })),
  android: androidSizes.map((size) => ({
    id: `android-${size}`,
    size,
    label: `${size}x${size}`,
    filename: `ic_launcher.png`,
    directory: `native/android/mipmap-${densityFromSize(size)}`,
    platform: "android"
  })),
  web: webNamedTargets.map((item) => ({
    id: `web-${item.size}`,
    size: item.size,
    label: `${item.size}x${item.size}`,
    filename: item.filename,
    directory: "web",
    platform: "web"
  })),
  flutter: androidSizes.map((size) => ({
    id: `flutter-${size}`,
    size,
    label: `${size}x${size}`,
    filename: "ic_launcher.png",
    directory: `flutter/android/mipmap-${densityFromSize(size)}`,
    platform: "flutter"
  }))
};

export const flutterIosSpecs: FlutterIosIconSpec[] = [
  { size: 20, scale: 2 },
  { size: 20, scale: 3 },
  { size: 29, scale: 2 },
  { size: 29, scale: 3 },
  { size: 40, scale: 2 },
  { size: 40, scale: 3 },
  { size: 60, scale: 2 },
  { size: 60, scale: 3 },
  { size: 76, scale: 2 },
  { size: 83.5, scale: 2 },
  { size: 1024, scale: 1 }
];

export function densityFromSize(size: number) {
  if (size === 48) return "mdpi";
  if (size === 72) return "hdpi";
  if (size === 96) return "xhdpi";
  if (size === 144) return "xxhdpi";
  return "xxxhdpi";
}
