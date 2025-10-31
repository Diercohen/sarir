import * as fabric from "fabric";

// Keep a single module-scoped instance to avoid re-initializing
let canvasInstance: fabric.Canvas | null = null;

const getCanvas = () => {
  if (canvasInstance) return canvasInstance as fabric.Canvas;
  const element = document.getElementById("canvas") as HTMLCanvasElement | null;
  if (!element) {
    throw new Error("Canvas element with id 'canvas' not found");
  }
  canvasInstance = new fabric.Canvas(element);
  return canvasInstance as fabric.Canvas;
};

const addSVGImage = (svgSrcArray: string[]) => {
  const canvas = getCanvas();
  const groupObjects: fabric.Object[] = [];

  // let loaded = 0;
  // const onAllLoaded = () => {
  //   if (loaded === svgSrcArray.length) {
  //     // Combine all loaded SVGs into one group
  //     const group = new fabric.Group(groupObjects, {
  //       left: 0,
  //       top: 0,
  //     });
  //     canvas.add(group);
  //     canvas.requestRenderAll();
  //   }
  // };

  svgSrcArray.forEach((svgSrc) => {
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
        // loaded += 1;
        canvas.add(clone);
        canvas.requestRenderAll();
        // onAllLoaded();
      });
    });
  });
};

const disposeCanvas = () => {
  if (canvasInstance) {
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
    canvas.setActiveObject(clone);
    canvas.requestRenderAll();
  });
};

function add() {
  const canvas = getCanvas();
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
}

fabric.FabricObject.ownDefaults.transparentCorners = false;

const addmore = () => {
  add();
};

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
  const group = new fabric.Group(
    (canvas.getActiveObject() as fabric.ActiveSelection)?.removeAll()
  );
  canvas.add(group);
  canvas.setActiveObject(group);
  canvas.requestRenderAll();
};

const ungroup = () => {
  const canvas = getCanvas();
  const group = canvas.getActiveObject();
  if (!group || group.type !== "group") {
    return;
  }
  canvas.remove(group);
  const sel = new fabric.ActiveSelection((group as fabric.Group)?.removeAll(), {
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
  canvas.remove(canvas.getActiveObject() as fabric.FabricObject);
  canvas.requestRenderAll();
};

export {
  add,
  addmore,
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
