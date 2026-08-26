"use client";

import { useEffect, useRef, useState } from "react";
import { BringToFront, Circle, ImagePlus, Square, Trash2, Type } from "lucide-react";
import Button from "../common/Button";
import { demoImageSvg } from "./mockImageWorkspaceData";

const canvasSize = { height: 680, width: 1080 };

export default function FabricImageEditor({
  collaborationProvider,
  editable = true,
  generationRequest,
  onDirtyChange,
  onReady,
  remoteCanvasPointers = [],
  remoteCanvasState
}) {
  const canvasElementRef = useRef(null);
  const canvasRef = useRef(null);
  const fabricRef = useRef(null);
  const applyingRemoteStateRef = useRef(false);
  const collaborationProviderRef = useRef(collaborationProvider);
  collaborationProviderRef.current = collaborationProvider;
  const [activeObjectType, setActiveObjectType] = useState("None");
  const [fillColor, setFillColor] = useState("#8b5cf6");
  const [opacity, setOpacity] = useState(100);

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
        backgroundColor: "#f8fafc",
        height: canvasSize.height,
        preserveObjectStacking: true,
        renderOnAddRemove: true,
        selection: editable,
        width: canvasSize.width
      });

      canvasRef.current = canvas;
      canvas.setDimensions(canvasSize);

      const headline = new fabric.Textbox("Launch Campaign", {
        fill: "#111827",
        fontFamily: "Arial",
        fontSize: 56,
        fontWeight: 800,
        left: 118,
        top: 312,
        width: 420
      });
      const badge = new fabric.Rect({
        fill: "#8b5cf6",
        height: 74,
        left: 568,
        rx: 18,
        ry: 18,
        top: 360,
        width: 210
      });
      const badgeText = new fabric.Textbox("AI READY", {
        fill: "#ffffff",
        fontFamily: "Arial",
        fontSize: 28,
        fontWeight: 800,
        left: 602,
        top: 382,
        width: 150
      });

      canvas.add(headline, badge, badgeText);
      canvas.setActiveObject(headline);
      canvas.calcOffset();
      canvas.requestRenderAll();
      await addDemoBackgroundImage(fabric, canvas, isMounted);

      const markDirty = () => {
        if (!isInitializing && !applyingRemoteStateRef.current) {
          onDirtyChange?.(true);
          collaborationProviderRef.current?.emitCanvasUpdate(canvas.toJSON());
        }
      };
      const emitPointer = (event) => {
        const pointer = getCanvasPointer(event.e, canvas);
        collaborationProviderRef.current?.emitCanvasPointer({
          x: Math.round(pointer.x),
          y: Math.round(pointer.y)
        });
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
      canvas.on("object:moving", markDirty);
      canvas.on("object:scaling", markDirty);
      canvas.on("object:rotating", markDirty);
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
  }, [onDirtyChange, onReady]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || !remoteCanvasState) {
      return;
    }

    applyingRemoteStateRef.current = true;
    canvas
      .loadFromJSON(remoteCanvasState)
      .then(() => {
        canvas.requestRenderAll();
        onDirtyChange?.(false);
      })
      .finally(() => {
        applyingRemoteStateRef.current = false;
      });
  }, [onDirtyChange, remoteCanvasState]);

  useEffect(() => {
    if (!generationRequest || !canvasRef.current || !fabricRef.current) {
      return;
    }

    addGeneratedDemoImage(generationRequest.prompt);
  }, [generationRequest]);

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

  async function addGeneratedDemoImage(prompt) {
    const fabric = fabricRef.current;
    const canvas = canvasRef.current;

    if (!fabric || !canvas || !editable) {
      return;
    }

    const colors = ["#8b5cf6", "#14b8a6", "#f59e0b", "#ec4899"];
    const accentColor = colors[generationRequest.id % colors.length];
    const generatedImage = await createGeneratedImageObject(fabric, accentColor);
    const card = new fabric.Rect({
      fill: "#ffffff",
      height: 86,
      left: 510,
      opacity: 0.94,
      rx: 24,
      ry: 24,
      top: 358,
      width: 276
    });
    const title = new fabric.Textbox("Generated Demo", {
      fill: "#111827",
      fontFamily: "Arial",
      fontSize: 26,
      fontWeight: 800,
      left: 534,
      top: 372,
      width: 230
    });
    const caption = new fabric.Textbox(prompt || "AI image concept", {
      fill: "#475569",
      fontFamily: "Arial",
      fontSize: 15,
      fontWeight: 600,
      left: 535,
      top: 406,
      width: 220
    });

    canvas.add(generatedImage, card, title, caption);
    canvas.setActiveObject(generatedImage);
    canvas.requestRenderAll();
    notifyCanvasChange();
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

  function deleteSelected() {
    const canvas = canvasRef.current;
    const activeObjects = canvas?.getActiveObjects() || [];

    if (!editable) {
      return;
    }

    activeObjects.forEach((object) => canvas.remove(object));
    canvas?.requestRenderAll();
    notifyCanvasChange();
  }

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

  function notifyCanvasChange() {
    const canvas = canvasRef.current;

    if (!canvas || applyingRemoteStateRef.current) {
      return;
    }

    onDirtyChange?.(true);
    collaborationProviderRef.current?.emitCanvasUpdate(canvas.toJSON());
  }

  return (
    <section className="grid min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_10px_22px_rgba(16,24,40,0.04)]">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-3">
        <Button disabled={!editable} onClick={addText} type="button" variant="secondary">
          <Type aria-hidden="true" size={17} />
          Text
        </Button>
        <Button disabled={!editable} type="button" variant="secondary">
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
        <Button disabled={!editable} onClick={deleteSelected} type="button" variant="ghost">
          <Trash2 aria-hidden="true" size={17} />
          Delete
        </Button>
        <div className="hidden flex-1 md:block" />
        <span className="text-xs font-bold uppercase text-slate-500">
          Selected: {activeObjectType}
        </span>
      </div>

      <div className="overflow-auto bg-white p-3">
        <div
          className="relative mx-auto rounded-md bg-white"
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

async function addDemoBackgroundImage(fabric, canvas, isMounted) {
  try {
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(demoImageSvg)}`;
    const image = await fabric.FabricImage.fromURL(dataUrl);

    if (!isMounted || canvas.disposed || canvas.destroyed) {
      return;
    }

    image.set({
      evented: false,
      left: 0,
      selectable: false,
      top: 0
    });
    image.scaleToWidth(canvasSize.width);
    canvas.insertAt(0, image);
    canvas.renderAll();
  } catch (error) {
    canvas.renderAll();
  }
}

async function createGeneratedImageObject(fabric, accentColor) {
  try {
    const imageDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
      buildGeneratedDemoSvg(accentColor)
    )}`;
    const generatedImage = await fabric.FabricImage.fromURL(imageDataUrl);

    generatedImage.set({
      left: 488,
      shadow: "0 18px 34px rgba(15,23,42,0.18)",
      top: 118
    });
    generatedImage.scaleToWidth(320);
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
        left: 488,
        top: 118
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
