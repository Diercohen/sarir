import * as fabric from "fabric";
import { HistoryRegistry } from "../../utils/HistoryRegistry";
import { LayerRegistry } from "../../utils/LayerRegistry";

// Keep a single module-scoped instance to avoid re-initializing
let canvasInstance: fabric.Canvas | null = null;

const getCanvas = () => {
  if (canvasInstance) return canvasInstance as fabric.Canvas;
  const element = document.getElementById("canvas") as HTMLCanvasElement | null;
  if (!element) {
    throw new Error("Canvas element with id 'canvas' not found");
  }
  canvasInstance = new fabric.Canvas(element);

  // Register canvas with LayerRegistry
  const registry = LayerRegistry.getInstance();
  registry.setCanvas(canvasInstance);

  // Set up canvas event listeners for layer tracking and history
  setupCanvasEventListeners(canvasInstance, registry);

  return canvasInstance as fabric.Canvas;
};

const setupCanvasEventListeners = (
  canvas: fabric.Canvas,
  registry: LayerRegistry
) => {
  const historyRegistry = HistoryRegistry.getInstance();

  // Register objects when added to canvas
  canvas.on("object:added", (e) => {
    if (e.target) {
      // Only register if not already registered
      let layer = registry.getLayerByObject(e.target);
      if (!layer) {
        const layerId = registry.register(e.target);
        layer = registry.getLayerById(layerId);
      }
      // Record history
      const name = layer?.name || "Object";
      historyRegistry.recordStep("object:added", `Added ${name}`);
    }
  });

  // Unregister objects when removed from canvas
  canvas.on("object:removed", (e) => {
    if (e.target) {
      const layer = registry.getLayerByObject(e.target);
      const name = layer?.name || "Object";
      registry.unregister(e.target);
      // Record history
      historyRegistry.recordStep("object:removed", `Removed ${name}`);
    }
  });

  // Sync when objects are modified (moved, resized, etc.)
  canvas.on("object:modified", (e) => {
    registry.syncWithCanvas();
    // Record history for modifications
    if (e.target) {
      const layer = registry.getLayerByObject(e.target);
      const name = layer?.name || "Object";
      historyRegistry.recordStep("object:modified", `Modified ${name}`);
    }
  });

  // Track object movement
  canvas.on("object:moving", (e) => {
    if (e.target) {
      const layer = registry.getLayerByObject(e.target);
      const name = layer?.name || "Object";
      historyRegistry.saveState("object:moving", `Moving ${name}`);
    }
  });

  // Track object scaling
  canvas.on("object:scaling", (e) => {
    if (e.target) {
      const layer = registry.getLayerByObject(e.target);
      const name = layer?.name || "Object";
      historyRegistry.saveState("object:scaling", `Scaling ${name}`);
    }
  });

  // Track object rotation
  canvas.on("object:rotating", (e) => {
    if (e.target) {
      const layer = registry.getLayerByObject(e.target);
      const name = layer?.name || "Object";
      historyRegistry.saveState("object:rotating", `Rotating ${name}`);
    }
  });

  // Track object skewing
  canvas.on("object:skewing", (e) => {
    if (e.target) {
      const layer = registry.getLayerByObject(e.target);
      const name = layer?.name || "Object";
      historyRegistry.saveState("object:skewing", `Skewing ${name}`);
    }
  });

  // Track text changes
  canvas.on("text:changed", (e) => {
    if (e.target) {
      const layer = registry.getLayerByObject(e.target);
      const name = layer?.name || "Text";
      historyRegistry.saveState("text:changed", `Changed ${name}`);
    }
  });

  // Track text movement text:moving
  canvas.on("object:moving", (e) => {
    if (e.target) {
      const layer = registry.getLayerByObject(e.target);
      const name = layer?.name || "Text";
      historyRegistry.saveState("text:moving", `Moving ${name}`);
    }
  });

  // Track text scaling text:scaling
  canvas.on("object:scaling", (e) => {
    if (e.target) {
      const layer = registry.getLayerByObject(e.target);
      const name = layer?.name || "Text";
      historyRegistry.saveState("text:scaling", `Scaling ${name}`);
    }
  });

  // Track text rotation object:rotating
  canvas.on("object:rotating", (e) => {
    if (e.target) {
      const layer = registry.getLayerByObject(e.target);
      const name = layer?.name || "Text";
      historyRegistry.saveState("text:rotating", `Rotating ${name}`);
    }
  });

  // Handle double-click on text to enter edit mode
  canvas.on("mouse:dblclick", (e) => {
    if (e.target) {
      const isTextObject =
        e.target.type === "textbox" ||
        e.target.type === "itext" ||
        e.target.type === "text";
      if (isTextObject) {
        console.log("Text double-clicked - entering edit mode");
      }
    }
  });

  // Handle text exiting edit mode
  canvas.on("text:editing:exited", (e) => {
    if (e.target) {
      const isTextObject =
        e.target.type === "textbox" ||
        e.target.type === "itext" ||
        e.target.type === "text";
      if (isTextObject) {
        console.log("Text exited edit mode");
      }
    }
  });
  // Sync layer order when rendering (handles z-order changes)
  // This is a catch-all for any z-order changes that might occur
  let syncTimeout: ReturnType<typeof setTimeout> | null = null;
  const debouncedSync = () => {
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(() => {
      registry.syncWithCanvas();
    }, 100);
  };

  // Listen for selection changes which might indicate z-order updates
  canvas.on("selection:created", debouncedSync);
  canvas.on("selection:updated", debouncedSync);
};

