"use client";
import { IconCanvasController } from "@faviconate/pixler/src/model/IconCanvasController";
import { IconService } from "@faviconate/pixler/src/model/IconService";
import { SelectionTool } from "@faviconate/pixler/src/model/tools/SelectionTool";
import { PencilTool } from "@faviconate/pixler/src/model/tools/PencilTool";
import { createContext, useEffect } from "react";
import { useContext } from "react";
import { useState } from "react";

type Tool = "select" | "pencil" | "bucket" | "eraser";

export interface FaviconateState {
  controller: IconCanvasController;
  tool: Tool;
  grid: boolean;

  setTool: (tool: Tool) => void;
  toggleGrid: () => void;
}

const DefaultFaviconateState: FaviconateState = {
  controller: new IconCanvasController({ icon: IconService.newIcon(32, 32) }),
  tool: "pencil",
  grid: true,
  setTool: () => {},
  toggleGrid: () => {},
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
  const [controller, setController] = useState<IconCanvasController>(
    new IconCanvasController(
      { icon: IconService.newIcon(32, 32) },
      { drawGrid: true }
    )
  );

  useEffect(() => {
    switch (tool) {
      case "select":
        controller.tool = new SelectionTool(controller);
        break;
      case "pencil":
        controller.tool = new PencilTool(controller);
        break;
    }
  }, [controller, tool]);

  return (
    <FaviconateContext.Provider
      value={{
        controller,
        tool,
        grid,
        setTool,
        toggleGrid: () => setGrid(!grid),
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
