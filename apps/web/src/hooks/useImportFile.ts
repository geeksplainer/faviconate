import { useFaviconate } from "@/components/FaviconateContext";
import { IconService } from "@faviconate/pixler/src/model/IconService";

export function useImportFile() {
  const { controller, setTool, replaceDocuments } = useFaviconate();
  const promptFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".png,.ico,.webp,.gif,.jpg,.jpeg";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        importFile(file);
        input.remove();
      }
    };
    document.body.appendChild(input);
    input.click();
  };

  const importFile = async (file: File): Promise<void> => {
    if (file.name.toLocaleLowerCase().endsWith(".ico")) {
      const dir = await IconService.fromIcoBlob(file);
      if (dir.icons.length > 1) {
        replaceDocuments?.(dir.icons.map((icon) => ({ icon })));
      } else {
        controller.importFile(file);
        setTool("select");
      }
    } else {
      controller.importFile(file);
      setTool("select");
    }
  };

  return { promptFile, importFile };
}
