import { CaseUpperIcon, TypeIcon } from "lucide-react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ToolItemType } from "./components/Panels/PanelItems/ToolItem/ToolItem";

export enum Language {
  EN = "en",
  FA = "fa",
}

export enum ToolType {
  TextTool = "TEXT_TOOL",
  CalligraphyTool = "CALLIGRAPHY_TOOL",
}

export const ToolsObject: ToolItemType[] = [
  {
    toolId: ToolType.TextTool,
    name: "Text",
    icon: renderToStaticMarkup(createElement(TypeIcon)),
    order: 0,
  },
  {
    toolId: ToolType.CalligraphyTool,
    name: "Calligraphy",
    icon: renderToStaticMarkup(createElement(CaseUpperIcon)),
    order: 1,
  },
];
