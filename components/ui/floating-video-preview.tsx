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
                width="16"
                height="16"
                viewBox="0 0 800 800"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M66.667 100V700C66.667 708.841 70.1789 717.319 76.4301 723.571C82.6813 729.822 91.1598 733.334 100 733.334H700C708.841 733.334 717.319 729.822 723.571 723.571C729.822 717.319 733.334 708.841 733.334 700V100C733.334 91.1598 729.822 82.6813 723.571 76.4301C717.319 70.1789 708.841 66.667 700 66.667H100C91.1598 66.667 82.6813 70.1789 76.4301 76.4301C70.1789 82.6813 66.667 91.1598 66.667 100ZM133.334 133.334H666.667V666.667H333.334V500C333.334 491.16 329.822 482.681 323.571 476.43C317.319 470.179 308.841 466.667 300 466.667H133.334V133.334ZM133.334 533.334H266.667V666.667H133.334V533.334ZM369.234 412.734C367.56 408.696 366.688 404.371 366.667 400V283.334C366.667 274.493 370.179 266.015 376.43 259.763C382.681 253.512 391.16 250 400 250C408.841 250 417.319 253.512 423.571 259.763C429.822 266.015 433.334 274.493 433.334 283.334V319.534L526.434 226.434C529.509 223.25 533.187 220.711 537.253 218.964C541.32 217.217 545.694 216.297 550.12 216.259C554.546 216.22 558.936 217.064 563.032 218.74C567.129 220.416 570.85 222.891 573.98 226.02C577.11 229.15 579.585 232.872 581.261 236.969C582.937 241.065 583.78 245.454 583.742 249.88C583.704 254.306 582.784 258.68 581.037 262.747C579.29 266.814 576.751 270.492 573.567 273.567L480.467 366.667H516.667C525.508 366.667 533.986 370.179 540.237 376.43C546.488 382.681 550 391.16 550 400C550 408.841 546.488 417.319 540.237 423.571C533.986 429.822 525.508 433.334 516.667 433.334H400C395.629 433.313 391.305 432.441 387.267 430.767C379.103 427.384 372.617 420.898 369.234 412.734Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
