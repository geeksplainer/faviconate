import { Icon } from "../Icon";
import { IconService } from "../IconService";
import { Size } from "./Rectangle";

/**
 * IconService.asBlobUrl(icon)
                .then(src => changeFavicon(src));
 */
export function changeFavicon(src: string) {
  const ID = "dyna-favicon";

  const oldLink = document.getElementById(ID);
  if (oldLink) {
    oldLink.remove();
  }

  const link = document.createElement("link");
  link.id = ID;
  link.rel = "shortcut icon";
  link.href = src;
  document.head.append(link);
}

export function minMax(min: number, max: number, value: number): number {
  return Math.max(min, Math.min(max, value));
}

export async function importFile(
  file: File,
  targetIconSize: Size
): Promise<Icon[]> {
  if (file.name.toLowerCase().endsWith(".ico")) {
    const { icons } = await IconService.fromIcoBlob(file);
    return icons;
  }
  const icon = await IconService.fromFile(file, targetIconSize, true);
  return [icon];
}
