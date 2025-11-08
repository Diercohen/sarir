import * as fabric from "fabric";
import { LayerRegistry } from "./LayerRegistry";

export interface HistoryStep {
  id: string;
  timestamp: number;
  description: string;
  canvasState: string; // JSON string of canvas state
  eventType: string;
}

type HistoryRegistryListener = (
  steps: HistoryStep[],
  currentIndex: number
) => void;

export class HistoryRegistry {
  private static instance: HistoryRegistry | null = null;
  private steps: HistoryStep[] = [];
  private currentIndex: number = -1;
  private listeners: Set<HistoryRegistryListener> = new Set();
  private maxHistorySize: number = 100;
  private isRecording: boolean = true;
  private isApplyingState: boolean = false;
  private debounceTimeout: ReturnType<typeof setTimeout> | null = null;
  private pendingEvent: { type: string; description: string; timestamp: number } | null = null;

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): HistoryRegistry {
    if (!HistoryRegistry.instance) {
      HistoryRegistry.instance = new HistoryRegistry();
    }
    return HistoryRegistry.instance;
  }

  /**
   * Subscribe to history changes
   */
  subscribe(listener: HistoryRegistryListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of history changes
   */
  private notify(): void {
    this.listeners.forEach((listener) =>
      listener(this.steps, this.currentIndex)
    );
  }

  /**
   * Get canvas instance
   */
  private getCanvas(): fabric.Canvas | null {
    try {
      const canvasElement = document.getElementById(
        "canvas"
      ) as HTMLCanvasElement | null;
      if (!canvasElement) return null;

      // @ts-expect-error - fabric stores instance on element
      const existingCanvas = canvasElement.__canvas;
      return existingCanvas || null;
    } catch {
      return null;
    }
  }

  /**
   * Remove all future history steps (steps after currentIndex)
   * This is called when adding a new history step after navigating to a past step
   */
  private truncateFutureHistory(): void {
    if (this.currentIndex < this.steps.length - 1) {
      this.steps = this.steps.slice(0, this.currentIndex + 1);
    }
  }

  /**
   * Save current canvas state as a history step
   */
  saveState(eventType: string, description: string): void {
    const canvas = this.getCanvas();
    if (!canvas || !this.isRecording || this.isApplyingState) return;

    // Capture timestamp when event occurs, not when debounced callback executes
    const eventTimestamp = Date.now();

    // Debounce rapid events (like object:moving) to avoid too many history entries
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    this.pendingEvent = { type: eventType, description, timestamp: eventTimestamp };

    this.debounceTimeout = setTimeout(() => {
      if (!this.pendingEvent) return;

      const canvas = this.getCanvas();
      if (!canvas) return;

      // Serialize canvas state
      const canvasState = JSON.stringify(canvas.toJSON());

      // Remove all future history steps before adding new one
      this.truncateFutureHistory();

      // Create new history step with timestamp from when event occurred
      const step: HistoryStep = {
        id: `step-${this.pendingEvent.timestamp}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: this.pendingEvent.timestamp,
        description: this.pendingEvent.description,
        canvasState,
        eventType: this.pendingEvent.type,
      };

      this.steps.push(step);
      this.currentIndex = this.steps.length - 1;

      // Limit history size
      if (this.steps.length > this.maxHistorySize) {
        this.steps.shift();
        this.currentIndex--;
      }

      this.pendingEvent = null;
      this.notify();
    }, 300); // 300ms debounce for rapid events
  }

  /**
   * Record a history step immediately (for important events like add/remove)
   */
  recordStep(eventType: string, description: string): void {
    const canvas = this.getCanvas();
    if (!canvas || !this.isRecording || this.isApplyingState) return;

    // Capture timestamp when event occurs
    const eventTimestamp = Date.now();

    // Clear any pending debounced events
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }
    this.pendingEvent = null;

    // Serialize canvas state
    const canvasState = JSON.stringify(canvas.toJSON());

    // Remove all future history steps (those with opacity-30) before adding new one
    this.truncateFutureHistory();

    // Create new history step with accurate timestamp
    const step: HistoryStep = {
      id: `step-${eventTimestamp}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: eventTimestamp,
      description,
      canvasState,
      eventType,
    };

    this.steps.push(step);
    this.currentIndex = this.steps.length - 1;

    // Limit history size
    if (this.steps.length > this.maxHistorySize) {
      this.steps.shift();
      this.currentIndex--;
    }

    this.notify();
  }

  /**
   * Undo - go back one step
   */
  undo(): boolean {
    if (this.currentIndex <= 0) {
      return false; // Already at the beginning
    }

    this.currentIndex--;
    this.applyState(this.steps[this.currentIndex].canvasState);
    this.notify();
    return true;
  }

  /**
   * Redo - go forward one step
   */
  redo(): boolean {
    if (this.currentIndex >= this.steps.length - 1) {
      return false; // Already at the end
    }

    this.currentIndex++;
    this.applyState(this.steps[this.currentIndex].canvasState);
    this.notify();
    return true;
  }

  /**
   * Go to a specific history step
   */
  goToStep(stepId: string): boolean {
    const stepIndex = this.steps.findIndex((step) => step.id === stepId);
    if (stepIndex === -1) {
      return false;
    }

    // Can navigate to any step that exists in history
    // Forward steps are accessible until a new change is made (which truncates them)
    if (stepIndex < 0 || stepIndex >= this.steps.length) {
      return false;
    }

    this.currentIndex = stepIndex;
    this.applyState(this.steps[this.currentIndex].canvasState);
    this.notify();
    return true;
  }

  /**
   * Apply a canvas state from JSON
   */
  private applyState(canvasState: string): void {
    const canvas = this.getCanvas();
    if (!canvas) return;

    this.isRecording = false; // Prevent recording while applying state
    this.isApplyingState = true; // Flag to prevent event handlers from recording

    try {
      const json = JSON.parse(canvasState);
      canvas.loadFromJSON(json, () => {
        // Sync LayerRegistry after restoring canvas state
        const registry = LayerRegistry.getInstance();
        registry.syncWithCanvas();
        canvas.requestRenderAll();

        // Use a small delay to ensure all canvas events from loadFromJSON have fired
        // before re-enabling recording
        setTimeout(() => {
          this.isRecording = true;
          this.isApplyingState = false;
        }, 100);
      });
    } catch (error) {
      console.error("Error applying history state:", error);
      this.isRecording = true;
      this.isApplyingState = false;
    }
  }

  /**
   * Get all history steps
   */
  getSteps(): HistoryStep[] {
    return [...this.steps];
  }

  /**
   * Get current step index
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.currentIndex < this.steps.length - 1;
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.steps = [];
    this.currentIndex = -1;
    this.notify();
  }

  /**
   * Initialize history with current canvas state
   */
  initialize(): void {
    const canvas = this.getCanvas();
    if (!canvas) return;

    const canvasState = JSON.stringify(canvas.toJSON());
    const step: HistoryStep = {
      id: `step-initial-${Date.now()}`,
      timestamp: Date.now(),
      description: "Initial state",
      canvasState,
      eventType: "initial",
    };

    this.steps = [step];
    this.currentIndex = 0;
    this.notify();
  }
}
