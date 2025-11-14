import { ToolType } from "@/App.const";
import type { FC } from "react";
import ToolItem from "./ToolItem";

const PanelItems: FC = () => {
  return (
    <>
      <ToolItem toolType={ToolType.TextTool} />
    </>
  );
};

export default PanelItems;
