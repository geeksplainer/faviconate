import { useFaviconate } from "@/components/FaviconateContext";
import { IconControllerView } from "@faviconate/pixler/src/components/IconControllerView";

export function IconArea({ className }: { className?: string }) {
  const { controller } = useFaviconate();

  return <IconControllerView controller={controller} {...{ className }} />;
}
