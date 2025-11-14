import { Button } from "@/components/ui/button";
import { TypeIcon } from "lucide-react";
import type { FC } from "react";

const TextTool: FC = () => {
  return (
    <>
      <Button
        variant="outline"
        size="lg"
        className="w-full flex items-center gap-2 justify-start border-y rounded-none dark:border-neutral-500 border-neutral-200"
      >
        <TypeIcon className="size-4" />
      </Button>
    </>
  );
};

export default TextTool;
