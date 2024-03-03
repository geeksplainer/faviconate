import { Export } from "@/components/sidebar/export";
import { Preview } from "@/components/sidebar/preview";
import { Selection } from "@/components/sidebar/selection";

export function Sidebar() {
  return (
    <div>
      <Preview />
      <Selection />
      <Export />
    </div>
  );
}
