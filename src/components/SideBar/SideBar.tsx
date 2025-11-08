import { type FC } from "react";
import History from "./History";
import Layers from "./Layers";

const SideBar: FC = () => {
  return (
    <div className="fixed top-22 right-0 bottom-0 w-64 h-full dark:bg-neutral-700 bg-neutral-100 border-l dark:border-neutral-600 border-neutral-200  border-r border-t border-neutral-200 dark:border-neutral-600 flex flex-col">
      <div className="flex-1 overflow-hidden">
        <Layers />
      </div>
      <div className="flex-1 overflow-hidden border-t dark:border-neutral-600 border-neutral-200">
        <History />
      </div>
    </div>
  );
};

export default SideBar;
