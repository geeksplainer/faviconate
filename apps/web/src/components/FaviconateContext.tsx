"use client";
import {
  createIconCanvasController,
  IconCanvasController,
  IconCanvasProps,
} from "@faviconate/pixler/src/model/IconCanvasController";
import { IconService } from "@faviconate/pixler/src/model/IconService";
import { createContext, useEffect } from "react";
import { useContext } from "react";
import { useState } from "react";
import { Color } from "@faviconate/pixler/src/model/util/Color";
import { useTheme } from "next-themes";
import { IconDocumentRenderer } from "@faviconate/pixler/src/model/rendering/IconDocumentRenderer";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { usePencil } from "@/hooks/usePencil";
import { SelectionToolCommands, useSelection } from "@/hooks/useSelection";
import { useFloodFill } from "@/hooks/useFloodFill";
import { IconDocument } from "@faviconate/pixler/src/models";

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
  documents: IconDocument[];
  currentDocument: number;
  controllerProps: IconCanvasProps;
  controller: IconCanvasController;
  tool: Tool;
  grid: boolean;
  color: Color;
  checker: boolean;
  selectTool?: SelectionToolCommands;
  setTool: (tool: Tool) => void;
  setColor: (color: Color) => void;
  toggleGrid: () => void;
  toggleChecker: () => void;
  setCurrentDocument?: (index: number) => void;
  addDocument?: (document: IconDocument) => void;
  removeDocument?: (index: number) => void;
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
  documents: [],
  currentDocument: 0,
  controllerProps: getDefaultControllerProps(true),
  controller: createIconCanvasController(getDefaultControllerProps(true)),
  tool: "pencil",
  grid: DEFAULT_GRID,
  checker: DEFAULT_CHECKER,
  color: Color.black,
  setTool: () => {},
  toggleGrid: () => {},
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
  const [currentDocument, setCurrentDocument] = useState(0);
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  const [color, setColor] = useState<Color>(new Color(150, 150, 150));
  const [controllerProps, setControllerProps] = useState<IconCanvasProps>(
    getDefaultControllerProps(dark)
  );

  const {
    document: documents,
    setDocument: setDocuments,
    commit,
    rollback,
  } = useUndoRedo([getDefaultControllerProps(dark).document]);

  const document = documents[currentDocument];
  const setDocument = (doc: IconDocument) =>
    setDocuments(documents.map((d, i) => (i === currentDocument ? doc : d)));

  const pencil = usePencil({
    color,
    document,
    setDocument,
    commit,
  });

  const selection = useSelection({
    document,
    setDocument,
    commit,
  });

  const floodFill = useFloodFill({
    color,
    document,
    setDocument,
    commit,
  });

  const eraser = usePencil({
    color: Color.transparent,
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
    tool:
      tool === "select"
        ? selection
        : tool === "bucket"
        ? floodFill
        : tool === "eraser"
        ? eraser
        : pencil,
  });

  const addDocument = (document: IconDocument) => {
    setDocuments([...documents, document]);
    setCurrentDocument(documents.length);
  };

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
    setCurrentDocument(0);
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedTheme]);

  return (
    <FaviconateContext.Provider
      value={{
        documents,
        currentDocument,
        controllerProps,
        controller,
        tool,
        grid,
        color,
        checker,
        selectTool: selection,
        setColor,
        setTool,
        toggleGrid: () => setGrid(!grid),
        toggleChecker: () => setChecker(!checker),
        addDocument,
        setCurrentDocument,
        removeDocument,
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
