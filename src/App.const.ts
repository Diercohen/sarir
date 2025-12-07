import { CaseUpperIcon, TypeIcon } from "lucide-react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

export enum Language {
  EN = "en",
  FA = "fa",
}

export enum ToolType {
  TextTool = "TEXT_TOOL",
  CalligraphyTool = "CALLIGRAPHY_TOOL",
}

export const ToolsIcon: Record<ToolType, { icon: string }> = {
  [ToolType.TextTool]: {
    icon: renderToStaticMarkup(createElement(TypeIcon)),
  },
  [ToolType.CalligraphyTool]: {
    icon: renderToStaticMarkup(createElement(CaseUpperIcon)),
  },
};
