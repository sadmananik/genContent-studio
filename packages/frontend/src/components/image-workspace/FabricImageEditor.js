"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BringToFront, Circle, ImagePlus, Redo2, Square, Trash2, Type, Undo2 } from "lucide-react";
import Button from "../common/Button";
import StatusText from "../common/StatusText";

const canvasSize = { height: 680, width: 1080 };
const CANVAS_EMIT_THROTTLE_MS = 40;

export default function FabricImageEditor({
  activeResponseId,
  clearCanvasRequest,
  collaborationProvider,
  editable = true,
  generationRequest,
  onDirtyChange,
  onReady,
  remoteCanvasPointers = [],
  remoteCanvasState,
  remoteCanvasTransform,
  statusLabel,
  statusTone = "success"
}) {
  const canvasElementRef = useRef(null);
  const canvasRef = useRef(null);
  const fabricRef = useRef(null);
  const applyingRemoteStateRef = useRef(false);
  const remoteApplyStateRef = useRef({ isApplying: false, pendingState: null });
  const lastCanvasEmitRef = useRef(0);
  const historyRef = useRef({ future: [], past: [] });
  const restoringHistoryRef = useRef(false);
  const collaborationProviderRef = useRef(collaborationProvider);
  const editableRef = useRef(editable);
  const activeResponseIdRef = useRef(activeResponseId);
  collaborationProviderRef.current = collaborationProvider;
  editableRef.current = editable;
  activeResponseIdRef.current = activeResponseId;
  const [activeObjectType, setActiveObjectType] = useState("None");
  const [canRedo, setCanRedo] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [fillColor, setFillColor] = useState("#8b5cf6");
  const [opacity, setOpacity] = useState(100);

  const updateHistoryControls = useCallback(() => {
    setCanUndo(historyRef.current.past.length > 1);
    setCanRedo(historyRef.current.future.length > 0);
  }, []);

  const resetHistory = useCallback(
    (canvas) => {
      historyRef.current = { future: [], past: [canvas.toJSON()] };
      updateHistoryControls();
    },
    [updateHistoryControls]
  );

  const recordHistory = useCallback(
    (canvas) => {
      if (applyingRemoteStateRef.current || restoringHistoryRef.current) {
        return;
      }

      const snapshot = canvas.toJSON();
      const past = historyRef.current.past;
      const previousSnapshot = past[past.length - 1];

      if (JSON.stringify(previousSnapshot) === JSON.stringify(snapshot)) {
        return;
      }

      historyRef.current = {
        future: [],
        past: [...past.slice(-49), snapshot]
      };
      updateHistoryControls();
    },
    [updateHistoryControls]
  );

  useEffect(() => {
    let isMounted = true;

    async function setupCanvas() {
      const fabric = await import("fabric");

      if (!isMounted || !canvasElementRef.current) {
        return;
      }

      fabricRef.current = fabric;
      let isInitializing = true;

      const canvas = new fabric.Canvas(canvasElementRef.current, {
        backgroundColor: "#ffffff",
        height: canvasSize.height,
        preserveObjectStacking: true,
        renderOnAddRemove: true,
        selection: editableRef.current,
        width: canvasSize.width
      });

      canvasRef.current = canvas;
      canvas.setDimensions(canvasSize);

      canvas.calcOffset();
      canvas.requestRenderAll();
      resetHistory(canvas);

      const markDirty = () => {
        if (!isInitializing && !applyingRemoteStateRef.current) {
          recordHistory(canvas);
          onDirtyChange?.(true);

          try {
            collaborationProviderRef.current?.emitCanvasUpdate(
              canvas.toJSON(),
              activeResponseIdRef.current
            );
          } catch (error) {
            console.error("[canvas] failed to emit canvas update", error);
          }
        }
      };
      const markDirtyThrottled = (event) => {
        if (isInitializing || applyingRemoteStateRef.current) {
          return;
        }

        recordHistory(canvas);
        onDirtyChange?.(true);

        const now = Date.now();
        if (now - lastCanvasEmitRef.current < CANVAS_EMIT_THROTTLE_MS) {
          return;
        }

        lastCanvasEmitRef.current = now;

        try {
          const target = event?.target;
          const objectIndex = target ? canvas.getObjects().indexOf(target) : -1;

          if (objectIndex === -1) {
            return;
          }

          collaborationProviderRef.current?.emitCanvasTransform(
            objectIndex,
            {
              angle: target.angle,
              flipX: target.flipX,
              flipY: target.flipY,
              left: target.left,
              scaleX: target.scaleX,
              scaleY: target.scaleY,
              skewX: target.skewX,
              skewY: target.skewY,
              top: target.top
            },
            activeResponseIdRef.current
          );
        } catch (error) {
          console.error("[canvas] failed to emit canvas transform", error);
        }
      };
      const emitPointer = (event) => {
        try {
          const pointer = getCanvasPointer(event.e, canvas);
          collaborationProviderRef.current?.emitCanvasPointer(
            {
              x: Math.round(pointer.x),
              y: Math.round(pointer.y)
            },
            activeResponseIdRef.current
          );
        } catch (error) {
          console.error("[canvas] failed to emit pointer", error);
        }
      };
      const syncSelection = () => {
        const activeObject = canvas.getActiveObject();
        setActiveObjectType(activeObject?.type || "None");

        if (activeObject?.fill && typeof activeObject.fill === "string") {
          setFillColor(activeObject.fill);
        }

        setOpacity(Math.round((activeObject?.opacity ?? 1) * 100));
      };

      canvas.on("object:modified", markDirty);
      canvas.on("object:moving", markDirtyThrottled);
      canvas.on("object:scaling", markDirtyThrottled);
      canvas.on("object:rotating", markDirtyThrottled);
      canvas.on("object:added", markDirty);
      canvas.on("object:removed", markDirty);
      canvas.on("mouse:move", emitPointer);
      canvas.on("selection:created", syncSelection);
      canvas.on("selection:updated", syncSelection);
      canvas.on("selection:cleared", syncSelection);

      onReady?.(canvas);
      isInitializing = false;
      onDirtyChange?.(false);
    }

    setupCanvas();

    return () => {
      isMounted = false;
      canvasRef.current?.dispose();
      canvasRef.current = null;
    };
  }, [onDirtyChange, onReady, recordHistory, resetHistory]);

  const applyRemoteCanvasState = useCallback(
    (canvas, state) => {
      const applyState = remoteApplyStateRef.current;

      if (applyState.isApplying) {
        applyState.pendingState = state;
        return;
      }

      applyState.isApplying = true;
      applyingRemoteStateRef.current = true;
      // Keep the canvas white while objects reload asynchronously to avoid a black flash.
      canvas.backgroundColor = state.background || "#ffffff";
      canvas.requestRenderAll();
      canvas
        .loadFromJSON(state)
        .then(() => {
          canvas.requestRenderAll();
          resetHistory(canvas);
          onDirtyChange?.(false);
        })
        .catch(() => {})
        .finally(() => {
          applyingRemoteStateRef.current = false;
          applyState.isApplying = false;

          const pendingState = applyState.pendingState;
          applyState.pendingState = null;

          if (pendingState) {
            applyRemoteCanvasState(canvas, pendingState);
          }
        });
    },
    [onDirtyChange, resetHistory]
  );

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || !Array.isArray(remoteCanvasState?.objects)) {
      return;
    }

    applyRemoteCanvasState(canvas, remoteCanvasState);
  }, [applyRemoteCanvasState, remoteCanvasState]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || !remoteCanvasTransform || applyingRemoteStateRef.current) {
      return;
    }

    const target = canvas.getObjects()[remoteCanvasTransform.objectIndex];

    if (!target) {
      return;
    }

    target.set(remoteCanvasTransform.transform);
    target.setCoords();
    canvas.requestRenderAll();
  }, [remoteCanvasTransform]);

  const notifyCanvasChange = useCallback(() => {
    const canvas = canvasRef.current;

    if (!canvas || applyingRemoteStateRef.current) {
      return;
    }

    onDirtyChange?.(true);
    collaborationProviderRef.current?.emitCanvasUpdate(
      canvas.toJSON(),
      activeResponseIdRef.current
    );
  }, [onDirtyChange]);

  const addGeneratedImage = useCallback(
    async ({ imageUrl, requestId, syncCanvas = true }) => {
      const fabric = fabricRef.current;
      const canvas = canvasRef.current;

      if (!fabric || !canvas || !editableRef.current) {
        return;
      }

      applyingRemoteStateRef.current = true;
      try {
        canvas.discardActiveObject();
        canvas.remove(...canvas.getObjects());

        const colors = ["#8b5cf6", "#14b8a6", "#f59e0b", "#ec4899"];
        const accentColor = colors[requestId % colors.length];
        const generatedImage = await createGeneratedImageObject(fabric, imageUrl, accentColor);

        canvas.add(generatedImage);
        canvas.setActiveObject(generatedImage);
        canvas.requestRenderAll();
      } finally {
        applyingRemoteStateRef.current = false;
      }

      if (syncCanvas) {
        notifyCanvasChange();
      } else {
        resetHistory(canvas);
        onDirtyChange?.(false);
      }
    },
    [notifyCanvasChange, onDirtyChange, resetHistory]
  );

  useEffect(() => {
    if (!generationRequest || !canvasRef.current || !fabricRef.current) {
      return;
    }

    addGeneratedImage({
      imageUrl: generationRequest.imageUrl,
      requestId: generationRequest.id,
      syncCanvas: generationRequest.syncCanvas
    });
  }, [addGeneratedImage, generationRequest]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || !clearCanvasRequest) {
      return;
    }

    applyingRemoteStateRef.current = true;
    try {
      canvas.discardActiveObject();
      canvas.remove(...canvas.getObjects());
      canvas.backgroundColor = "#ffffff";
      canvas.requestRenderAll();
    } finally {
      applyingRemoteStateRef.current = false;
    }

    if (clearCanvasRequest.syncCanvas) {
      notifyCanvasChange();
    } else {
      resetHistory(canvas);
      onDirtyChange?.(false);
    }
  }, [clearCanvasRequest, notifyCanvasChange, onDirtyChange, resetHistory]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    canvas.selection = editable;
    canvas.forEachObject((object) => {
      object.selectable = editable;
      object.evented = editable;
    });
    canvas.discardActiveObject();
    canvas.requestRenderAll();
  }, [editable]);

  function addText() {
    const fabric = fabricRef.current;
    const canvas = canvasRef.current;

    if (!fabric || !canvas || !editable) {
      return;
    }

    const text = new fabric.Textbox("Edit text", {
      fill: fillColor,
      fontFamily: "Arial",
      fontSize: 42,
      fontWeight: 700,
      left: 120,
      top: 120,
      width: 260
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.requestRenderAll();
  }

  function addShape(shape) {
    const fabric = fabricRef.current;
    const canvas = canvasRef.current;

    if (!fabric || !canvas || !editable) {
      return;
    }

    const object =
      shape === "circle"
        ? new fabric.Circle({
            fill: fillColor,
            left: 160,
            radius: 58,
            stroke: "#312e81",
            strokeWidth: 2,
            top: 150
          })
        : new fabric.Rect({
            fill: fillColor,
            height: 120,
            left: 160,
            rx: 14,
            ry: 14,
            stroke: "#312e81",
            strokeWidth: 2,
            top: 150,
            width: 180
          });

    canvas.add(object);
    canvas.setActiveObject(object);
    canvas.requestRenderAll();
  }

  function applyFillColor(nextColor) {
    const canvas = canvasRef.current;
    const activeObject = canvas?.getActiveObject();

    setFillColor(nextColor);

    if (!activeObject || !editable) {
      return;
    }
    activeObject.set("fill", nextColor);
    canvas.requestRenderAll();
    notifyCanvasChange();
  }

  function applyOpacity(nextOpacity) {
    const canvas = canvasRef.current;
    const activeObject = canvas?.getActiveObject();

    setOpacity(nextOpacity);

    if (!activeObject || !editable) {
      return;
    }
    activeObject.set("opacity", nextOpacity / 100);
    canvas.requestRenderAll();
    notifyCanvasChange();
  }

  const deleteSelected = useCallback(() => {
    const canvas = canvasRef.current;
    const activeObjects = canvas?.getActiveObjects() || [];

    if (!editable) {
      return;
    }

    activeObjects.forEach((object) => canvas.remove(object));
    canvas?.requestRenderAll();
    notifyCanvasChange();
  }, [editable, notifyCanvasChange]);

  const restoreHistorySnapshot = useCallback(
    async (snapshot) => {
      const canvas = canvasRef.current;

      if (!canvas || !snapshot) {
        return;
      }

      restoringHistoryRef.current = true;
      try {
        await canvas.loadFromJSON(snapshot);
        canvas.discardActiveObject();
        canvas.requestRenderAll();
        onDirtyChange?.(true);
        collaborationProviderRef.current?.emitCanvasUpdate(canvas.toJSON());
      } finally {
        restoringHistoryRef.current = false;
      }
    },
    [onDirtyChange]
  );

  const undo = useCallback(() => {
    if (!editable || historyRef.current.past.length <= 1) {
      return;
    }

    const currentSnapshot = historyRef.current.past.pop();
    const previousSnapshot = historyRef.current.past[historyRef.current.past.length - 1];
    historyRef.current.future.unshift(currentSnapshot);
    updateHistoryControls();
    restoreHistorySnapshot(previousSnapshot);
  }, [editable, restoreHistorySnapshot, updateHistoryControls]);

  const redo = useCallback(() => {
    if (!editable || historyRef.current.future.length === 0) {
      return;
    }

    const nextSnapshot = historyRef.current.future.shift();
    historyRef.current.past.push(nextSnapshot);
    updateHistoryControls();
    restoreHistorySnapshot(nextSnapshot);
  }, [editable, restoreHistorySnapshot, updateHistoryControls]);

  useEffect(() => {
    function handleCanvasKeyDown(event) {
      const target = event.target;
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target.isContentEditable;

      if (isTyping) {
        return;
      }

      const modifier = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();

      if (modifier && key === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      if (modifier && key === "y") {
        event.preventDefault();
        redo();
        return;
      }

      if (event.key !== "Delete" && event.key !== "Backspace") {
        return;
      }

      const canvas = canvasRef.current;
      if (!editableRef.current || !canvas?.getActiveObjects().length) {
        return;
      }

      event.preventDefault();
      deleteSelected();
    }

    document.addEventListener("keydown", handleCanvasKeyDown);
    return () => document.removeEventListener("keydown", handleCanvasKeyDown);
  }, [deleteSelected, redo, undo]);

  function moveLayer(direction) {
    const canvas = canvasRef.current;
    const activeObject = canvas?.getActiveObject();

    if (!canvas || !activeObject || !editable) {
      return;
    }

    if (direction === "front") {
      canvas.bringObjectToFront(activeObject);
    } else {
      canvas.sendObjectToBack(activeObject);
    }

    canvas.requestRenderAll();
    notifyCanvasChange();
  }

  return (
    <section className="grid min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_10px_22px_rgba(16,24,40,0.04)]">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-3">
        <Button
          aria-label="Undo canvas change"
          disabled={!editable || !canUndo}
          onClick={undo}
          title="Undo"
          type="button"
          variant="secondary"
        >
          <Undo2 aria-hidden="true" size={17} />
          Undo
        </Button>
        <Button
          aria-label="Redo canvas change"
          disabled={!editable || !canRedo}
          onClick={redo}
          title="Redo"
          type="button"
          variant="secondary"
        >
          <Redo2 aria-hidden="true" size={17} />
          Redo
        </Button>
        <Button
          aria-label="Remove selected canvas object"
          disabled={!editable}
          onClick={deleteSelected}
          title="Remove selected object"
          type="button"
          variant="secondary"
        >
          <Trash2 aria-hidden="true" size={17} />
          Remove
        </Button>
        <Button disabled={!editable} onClick={addText} type="button" variant="secondary">
          <Type aria-hidden="true" size={17} />
          Text
        </Button>
        <Button
          disabled={!editable}
          onClick={() => addShape("rect")}
          type="button"
          variant="secondary"
        >
          <Square aria-hidden="true" size={17} />
          Rect
        </Button>
        <Button
          disabled={!editable}
          onClick={() => addShape("circle")}
          type="button"
          variant="secondary"
        >
          <Circle aria-hidden="true" size={17} />
          Circle
        </Button>
        <label className="flex min-h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700">
          Color
          <input
            aria-label="Selected object color"
            className="h-6 w-8 cursor-pointer border-0 bg-transparent p-0"
            disabled={!editable}
            onChange={(event) => applyFillColor(event.target.value)}
            type="color"
            value={fillColor}
          />
        </label>
        <label className="flex min-h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700">
          Opacity
          <input
            aria-label="Selected object opacity"
            className="w-24 accent-violet-600"
            disabled={!editable}
            max="100"
            min="10"
            onChange={(event) => applyOpacity(Number(event.target.value))}
            type="range"
            value={opacity}
          />
        </label>
        <Button
          disabled={!editable}
          onClick={() => moveLayer("front")}
          type="button"
          variant="secondary"
        >
          <BringToFront aria-hidden="true" size={17} />
          Front
        </Button>
        <Button
          disabled={!editable}
          onClick={() => moveLayer("back")}
          type="button"
          variant="secondary"
        >
          <ImagePlus aria-hidden="true" size={17} />
          Back
        </Button>
        <div className="hidden flex-1 md:block" />
        <StatusText tone={statusTone} variant="compact">
          {statusLabel}
        </StatusText>
        <span className="text-xs font-bold uppercase text-slate-500">
          Selected: {activeObjectType}
        </span>
      </div>

      <div className="fabric-canvas-surface overflow-auto bg-white p-3">
        <div
          className="fabric-canvas-surface relative mx-auto rounded-md bg-white"
          style={{ height: canvasSize.height, width: canvasSize.width }}
        >
          <canvas height={canvasSize.height} ref={canvasElementRef} width={canvasSize.width} />
          {remoteCanvasPointers.map((cursor) => (
            <span
              className="pointer-events-none absolute z-10"
              key={cursor.id}
              style={{
                left: cursor.x,
                top: cursor.y,
                transform: "translate(4px, 4px)"
              }}
            >
              <span
                className="block h-3 w-3 rounded-full ring-2 ring-white"
                style={{ backgroundColor: cursor.color }}
              />
              <span
                className="mt-1 block whitespace-nowrap rounded bg-slate-950 px-2 py-1 text-xs font-bold text-white shadow-lg"
                style={{ borderTop: `3px solid ${cursor.color}` }}
              >
                {cursor.name}
              </span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

async function createGeneratedImageObject(fabric, imageUrl, accentColor) {
  try {
    const imageDataUrl =
      imageUrl ||
      `data:image/svg+xml;charset=utf-8,${encodeURIComponent(buildGeneratedDemoSvg(accentColor))}`;
    const generatedImage = await fabric.FabricImage.fromURL(imageDataUrl, {
      crossOrigin: imageUrl?.startsWith("http") ? "anonymous" : undefined
    });

    const scale = Math.min(
      (canvasSize.width - 48) / Math.max(generatedImage.width || 1, 1),
      (canvasSize.height - 48) / Math.max(generatedImage.height || 1, 1)
    );

    generatedImage.set({
      left: canvasSize.width / 2,
      originX: "center",
      originY: "center",
      scaleX: scale,
      scaleY: scale,
      shadow: "0 18px 34px rgba(15,23,42,0.18)",
      top: canvasSize.height / 2
    });
    return generatedImage;
  } catch (error) {
    return new fabric.Group(
      [
        new fabric.Rect({
          fill: "#dbeafe",
          height: 210,
          rx: 22,
          ry: 22,
          width: 320
        }),
        new fabric.Circle({
          fill: accentColor,
          left: 208,
          opacity: 0.72,
          radius: 46,
          top: 26
        }),
        new fabric.Rect({
          fill: "#ffffff",
          height: 112,
          left: 38,
          opacity: 0.82,
          rx: 18,
          ry: 18,
          top: 58,
          width: 162
        })
      ],
      {
        left: canvasSize.width / 2 - 160,
        top: canvasSize.height / 2 - 105
      }
    );
  }
}

function buildGeneratedDemoSvg(accentColor) {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420">
  <defs>
    <linearGradient id="generated-bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#dbeafe"/>
      <stop offset="0.48" stop-color="#f5d0fe"/>
      <stop offset="1" stop-color="#bbf7d0"/>
    </linearGradient>
    <linearGradient id="screen" x1="0" x2="1">
      <stop offset="0" stop-color="${accentColor}"/>
      <stop offset="1" stop-color="#0f172a"/>
    </linearGradient>
  </defs>
  <rect width="640" height="420" rx="28" fill="url(#generated-bg)"/>
  <circle cx="512" cy="96" r="78" fill="${accentColor}" opacity="0.35"/>
  <circle cx="122" cy="316" r="92" fill="#14b8a6" opacity="0.25"/>
  <rect x="96" y="88" width="448" height="248" rx="24" fill="#ffffff" opacity="0.78"/>
  <rect x="134" y="128" width="204" height="160" rx="18" fill="url(#screen)"/>
  <path d="M156 250 L214 188 L256 232 L292 196 L324 250 Z" fill="#ffffff" opacity="0.82"/>
  <circle cx="274" cy="162" r="22" fill="#fde68a"/>
  <rect x="370" y="138" width="118" height="18" rx="9" fill="#0f172a" opacity="0.72"/>
  <rect x="370" y="176" width="92" height="14" rx="7" fill="#475569" opacity="0.5"/>
  <rect x="370" y="206" width="132" height="14" rx="7" fill="#475569" opacity="0.38"/>
  <rect x="370" y="250" width="96" height="34" rx="17" fill="${accentColor}" opacity="0.86"/>
</svg>`;
}

function getCanvasPointer(event, canvas) {
  const canvasElement = canvas.upperCanvasEl || canvas.lowerCanvasEl;
  const bounds = canvasElement?.getBoundingClientRect();

  if (!bounds) {
    return { x: 0, y: 0 };
  }

  const scaleX = canvasSize.width / bounds.width;
  const scaleY = canvasSize.height / bounds.height;

  return {
    x: (event.clientX - bounds.left) * scaleX,
    y: (event.clientY - bounds.top) * scaleY
  };
}
