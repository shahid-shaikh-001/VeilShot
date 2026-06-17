"use client";

import { useEffect } from "react";
import { useEditor } from "@/providers/EditorProvider";

export function useEditorShortcuts() {
  const {
    selectedAnnotationId,
    deleteAnnotation,
    selectAnnotation,
    undo,
    redo,
    setActiveTool,
    zoom,
    setZoom,
  } = useEditor();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return;
      }

      const modifier = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();

      if (modifier && key === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }

      if (modifier && key === "y") {
        event.preventDefault();
        redo();
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        if (selectedAnnotationId) {
          event.preventDefault();
          deleteAnnotation(selectedAnnotationId);
        }
        return;
      }

      if (event.key === "Escape") {
        setActiveTool("select");
        selectAnnotation(null);
        return;
      }

      if (event.key === "0") {
        setZoom(1);
        return;
      }

      if (event.key === "+" || event.key === "=") {
        setZoom(Number((zoom + 0.15).toFixed(2)));
        return;
      }

      if (event.key === "-") {
        setZoom(Number((zoom - 0.15).toFixed(2)));
        return;
      }

      if (key === "v") setActiveTool("select");
      if (key === "b") setActiveTool("blur");
      if (key === "p") setActiveTool("pixelate");
      if (key === "r") setActiveTool("redact");
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    deleteAnnotation,
    redo,
    selectAnnotation,
    selectedAnnotationId,
    setActiveTool,
    setZoom,
    undo,
    zoom,
  ]);
}
