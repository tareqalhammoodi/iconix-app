"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import IconGenerator from "@/features/IconGenerator";
import PngToSvgConverter from "@/features/PngToSvgConverter";
import { Card } from "@/components/ui/card";
import { cn } from "@/utils/cn";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"icons" | "vector">("icons");

  return (
    <div className="min-h-screen px-5 pb-14 pt-8 md:px-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <Header />

        <Card className="p-2">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: "icons", label: "Icon Generator", sub: "App + web packs" },
                { id: "vector", label: "PNG to SVG", sub: "Vector tracing" }
              ] as const
            ).map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex flex-1 flex-col items-start gap-1 rounded-2xl border px-4 py-3 text-left transition",
                    isActive
                      ? "border-accent/60 bg-accent/10 text-white shadow-[0_5px_20px_rgba(59,130,246,0.18)]"
                      : "border-border bg-white/4 text-muted hover:bg-white/6"
                  )}
                >
                  <span className="text-sm font-semibold">{tab.label}</span>
                  <span className="text-[11px] text-muted">{tab.sub}</span>
                </button>
              );
            })}
          </div>
        </Card>

        {activeTab === "icons" ? (
          <IconGenerator />
        ) : (
          <PngToSvgConverter />
        )}

        <Footer />
      </div>
    </div>
  );
}
