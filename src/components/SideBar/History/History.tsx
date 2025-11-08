import { cn } from "@/lib/utils";
import { HistoryRegistry, type HistoryStep } from "@/utils/HistoryRegistry";
import { Clock } from "lucide-react";
import { useEffect, useState, type FC } from "react";

const History: FC = () => {
  const [steps, setSteps] = useState<HistoryStep[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);

  useEffect(() => {
    const registry = HistoryRegistry.getInstance();

    // Initialize if needed
    if (registry.getSteps().length === 0) {
      registry.initialize();
    }

    // Initial sync
    setSteps(registry.getSteps());
    setCurrentIndex(registry.getCurrentIndex());

    // Subscribe to changes
    const unsubscribe = registry.subscribe((updatedSteps, updatedIndex) => {
      setSteps(updatedSteps);
      setCurrentIndex(updatedIndex);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleStepClick = (stepId: string) => {
    const registry = HistoryRegistry.getInstance();
    registry.goToStep(stepId);
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  const getEventTypeLabel = (eventType: string): string => {
    const labels: Record<string, string> = {
      "object:added": "Object Added",
      "object:removed": "Object Removed",
      "object:modified": "Object Modified",
      "object:moving": "Object Moved",
      "object:scaling": "Object Scaled",
      "object:rotating": "Object Rotated",
      "object:skewing": "Object Skewed",
      "text:changed": "Text Changed",
      "text:moving": "Text Moved",
      "text:scaling": "Text Scaled",
      "text:rotating": "Text Rotated",
      initial: "Initial State",
    };
    return labels[eventType] || eventType;
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b dark:border-neutral-600 border-neutral-200">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          History
        </h2>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto">
        {steps.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
            No history
          </div>
        ) : (
          <div className="py-2 overflow-y-auto max-h-70">
            {steps.map((step, index) => {
              const isCurrent = index === currentIndex;
              const isPast = index < currentIndex;
              const isFuture = index > currentIndex;

              return (
                <div
                  key={step.id}
                  onClick={() => {
                    handleStepClick(step.id);
                  }}
                  className={cn(
                    "group px-2 py-1.5 mx-1 rounded flex items-center gap-2 transition-colors",
                    isCurrent
                      ? "bg-blue-100 dark:bg-blue-900/30 cursor-default"
                      : isPast
                      ? "hover:bg-neutral-200 dark:hover:bg-neutral-600 cursor-pointer"
                      : isFuture && "opacity-30"
                  )}
                  title={step.description}
                >
                  {/* Time Icon */}
                  <Clock
                    className={cn(
                      "size-4 flex-shrink-0",
                      isCurrent
                        ? "text-blue-600 dark:text-blue-400"
                        : isPast || isFuture
                        ? "text-neutral-500 dark:text-neutral-400"
                        : "text-neutral-300 dark:text-neutral-600"
                    )}
                  />
                  {/* Step Info */}
                  <div className="flex-1 min-w-0">
                    <div
                      className={cn(
                        "text-sm truncate",
                        isCurrent
                          ? "text-blue-900 dark:text-blue-100 font-medium"
                          : isPast || isFuture
                          ? "text-neutral-700 dark:text-neutral-300"
                          : "text-neutral-400 dark:text-neutral-500"
                      )}
                    >
                      {step.description || getEventTypeLabel(step.eventType)}
                    </div>
                    <div
                      className={cn(
                        "text-xs truncate",
                        isCurrent
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-neutral-400 dark:text-neutral-500"
                      )}
                    >
                      {formatTime(step.timestamp)}
                    </div>
                  </div>
                  {/* Current Indicator */}
                  {isCurrent && (
                    <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
