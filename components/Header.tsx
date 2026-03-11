import Image from "next/image";

export default function Header() {
  return (
    <header className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-2xl bg-surface-strong">
          <Image
            src="/android-chrome-192x192.png"
            alt="Universal Icon Generator"
            width={36}
            height={36}
            className="h-8 w-8"
            priority
          />
        </span>
        <div>
          <h1 className="text-lg font-semibold text-white">Iconix</h1>
          <p className="text-[11px] text-muted">
            Generate mobile and web icons from one upload.
          </p>
        </div>
      </div>
    </header>
  );
}
