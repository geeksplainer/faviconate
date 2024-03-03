export interface KeyMapping {
  command: (commands: BookCommands) => void;
  key: string;
  flat?: boolean;
  shift?: boolean;
}

export const mappings: KeyMapping[] = [
  { key: "z", command: (c) => c.commandRedo(), shift: true },
  { key: "z", command: (c) => c.commandUndo() },
  { key: "v", command: (c) => c.commandPaste() },
  { key: "c", command: (c) => c.commandCopy() },
  { key: "x", command: (c) => c.commandCut() },
  { key: "a", command: (c) => c.commandSelectAll() },

  { key: "d", command: (c) => c.commandUsePen(), flat: true },
  { key: "v", command: (c) => c.commandUseSelection(), flat: true },
  { key: "f", command: (c) => c.commandUseFlood(), flat: true },
  { key: "e", command: (c) => c.commandUseEraser(), flat: true },
  { key: "b", command: (c) => c.commandSwapBg(), flat: true },
  { key: "g", command: (c) => c.commandSwapGrid(), flat: true },
];

export abstract class BookCommands {
  abstract commandRedo(): void;

  abstract commandUndo(): void;

  abstract commandPaste(): void;

  abstract commandCopy(): void;

  abstract commandCut(): void;

  abstract commandSelectAll(): void;

  abstract commandUsePen(): void;

  abstract commandUseSelection(): void;

  abstract commandUseFlood(): void;

  abstract commandUseEraser(): void;

  abstract commandSwapBg(): void;

  abstract commandSwapGrid(): void;
}
