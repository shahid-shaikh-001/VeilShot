"use client";

import Konva from "konva";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Image as KonvaImage, Layer, Stage } from "react-konva";
import useImage from "use-image";

import { AnnotationLayer } from "@/components/editor/AnnotationLayer";
import { getProtectionPreset } from "@/features/editor/protection-presets";
import { useEditor } from "@/providers/EditorProvider";

import type { Annotation, EffectType } from "@/types/editor";

const CANVAS_HEADER_HEIGHT = 40;

export function EditorCanvas() {
  const {
    imageUrl,
    imageBounds,
    activeTool,
    protectionMode,
    annotations,
    selectedAnnotationId,
    zoom,
    addAnnotation,
    updateAnnotation,
    selectAnnotation,
    setActiveTool,
  } = useEditor();

  const [image] = useImage(imageUrl || "");

  const containerRef = useRef<HTMLDivElement>(null);

  const [viewport, setViewport] = useState({
    width: 0,
    height: 0,
  });

  const [isDrawing, setIsDrawing] = useState(false);

  const [currentShape, setCurrentShape] = useState<Annotation | null>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    let frameId = 0;

    const updateViewport = () => {
      cancelAnimationFrame(frameId);

      frameId = requestAnimationFrame(() => {
        setViewport({
          width: container.clientWidth,
          height: container.clientHeight,
        });
      });
    };

    const observer = new ResizeObserver(updateViewport);

    observer.observe(container);
    updateViewport();

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, []);

  const canvasPadding = useMemo(() => {
    if (viewport.width < 480) {
      return 12;
    }

    if (viewport.width < 768) {
      return 16;
    }

    return 24;
  }, [viewport.width]);

  const fitScale = useMemo(() => {
    if (!imageBounds || viewport.width <= 0 || viewport.height <= 0) {
      return 1;
    }

    const availableWidth = Math.max(1, viewport.width - canvasPadding * 2);

    const availableHeight = Math.max(
      1,
      viewport.height - canvasPadding * 2 - CANVAS_HEADER_HEIGHT,
    );

    return Math.min(
      availableWidth / imageBounds.width,
      availableHeight / imageBounds.height,
      1,
    );
  }, [canvasPadding, imageBounds, viewport.height, viewport.width]);

  const displayScale = Math.max(0.01, fitScale * zoom);

  const stageWidth = imageBounds ? imageBounds.width * displayScale : 0;

  const stageHeight = imageBounds ? imageBounds.height * displayScale : 0;

  const workspaceWidth = Math.max(
    viewport.width,
    stageWidth + canvasPadding * 2,
  );

  const workspaceHeight = Math.max(
    viewport.height,
    stageHeight + canvasPadding * 2 + CANVAS_HEADER_HEIGHT,
  );

  const getImagePointer = (
    event: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => {
    const stage = event.target.getStage();
    const pointer = stage?.getPointerPosition();

    if (!pointer || !imageBounds) {
      return null;
    }

    return {
      x: clamp(pointer.x / displayScale, 0, imageBounds.width),

      y: clamp(pointer.y / displayScale, 0, imageBounds.height),
    };
  };

  const handlePointerDown = (
    event: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => {
    if (!imageBounds) {
      return;
    }

    if (activeTool === "select") {
      const targetName = event.target.name();

      if (
        event.target === event.target.getStage() ||
        targetName === "base-image"
      ) {
        selectAnnotation(null);
      }

      return;
    }

    const pointer = getImagePointer(event);

    if (!pointer) {
      return;
    }

    const preset = getProtectionPreset(protectionMode);

    const annotation: Annotation = {
      id: createAnnotationId(),
      tool: activeTool as EffectType,

      x: pointer.x,
      y: pointer.y,
      width: 0,
      height: 0,

      blurStrength: preset.blurStrength,
      pixelSize: preset.pixelSize,
      redactColor: preset.redactColor,
    };

    setIsDrawing(true);
    setCurrentShape(annotation);
  };

  const handlePointerMove = (
    event: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => {
    if (!isDrawing || !currentShape) {
      return;
    }

    const pointer = getImagePointer(event);

    if (!pointer) {
      return;
    }

    setCurrentShape({
      ...currentShape,
      width: pointer.x - currentShape.x,
      height: pointer.y - currentShape.y,
    });
  };

  const finishDrawing = () => {
    if (!isDrawing || !currentShape || !imageBounds) {
      return;
    }

    setIsDrawing(false);

    const normalized = normalizeAnnotation(currentShape, imageBounds);

    if (normalized.width >= 6 && normalized.height >= 6) {
      addAnnotation(normalized);
      setActiveTool("select");
    }

    setCurrentShape(null);
  };

  if (!imageUrl || !imageBounds) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full min-h-0 w-full min-w-0 overflow-auto overscroll-contain bg-[#08080a]"
    >
      <div
        className="flex items-center justify-center"
        style={{
          width: workspaceWidth,
          height: workspaceHeight,
          padding: canvasPadding,
        }}
      >
        {image && stageWidth > 0 && stageHeight > 0 ? (
          <div className="shrink-0 overflow-hidden rounded-lg border border-neutral-700 bg-neutral-900 shadow-2xl shadow-black/60 sm:rounded-xl">
            <div className="flex h-10 items-center gap-2 border-b border-neutral-800 bg-neutral-950 px-3 sm:px-4">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500/80 sm:h-3 sm:w-3" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80 sm:h-3 sm:w-3" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80 sm:h-3 sm:w-3" />

              <span className="ml-auto max-w-40 truncate text-[10px] text-neutral-600 sm:text-xs">
                {Math.round(imageBounds.width)} ×{" "}
                {Math.round(imageBounds.height)}
              </span>
            </div>

            <Stage
              width={stageWidth}
              height={stageHeight}
              scaleX={displayScale}
              scaleY={displayScale}
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseUp={finishDrawing}
              onMouseLeave={finishDrawing}
              onTouchStart={handlePointerDown}
              onTouchMove={handlePointerMove}
              onTouchEnd={finishDrawing}
              style={{
                display: "block",
                cursor: activeTool === "select" ? "default" : "crosshair",
                background: "#111113",
                touchAction: activeTool === "select" ? "pan-x pan-y" : "none",
              }}
            >
              <Layer listening={activeTool === "select"}>
                <KonvaImage
                  name="base-image"
                  image={image}
                  width={imageBounds.width}
                  height={imageBounds.height}
                />
              </Layer>

              <AnnotationLayer
                annotations={annotations}
                image={image}
                imageBounds={imageBounds}
                selectedAnnotationId={selectedAnnotationId}
                interactive={activeTool === "select"}
                onSelect={selectAnnotation}
                onChange={updateAnnotation}
              />

              {currentShape ? (
                <AnnotationLayer
                  annotations={[normalizeAnnotation(currentShape, imageBounds)]}
                  image={image}
                  imageBounds={imageBounds}
                />
              ) : null}
            </Stage>
          </div>
        ) : (
          <div className="flex min-h-40 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900/40 px-6 text-sm text-neutral-500">
            Loading image…
          </div>
        )}
      </div>
    </div>
  );
}

function normalizeAnnotation(
  annotation: Annotation,
  bounds: {
    width: number;
    height: number;
  },
): Annotation {
  const rawX =
    annotation.width < 0 ? annotation.x + annotation.width : annotation.x;

  const rawY =
    annotation.height < 0 ? annotation.y + annotation.height : annotation.y;

  const x = clamp(rawX, 0, bounds.width);
  const y = clamp(rawY, 0, bounds.height);

  const width = Math.max(
    0,
    Math.min(Math.abs(annotation.width), bounds.width - x),
  );

  const height = Math.max(
    0,
    Math.min(Math.abs(annotation.height), bounds.height - y),
  );

  return {
    ...annotation,
    x,
    y,
    width,
    height,
  };
}

function createAnnotationId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
