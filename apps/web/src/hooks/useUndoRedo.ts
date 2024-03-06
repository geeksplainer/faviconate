import { useState } from "react";

export function useUndoRedo<T>(initialState: T): {
  document: T;
  setDocument(s: T): void;
  undo(): void;
  redo(): void;
  commit(): void;
  rollback(): void;
} {
  const [document, setDocument] = useState(initialState);
  const [undoStack, setUndoStack] = useState<T[]>([initialState]);
  const [redoStack, setRedoStack] = useState<T[]>([]);

  const commit = () => {
    console.log("commiting");
    setUndoStack([...undoStack, document]);
    setRedoStack([]);
  };

  const undo = () => {
    console.log("undoing");
    if (undoStack.length > 1) {
      const last = undoStack[undoStack.length - 1];
      const desired = undoStack[undoStack.length - 2];
      setUndoStack(undoStack.slice(0, undoStack.length - 1));
      setRedoStack([...redoStack, last]);
      setDocument(desired);
    }
  };

  const redo = () => {
    if (redoStack.length > 0) {
      const last = redoStack[redoStack.length - 1];
      setUndoStack([...undoStack, last]);
      setRedoStack(redoStack.slice(0, redoStack.length - 1));
      setDocument(last);
    }
  };

  const rollback = () => {
    setDocument(undoStack[0]);
    setUndoStack([undoStack[0]]);
    setRedoStack([]);
  };

  return { document, setDocument, undo, redo, commit, rollback };
}

/**
 * Usage
 *
 * 
  type Point = [number, number];
  type Line = [Point, Point];
  type Document = Line[];


  ....

  const [isDrawing, setIsDrawing] = useState(false);
  const { document, setDocument, undo, redo, store } = useUndoRedo<Document>([]);
  const handleMouseDown = (e: React.MouseEvent) => {
    const point: Point = [e.clientX, e.clientY];
    setDocument([...document, [point, point]]);
    setIsDrawing(true);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    setIsDrawing(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDrawing && document.length > 0) {
      const lastLine = document[document.length - 1];
      const lastLineUpdated: Line = [lastLine[0], [e.clientX, e.clientY]];
      setDocument([...document.slice(0, document.length - 1), lastLineUpdated]);
    }
  };

  useEffect(() => {
    if (!isDrawing) {
      store();
    }
  }, [isDrawing]);
 *
 *
 */
