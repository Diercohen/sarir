import { Eye, EyeOff, GripVertical, Lock, Trash2, Unlock } from "lucide-react";
import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FC,
} from "react";
import { useAppContext } from "../../App.context";
import { cn } from "../../lib/utils";
import { LayerRegistry, type Layer } from "../../utils/LayerRegistry";

const SideBar: FC = () => {
  const { selectedLayerIds, setSelectedLayerIds } = useAppContext();
  const [layers, setLayers] = useState<Layer[]>([]);
  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const layerRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const previousOrderRef = useRef<Map<string, number>>(new Map());
  const previousPositionsRef = useRef<Map<string, number>>(new Map());
  const isAnimatingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

    return () => {
      unsubscribe();
    };
  }, []);

  // Scroll to first selected layer when selection changes (from canvas selection)
  useEffect(() => {
    if (selectedLayerIds.size > 0) {
      // Use a small delay to ensure DOM has updated
      // Scroll to the first selected layer
      const firstSelectedId = Array.from(selectedLayerIds)[0];
      const timeoutId = setTimeout(() => {
        scrollToLayer(firstSelectedId);
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [selectedLayerIds]);

  const scrollToLayer = (layerId: string) => {
    const layerElement = layerRefs.current.get(layerId);
    const scrollContainer = scrollContainerRef.current;

    if (layerElement && scrollContainer) {
      const containerRect = scrollContainer.getBoundingClientRect();
      const elementRect = layerElement.getBoundingClientRect();

      // Check if element is outside visible area
      const isAboveView = elementRect.top < containerRect.top;
      const isBelowView = elementRect.bottom > containerRect.bottom;

      if (isAboveView || isBelowView) {
        // Calculate scroll position to center the element
        const elementTop = layerElement.offsetTop;
        const elementHeight = layerElement.offsetHeight;
        const containerHeight = scrollContainer.clientHeight;
        const scrollPosition =
          elementTop - containerHeight / 2 + elementHeight / 2;

        scrollContainer.scrollTo({
          top: Math.max(0, scrollPosition),
          behavior: "smooth",
        });
      }
    }
  };

  const handleVisibilityToggle = (layerId: string, currentVisible: boolean) => {
    const registry = LayerRegistry.getInstance();
    registry.setVisibility(layerId, !currentVisible);
  };

  const handleLockToggle = (layerId: string, currentLocked: boolean) => {
    const registry = LayerRegistry.getInstance();
    registry.setLocked(layerId, !currentLocked);
  };

  const handleSelect = (layerId: string, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();

    const registry = LayerRegistry.getInstance();

    // Check if this layer is already selected
    const isSelected = selectedLayerIds.has(layerId);

    let newSelection: Set<string>;

    if (e?.shiftKey || e?.metaKey || e?.ctrlKey) {
      // Multi-select: toggle this layer
      if (isSelected) {
        // Deselect if already selected
        newSelection = new Set(selectedLayerIds);
        newSelection.delete(layerId);
      } else {
        // Add to selection
        newSelection = new Set(selectedLayerIds);
        newSelection.add(layerId);
      }
    } else {
      // Single select: clear all and select only this one
      newSelection = new Set([layerId]);
    }

    // Update selection state
    setSelectedLayerIds(newSelection);

    // Update canvas selection after state update
    requestAnimationFrame(() => {
      if (newSelection.size === 0) {
        // Clear selection
        registry.clearSelection();
      } else {
        // Select on canvas (single or multiple)
        registry.selectMultiple(Array.from(newSelection));
      }
    });

    scrollToLayer(layerId);
  };

  const handleDelete = (layerId: string) => {
    const registry = LayerRegistry.getInstance();
    registry.delete(layerId);
  };

  const handleDragStart = (layerId: string) => {
    setDraggedLayerId(layerId);
    const draggedIndex = layers.findIndex((l) => l.id === layerId);
    setDropTargetIndex(draggedIndex);
  };

  const handleDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent container handler from running
    if (!draggedLayerId) return;

    const draggedIndex = layers.findIndex((l) => l.id === draggedLayerId);
    if (draggedIndex === -1) return;

    const layerElement = layerRefs.current.get(layers[targetIndex].id);
    if (!layerElement) return;

    const rect = layerElement.getBoundingClientRect();
    const mouseY = e.clientY;
    const layerMidpoint = rect.top + rect.height / 2;

    let finalIndex = targetIndex;

    // Determine if we should place before or after the target layer
    if (mouseY < layerMidpoint) {
      // Place before this layer
      finalIndex = targetIndex;
      // If dragging from below, don't adjust
      if (draggedIndex > targetIndex) {
        // Already correct
      }
    } else {
      // Place after this layer
      finalIndex = targetIndex + 1;
      // If dragging from above, adjust for the gap
      if (draggedIndex < targetIndex) {
        finalIndex = targetIndex + 1;
      }
    }

    // Don't show placeholder if it's the same as dragged position
    if (finalIndex === draggedIndex || finalIndex === draggedIndex + 1) {
      setDropTargetIndex(draggedIndex);
    } else {
      setDropTargetIndex(finalIndex);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if leaving the container, not just moving between children
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setDropTargetIndex(null);
    }
  };

  const handleContainerDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedLayerId || !containerRef.current) return;

    // Calculate drop position based on mouse Y coordinate
    const mouseY = e.clientY;

    const draggedIndex = layers.findIndex((l) => l.id === draggedLayerId);
    if (draggedIndex === -1) return;

    // Find which layer position the mouse is over
    let targetIndex = layers.length;

    // Check if mouse is above all layers
    const firstLayer = layerRefs.current.get(layers[0]?.id);
    if (firstLayer && mouseY < firstLayer.getBoundingClientRect().top) {
      targetIndex = 0;
    } else {
      // Check each layer
      for (let i = 0; i < layers.length; i++) {
        const layerElement = layerRefs.current.get(layers[i].id);
        if (layerElement) {
          const layerRect = layerElement.getBoundingClientRect();
          const layerMidpoint = layerRect.top + layerRect.height / 2;

          if (mouseY < layerMidpoint) {
            targetIndex = i;
            break;
          } else if (i === layers.length - 1) {
            // Last layer, check if below it
            if (mouseY > layerRect.bottom) {
              targetIndex = layers.length;
            } else {
              targetIndex = i + 1;
            }
            break;
          }
        }
      }
    }

    // Adjust target index based on dragged position
    if (targetIndex !== draggedIndex && targetIndex !== draggedIndex + 1) {
      // Adjust if dragging from above (items shift down)
      if (draggedIndex < targetIndex) {
        // No adjustment needed - target is already correct
      } else {
        // Dragging from below - no adjustment needed either
      }
      setDropTargetIndex(targetIndex);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex?: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedLayerId) return;

    const registry = LayerRegistry.getInstance();
    // Use dropTargetIndex if available, otherwise use the passed targetIndex
    const finalIndex =
      dropTargetIndex !== null ? dropTargetIndex : targetIndex ?? 0;
    registry.reorder(draggedLayerId, finalIndex);
    setDraggedLayerId(null);
    setDropTargetIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedLayerId(null);
    setDropTargetIndex(null);
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
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
        {layers.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
            No layers
          </div>
        ) : (
          <div
            ref={containerRef}
            className="py-2 relative"
            onDragOver={handleContainerDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e)}
          >
            {layers.map((layer, index) => {
              const draggedIndex = draggedLayerId
                ? layers.findIndex((l) => l.id === draggedLayerId)
                : -1;
              const showPlaceholderBefore =
                dropTargetIndex !== null &&
                dropTargetIndex === index &&
                draggedIndex !== index;
              const isDragged = draggedLayerId === layer.id;

              return (
                <React.Fragment key={layer.id}>
                  {/* Drop placeholder */}
                  {showPlaceholderBefore && (
                    <div className="mx-1 my-1 h-8 border-2 border-dashed border-blue-500 dark:border-blue-400 rounded bg-blue-50/50 dark:bg-blue-900/20" />
                  )}
                  <div
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
                    onDrop={(e) => handleDrop(e)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "group px-2 py-1.5 mx-1 rounded flex items-center gap-2 cursor-pointer transition-colors",
                      selectedLayerIds.has(layer.id)
                        ? "bg-blue-100 dark:bg-blue-900/30"
                        : "hover:bg-neutral-200 dark:hover:bg-neutral-600",
                      isDragged && "opacity-50"
                    )}
                    style={{
                      // Inline styles needed for dynamic animation transforms
                      transition: isAnimatingRef.current
                        ? "transform 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 200ms"
                        : "opacity 200ms",
                    }}
                    onClick={(e) => handleSelect(layer.id, e)}
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
                  {/* Show placeholder after last item if dragging to the end */}
                  {index === layers.length - 1 &&
                    dropTargetIndex !== null &&
                    dropTargetIndex === layers.length &&
                    draggedIndex !== layers.length - 1 && (
                      <div className="mx-1 my-1 h-8 border-2 border-dashed border-blue-500 dark:border-blue-400 rounded bg-blue-50/50 dark:bg-blue-900/20" />
                    )}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SideBar;
