import { Redo2, Undo2 } from "lucide-react";
import type { FC } from "react";
import { Button } from "../ui/button";
import { ButtonGroup } from "../ui/button-group";

const CommandBar: FC = () => {
  return (
    <div className="px-2 fixed top-9 left-0 right-0 z-50 bg-neutral-700 py-2">
      <ButtonGroup className="hidden sm:flex">
        <Button variant="default" size="icon" aria-label="Go Back">
          <Undo2 />
        </Button>
        <Button variant="default" size="icon" aria-label="Go Forward">
          <Redo2 />
        </Button>
      </ButtonGroup>
    </div>
  );
};

export default CommandBar;
