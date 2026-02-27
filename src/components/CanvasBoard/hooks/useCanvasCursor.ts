import { ToolsIcon, ToolType } from "@/App.const";
import { useAppContext } from "@/App.context";
import * as fabric from "fabric";
import { useEffect } from "react";
import { getCanvas } from "../code";

const useCanvasCursor = (isDragging: boolean) => {
  const { activeTool } = useAppContext();
  const isAnyToolsItemActive =
    activeTool && Object.values(ToolType).includes(activeTool);
  const canvasCursor = isDragging
    ? "grabbing"
    : isAnyToolsItemActive
    ? `url("data:image/svg+xml,${encodeURIComponent(
        ToolsIcon[activeTool].icon
      )}") 12 12, auto`
    : "grab";

  useEffect(() => {
    let canvasInstance: fabric.Canvas | null = null;

    try {
      canvasInstance = getCanvas() as fabric.Canvas;
    } catch {
      return;
    }

    const applyCursor = (element?: HTMLElement | HTMLCanvasElement | null) => {
      if (element) {
        element.style.cursor = canvasCursor;
      }
    };

    canvasInstance.defaultCursor = canvasCursor;
    canvasInstance.hoverCursor = canvasCursor;
    canvasInstance.moveCursor = canvasCursor;
    canvasInstance.freeDrawingCursor = canvasCursor;

    applyCursor(canvasInstance.upperCanvasEl);
    applyCursor(canvasInstance.lowerCanvasEl);
    applyCursor(canvasInstance.wrapperEl);
  }, [canvasCursor]);

  return { canvasCursor };
};

export default useCanvasCursor;
