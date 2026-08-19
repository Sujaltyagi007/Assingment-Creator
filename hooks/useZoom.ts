import { useState, useRef } from "react";
import { PAGE_WIDTH_PX } from "@/lib/render/canvasBackend";

export function useZoom(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const [zoom, setZoom] = useState({ mode: "fit-height" as "fit-height" | "fit-width" | "custom", level: 1 });
  const touchStartDistance = useRef<number | null>(null);
  const touchStartZoom = useRef<number>(1);

  const handleZoomIn = () => {
    if (zoom.mode !== "custom") {
      const rect = canvasRef.current?.getBoundingClientRect();
      rect ? setZoom(s => ({ ...s, level: Math.min(1.2, (rect.width / PAGE_WIDTH_PX) + 0.1), mode: "custom" })) : setZoom(s => ({ ...s, level: 1.1, mode: "custom" }));
    } else {
      setZoom(s => ({ ...s, level: Math.min(1.2, s.level + 0.1), mode: "custom" }));
    }
  };

  const handleZoomOut = () => {
    if (zoom.mode !== "custom") {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) { setZoom(s => ({ ...s, level: Math.max(0.2, (rect.width / PAGE_WIDTH_PX) - 0.1), mode: "custom" })); }
      else { setZoom(s => ({ ...s, level: 0.9, mode: "custom" })); }
    } else { setZoom(s => ({ ...s, level: Math.max(0.2, s.level - 0.1), mode: "custom" })); }
  };

  const handleResetZoom = () => { setZoom(s => ({ ...s, mode: "fit-height" })); };
  const handleFitWidth = () => { setZoom(s => ({ ...s, mode: "fit-width" })); };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      touchStartDistance.current = dist;

      let startZoom = zoom.level;
      if (zoom.mode !== "custom" && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        startZoom = rect.width / PAGE_WIDTH_PX;
      }
      touchStartZoom.current = startZoom;
      setZoom(s => ({ ...s, level: startZoom, mode: "custom" }));
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDistance.current !== null && touchStartDistance.current > 0) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const ratio = dist / touchStartDistance.current;
      const MIN_ZOOM = 0.2;
      const MAX_ZOOM = 2.0;
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, touchStartZoom.current * ratio));
      setZoom(s => ({ ...s, level: newZoom }));
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) { touchStartDistance.current = null; }
  };

  return { zoom, setZoom, handleZoomIn, handleZoomOut, handleResetZoom, handleFitWidth, handleTouchStart, handleTouchMove, handleTouchEnd };
}
