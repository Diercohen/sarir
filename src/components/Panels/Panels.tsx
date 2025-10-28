import { LayoutDashboardIcon } from "lucide-react";
import type { FC } from "react";
import { Button } from "../ui/button";

const Panels: FC = () => {
  return (
    <div className="fixed top-18 left-0  bottom-0 bg-neutral-700 flex flex-col">
      <div className="flex-1 border-r border-neutral-600">
        <div className="h-full w-full ">
          <div className="grid grid-cols-1 gap-4">
            <Button
              variant="ghost"
              size="lg"
              className="w-full flex items-center gap-2 justify-start border-y rounded-none border-neutral-500"
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
