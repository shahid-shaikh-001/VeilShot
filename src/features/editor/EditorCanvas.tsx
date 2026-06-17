"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Image as KonvaImage, Layer, Stage } from "react-konva";
import useImage from "use-image";
import Konva from "konva";

import { AnnotationLayer } from "@/components/editor/AnnotationLayer";
import { getProtectionPreset } from "@/features/editor/protection-presets";
import { useEditor } from "@/providers/EditorProvider";

import type { Annotation, EffectType } from "@/types/editor";

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

    const updateViewport = () => {
      setViewport({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };

    updateViewport();

    const observer = new ResizeObserver(updateViewport);

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  const fitScale = useMemo(() => {
    if (!imageBounds || !viewport.width || !viewport.height) {
      return 1;
    }

    const availableWidth = Math.max(240, viewport.width - 48);

    const availableHeight = Math.max(220, viewport.height - 100);

    return Math.min(
      availableWidth / imageBounds.width,
      availableHeight / imageBounds.height,
      1,
    );
  }, [imageBounds, viewport]);

  const displayScale = fitScale * zoom;

  const stageWidth = imageBounds ? imageBounds.width * displayScale : 0;

  const stageHeight = imageBounds ? imageBounds.height * displayScale : 0;

  const getImagePointer = (
    event: Konva.KonvaEventObject<MouseEvent | TouchEvent>,
  ) => {
    const pointer = event.target.getStage()?.getPointerPosition();

    if (!pointer || !imageBounds) {
      return null;
    }

    return {
      x: Math.max(0, Math.min(pointer.x / displayScale, imageBounds.width)),

      y: Math.max(0, Math.min(pointer.y / displayScale, imageBounds.height)),
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
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`,

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

  const handlePointerUp = () => {
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
      className="relative h-full w-full overflow-auto bg-[#08080a]"
    >
      <div
        className="flex items-center justify-center p-6"
        style={{
          width: Math.max(viewport.width, stageWidth + 48),

          height: Math.max(viewport.height, stageHeight + 48),
        }}
      >
        {image && stageWidth > 0 && stageHeight > 0 ? (
          <div className="overflow-hidden rounded-xl border border-neutral-700 bg-neutral-900 shadow-2xl shadow-black/60">
            <div className="flex h-10 items-center gap-2 border-b border-neutral-800 bg-neutral-950 px-4">
              <span className="h-3 w-3 rounded-full bg-red-500/80" />
              <span className="h-3 w-3 rounded-full bg-amber-400/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
            </div>

            <Stage
              width={stageWidth}
              height={stageHeight}
              scaleX={displayScale}
              scaleY={displayScale}
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp}
              onMouseLeave={handlePointerUp}
              onTouchStart={handlePointerDown}
              onTouchMove={handlePointerMove}
              onTouchEnd={handlePointerUp}
              style={{
                cursor: activeTool === "select" ? "default" : "crosshair",

                background: "#111113",
              }}
            >
              <Layer listening={activeTool === "select"}>
                <KonvaImage name="base-image" image={image} />
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
          <div className="text-sm text-neutral-500">Loading image…</div>
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

  const x = Math.max(0, Math.min(rawX, bounds.width));

  const y = Math.max(0, Math.min(rawY, bounds.height));

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
