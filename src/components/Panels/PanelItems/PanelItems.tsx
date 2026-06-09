import { ToolsObject } from "@/App.const";
import type { FC } from "react";
import ToolItem from "./ToolItem";

const PanelItems: FC = () => {
  return (
    <>
      {Object.values(ToolsObject).map((tool) => {
        return <ToolItem key={tool.name} {...tool} />;
      })}
    </>
  );
};

export default PanelItems;
