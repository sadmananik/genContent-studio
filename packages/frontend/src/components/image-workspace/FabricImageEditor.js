"use client";

import { useEffect, useRef, useState } from "react";
import { BringToFront, Circle, Download, ImagePlus, Square, Trash2, Type } from "lucide-react";
import Button from "../common/Button";
import { demoImageSvg } from "./mockImageWorkspaceData";

const canvasSize = { height: 600, width: 900 };

export default function FabricImageEditor({ onDirtyChange, onExport, onReady, onSave }) {
  const canvasElementRef = useRef(null);
  const canvasRef = useRef(null);
  const fabricRef = useRef(null);
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

      const canvas = new fabric.Canvas(canvasElementRef.current, {
        backgroundColor: "#f8fafc",
        height: canvasSize.height,
        preserveObjectStacking: true,
        selection: true,
        width: canvasSize.width
      });

      canvasRef.current = canvas;

      const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(demoImageSvg)}`;
      const image = await fabric.FabricImage.fromURL(dataUrl);
      image.set({
        evented: false,
        left: 0,
        selectable: false,
        top: 0
      });
      image.scaleToWidth(canvasSize.width);
      canvas.add(image);

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
      canvas.renderAll();

      const markDirty = () => onDirtyChange?.(true);
      const syncSelection = () => {
        const activeObject = canvas.getActiveObject();
        setActiveObjectType(activeObject?.type || "None");

        if (activeObject?.fill && typeof activeObject.fill === "string") {
          setFillColor(activeObject.fill);
        }

        setOpacity(Math.round((activeObject?.opacity ?? 1) * 100));
      };

      canvas.on("object:modified", markDirty);
      canvas.on("object:added", markDirty);
      canvas.on("object:removed", markDirty);
      canvas.on("selection:created", syncSelection);
      canvas.on("selection:updated", syncSelection);
      canvas.on("selection:cleared", syncSelection);

      onReady?.(canvas);
    }

    setupCanvas();

    return () => {
      isMounted = false;
      canvasRef.current?.dispose();
      canvasRef.current = null;
    };
  }, [onDirtyChange, onReady]);

  function addText() {
    const fabric = fabricRef.current;
    const canvas = canvasRef.current;

    if (!fabric || !canvas) {
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
    canvas.renderAll();
  }

  function addShape(shape) {
    const fabric = fabricRef.current;
    const canvas = canvasRef.current;

    if (!fabric || !canvas) {
      return;
    }

    const object =
      shape === "circle"
        ? new fabric.Circle({ fill: fillColor, left: 160, radius: 58, top: 150 })
        : new fabric.Rect({
            fill: fillColor,
            height: 120,
            left: 160,
            rx: 14,
            ry: 14,
            top: 150,
            width: 180
          });

    canvas.add(object);
    canvas.setActiveObject(object);
    canvas.renderAll();
  }

  function applyFillColor(nextColor) {
    const canvas = canvasRef.current;
    const activeObject = canvas?.getActiveObject();

    setFillColor(nextColor);

    if (!activeObject) {
      return;
    }

    activeObject.set("fill", nextColor);
    canvas.renderAll();
    onDirtyChange?.(true);
  }

  function applyOpacity(nextOpacity) {
    const canvas = canvasRef.current;
    const activeObject = canvas?.getActiveObject();

    setOpacity(nextOpacity);

    if (!activeObject) {
      return;
    }

    activeObject.set("opacity", nextOpacity / 100);
    canvas.renderAll();
    onDirtyChange?.(true);
  }

  function deleteSelected() {
    const canvas = canvasRef.current;
    const activeObjects = canvas?.getActiveObjects() || [];

    activeObjects.forEach((object) => canvas.remove(object));
    canvas?.discardActiveObject();
    canvas?.renderAll();
  }

  function moveLayer(direction) {
    const canvas = canvasRef.current;
    const activeObject = canvas?.getActiveObject();

    if (!canvas || !activeObject) {
      return;
    }

    if (direction === "front") {
      canvas.bringObjectToFront(activeObject);
    } else {
      canvas.sendObjectToBack(activeObject);
    }

    canvas.renderAll();
    onDirtyChange?.(true);
  }

  function saveCanvas() {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    onSave?.(JSON.stringify(canvas.toJSON()));
  }

  function exportPng() {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    onExport?.(
      canvas.toDataURL({
        format: "png",
        multiplier: 1,
        quality: 1
      })
    );
  }

  return (
    <div className="grid min-w-0 gap-4">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-[0_10px_22px_rgba(16,24,40,0.04)]">
        <Button onClick={addText} type="button" variant="secondary">
          <Type aria-hidden="true" size={17} />
          Text
        </Button>
        <Button onClick={() => addShape("rect")} type="button" variant="secondary">
          <Square aria-hidden="true" size={17} />
          Rect
        </Button>
        <Button onClick={() => addShape("circle")} type="button" variant="secondary">
          <Circle aria-hidden="true" size={17} />
          Circle
        </Button>
        <label className="flex min-h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700">
          Color
          <input
            aria-label="Selected object color"
            className="h-6 w-8 cursor-pointer border-0 bg-transparent p-0"
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
            max="100"
            min="10"
            onChange={(event) => applyOpacity(Number(event.target.value))}
            type="range"
            value={opacity}
          />
        </label>
        <Button onClick={() => moveLayer("front")} type="button" variant="secondary">
          <BringToFront aria-hidden="true" size={17} />
          Front
        </Button>
        <Button onClick={() => moveLayer("back")} type="button" variant="secondary">
          <ImagePlus aria-hidden="true" size={17} />
          Back
        </Button>
        <Button onClick={deleteSelected} type="button" variant="ghost">
          <Trash2 aria-hidden="true" size={17} />
          Delete
        </Button>
        <div className="hidden flex-1 md:block" />
        <span className="text-xs font-bold uppercase text-slate-500">
          Selected: {activeObjectType}
        </span>
        <Button onClick={exportPng} type="button" variant="secondary">
          <Download aria-hidden="true" size={17} />
          PNG
        </Button>
        <Button onClick={saveCanvas} type="button">
          Save Canvas
        </Button>
      </div>

      <div className="overflow-auto rounded-lg border border-slate-200 bg-slate-100 p-4 shadow-[0_10px_22px_rgba(16,24,40,0.04)]">
        <div className="mx-auto w-[900px] max-w-full">
          <canvas
            className="h-auto w-full rounded-md border border-slate-200 bg-white"
            height={canvasSize.height}
            ref={canvasElementRef}
            width={canvasSize.width}
          />
        </div>
      </div>
    </div>
  );
}
