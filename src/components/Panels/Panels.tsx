import { LayoutDashboardIcon } from "lucide-react";
import type { FC } from "react";
import { Button } from "../ui/button";

const Panels: FC = () => {
  return (
    <div className="fixed top-22 left-0  bottom-0 dark:bg-neutral-700 bg-neutral-100 flex flex-col">
      <div className="flex-1 border-r dark:border-neutral-600 border-neutral-200">
        <div className="h-full w-full ">
          <div className="grid grid-cols-1 gap-4">
            <Button
              variant="outline"
              size="lg"
              className="w-full flex items-center gap-2 justify-start border-y rounded-none dark:border-neutral-500 border-neutral-200"
            >
              <LayoutDashboardIcon className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Panels;
