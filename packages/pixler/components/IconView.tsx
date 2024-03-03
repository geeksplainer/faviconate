import { FC } from "react";
import { Icon } from "../model/Icon";
import { IconCanvasController } from "../model/IconCanvasController";
import { IconDocumentRendererParams } from "../model/rendering/IconDocumentRenderer";
import { IconControllerView } from "./IconControllerView";

interface Props extends Partial<IconDocumentRendererParams> {
  icon: Icon;
}

export const IconView: FC<Props> = (props) => {
  const { icon } = props;
  const controller = new IconCanvasController({ icon }, props);

  return <IconControllerView controller={controller} />;
};
