"use client";

import React, {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";

import { getProtectionPreset } from "@/features/editor/protection-presets";

import type {
  Annotation,
  AnnotationSnapshot,
  EditorState,
  ImageBounds,
  ProtectionMode,
  ToolType,
} from "@/types/editor";

interface EditorContextType extends EditorState {
  setImage: (file: File, url: string, bounds: ImageBounds) => void;
  setActiveTool: (tool: ToolType) => void;
  setProtectionMode: (mode: ProtectionMode) => void;
  setImageBounds: (bounds: ImageBounds | null) => void;
  addAnnotation: (annotation: Annotation) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  deleteAnnotation: (id: string) => void;
  selectAnnotation: (id: string | null) => void;
  undo: () => void;
  redo: () => void;
  clearAnnotations: () => void;
  resetEditor: () => void;
  setZoom: (zoom: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  selectedAnnotation: Annotation | null;
}

type EditorAction =
  | {
      type: "SET_IMAGE";
      payload: {
        file: File;
        url: string;
        bounds: ImageBounds;
      };
    }
  | {
      type: "SET_ACTIVE_TOOL";
      payload: ToolType;
    }
  | {
      type: "SET_PROTECTION_MODE";
      payload: ProtectionMode;
    }
  | {
      type: "SET_IMAGE_BOUNDS";
      payload: ImageBounds | null;
    }
  | {
      type: "ADD_ANNOTATION";
      payload: Annotation;
    }
  | {
      type: "UPDATE_ANNOTATION";
      payload: {
        id: string;
        updates: Partial<Annotation>;
      };
    }
  | {
      type: "DELETE_ANNOTATION";
      payload: string;
    }
  | {
      type: "SELECT_ANNOTATION";
      payload: string | null;
    }
  | {
      type: "UNDO";
    }
  | {
      type: "REDO";
    }
  | {
      type: "CLEAR_ANNOTATIONS";
    }
  | {
      type: "RESET_EDITOR";
    }
  | {
      type: "SET_ZOOM";
      payload: number;
    };

const initialState: EditorState = {
  imageFile: null,
  imageUrl: null,
  activeTool: "select",
  protectionMode: "standard",
  imageBounds: null,
  annotations: [],
  selectedAnnotationId: null,
  zoom: 1,
  past: [],
  future: [],
};

const EditorContext = createContext<EditorContextType | undefined>(undefined);

function snapshot(state: EditorState): AnnotationSnapshot {
  return {
    annotations: state.annotations.map((annotation) => ({
      ...annotation,
    })),
    selectedAnnotationId: state.selectedAnnotationId,
  };
}

function commit(
  state: EditorState,
  annotations: Annotation[],
  selectedAnnotationId: string | null,
): EditorState {
  return {
    ...state,
    annotations,
    selectedAnnotationId,
    past: [...state.past.slice(-49), snapshot(state)],
    future: [],
  };
}

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "SET_IMAGE":
      return {
        ...initialState,
        imageFile: action.payload.file,
        imageUrl: action.payload.url,
        imageBounds: action.payload.bounds,
      };

    case "SET_ACTIVE_TOOL":
      return {
        ...state,
        activeTool: action.payload,
        selectedAnnotationId:
          action.payload === "select" ? state.selectedAnnotationId : null,
      };

    case "SET_PROTECTION_MODE": {
      const preset = getProtectionPreset(action.payload);

      const selectedAnnotation = state.annotations.find(
        (annotation) => annotation.id === state.selectedAnnotationId,
      );

      // No selected region:
      // use this preset for the next region that is drawn.
      if (!selectedAnnotation) {
        return {
          ...state,
          protectionMode: action.payload,
          activeTool: preset.tool,
        };
      }

      // Selected region:
      // apply the preset immediately and save it in history.
      const updatedAnnotations = state.annotations.map((annotation) =>
        annotation.id === selectedAnnotation.id
          ? {
              ...annotation,
              tool: preset.tool,
              blurStrength: preset.blurStrength,
              pixelSize: preset.pixelSize,
              redactColor: preset.redactColor,
            }
          : annotation,
      );

      return {
        ...commit(state, updatedAnnotations, selectedAnnotation.id),
        protectionMode: action.payload,
        activeTool: "select",
      };
    }

    case "SET_IMAGE_BOUNDS":
      return {
        ...state,
        imageBounds: action.payload,
      };

    case "ADD_ANNOTATION":
      return commit(
        state,
        [...state.annotations, action.payload],
        action.payload.id,
      );

    case "UPDATE_ANNOTATION": {
      const currentAnnotation = state.annotations.find(
        (annotation) => annotation.id === action.payload.id,
      );

      if (!currentAnnotation) {
        return state;
      }

      const updatedAnnotations = state.annotations.map((annotation) =>
        annotation.id === action.payload.id
          ? {
              ...annotation,
              ...action.payload.updates,
            }
          : annotation,
      );

      return commit(state, updatedAnnotations, action.payload.id);
    }

    case "DELETE_ANNOTATION": {
      const annotationExists = state.annotations.some(
        (annotation) => annotation.id === action.payload,
      );

      if (!annotationExists) {
        return state;
      }

      return commit(
        state,
        state.annotations.filter(
          (annotation) => annotation.id !== action.payload,
        ),
        null,
      );
    }

    case "SELECT_ANNOTATION":
      return {
        ...state,
        selectedAnnotationId: action.payload,
      };

    case "UNDO": {
      const previousSnapshot = state.past.at(-1);

      if (!previousSnapshot) {
        return state;
      }

      return {
        ...state,
        annotations: previousSnapshot.annotations.map((annotation) => ({
          ...annotation,
        })),
        selectedAnnotationId: previousSnapshot.selectedAnnotationId,
        past: state.past.slice(0, -1),
        future: [snapshot(state), ...state.future.slice(0, 49)],
      };
    }

    case "REDO": {
      const nextSnapshot = state.future[0];

      if (!nextSnapshot) {
        return state;
      }

      return {
        ...state,
        annotations: nextSnapshot.annotations.map((annotation) => ({
          ...annotation,
        })),
        selectedAnnotationId: nextSnapshot.selectedAnnotationId,
        past: [...state.past.slice(-49), snapshot(state)],
        future: state.future.slice(1),
      };
    }

    case "CLEAR_ANNOTATIONS":
      return state.annotations.length > 0 ? commit(state, [], null) : state;

    case "SET_ZOOM":
      return {
        ...state,
        zoom: Math.min(3, Math.max(0.35, action.payload)),
      };

    case "RESET_EDITOR":
      return initialState;

    default:
      return state;
  }
}

