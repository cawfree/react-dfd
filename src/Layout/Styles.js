import { useState } from 'react';

export const absoluteFill = (x, y, width, height) => ({
  position: 'absolute',
  display: 'flex',
  left: x,
  top: y,
  width,
  height,
});

export const createStylesBuffer = (keys, lastBuffer, mutateStylesBuffer) => keys
  .reduce(
    ({ styles, setStyles }, k) => {
      return {
        styles: {
          ...styles,
          [k]: styles[k] || absoluteFill(),
        },
        setStyles: {
          ...setStyles,
          [k]: style => mutateStylesBuffer(
            ({ styles, setStyles }) => ({
              setStyles,
              styles: {
                ...styles,
                [k]: style,
              },
            }),
          ),
        },
      };
    },
    lastBuffer,
  );

export const useStylesBuffer = (initialKeys) => {
  let [ stylesBuffer, setStylesBuffer ] = useState(
    () => createStylesBuffer(initialKeys, { styles: {} }),
  );
  const [ mutateStylesBuffer ] = useState(
    () => fn => setStylesBuffer(
      stylesBuffer = fn(stylesBuffer),
    ),
  );
  return [
    stylesBuffer,
    setStylesBuffer,
    mutateStylesBuffer,
  ];
};
