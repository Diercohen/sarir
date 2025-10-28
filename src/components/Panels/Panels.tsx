import { LayoutDashboardIcon } from "lucide-react";
import type { FC } from "react";
import { Button } from "../ui/button";

const Panels: FC = () => {
  return (
    <div className="fixed top-20 left-0 w-[100px] bottom-0 bg-neutral-700 flex flex-col">
      <div className="flex-1">
        <div className="h-full w-full p-2">
          <Button
            variant="secondary"
            color="white"
            size="sm"
            aria-label="Submit"
          >
            <LayoutDashboardIcon className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Panels;
