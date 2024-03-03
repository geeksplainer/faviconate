import { Icon } from "./Icon";
import { IconService } from "./IconService";
import {
  makePt,
  makeSz,
  Point,
  Rectangle,
  roundPt,
  roundSz,
  scaleToFill,
  Size,
} from "./util/Rectangle";

export const MAX_SCALE = 500;

export interface ImagePixelationState {
  image?: HTMLImageElement;
  imageSize?: Size;
  scaledIcon?: Icon;
  icon?: Icon;
  scaledIconSize?: Size;
  scroll?: Point;
  scale: number;
  iconSize: Size;
  deltaSize: Size;
}

export const EmptyPhotoPaletteState: ImagePixelationState = {
  iconSize: makeSz(64, 64),
  deltaSize: makeSz(0, 0),
  scale: 100,
};

export type ImagePixelationAction =
  | { type: "setIconSize"; iconSize: Size }
  | { type: "setImage"; image: HTMLImageElement; imageSize: Size }
  | { type: "setScroll"; scroll: Point }
  | { type: "setScale"; scale: number };

export function imagePixelationReducer(
  state: ImagePixelationState,
  action: ImagePixelationAction
): ImagePixelationState {
  const { type } = action;

  function setIconSize(iconSize: Size): ImagePixelationState {
    return {
      ...state,
      iconSize,
      ...updateScaledIcon({ ...state, iconSize }, state.scale),
    };
  }

  function setImage(
    image: HTMLImageElement,
    imageSize: Size
  ): ImagePixelationState {
    const { scale } = state;
    const newState = { ...state, image, imageSize };
    return { ...newState, ...updateScaledIcon(newState, scale) };
  }

  function setScale(dirtyScale: number): ImagePixelationState {
    const scale = Math.max(100, Math.min(dirtyScale, MAX_SCALE));
    return { ...state, ...updateScaledIcon(state, scale) };
  }

  function setScroll(scroll: Point): ImagePixelationState {
    return { ...state, scroll };
  }

  function updateScaledIcon(
    pixelationState: ImagePixelationState,
    scale: number
  ): Partial<ImagePixelationState> {
    const { image, imageSize, iconSize } = pixelationState;

    if (!imageSize || !image) {
      return { scale };
    }

    const oldW =
      pixelationState.deltaSize.width > 0 && pixelationState.scroll
        ? pixelationState.scroll.x / pixelationState.deltaSize.width
        : 0;
    const oldH =
      pixelationState.deltaSize.height > 0 && pixelationState.scroll
        ? pixelationState.scroll.y / pixelationState.deltaSize.height
        : 0;

    const { width, height } = roundSz(
      scaleToFill(pixelationState.iconSize, imageSize)
    );
    const scaledIconSize = roundSz(
      makeSz((width * scale) / 100, (height * scale) / 100)
    );
    const scaledIcon = IconService.fromImage(image, scaledIconSize);
    const deltaSize = makeSz(
      scaledIconSize.width - iconSize.width,
      scaledIconSize.height - iconSize.height
    );
    const scroll = pixelationState.scroll
      ? roundPt(makePt(deltaSize.width * oldW, deltaSize.height * oldH))
      : roundPt(makePt(deltaSize.width / 2, deltaSize.height / 2));

    return {
      scale,
      scaledIconSize,
      scaledIcon,
      deltaSize,
      scroll,
    };
  }

  function wrap(pixelationState: ImagePixelationState): ImagePixelationState {
    const { iconSize, scaledIcon, scroll } = pixelationState;
    const icon = scaledIcon
      ? IconService.fromIcon(
          scaledIcon,
          Rectangle.fromSize(iconSize).withLocation(scroll || makePt(0, 0))
        )
      : IconService.newIcon(iconSize.width, iconSize.height);

    return { ...pixelationState, icon };
  }

  switch (type) {
    case "setImage":
      return wrap(setImage(action.image, action.imageSize));
    case "setScroll":
      return wrap(setScroll(action.scroll));
    case "setScale":
      return wrap(setScale(action.scale));
    case "setIconSize":
      return wrap(setIconSize(action.iconSize));
    default:
      throw new Error(`Unknown action type: ${type}`);
  }
}
