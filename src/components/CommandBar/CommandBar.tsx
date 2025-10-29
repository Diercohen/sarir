import { Redo2, Undo2 } from "lucide-react";
import type { FC } from "react";
import { Button } from "../ui/button";
import { ButtonGroup } from "../ui/button-group";

const CommandBar: FC = () => {
  return (
    <div className="px-2 fixed top-9 left-0 right-0 z-50 dark:bg-neutral-700 bg-neutral-100 py-2">
      <ButtonGroup className="hidden sm:flex dark:text-white text-black">
        <Button variant="outline" size="icon" aria-label="Go Back">
          <Undo2 />
        </Button>
        <Button variant="outline" size="icon" aria-label="Go Forward">
          <Redo2 />
        </Button>
      </ButtonGroup>
    </div>
  );
};

export default CommandBar;
