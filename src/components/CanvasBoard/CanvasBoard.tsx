import clsx from "clsx";
import * as fabric from "fabric";
import { useEffect, useRef, useState, type FC } from "react";
import { add, disposeCanvas, getCanvas, remove } from "./code";
// import ReactIcon from "@/assets/react.svg?react";

const RULER_SIZE = 24; // Size of ruler in pixels
const RULER_ORIGIN_OFFSET = 50; // Offset from 0,0

interface RulerProps {
  direction: "horizontal" | "vertical";
  zoom: number;
  scroll: number;
  length: number;
}

const Ruler: FC<RulerProps> = ({ direction, zoom, scroll, length }) => {
  const isHorizontal = direction === "horizontal";
  const pixelsPerUnit = zoom;

  // Calculate visible range based on zoom and scroll
  const startUnit = scroll / pixelsPerUnit;
  const endUnit = (length + scroll) / pixelsPerUnit;

  // Generate marks based on zoom level
  const getStep = () => {
    if (zoom < 0.5) return 100;
    if (zoom < 1) return 50;
    if (zoom < 2) return 25;
    if (zoom < 4) return 10;
    if (zoom < 8) return 5;
    return 1;
  };

  const step = getStep();
  const marks = [];
  const startMark = Math.floor(startUnit / step) * step;
  const endMark = Math.ceil(endUnit / step) * step;

  for (let i = startMark; i <= endMark; i += step) {
    // if (i === 0) continue; // Skip 0, it's at the origin
    const isLongMark = i % (step * 5) === 0;
    marks.push({
      position: i,
      isLong: isLongMark,
    });
  }

  return (
    <div
      className={clsx(
        "absolute dark:bg-neutral-900 bg-neutral-200 text-neutral-900 dark:text-neutral-400 text-[11px] select-none",
        {
          "border-b border-b-neutral-400/50 dark:border-b-neutral-500":
            isHorizontal,
          "border-r border-r-neutral-400/50 dark:border-r-neutral-500":
            !isHorizontal,
        }
      )}
      style={{
        width: isHorizontal ? `${length}px` : `${RULER_SIZE}px`,
        height: isHorizontal ? `${RULER_SIZE}px` : `${length}px`,
        top: isHorizontal ? 0 : RULER_SIZE,
        left: isHorizontal ? RULER_SIZE : 0,
      }}
    >
      {/* 0 mark at origin */}
      <div
        style={{
          position: "absolute",
          [isHorizontal ? "left" : "top"]: `${RULER_ORIGIN_OFFSET}px`,
          [isHorizontal ? "top" : "left"]: 0,
          width: isHorizontal ? "1px" : "6px",
          height: isHorizontal ? "6px" : "1px",
          backgroundColor: "currentColor",
        }}
      />

      {marks.map((mark) => {
        const position = RULER_ORIGIN_OFFSET + mark.position * pixelsPerUnit;
        if (position < 0 || position > length) return null;

        return (
          <div
            key={mark.position}
            style={{
              position: "absolute",
              [isHorizontal ? "left" : "top"]: `${position}px`,
              [isHorizontal ? "top" : "left"]: 0,
              width: isHorizontal ? "1px" : `${mark.isLong ? 10 : 5}px`,
              height: isHorizontal ? `${mark.isLong ? 10 : 5}px` : "1px",
              backgroundColor: "currentColor",
            }}
          >
            {mark.isLong && (
              <div
                style={{
                  position: "absolute",
                  [isHorizontal ? "left" : "top"]: 3,
                  [isHorizontal ? "top" : "left"]: isHorizontal ? 12 : 4,
                  fontSize: "10px",
                  color: "currentColor",
                  whiteSpace: "nowrap",
                }}
              >
                {mark.position}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

interface GridProps {
  zoom: number;
  canvasWidth: number;
  canvasHeight: number;
  gridSize: number;
  color?: string;
  zoomVisibilityThreshold?: number;
}

const Grid: FC<GridProps> = ({
  zoom,
  canvasWidth,
  canvasHeight,
  gridSize,
  color = "rgba(0,0,0,0.10)",
  zoomVisibilityThreshold = 2,
}) => {
  return (
    <div
      className={clsx(
        "absolute pointer-events-none top-0 left-0 transition-opacity duration-1000",
        zoom > zoomVisibilityThreshold ? "opacity-100" : "opacity-0"
      )}
      style={{
        width: `${canvasWidth}px`,
        height: `${canvasHeight}px`,
        marginLeft: `${RULER_ORIGIN_OFFSET}px`,
        // marginTop: `${RULER_ORIGIN_OFFSET}px`,
        backgroundImage: `
              linear-gradient(${color} ${1 / zoom}px, transparent ${
          1 / zoom
        }px),
              linear-gradient(90deg, ${color} ${1 / zoom}px, transparent ${
          1 / zoom
        }px)
            `,
        // backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
        // backgroundSize: `${20 / zoom}px ${20 / zoom}px`,
        backgroundSize: `${gridSize}px ${gridSize}px`,
      }}
    />
  );
};

const CanvasBoard: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasAreaRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Canvas dimensions
  const canvasWidth = 800;
  const canvasHeight = 600;

  // Update container size on mount and resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Handle wheel zoom
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const delta = e.deltaY;
      const zoomSpeed = 0.1;
      const newZoom = Math.max(
        0.1,
        Math.min(10, zoom - delta * zoomSpeed * 0.01)
      );

      // Zoom towards mouse position
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const zoomFactor = newZoom / zoom;
        const newPanX = mouseX - (mouseX - panX) * zoomFactor;
        const newPanY = mouseY - (mouseY - panY) * zoomFactor;

        setZoom(newZoom);
        setPanX(newPanX);
        setPanY(newPanY);
      }
    };

    const currentContainer = containerRef.current;
    currentContainer?.addEventListener("wheel", handleWheel, {
      passive: false,
    });
    return () => {
      currentContainer?.removeEventListener("wheel", handleWheel);
    };
  }, [zoom, panX, panY]);

  // Handle mouse drag for panning
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Only pan if Command (metaKey) or Control key is pressed
      const isCommandOrControlPressed = e.metaKey || e.ctrlKey;
      if (!isDragging) return;

      // Only pan if drag started outside #canvas-container
      const canvasContainer = document.getElementById("canvas-container");
      // If containerRef is available, prefer it (more React-like)
      const containerElem = canvasContainer;

      if (containerElem) {
        const rect = containerElem.getBoundingClientRect();
        // Only pan if the mouse is currently outside the canvas container
        if (
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom &&
          !isCommandOrControlPressed
        ) {
          return;
        }
      }

      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      setPanX(panX + deltaX);
      setPanY(panY + deltaY);
      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, dragStart, panX, panY]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      // Left mouse button
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const resetZoom = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
    setIsDragging(false);
    setDragStart({ x: 0, y: 0 });
  };

  useEffect(() => {
    const canvas = getCanvas() as fabric.Canvas;
    if (canvas) {
      add();
    }
    return () => {
      // Ensure we dispose the Fabric canvas on unmount/HMR to avoid re-init
      disposeCanvas();
    };
  }, []);

  // Handle Delete/Backspace to remove active object(s)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        try {
          const canvas = getCanvas() as fabric.Canvas;
          const activeObject = canvas.getActiveObject();
          if (activeObject) {
            e.preventDefault();
            remove();
          }
        } catch {
          // If canvas not ready, ignore
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden dark:bg-neutral-800 bg-neutral-300"
      style={{
        top: "80px", // Leave space for topbar
        left: "48px", // Leave space for sidebar
      }}
    >
      {/* Origin corner */}
      <div
        className="absolute dark:bg-neutral-800 bg-neutral-300 border-b border-r border-neutral-400/50 z-10"
        style={{
          width: `${RULER_SIZE}px`,
          height: `${RULER_SIZE}px`,
          top: 0,
          left: 0,
        }}
      />

      {/* Rulers */}
      <Ruler
        direction="horizontal"
        zoom={zoom}
        scroll={panX}
        length={containerSize.width - RULER_SIZE}
      />
      <Ruler
        direction="vertical"
        zoom={zoom}
        scroll={panY}
        length={containerSize.height - RULER_SIZE}
      />

      {/* Canvas area */}
      <div
        ref={canvasAreaRef}
        className="absolute dark:bg-neutral-600 bg-neutral-300"
        style={{
          cursor: isDragging ? "grabbing" : "grab",
          width: `${containerSize.width - RULER_SIZE}px`,
          height: `${containerSize.height - RULER_SIZE}px`,
          top: `${RULER_SIZE}px`,
          left: `${RULER_SIZE}px`,
          overflow: "hidden",
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Scrollable content */}
        <div
          style={{
            transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
            transformOrigin: "0 0",
          }}
        >
          {/* White canvas */}
          <div
            id="canvas-container"
            className="dark:text-neutral-500 text-neutral-50"
            style={{
              width: `${canvasWidth}px`,
              height: `${canvasHeight}px`,
              backgroundColor: "currentColor",
              marginLeft: `${RULER_ORIGIN_OFFSET}px`,
              marginTop: `${RULER_ORIGIN_OFFSET}px`,
              boxShadow: "0 0 0 1px rgba(0,0,0,0.1)",
            }}
          >
            {/* Canvas content goes here */}
            <canvas id="canvas" width={canvasWidth} height={canvasHeight} />
            {/* Example: Inline SVG usage */}
            {/*<div className="absolute z-10 top-[50px] left-[50px] w-[100px] h-[100px]">
              <ReactIcon
                style={{
                  width: "100%",
                  height: "100%",
                  filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))",
                }}
              /> 
            </div>*/}
          </div>
          {/* Grid pattern overlay (optional) */}
          <Grid
            zoomVisibilityThreshold={0.75}
            zoom={zoom}
            gridSize={20}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
          />

          <Grid
            zoomVisibilityThreshold={2}
            zoom={zoom}
            gridSize={2.5}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            color="rgba(0,0,0,0.05)"
          />
        </div>
      </div>

      {/* Zoom info (optional) */}
      <div
        onClick={resetZoom}
        className="cursor-pointer absolute bottom-4 right-4  dark:bg-neutral-900 bg-neutral-200 text-black dark:text-white px-3 py-2 rounded text-sm"
        style={{ zIndex: 20 }}
      >
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
};

export default CanvasBoard;
