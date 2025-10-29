import { useEffect, useRef, useState, type FC } from "react";

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
      className="absolute bg-[#2b2b2b] text-[#888] text-[11px] select-none"
      style={{
        width: isHorizontal ? `${length}px` : `${RULER_SIZE}px`,
        height: isHorizontal ? `${RULER_SIZE}px` : `${length}px`,
        top: isHorizontal ? 0 : RULER_SIZE,
        left: isHorizontal ? RULER_SIZE : 0,
        borderBottom: isHorizontal ? "1px solid #1a1a1a" : "none",
        borderRight: !isHorizontal ? "1px solid #1a1a1a" : "none",
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
          backgroundColor: "#555",
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
              backgroundColor: "#555",
            }}
          >
            {mark.isLong && (
              <div
                style={{
                  position: "absolute",
                  [isHorizontal ? "left" : "top"]: 3,
                  [isHorizontal ? "top" : "left"]: isHorizontal ? 12 : 4,
                  fontSize: "10px",
                  color: "#ddd",
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
      if (!isDragging) return;

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

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden bg-[#2b2b2b]"
      style={{
        top: "80px", // Leave space for topbar
        left: "48px", // Leave space for sidebar
      }}
    >
      {/* Origin corner */}
      <div
        className="absolute bg-[#2b2b2b] border-b border-r border-[#1a1a1a] z-10"
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
        className="absolute bg-gray-200"
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
            style={{
              width: `${canvasWidth}px`,
              height: `${canvasHeight}px`,
              backgroundColor: "white",
              marginLeft: `${RULER_ORIGIN_OFFSET}px`,
              marginTop: `${RULER_ORIGIN_OFFSET}px`,
              boxShadow: "0 0 0 1px rgba(0,0,0,0.1)",
            }}
          >
            {/* Canvas content goes here */}
          </div>
          {/* Grid pattern overlay (optional) */}
          <div
            className="absolute pointer-events-none top-0 left-0"
            style={{
              width: `${canvasWidth}px`,
              height: `${canvasHeight}px`,
              marginLeft: `${RULER_ORIGIN_OFFSET}px`,
              // marginTop: `${RULER_ORIGIN_OFFSET}px`,
              backgroundImage: `
              linear-gradient(rgba(0,0,0,0.05) ${1 / zoom}px, transparent ${
                1 / zoom
              }px),
              linear-gradient(90deg, rgba(0,0,0,0.05) ${
                1 / zoom
              }px, transparent ${1 / zoom}px)
            `,
              // backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
              backgroundSize: `${20 / zoom}px ${20 / zoom}px`,
            }}
          />
        </div>
      </div>

      {/* Zoom info (optional) */}
      <div
        className="absolute bottom-4 right-4 bg-[#2b2b2b] text-white px-3 py-2 rounded text-sm"
        style={{
          zIndex: 20,
        }}
      >
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
};

export default CanvasBoard;
