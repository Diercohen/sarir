import type { FC } from "react";
import PanelItems from "./PanelItems";

const Panels: FC = () => {
  return (
    <div className="fixed top-22 left-0  bottom-0 dark:bg-neutral-700 bg-neutral-100 flex flex-col">
      <div className="flex-1 border-r dark:border-neutral-600 border-neutral-200">
        <div className="h-full w-full ">
          <div className="grid grid-cols-1 gap-0">
            <PanelItems />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Panels;
