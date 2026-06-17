"use client";

import React, { useEffect, useRef } from "react";
import { Image as KonvaImage, Layer, Rect, Transformer } from "react-konva";
import Konva from "konva";
import type { Annotation, ImageBounds } from "@/types/editor";

interface AnnotationLayerProps {
  annotations: Annotation[];
  image: HTMLImageElement | undefined;
  imageBounds: ImageBounds;
  selectedAnnotationId?: string | null;
  interactive?: boolean;
  onSelect?: (id: string) => void;
  onChange?: (id: string, updates: Partial<Annotation>) => void;
}

export function AnnotationLayer({
  annotations,
  image,
  imageBounds,
  selectedAnnotationId = null,
  interactive = false,
  onSelect,
  onChange,
}: AnnotationLayerProps) {
  const layerRef = useRef<Konva.Layer>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    const transformer = transformerRef.current;
    const layer = layerRef.current;
    if (!transformer || !layer || !interactive || !selectedAnnotationId) {
      transformer?.nodes([]);
      transformer?.getLayer()?.batchDraw();
      return;
    }

    const node = layer.findOne(`#annotation-${selectedAnnotationId}`);
    transformer.nodes(node ? [node] : []);
    transformer.getLayer()?.batchDraw();
  }, [interactive, selectedAnnotationId, annotations]);

  const handleTransformEnd = (
    event: Konva.KonvaEventObject<Event>,
    annotation: Annotation,
  ) => {
    const node = event.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const width = Math.max(6, node.width() * scaleX);
    const height = Math.max(6, node.height() * scaleY);
    const x = Math.max(0, Math.min(node.x(), imageBounds.width - width));
    const y = Math.max(0, Math.min(node.y(), imageBounds.height - height));

    node.scaleX(1);
    node.scaleY(1);
    node.position({ x, y });
    node.size({ width, height });

    onChange?.(annotation.id, { x, y, width, height });
  };

  const handleDragEnd = (
    event: Konva.KonvaEventObject<DragEvent>,
    annotation: Annotation,
  ) => {
    onChange?.(annotation.id, {
      x: event.target.x(),
      y: event.target.y(),
    });
  };

  return (
    <Layer ref={layerRef}>
      {annotations.map((annotation) => {
        const commonProps = {
          id: `annotation-${annotation.id}`,
          x: annotation.x,
          y: annotation.y,
          width: annotation.width,
          height: annotation.height,
          draggable: interactive,
          onClick: interactive
            ? (event: Konva.KonvaEventObject<MouseEvent>) => {
                event.cancelBubble = true;
                onSelect?.(annotation.id);
              }
            : undefined,
          onTap: interactive
            ? (event: Konva.KonvaEventObject<TouchEvent>) => {
                event.cancelBubble = true;
                onSelect?.(annotation.id);
              }
            : undefined,
          onDragEnd: interactive
            ? (event: Konva.KonvaEventObject<DragEvent>) =>
                handleDragEnd(event, annotation)
            : undefined,
          onTransformEnd: interactive
            ? (event: Konva.KonvaEventObject<Event>) =>
                handleTransformEnd(event, annotation)
            : undefined,
          dragBoundFunc: (position: { x: number; y: number }) => ({
            x: Math.max(
              0,
              Math.min(position.x, imageBounds.width - annotation.width),
            ),
            y: Math.max(
              0,
              Math.min(position.y, imageBounds.height - annotation.height),
            ),
          }),
        };

        if (annotation.tool === "redact") {
          return (
            <Rect
              key={annotation.id}
              {...commonProps}
              fill={annotation.redactColor}
              stroke={
                selectedAnnotationId === annotation.id
                  ? "rgba(167,139,250,0.9)"
                  : undefined
              }
              strokeWidth={selectedAnnotationId === annotation.id ? 1.5 : 0}
            />
          );
        }

        if (!image) return null;

        return (
          <FilteredAnnotation
            key={annotation.id}
            annotation={annotation}
            image={image}
            selected={selectedAnnotationId === annotation.id}
            commonProps={commonProps}
          />
        );
      })}

      {interactive ? (
        <Transformer
          ref={transformerRef}
          rotateEnabled={false}
          flipEnabled={false}
          keepRatio={false}
          borderStroke="#a78bfa"
          borderStrokeWidth={1.5}
          anchorFill="#ffffff"
          anchorStroke="#7c3aed"
          anchorStrokeWidth={1.5}
          anchorSize={9}
          padding={2}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 6 || newBox.height < 6) return oldBox;
            return newBox;
          }}
        />
      ) : null}
    </Layer>
  );
}

interface FilteredAnnotationProps {
  annotation: Annotation;
  image: HTMLImageElement;
  selected: boolean;
  commonProps: Omit<React.ComponentProps<typeof KonvaImage>, "image">;
}

function FilteredAnnotation({
  annotation,
  image,
  selected,
  commonProps,
}: FilteredAnnotationProps) {
  const imageRef = useRef<Konva.Image>(null);

  useEffect(() => {
    const node = imageRef.current;
    if (!node || annotation.width <= 0 || annotation.height <= 0) return;
    node.clearCache();
    node.cache({ pixelRatio: 1 });
    node.getLayer()?.batchDraw();
  }, [
    annotation.blurStrength,
    annotation.height,
    annotation.pixelSize,
    annotation.tool,
    annotation.width,
    image,
  ]);

  const isBlur = annotation.tool === "blur";

  return (
    <KonvaImage
      ref={imageRef}
      {...commonProps}
      image={image}
      crop={{
        x: annotation.x,
        y: annotation.y,
        width: annotation.width,
        height: annotation.height,
      }}
      filters={isBlur ? [Konva.Filters.Blur] : [Konva.Filters.Pixelate]}
      blurRadius={isBlur ? annotation.blurStrength : undefined}
      pixelSize={!isBlur ? annotation.pixelSize : undefined}
      stroke={selected ? "rgba(167,139,250,0.9)" : undefined}
      strokeWidth={selected ? 1.5 : 0}
    />
  );
}
