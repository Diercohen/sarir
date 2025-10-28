import { Undo2 } from "lucide-react";
import type { FC } from "react";
import { Button } from "../ui/button";

const CommandBar: FC = () => {
  return (
    <div className="px-2 fixed top-9 left-0 right-0 z-50 bg-neutral-700 py-2">
      <Button variant="default" size="icon" aria-label="Submit">
        <Undo2 />
      </Button>
    </div>
  );
};

export default CommandBar;
