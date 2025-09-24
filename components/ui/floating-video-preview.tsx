"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import videoPreview from "../../public/video_preview_square.gif";

const STORAGE_KEY = "floatingVideoCollapsed";

export default function FloatingVideoPreview({
  size = 256,
}: {
  size?: number;
}) {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === "1") setCollapsed(true);
    } catch {
      // ignore (SSR)
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      // ignore
    }
  }, [collapsed]);

  // Collapsed size (small circle)
  const mini = 56;
  // Keep the outer container at the full size and animate via CSS scale so
  // transform-origin behaves reliably. Compute a scale factor when collapsed.
  const effectiveSize = size;
  const scale = collapsed ? mini / size : 1;

  // Soft modern shadow
  const shadowStyle = {
    boxShadow: "0 10px 30px rgba(2,6,23,0.12), 0 4px 8px rgba(2,6,23,0.06)",
  } as React.CSSProperties;

  // If not mounted yet, avoid rendering anything that depends on window.
  // Still render something to avoid layout shift.
  if (!mounted) {
    return (
      <div
        className="fixed bottom-4 left-4 z-50"
        style={{
          width: effectiveSize,
          height: effectiveSize,
          transformOrigin: "bottom left",
        }}
      />
    );
  }

  return (
    <div
      className="fixed bottom-4 left-4 z-50"
      style={{
        width: effectiveSize,
        height: effectiveSize,
        transformOrigin: "bottom left",
      }}
    >
      <div
        className={`relative overflow-hidden transition-transform duration-300 ease-out transform-gpu`}
        style={{
          width: effectiveSize,
          height: effectiveSize,
          ...shadowStyle,
          transformOrigin: "bottom left",
          willChange: "transform, opacity",
          transform: `scale(${scale})`,
          borderRadius: collapsed ? "9999px" : "12px",
        }}
      >
        {!collapsed ? (
          // Expanded: image that opens the video when clicked
          <a
            href="https://www.youtube.com/watch?v=wIBF0ZkuJpI&feature=youtu.be"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open video preview in new tab"
            className="block w-full h-full"
            style={{ pointerEvents: collapsed ? "none" : "auto" }}
          >
            <Image
              src={videoPreview}
              alt="Preview video"
              width={size}
              height={size}
              style={{ objectFit: "cover", display: "block" }}
              priority
              unoptimized
            />
          </a>
        ) : (
          // Collapsed: small preview that when clicked expands
          <button
            aria-label="Expand video preview"
            className="w-full h-full rounded-full bg-white/50 flex items-center justify-center"
            onClick={() => setCollapsed(false)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-24 h-24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        )}

        {/* Controls: minimize / open (when expanded) */}
        <div className="absolute top-2 right-2 flex gap-2">
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              aria-label="Minimize preview"
              className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-gray-700 shadow-sm hover:scale-105 transition-transform"
              title="Minimize"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18 12H6"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
