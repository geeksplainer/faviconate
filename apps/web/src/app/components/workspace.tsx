import { BottomToolbar } from "./bottom-toolbar";
import { IconArea } from "./icon-area";
import { TopToolbar } from "./top-toolbar";

export function Workspace() {
  return (
    <>
      <TopToolbar />
      <IconArea className="flex-1" />
      <BottomToolbar />
    </>
  );
}
