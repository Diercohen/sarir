import { HistoryRegistry } from "@/utils/HistoryRegistry";
import { Redo2, Undo2 } from "lucide-react";
import { useEffect, useState, type FC } from "react";
import { Button } from "../ui/button";
import { ButtonGroup } from "../ui/button-group";

const CommandBar: FC = () => {
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    const historyRegistry = HistoryRegistry.getInstance();

    // Initial state
    setCanUndo(historyRegistry.canUndo());
    setCanRedo(historyRegistry.canRedo());

    // Subscribe to history changes
    const unsubscribe = historyRegistry.subscribe(() => {
      setCanUndo(historyRegistry.canUndo());
      setCanRedo(historyRegistry.canRedo());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleUndo = () => {
    const historyRegistry = HistoryRegistry.getInstance();
    historyRegistry.undo();
  };

  const handleRedo = () => {
    const historyRegistry = HistoryRegistry.getInstance();
    historyRegistry.redo();
  };

  return (
    <div className="px-2 fixed top-9 left-0 right-0 z-50 dark:bg-neutral-700 bg-neutral-100 py-2">
      <ButtonGroup className="hidden sm:flex dark:text-white text-black">
        <Button
          variant="outline"
          size="icon"
          aria-label="Undo"
          onClick={handleUndo}
          disabled={!canUndo}
        >
          <Undo2 />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Redo"
          onClick={handleRedo}
          disabled={!canRedo}
        >
          <Redo2 />
        </Button>
      </ButtonGroup>
    </div>
  );
};

export default CommandBar;
