import * as fabric from "fabric";

export interface Layer {
  id: string;
  object: fabric.Object;
  name: string;
  visible: boolean;
  locked: boolean;
  index: number; // Index in the canvas (z-index order)
}

type LayerRegistryListener = (layers: Layer[]) => void;

export class LayerRegistry {
  private static instance: LayerRegistry | null = null;
  private layers: Map<string, Layer> = new Map();
  private listeners: Set<LayerRegistryListener> = new Set();
  private nextIndex = 0;

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): LayerRegistry {
    if (!LayerRegistry.instance) {
      LayerRegistry.instance = new LayerRegistry();
    }
    return LayerRegistry.instance;
  }

  /**
   * Subscribe to layer changes
   */
  subscribe(listener: LayerRegistryListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of layer changes
   */
  private notify(): void {
    const layers = this.getLayers();
    this.listeners.forEach((listener) => listener(layers));
  }

  /**
   * Register a new layer from a canvas object
   */
  register(object: fabric.Object, name?: string): string {
    const id = `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const layer: Layer = {
      id,
      object,
      name: name || this.generateDefaultName(object),
      visible: true,
      locked: false,
      index: this.nextIndex++,
    };

    this.layers.set(id, layer);
    this.notify();
    return id;
  }

  /**
   * Unregister a layer
   */
  unregister(objectOrId: fabric.Object | string): void {
    let id: string;
    if (typeof objectOrId === "string") {
      id = objectOrId;
    } else {
      const layer = Array.from(this.layers.values()).find(
        (l) => l.object === objectOrId
      );
      if (!layer) return;
      id = layer.id;
    }

    this.layers.delete(id);
    this.notify();
  }

  /**
   * Get layer by object
   */
  getLayerByObject(object: fabric.Object): Layer | undefined {
    return Array.from(this.layers.values()).find((l) => l.object === object);
  }

  /**
   * Get layer by ID
   */
  getLayerById(id: string): Layer | undefined {
    return this.layers.get(id);
  }

  /**
   * Get all layers in z-index order (top to bottom)
   */
  getLayers(): Layer[] {
    const canvas = this.getCanvas();
    if (!canvas) return [];

    const objects = canvas.getObjects();
    // Map objects to layers, maintaining canvas order (top to bottom)
    const layers = objects
      .map((obj) => {
        const layer = this.getLayerByObject(obj);
        return layer;
      })
      .filter((layer): layer is Layer => layer !== undefined);

    // Reverse to show top layer first in UI (like Photoshop)
    return layers.reverse();
  }

  /**
   * Update layer visibility
   */
  setVisibility(id: string, visible: boolean): void {
    const layer = this.layers.get(id);
    if (!layer) return;

    layer.visible = visible;
    layer.object.visible = visible;
    const canvas = this.getCanvas();
    if (canvas) {
      canvas.requestRenderAll();
    }
    this.notify();
  }

  /**
   * Update layer lock state
   */
  setLocked(id: string, locked: boolean): void {
    const layer = this.layers.get(id);
    if (!layer) return;

    layer.locked = locked;
    layer.object.selectable = !locked;
    layer.object.evented = !locked;
    const canvas = this.getCanvas();
    if (canvas) {
      canvas.requestRenderAll();
    }
    this.notify();
  }

  /**
   * Rename a layer
   */
  rename(id: string, newName: string): void {
    const layer = this.layers.get(id);
    if (!layer) return;

    layer.name = newName;
    this.notify();
  }

  /**
   * Reorder layer (move to new z-index position)
   */
  reorder(id: string, newIndex: number): void {
    const canvas = this.getCanvas();
    if (!canvas) return;

    const layer = this.layers.get(id);
    if (!layer) return;

    const objects = canvas.getObjects();
    const currentIndex = objects.indexOf(layer.object);
    if (currentIndex === -1) return;

    // Convert newIndex from UI order (top to bottom) to canvas order (bottom to top)
    const canvasOrder = objects.length - 1 - newIndex;
    const targetIndex = Math.max(0, Math.min(canvasOrder, objects.length - 1));

    canvas.moveObjectTo(layer.object, targetIndex);
    canvas.requestRenderAll();
    this.notify();
  }

  /**
   * Select a layer (sets it as active object)
   */
  select(id: string): void {
    const canvas = this.getCanvas();
    if (!canvas) return;

    const layer = this.layers.get(id);
    if (!layer) return;

    canvas.setActiveObject(layer.object);
    canvas.requestRenderAll();
    this.notify();
  }

  /**
   * Delete a layer
   */
  delete(id: string): void {
    const canvas = this.getCanvas();
    if (!canvas) return;

    const layer = this.layers.get(id);
    if (!layer) return;

    canvas.remove(layer.object);
    this.unregister(id);
    canvas.requestRenderAll();
  }

  /**
   * Clear all layers
   */
  clear(): void {
    this.layers.clear();
    this.nextIndex = 0;
    this.notify();
  }

  /**
   * Generate default name based on object type
   */
  private generateDefaultName(object: fabric.Object): string {
    const type = object.type || "object";
    const typeMap: Record<string, string> = {
      rect: "Rectangle",
      circle: "Circle",
      ellipse: "Ellipse",
      line: "Line",
      polyline: "Polyline",
      polygon: "Polygon",
      path: "Path",
      textbox: "Text",
      text: "Text",
      itext: "Text",
      group: "Group",
      "activeSelection": "Selection",
      "fabric-image": "Image",
    };

    const baseName = typeMap[type] || type.charAt(0).toUpperCase() + type.slice(1);
    const count = Array.from(this.layers.values()).filter(
      (l) => l.name.startsWith(baseName)
    ).length;

    return count > 0 ? `${baseName} ${count + 1}` : baseName;
  }

  private canvasInstance: fabric.Canvas | null = null;

  /**
   * Set canvas instance
   */
  setCanvas(canvas: fabric.Canvas | null): void {
    this.canvasInstance = canvas;
    // Store reference on canvas element for backward compatibility
    if (canvas) {
      const canvasElement = document.getElementById("canvas") as HTMLCanvasElement | null;
      if (canvasElement) {
        // @ts-expect-error - store instance for external access
        canvasElement.__canvas = canvas;
      }
    }
  }

  /**
   * Get canvas instance (helper method)
   */
  private getCanvas(): fabric.Canvas | null {
    if (this.canvasInstance) return this.canvasInstance;
    
    try {
      const canvasElement = document.getElementById("canvas") as HTMLCanvasElement | null;
      if (!canvasElement) return null;
      
      // Try to get existing fabric instance
      // @ts-expect-error - fabric stores instance on element
      const existingCanvas = canvasElement.__canvas;
      if (existingCanvas) {
        this.canvasInstance = existingCanvas;
        return existingCanvas;
      }
      
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Sync with canvas - rebuild registry from current canvas objects
   */
  syncWithCanvas(): void {
    const canvas = this.getCanvas();
    if (!canvas) return;

    const canvasObjects = canvas.getObjects();
    const registryObjectIds = new Set(
      Array.from(this.layers.values()).map((l) => l.object)
    );

    // Remove layers for objects that no longer exist in canvas
    this.layers.forEach((layer, id) => {
      if (!canvasObjects.includes(layer.object)) {
        this.layers.delete(id);
      }
    });

    // Add new objects that aren't in registry
    canvasObjects.forEach((obj) => {
      if (!this.getLayerByObject(obj)) {
        this.register(obj);
      }
    });

    this.notify();
  }
}

