"use client";
import {
  createIconCanvasController,
  IconCanvasController,
  IconCanvasProps,
} from "@faviconate/pixler/src/model/IconCanvasController";
import { IconService } from "@faviconate/pixler/src/model/IconService";
import { SelectionTool } from "@faviconate/pixler/src/model/tools/SelectionTool";
import { PencilTool } from "@faviconate/pixler/src/model/tools/PencilTool";
import { EraserTool } from "@faviconate/pixler/src/model/tools/EraserTool";
import { FloodFillTool } from "@faviconate/pixler/src/model/tools/FloodFillTool";
import { createContext, useEffect } from "react";
import { useContext } from "react";
import { useState } from "react";
import { FaviconateCommand } from "@/models";
import { Color } from "@faviconate/pixler/src/model/util/Color";
import { useTheme } from "next-themes";
import { IconDocumentRenderer } from "@faviconate/pixler/src/model/rendering/IconDocumentRenderer";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { IconEditorTool } from "@faviconate/pixler/src/models";
import { usePencil } from "@/hooks/usePencil";

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
  controllerProps: IconCanvasProps;
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

const getDefaultControllerProps = (dark: boolean): IconCanvasProps => {
  return {
    document: { icon: IconService.newIcon(32, 32) },
    setDocument: () => {},
    commit: () => {},
    rollback: () => {},
    renderParams: {
      drawGrid: DEFAULT_GRID,
      drawBackground: DEFAULT_CHECKER,
      gridColor: dark ? GRID_DARK : GRID_LIGHT,
      checkerColorA: dark ? CHECKER_DARK_A : CHECKER_LIGHT_A,
      checkerColorB: dark ? CHECKER_DARK_B : CHECKER_LIGHT_B,
    },
  };
};

const DefaultFaviconateState: FaviconateState = {
  controllerProps: getDefaultControllerProps(true),
  controller: createIconCanvasController(getDefaultControllerProps(true)),
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
  const [color, setColor] = useState<Color>(new Color(150, 150, 150));
  const [controllerProps, setControllerProps] = useState<IconCanvasProps>(
    getDefaultControllerProps(dark)
  );

  const { document, setDocument, commit, rollback } = useUndoRedo(
    getDefaultControllerProps(dark).document
  );

  const pencil = usePencil({
    color,
    document,
    setDocument,
    commit,
  });

  const controller = createIconCanvasController({
    ...controllerProps,
    document,
    setDocument,
    commit,
    rollback,
    tool: pencil,
  });

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const executeCommand = (command: FaviconateCommand, ...args: any) => {
    // if (toolInstance) {
    //   switch (command) {
    //     case "selectAll":
    //       (toolInstance as SelectionTool).selectAll();
    //       break;
    //     case "clearSelection":
    //       (toolInstance as SelectionTool).clearSelection();
    //       break;
    //     case "deleteSelection":
    //       (toolInstance as SelectionTool).deleteSelection();
    //       break;
    //     case "crop":
    //       (toolInstance as SelectionTool).cropToSelection();
    //       break;
    //   }
    // }
  };

  // useEffect(() => {
  //   if (toolInstance instanceof PencilTool) {
  //     toolInstance.color = color;
  //   } else if (toolInstance instanceof FloodFillTool) {
  //     toolInstance.color = color;
  //   }
  // }, [toolInstance, color]);

  // useEffect(() => {
  //   switch (tool) {
  //     case "select":
  //       setToolInstance(controller.tool);
  //       controller.tool = new SelectionTool(controller);
  //       break;
  //     case "pencil":
  //       controller.tool = new PencilTool(controller);
  //       break;
  //     case "bucket":
  //       controller.tool = new FloodFillTool(controller);
  //       break;
  //     case "eraser":
  //       controller.tool = new EraserTool(controller);
  //       break;
  //   }

  //   setToolInstance(controller.tool);
  // }, [tool]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (!controller.document) {
      throw new Error("Controller document is undefined");
    }
    setControllerProps({
      ...controllerProps,
      renderParams: {
        ...controllerProps.renderParams,
        drawGrid: grid,
        drawBackground: checker,
      },
    });
  }, [grid, checker]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    const resolved = !!resolvedTheme && resolvedTheme !== "system";
    console.log({ resolvedTheme, resolved });
    setControllerProps({
      ...controllerProps,
      renderParams: {
        ...controllerProps.renderParams,
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
      },
    });
    setTimeout(() => IconDocumentRenderer.clearCheckerCanvasCache());
  }, [resolvedTheme]);

  return (
    <FaviconateContext.Provider
      value={{
        controllerProps,
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
