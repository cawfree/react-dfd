import React from 'react';
import PropTypes from 'prop-types';
import { indexOf } from './Introspection';

export const getLinksFor = (signals, nodes) => signals
  .valueSeq()
  .toArray()
  .reduce(
    (arr, map) => {
      // i.e. writers
      const signalIn = map.get('signalIn')
        .entrySeq()
        .toArray();
      const signalOut = map.get('signalOut')
        .entrySeq()
        .toArray();
      if (signalIn.length > 1) {
        throw new Error(
          'react-dfd: Multiple writers to a single input are not supported.',
        );
      }
      return [
        ...arr,
        ...signalIn
          .reduce(
            (arr, [writerLayoutId, prop]) => {
              // TODO: Really need to fix this.
              const source = indexOf(nodes, writerLayoutId, JSON.parse(JSON.stringify(prop))[0]);
              return [
                ...arr,
                ...signalOut
                  .reduce(
                    (arr, [readerLayoutId, prop]) => {
                      const target = indexOf(nodes, readerLayoutId, JSON.parse(JSON.stringify(prop))[0]);
                      return [
                        ...arr,
                        { source, target },
                      ];
                    },
                    [],
                  ),
              ];
            },
            [],
          ),
      ];
    },
    [],
  );

const getPath = (sourceX, sourceY, c1X, c1Y, c2X, c2Y, targetX, targetY) => {
  return `M ${sourceX} ${sourceY} C ${c1X} ${c1Y} ${c2X} ${c2Y} ${targetX} ${targetY}`;
};

const Link = React.memo(
  ({ x0, y0, x1, y1, color }) => (
    <svg
      style={{
        position: 'absolute',
        overflow: 'visible',
      }}
    >
      <path
        fill="none"
        stroke={color}
        strokeWidth={2}
        d={getPath(
          x0,
          y0,
          x0 + (x1 - x0) * 0.25,
          y0 + (y1 - y0),
          x0 + (x1 - x0) * 0.85,
          y0 + (y1 - y0),
          x1,
          y1,
        )}
      />
    </svg>
  ),
);

Link.propTypes = {
  x0: PropTypes.number.isRequired,
  y0: PropTypes.number.isRequired,
  x1: PropTypes.number.isRequired,
  y1: PropTypes.number.isRequired,
  color: PropTypes.string,
};

Link.defaultProps = {
  color: 'red',
};

export default Link;
