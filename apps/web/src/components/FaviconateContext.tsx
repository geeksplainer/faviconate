"use client";
import { IconCanvasController } from "@faviconate/pixler/src/model/IconCanvasController";
import { IconService } from "@faviconate/pixler/src/model/IconService";
import { SelectionTool } from "@faviconate/pixler/src/model/tools/SelectionTool";
import { PencilTool } from "@faviconate/pixler/src/model/tools/PencilTool";
import { FloodFillTool } from "@faviconate/pixler/src/model/tools/FloodFillTool";
import { createContext, use, useEffect } from "react";
import { useContext } from "react";
import { useState } from "react";
import { IconEditorTool } from "@faviconate/pixler/src/model/IconEditor";
import { FaviconateCommand } from "@/models";
import { Color } from "@faviconate/pixler/src/model/util/Color";

type Tool = "select" | "pencil" | "bucket" | "eraser";

export interface FaviconateState {
  controller: IconCanvasController;
  tool: Tool;
  grid: boolean;
  color: Color;
  checker: boolean;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  executeCommand: (command: FaviconateCommand, ...args: any[]) => void;
  setTool: (tool: Tool) => void;
  setColor: (color: Color) => void;
  toggleGrid: () => void;
  toggleChecker: () => void;
}

const DefaultFaviconateState: FaviconateState = {
  controller: new IconCanvasController({ icon: IconService.newIcon(32, 32) }),
  tool: "pencil",
  grid: true,
  color: Color.black,
  setTool: () => {},
  toggleGrid: () => {},
  executeCommand: () => {},
  setColor: () => {},
  checker: true,
  toggleChecker: () => {},
};

const getDefaultController = () => {
  return new IconCanvasController(
    { icon: IconService.newIcon(32, 32) },
    { drawGrid: true }
  );
};

export const FaviconateContext = createContext<FaviconateState>(
  DefaultFaviconateState
);

export const FaviconateProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [tool, setTool] = useState<Tool>("pencil");
  const [grid, setGrid] = useState<boolean>(true);
  const [checker, setChecker] = useState<boolean>(true);
  const [color, setColor] = useState<Color>(Color.black);
  const [toolInstance, setToolInstance] = useState<IconEditorTool | null>(null);
  const [controller, setController] = useState<IconCanvasController>(
    getDefaultController()
  );

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const executeCommand = (command: FaviconateCommand, ...args: any) => {
    if (toolInstance) {
      switch (command) {
        case "selectAll":
          (toolInstance as SelectionTool).selectAll();
          break;
        case "clearSelection":
          (toolInstance as SelectionTool).clearSelection();
          break;
        case "deleteSelection":
          (toolInstance as SelectionTool).deleteSelection();
          break;
        case "crop":
          (toolInstance as SelectionTool).cropToSelection();
          break;
      }
    }
  };

  useEffect(() => {
    if (toolInstance instanceof PencilTool) {
      toolInstance.color = color;
    } else if (toolInstance instanceof FloodFillTool) {
      toolInstance.color = color;
    }
  }, [toolInstance, color]);

  useEffect(() => {
    switch (tool) {
      case "select":
        controller.tool = new SelectionTool(controller);
        break;
      case "pencil":
        controller.tool = new PencilTool(controller);
        break;
    }

    setToolInstance(controller.tool);
  }, [controller, tool]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (!controller.document) {
      throw new Error("Controller document is undefined");
    }
    setController(
      new IconCanvasController(
        { icon: controller.document.icon },
        { drawGrid: grid, drawBackground: checker }
      )
    );
  }, [grid, checker]);

  return (
    <FaviconateContext.Provider
      value={{
        controller,
        tool,
        grid,
        color,
        checker,
        setColor,
        executeCommand,
        setTool,
        toggleGrid: () => setGrid(!grid),
        toggleChecker: () => setChecker(!checker),
      }}
    >
      {children}
    </FaviconateContext.Provider>
  );
};

export const useFaviconate = () => {
  const context = useContext(FaviconateContext);

  if (context === undefined) {
    throw new Error("useFaviconate must be used within a FaviconateProvider");
  }

  return context;
};
