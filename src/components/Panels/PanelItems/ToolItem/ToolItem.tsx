import { ToolType } from "@/App.const";
import { useAppContext } from "@/App.context";
import { Button } from "@/components/ui/button";
import type { FC } from "react";
export type ToolItemType = {
  toolId: ToolType;
  icon: string;
  name: string;
  order: number;
};
const ToolItem: FC<ToolItemType> = ({ icon, toolId }) => {
  const { setActiveTool, activeTool } = useAppContext();
  return (
    <>
      <Button
        onClick={() => {
          setActiveTool((prev) => (prev === toolId ? undefined : toolId));
        }}
        variant={activeTool === toolId ? "default" : "outline"}
        size="lg"
        className="px-4 w-full flex items-center gap-2 justify-start border-y rounded-none dark:border-neutral-500 border-neutral-200 first:border-b-0 cursor-pointer"
      >
        <span
          dangerouslySetInnerHTML={{
            __html: icon,
          }}
        />
      </Button>
    </>
  );
};

export default ToolItem;