const addSVGImage = (svgSrcArray: string[]) => {
  const canvas = getCanvas();
  const groupObjects: fabric.Object[] = [];

  let loaded = 0;
  const onAllLoaded = () => {
    if (loaded === svgSrcArray.length) {
      // Combine all loaded SVGs into one group
      const group = new fabric.Group(groupObjects, {
        left: 0,
        top: 0,
      });
      canvas.add(group);
      canvas.requestRenderAll();
    }
  };

  const registry = LayerRegistry.getInstance();
  svgSrcArray.forEach((svgSrc, index) => {
    fabric.loadSVGFromURL(svgSrc).then(({ objects }) => {
      const obj = fabric.util.groupSVGElements(objects as fabric.Object[]);
      obj.clone().then((clone: fabric.Object) => {
        clone.set({
          left: 0,
          top: 0,
          scaleX: 0.1,
          scaleY: 0.1,
          // left: clone.width * loaded,
          // top: clone.height * loaded,
        } as Partial<fabric.Object>);
        canvas.requestRenderAll();

        groupObjects.push(clone);
        loaded += 1;
        canvas.add(clone);
        // Register with layer registry
        const fileName =
          svgSrc.split("/").pop()?.replace(".svg", "") || `SVG ${index + 1}`;
        registry.register(clone, fileName);
        canvas.requestRenderAll();
        onAllLoaded();
      });
    });
  });
};

const disposeCanvas = () => {
  if (canvasInstance) {
    const registry = LayerRegistry.getInstance();
    registry.clear();
    registry.setCanvas(null); // Reset canvas reference
    canvasInstance.dispose();
    canvasInstance = null;
  }
};

const getActiveObject = () => {
  const canvas = getCanvas();
  return canvas.getActiveObject();
};

const nudgeActive = (dx: number, dy: number) => {
  const canvas = getCanvas();
  const active = canvas.getActiveObject();
  if (!active) return;

  // Move selection/group/object by delta
  active.set({
    left: (active.left ?? 0) + dx,
    top: (active.top ?? 0) + dy,
  } as Partial<fabric.Object>);
  active.setCoords();
  canvas.requestRenderAll();
};

const cloneActiveAndNudge = async (dx: number, dy: number) => {
  const canvas = getCanvas();
  const registry = LayerRegistry.getInstance();
  const active = canvas.getActiveObject();
  if (!active) return;

  // Handle multi-select separately by cloning each object and creating a new selection
  if (active.type === "activeSelection" || active.type === "activeselection") {
    const selection = active as fabric.ActiveSelection;
    const selectedObjects = selection.getObjects();

    const clones: fabric.Object[] = [];
    await Promise.all(
      selectedObjects.map(
        (obj) =>
          new Promise<void>((resolve) => {
            obj.clone().then((clone: fabric.Object) => {
              clone.set({
                left: (obj.left ?? 0) + dx,
                top: (obj.top ?? 0) + dy,
              } as Partial<fabric.Object>);
              canvas.add(clone);

              // Register cloned objects
              const originalLayer = registry.getLayerByObject(obj);
              const name = originalLayer
                ? `${originalLayer.name} copy`
                : undefined;
              registry.register(clone, name);

              clones.push(clone);
              resolve();
            });
          })
      )
    );

    const newSelection = new fabric.ActiveSelection(clones, { canvas });
    canvas.setActiveObject(newSelection);
    canvas.requestRenderAll();
    return;
  }

  // Single object or group
  await active.clone().then((clone: fabric.Object) => {
    clone.set({
      left: (active.left ?? 0) + dx,
      top: (active.top ?? 0) + dy,
    } as Partial<fabric.Object>);
    canvas.add(clone);

    // Register cloned object
    const originalLayer = registry.getLayerByObject(active);
    const name = originalLayer ? `${originalLayer.name} copy` : undefined;
    registry.register(clone, name);

    canvas.setActiveObject(clone);
    canvas.requestRenderAll();
  });
};