export function EditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(editorReducer, initialState);

  const imageUrlRef = useRef<string | null>(null);

  useEffect(() => {
    imageUrlRef.current = state.imageUrl;
  }, [state.imageUrl]);

  useEffect(() => {
    return () => {
      if (imageUrlRef.current) {
        URL.revokeObjectURL(imageUrlRef.current);
      }
    };
  }, []);

  const setImage = useCallback(
    (file: File, url: string, bounds: ImageBounds) => {
      if (imageUrlRef.current && imageUrlRef.current !== url) {
        URL.revokeObjectURL(imageUrlRef.current);
      }

      imageUrlRef.current = url;

      dispatch({
        type: "SET_IMAGE",
        payload: {
          file,
          url,
          bounds,
        },
      });
    },
    [],
  );

  const resetEditor = useCallback(() => {
    if (imageUrlRef.current) {
      URL.revokeObjectURL(imageUrlRef.current);
      imageUrlRef.current = null;
    }

    dispatch({
      type: "RESET_EDITOR",
    });
  }, []);

  const selectedAnnotation = useMemo(
    () =>
      state.annotations.find(
        (annotation) => annotation.id === state.selectedAnnotationId,
      ) ?? null,
    [state.annotations, state.selectedAnnotationId],
  );

  const value = useMemo<EditorContextType>(
    () => ({
      ...state,

      setImage,

      setActiveTool: (tool) =>
        dispatch({
          type: "SET_ACTIVE_TOOL",
          payload: tool,
        }),

      setProtectionMode: (mode) =>
        dispatch({
          type: "SET_PROTECTION_MODE",
          payload: mode,
        }),

      setImageBounds: (bounds) =>
        dispatch({
          type: "SET_IMAGE_BOUNDS",
          payload: bounds,
        }),

      addAnnotation: (annotation) =>
        dispatch({
          type: "ADD_ANNOTATION",
          payload: annotation,
        }),

      updateAnnotation: (id, updates) =>
        dispatch({
          type: "UPDATE_ANNOTATION",
          payload: {
            id,
            updates,
          },
        }),

      deleteAnnotation: (id) =>
        dispatch({
          type: "DELETE_ANNOTATION",
          payload: id,
        }),

      selectAnnotation: (id) =>
        dispatch({
          type: "SELECT_ANNOTATION",
          payload: id,
        }),

      undo: () =>
        dispatch({
          type: "UNDO",
        }),

      redo: () =>
        dispatch({
          type: "REDO",
        }),

      clearAnnotations: () =>
        dispatch({
          type: "CLEAR_ANNOTATIONS",
        }),

      resetEditor,

      setZoom: (zoom) =>
        dispatch({
          type: "SET_ZOOM",
          payload: zoom,
        }),

      canUndo: state.past.length > 0,
      canRedo: state.future.length > 0,
      selectedAnnotation,
    }),
    [state, setImage, resetEditor, selectedAnnotation],
  );

  return (
    <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);

  if (!context) {
    throw new Error("useEditor must be used within an EditorProvider");
  }

  return context;
}
