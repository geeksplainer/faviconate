"use client";
import { IconCanvasController } from "@faviconate/pixler/src/model/IconCanvasController";
import { IconService } from "@faviconate/pixler/src/model/IconService";
import { SelectionTool } from "@faviconate/pixler/src/model/tools/SelectionTool";
import { PencilTool } from "@faviconate/pixler/src/model/tools/PencilTool";
import { FloodFillTool } from "@faviconate/pixler/src/model/tools/FloodFillTool";
import { createContext, useEffect } from "react";
import { useContext } from "react";
import { useState } from "react";
import { IconEditorTool } from "@faviconate/pixler/src/model/IconEditor";
import { FaviconateCommand } from "@/models";
import { Color } from "@faviconate/pixler/src/model/util/Color";
import { useTheme } from "next-themes";
import { IconDocumentRenderer } from "@faviconate/pixler/src/model/rendering/IconDocumentRenderer";
import { getMediaDarkModeOn } from "@faviconate/pixler/src/model/rendering/RenderUtils";

type Tool = "select" | "pencil" | "bucket" | "eraser";

const GRID_LIGHT = new Color(220, 220, 220, 255);
const GRID_DARK = new Color(50, 50, 50);
const CHECKER_LIGHT_A = Color.transparent;
const CHECKER_LIGHT_B = new Color(240, 240, 240);
const CHECKER_DARK_A = Color.transparent;
const CHECKER_DARK_B = new Color(25, 25, 25);
const DEFAULT_GRID = true;
const DEFAULT_CHECKER = true;

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

const getDefaultController = (dark: boolean): IconCanvasController => {
  return new IconCanvasController(
    { icon: IconService.newIcon(32, 32) },
    {
      drawGrid: DEFAULT_GRID,
      drawBackground: DEFAULT_CHECKER,
      gridColor: dark ? GRID_DARK : GRID_LIGHT,
      checkerColorA: dark ? CHECKER_DARK_A : CHECKER_LIGHT_A,
      checkerColorB: dark ? CHECKER_DARK_B : CHECKER_LIGHT_B,
    }
  );
};

const DefaultFaviconateState: FaviconateState = {
  controller: getDefaultController(true),
  tool: "pencil",
  grid: DEFAULT_GRID,
  checker: DEFAULT_CHECKER,
  color: Color.black,
  setTool: () => {},
  toggleGrid: () => {},
  executeCommand: () => {},
  setColor: () => {},
  toggleChecker: () => {},
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
  const [grid, setGrid] = useState<boolean>(DEFAULT_GRID);
  const [checker, setChecker] = useState<boolean>(DEFAULT_CHECKER);
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const [color, setColor] = useState<Color>(dark ? Color.white : Color.black);
  const [toolInstance, setToolInstance] = useState<IconEditorTool | null>(null);
  const [controller, setController] = useState<IconCanvasController>(
    getDefaultController(dark)
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
        { ...controller.renderParams, drawGrid: grid, drawBackground: checker }
      )
    );
  }, [grid, checker]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    const resolved = !!resolvedTheme && resolvedTheme !== "system";
    console.log({ resolvedTheme, resolved });
    setController(
      new IconCanvasController(
        { icon: controller.document.icon },
        {
          ...controller.renderParams,
          drawGrid: resolved && grid,
          drawBackground: resolved && checker,
          gridColor: resolved
            ? dark
              ? GRID_DARK
              : GRID_LIGHT
            : Color.transparent,
          checkerColorA: resolved
            ? dark
              ? CHECKER_DARK_A
              : CHECKER_LIGHT_A
            : Color.transparent,
          checkerColorB: resolved
            ? dark
              ? CHECKER_DARK_B
              : CHECKER_LIGHT_B
            : Color.transparent,
        }
      )
    );
    setTimeout(() => IconDocumentRenderer.clearCheckerCanvasCache());
  }, [resolvedTheme]);

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
