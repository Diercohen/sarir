import { ToolsIcon, ToolType } from "@/App.const";
import { useAppContext } from "@/App.context";

const useCanvasCursor = (isDragging: boolean) => {
  const { activeTool } = useAppContext();
  const isTextToolActive = activeTool === ToolType.TextTool;
  const canvasCursor = isDragging
    ? "grabbing"
    : isTextToolActive
    ? `url("data:image/svg+xml,${encodeURIComponent(
        ToolsIcon[activeTool].icon
      )}") 12 12, auto`
    : "grab";

  return { canvasCursor };
};

export default useCanvasCursor;
