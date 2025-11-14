import { ToolType } from "@/App.const";
import { useAppContext } from "@/App.context";
import { Button } from "@/components/ui/button";
import { TypeIcon } from "lucide-react";
import type { FC } from "react";

const TextTool: FC = () => {
  const { setActiveTool, activeTool } = useAppContext();
  return (
    <>
      <Button
        onClick={() => {
          setActiveTool(ToolType.TextTool);
        }}
        variant={activeTool === ToolType.TextTool ? "default" : "outline"}
        size="lg"
        className="w-full flex items-center gap-2 justify-start border-y rounded-none dark:border-neutral-500 border-neutral-200"
      >
        <TypeIcon className="size-4" />
      </Button>
    </>
  );
};

export default TextTool;
