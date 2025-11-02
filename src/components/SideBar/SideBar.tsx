import { type FC } from "react";
import Layers from "./Layers";

const SideBar: FC = () => {
  return (
    <div className="fixed top-22 right-0 bottom-0 w-64 h-full dark:bg-neutral-700 bg-neutral-100 border-l dark:border-neutral-600 border-neutral-200  border-r border-t border-neutral-200 dark:border-neutral-600">
      <Layers />
    </div>
  );
};

export default SideBar;
