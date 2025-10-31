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
        loaded += 1;
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

function add() {
  const canvas = getCanvas();
  const { width, height } = canvas;
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
  canvas.add(red, blue, green);
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
  discard,
  disposeCanvas,
  getCanvas,
  group,
  multiselect,
  remove,
  ungroup,
};
