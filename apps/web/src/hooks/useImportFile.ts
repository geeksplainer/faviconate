import { useFaviconate } from "@/components/FaviconateContext";

export function useImportFile() {
  const { controller, setTool } = useFaviconate();
  const promptFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".png,.ico,.webp,.gif,.jpg,.jpeg";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        controller.importFile(file);
        setTool("select");
        input.remove();
      }
    };
    document.body.appendChild(input);
    input.click();
  };

  return { promptFile };
}
