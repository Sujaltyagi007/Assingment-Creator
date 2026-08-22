import { useState, useRef, useEffect } from "react";
import { PAGE_WIDTH_PX, PAGE_HEIGHT_PX } from "@/lib/render/canvasBackend";
import type { Page } from "@/lib/types";
import { DocumentAction } from "@/lib/state/documentReducer";

export function useCanvasInteraction(canvasRef: React.RefObject<HTMLCanvasElement | null>, activePage: Page, dispatch: React.Dispatch<DocumentAction>) {
  const [interaction, setInteraction] = useState({
    draggingElementId: null as string | null,
    dragOffset: { x: 0, y: 0 },
    resizingElementId: null as string | null,
    resizeStart: { w: 0, h: 0, x: 0, y: 0 },
    selectedImageId: null as string | null,
  });

  useEffect(() => {
    setInteraction(s => ({ ...s, draggingElementId: null, resizingElementId: null, selectedImageId: null }));
  }, [activePage.id]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = PAGE_WIDTH_PX / rect.width;
    const scaleY = PAGE_HEIGHT_PX / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    let clickedImage = false;
    for (let i = activePage.elements.length - 1; i >= 0; i--) {
      const el = activePage.elements[i];
      if (el.type === "image") {
        if (x >= el.x && x <= el.x + el.width && y >= el.y && y <= el.y + el.height) {
          clickedImage = true;
          if (x >= el.x + el.width - 20 && y >= el.y + el.height - 20) {
            setInteraction({ ...interaction, resizingElementId: el.id, resizeStart: { w: el.width, h: el.height, x, y }, selectedImageId: el.id });
            e.currentTarget.setPointerCapture(e.pointerId);
            canvas.style.cursor = "nwse-resize";
            break;
          } else {
            setInteraction({ ...interaction, draggingElementId: el.id, dragOffset: { x: x - el.x, y: y - el.y }, selectedImageId: el.id });
            e.currentTarget.setPointerCapture(e.pointerId);
            canvas.style.cursor = "grabbing";
            break;
          }
        }
      }
    }

    if (!clickedImage && interaction.selectedImageId) {
      setInteraction({ ...interaction, selectedImageId: null, draggingElementId: null, resizingElementId: null });
    }
  };

  const rafId = useRef<number | null>(null);
  const latestCoords = useRef<{ x: number; y: number } | null>(null);
  const interactionRef = useRef(interaction);
  interactionRef.current = interaction;

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!interaction.draggingElementId && !interaction.resizingElementId) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = PAGE_WIDTH_PX / rect.width;
      const scaleY = PAGE_HEIGHT_PX / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      let hoveringType: "none" | "grab" | "resize" = "none";
      let hId: string | null = null;

      for (let i = activePage.elements.length - 1; i >= 0; i--) {
        const el = activePage.elements[i];
        if (el.type === "image") {
          if (x >= el.x && x <= el.x + el.width && y >= el.y && y <= el.y + el.height) {
            hId = el.id;
            if (x >= el.x + el.width - 20 && y >= el.y + el.height - 20) { hoveringType = "resize"; }
            else { hoveringType = "grab"; }
            break;
          }
        }
      }
      canvas.style.cursor = hoveringType === "resize" ? "nwse-resize" : hoveringType === "grab" ? "grab" : "default";

      if (interactionRef.current.selectedImageId !== hId) {
        setInteraction(s => ({ ...s, selectedImageId: hId }));
      }
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = PAGE_WIDTH_PX / rect.width;
    const scaleY = PAGE_HEIGHT_PX / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    latestCoords.current = { x, y };

    if (rafId.current === null) {
      rafId.current = requestAnimationFrame(() => {
        const coords = latestCoords.current;
        const currentInter = interactionRef.current;
        if (coords && (currentInter.draggingElementId || currentInter.resizingElementId)) {
          if (currentInter.draggingElementId) {
            dispatch({
              type: "UPDATE_ELEMENT",
              pageId: activePage.id,
              elementId: currentInter.draggingElementId,
              updates: {
                x: coords.x - currentInter.dragOffset.x,
                y: coords.y - currentInter.dragOffset.y,
              },
            });
          } else if (currentInter.resizingElementId) {
            const newWidth = Math.max(20, currentInter.resizeStart.w + (coords.x - currentInter.resizeStart.x));
            const newHeight = Math.max(20, currentInter.resizeStart.h + (coords.y - currentInter.resizeStart.y));
            dispatch({
              type: "UPDATE_ELEMENT",
              pageId: activePage.id,
              elementId: currentInter.resizingElementId,
              updates: { width: newWidth, height: newHeight },
            });
          }
        }
        rafId.current = null;
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (interaction.draggingElementId || interaction.resizingElementId) {
      setInteraction(s => ({ ...s, draggingElementId: null, resizingElementId: null }));
      e.currentTarget.releasePointerCapture(e.pointerId);
      if (canvasRef.current) canvasRef.current.style.cursor = "default";
    }
  };

  const deleteSelectedImage = () => {
    if (interaction.selectedImageId) {
      dispatch({ type: "UPDATE_ELEMENT", pageId: activePage.id, elementId: interaction.selectedImageId, updates: { __delete: true } });
      setInteraction(s => ({ ...s, selectedImageId: null }));
    }
  };

  return { interaction, setInteraction, handlePointerDown, handlePointerMove, handlePointerUp, deleteSelectedImage };
}
