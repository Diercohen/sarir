import { ArrowUpIcon } from "lucide-react";
import type { FC } from "react";
import { Button } from "../ui/button";

const CommandBar: FC = () => {
  return (
    <div className="px-2 fixed top-10 left-0 right-0 z-50">
      <Button variant="outline" size="icon" aria-label="Submit">
        <ArrowUpIcon />
      </Button>
    </div>
  );
};

export default CommandBar;
