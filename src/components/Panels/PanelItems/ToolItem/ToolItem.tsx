import { ToolsIcon, ToolType } from "@/App.const";
import { useAppContext } from "@/App.context";
import { Button } from "@/components/ui/button";
import type { FC } from "react";

const ToolItem: FC<{ toolType: ToolType }> = ({ toolType }) => {
  const { setActiveTool, activeTool } = useAppContext();
  return (
    <>
      <Button
        onClick={() => {
          setActiveTool((prev) => (prev === toolType ? undefined : toolType));
        }}
        variant={activeTool === toolType ? "default" : "outline"}
        size="lg"
        className="px-4 w-full flex items-center gap-2 justify-start border-y rounded-none dark:border-neutral-500 border-neutral-200 first:border-b-0"
      >
        <span
          dangerouslySetInnerHTML={{
            __html: ToolsIcon[toolType].icon,
          }}
        />
      </Button>
    </>
  );
};

export default ToolItem;
