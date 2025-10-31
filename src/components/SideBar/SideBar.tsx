import { Eye, EyeOff, GripVertical, Lock, Trash2, Unlock } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type FC } from "react";
import { cn } from "../../lib/utils";
import { LayerRegistry, type Layer } from "../../utils/LayerRegistry";

const SideBar: FC = () => {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const layerRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const previousOrderRef = useRef<Map<string, number>>(new Map());
  const previousPositionsRef = useRef<Map<string, number>>(new Map());
  const isAnimatingRef = useRef(false);

  useEffect(() => {
    const registry = LayerRegistry.getInstance();

    // Initial sync
    registry.syncWithCanvas();
    setLayers(registry.getLayers());

    // Subscribe to changes
    const unsubscribe = registry.subscribe((updatedLayers) => {
      // Capture current positions BEFORE updating
      const positionsBefore = new Map<string, number>();
      layerRefs.current.forEach((element, id) => {
        const rect = element.getBoundingClientRect();
        positionsBefore.set(id, rect.top);
      });

      // Update current order
      const currentOrder = new Map<string, number>();
      updatedLayers.forEach((layer, index) => {
        currentOrder.set(layer.id, index);
      });

      // Check if order changed (not just a new/removed item)
      const orderChanged = Array.from(previousOrderRef.current.entries()).some(
        ([id, oldIndex]) => {
          const newIndex = currentOrder.get(id);
          return newIndex !== undefined && newIndex !== oldIndex;
        }
      );

      // Store positions before update
      if (orderChanged) {
        previousPositionsRef.current = positionsBefore;
      }

      // Update layers so DOM reflects new order
      setLayers(updatedLayers);

      // Update previous order
      previousOrderRef.current = currentOrder;
    });

    // Listen for canvas selection changes
    // Use a small delay to ensure canvas is initialized
    let cleanupFn: (() => void) | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const setupCanvasListeners = (): void => {
      const canvasElement = document.getElementById("canvas");
      if (!canvasElement) {
        // Retry after a short delay
        timeoutId = setTimeout(setupCanvasListeners, 100);
        return;
      }

      // @ts-expect-error - fabric stores instance on element
      const fabricCanvas = canvasElement.__canvas;
      if (!fabricCanvas) {
        // Retry after a short delay
        timeoutId = setTimeout(setupCanvasListeners, 100);
        return;
      }

      const handleSelection = () => {
        const active = fabricCanvas.getActiveObject();
        if (active) {
          const layer = registry.getLayerByObject(active);
          setSelectedLayerId(layer?.id || null);
        } else {
          setSelectedLayerId(null);
        }
      };

      const handleDeselection = () => {
        setSelectedLayerId(null);
      };

      fabricCanvas.on("selection:created", handleSelection);
      fabricCanvas.on("selection:updated", handleSelection);
      fabricCanvas.on("selection:cleared", handleDeselection);

      cleanupFn = () => {
        fabricCanvas.off("selection:created", handleSelection);
        fabricCanvas.off("selection:updated", handleSelection);
        fabricCanvas.off("selection:cleared", handleDeselection);
      };
    };

    setupCanvasListeners();

    return () => {
      unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
      if (cleanupFn) cleanupFn();
    };
  }, []);

  const handleVisibilityToggle = (layerId: string, currentVisible: boolean) => {
    const registry = LayerRegistry.getInstance();
    registry.setVisibility(layerId, !currentVisible);
  };

  const handleLockToggle = (layerId: string, currentLocked: boolean) => {
    const registry = LayerRegistry.getInstance();
    registry.setLocked(layerId, !currentLocked);
  };

  const handleSelect = (layerId: string) => {
    const registry = LayerRegistry.getInstance();
    registry.select(layerId);
    setSelectedLayerId(layerId);
  };

  const handleDelete = (layerId: string) => {
    const registry = LayerRegistry.getInstance();
    registry.delete(layerId);
  };

  const handleDragStart = (layerId: string) => {
    setDraggedLayerId(layerId);
  };

  const handleDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (!draggedLayerId) return;

    const draggedIndex = layers.findIndex((l) => l.id === draggedLayerId);
    if (draggedIndex === -1 || draggedIndex === targetIndex) return;

    // Visual feedback could be added here
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (!draggedLayerId) return;

    const registry = LayerRegistry.getInstance();
    registry.reorder(draggedLayerId, targetIndex);
    setDraggedLayerId(null);
  };

  const handleDragEnd = () => {
    setDraggedLayerId(null);
  };

  // Animate layer order changes using FLIP technique
  // This runs after React has rendered the new order
  useLayoutEffect(() => {
    if (previousPositionsRef.current.size === 0) return;

    const movedLayers: Array<{
      element: HTMLDivElement;
      fromY: number;
      toY: number;
      id: string;
    }> = [];

    // Find all layers that moved by comparing positions
    previousPositionsRef.current.forEach((fromY, id) => {
      const element = layerRefs.current.get(id);
      if (element) {
        const rect = element.getBoundingClientRect();
        const toY = rect.top;
        const deltaY = fromY - toY;

        // Only animate if there's significant movement
        if (Math.abs(deltaY) > 1) {
          movedLayers.push({
            element,
            fromY,
            toY,
            id,
          });
        }
      }
    });

    if (movedLayers.length > 0) {
      isAnimatingRef.current = true;

      // Step 1: Apply initial transform (invert the change)
      movedLayers.forEach((item) => {
        const deltaY = item.fromY - item.toY;
        item.element.style.transform = `translateY(${deltaY}px)`;
        item.element.style.transition = "transform 0ms";
        item.element.style.willChange = "transform";
      });

      // Step 2: Force reflow
      void document.body.offsetHeight;

      // Step 3: Animate to final position
      requestAnimationFrame(() => {
        movedLayers.forEach((item) => {
          item.element.style.transform = "translateY(0)";
          item.element.style.transition =
            "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)";
        });

        // Clean up after animation
        setTimeout(() => {
          movedLayers.forEach((item) => {
            item.element.style.transform = "";
            item.element.style.transition = "";
            item.element.style.willChange = "";
          });
          previousPositionsRef.current.clear();
          isAnimatingRef.current = false;
        }, 300);
      });
    } else {
      previousPositionsRef.current.clear();
    }
  }, [layers]);

  return (
    <div className="fixed top-22 right-0 bottom-0 w-64 dark:bg-neutral-700 bg-neutral-100 border-l dark:border-neutral-600 border-neutral-200 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b dark:border-neutral-600 border-neutral-200">
        <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Layers
        </h2>
      </div>

      {/* Layers List */}
      <div className="flex-1 overflow-y-auto">
        {layers.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
            No layers
          </div>
        ) : (
          <div className="py-2 relative">
            {layers.map((layer, index) => (
              <div
                key={layer.id}
                ref={(el) => {
                  if (el) {
                    layerRefs.current.set(layer.id, el);
                  } else {
                    layerRefs.current.delete(layer.id);
                  }
                }}
                draggable
                onDragStart={() => handleDragStart(layer.id)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "group px-2 py-1.5 mx-1 rounded flex items-center gap-2 cursor-pointer transition-colors",
                  selectedLayerId === layer.id
                    ? "bg-blue-100 dark:bg-blue-900/30"
                    : "hover:bg-neutral-200 dark:hover:bg-neutral-600",
                  draggedLayerId === layer.id && "opacity-50"
                )}
                style={{
                  // Inline styles needed for dynamic animation transforms
                  transition: isAnimatingRef.current
                    ? "transform 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 200ms"
                    : "opacity 200ms",
                }}
                onClick={() => handleSelect(layer.id)}
              >
                {/* Drag Handle */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                  <GripVertical className="size-3.5 text-neutral-400" />
                </div>

                {/* Visibility Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVisibilityToggle(layer.id, layer.visible);
                  }}
                  className="p-0.5 hover:bg-neutral-300 dark:hover:bg-neutral-500 rounded transition-colors"
                  title={layer.visible ? "Hide layer" : "Show layer"}
                >
                  {layer.visible ? (
                    <Eye className="size-4 text-neutral-700 dark:text-neutral-300" />
                  ) : (
                    <EyeOff className="size-4 text-neutral-400" />
                  )}
                </button>

                {/* Lock Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLockToggle(layer.id, layer.locked);
                  }}
                  className="p-0.5 hover:bg-neutral-300 dark:hover:bg-neutral-500 rounded transition-colors"
                  title={layer.locked ? "Unlock layer" : "Lock layer"}
                >
                  {layer.locked ? (
                    <Lock className="size-4 text-neutral-700 dark:text-neutral-300" />
                  ) : (
                    <Unlock className="size-4 text-neutral-400" />
                  )}
                </button>

                {/* Layer Name */}
                <span
                  className={cn(
                    "flex-1 text-sm truncate",
                    !layer.visible && "opacity-50 line-through",
                    layer.locked && "opacity-60"
                  )}
                  title={layer.name}
                >
                  {layer.name}
                </span>

                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(layer.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-all text-red-600 dark:text-red-400"
                  title="Delete layer"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SideBar;
