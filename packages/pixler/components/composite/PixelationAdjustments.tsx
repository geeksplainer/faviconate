import { FC } from "react";
import styled from "styled-components";
import { ImageScaleScrollSettings } from "../../model/ImageAdjustService";
import { Slider } from "../../ui/Slider";

export const PixelationAdjustments: FC<ImageScaleScrollSettings> = (props) => {
  const { scrollX, scrollY, scale, onScaleChanged, onScrollChanged } = props;

  return (
    <div>
      <SliderTupleContainer>
        <Slider
          min={0}
          max={scrollX.max}
          value={scrollX.value}
          onChange={(x) => onScrollChanged({ y: scrollY.value, x })}
        />
        <Slider
          min={0}
          max={scrollY.max}
          value={scrollY.value}
          onChange={(y) => onScrollChanged({ x: scrollX.value, y })}
        />
      </SliderTupleContainer>
      <div>
        <Slider
          min={scale.min}
          max={scale.max}
          value={scale.value}
          step={3}
          onChange={(value) => onScaleChanged(value)}
        />
      </div>
    </div>
  );
};

const SliderTupleContainer = styled.div`
  display: flex;

  > div {
    flex-grow: 1;
  }
`;