function add() {
  const canvas = getCanvas();
  const registry = LayerRegistry.getInstance();
  const historyRegistry = HistoryRegistry.getInstance();

  // Initialize history if not already initialized
  if (historyRegistry.getSteps().length === 0) {
    historyRegistry.initialize();
  }

  const { width, height } = canvas;
  const textbox = new fabric.Textbox("سلام من به تو یار قدیمی", {
    fill: "black",
    top: 70,
    left: 200,
    direction: "rtl",
    textAlign: "right",
  });
  const red = new fabric.Rect({
    top: Math.random() * (height - 25),
    left: Math.random() * (width - 40),
    width: 80,
    height: 50,
    fill: "red",
  });
  const blue = new fabric.Rect({
    top: Math.random() * (height - 35),
    left: Math.random() * (width - 25),
    width: 50,
    height: 70,
    fill: "blue",
  });
  const green = new fabric.Rect({
    top: Math.random() * (height - 30),
    left: Math.random() * (width - 30),
    width: 60,
    height: 60,
    fill: "green",
  });
  canvas.add(red, blue, green, textbox);

  // Register all objects with layer registry
  // Note: object:added event will also register them, but we do it explicitly here
  // to ensure they're registered immediately
  registry.register(textbox, "Text");
  registry.register(red, "Red Rectangle");
  registry.register(blue, "Blue Rectangle");
  registry.register(green, "Green Rectangle");
}

fabric.FabricObject.ownDefaults.transparentCorners = false;

const multiselect = () => {
  const canvas = getCanvas();
  canvas.discardActiveObject();
  const sel = new fabric.ActiveSelection(canvas.getObjects(), {
    canvas: canvas,
  });
  canvas.setActiveObject(sel);
  canvas.requestRenderAll();
};

const group = () => {
  const canvas = getCanvas();
  const registry = LayerRegistry.getInstance();
  if (!canvas.getActiveObject()) {
    return;
  }
  console.log(canvas.getActiveObject()?.type);
  if (
    canvas.getActiveObject()?.type !== "activeSelection" &&
    canvas.getActiveObject()?.type !== "activeselection"
  ) {
    return;
  }
  const selection = canvas.getActiveObject() as fabric.ActiveSelection;
  const objects = selection.getObjects();

  // Unregister individual objects before grouping
  objects.forEach((obj) => {
    registry.unregister(obj);
  });

  const group = new fabric.Group(selection.removeAll());
  canvas.add(group);

  // Register the new group
  registry.register(group, "Group");

  canvas.setActiveObject(group);
  canvas.requestRenderAll();
};

const ungroup = () => {
  const canvas = getCanvas();
  const registry = LayerRegistry.getInstance();
  const group = canvas.getActiveObject();
  if (!group || group.type !== "group") {
    return;
  }

  // Unregister the group
  registry.unregister(group);

  const groupObj = group as fabric.Group;
  const objects = groupObj.getObjects();
  canvas.remove(group);

  // Register all ungrouped objects
  objects.forEach((obj) => {
    registry.register(obj);
  });

  const sel = new fabric.ActiveSelection(objects, {
    canvas: canvas,
  });
  canvas.setActiveObject(sel);
  canvas.requestRenderAll();
};

const discard = () => {
  const canvas = getCanvas();
  canvas.discardActiveObject();
  canvas.requestRenderAll();
};
const remove = () => {
  const canvas = getCanvas();
  const active = canvas.getActiveObject();
  if (!active) return;

  const registry = LayerRegistry.getInstance();

  // Handle multi-selection (ActiveSelection)
  if (active.type === "activeSelection" || active.type === "activeselection") {
    const selection = active as fabric.ActiveSelection;
    const selectedObjects = selection.getObjects();

    // Remove all objects from canvas and unregister their layers
    selectedObjects.forEach((obj) => {
      canvas.remove(obj);
      registry.unregister(obj);
    });

    canvas.discardActiveObject();
    canvas.requestRenderAll();
    return;
  }

  // Handle single object or group
  canvas.remove(active as fabric.FabricObject);
  registry.unregister(active);
  canvas.requestRenderAll();
};

export {
  add,
  addSVGImage,
  cloneActiveAndNudge,
  discard,
  disposeCanvas,
  getActiveObject,
  getCanvas,
  group,
  multiselect,
  nudgeActive,
  remove,
  ungroup,
};
