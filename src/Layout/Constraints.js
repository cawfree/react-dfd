import { Sequences } from 'react-dataflow';

import { indexOf, getLayoutKey } from './Introspection';

const epsilon = 0.0001;

const localize = (nodes, constraints) => constraints
  .map(
    ({ offsets, left, right, ...extras }) => ({
      ...extras,
      ...(
        Array.isArray(offsets) ? {
          offsets: offsets
            .map(({ node, ...extras }) => ({
              ...extras,
              node: indexOf(nodes, node),
            }))
        } : {}
      ),
      ...(
        typeof left === 'string' ? {
          left: indexOf(nodes, left),
        } : {}
      ),
      ...(
        typeof right === 'string' ? {
          right: indexOf(nodes, right),
        } : {}
      ),
    }),
  );

export const getConstraintsFor = (
  layoutId,
  layoutProps,
  childLayoutProps,
) => {
  const { outlets } = layoutProps;
  return [
    {
      type: 'alignment',
      axis: 'x',
      offsets: [
        {
          node: layoutId,
          offset: 0,
        },
        ...Object.entries(childLayoutProps)
          .map(
            ([node, { left, width }]) => ({
              node: getLayoutKey(layoutId, node),
              offset: outlets.hasOwnProperty(node) ? layoutProps.width - width + left : epsilon + left,
            }),
          ),
      ],
    },
    ...Object
      .entries(childLayoutProps)
      .reduce(
        // TODO: Need to validate childLayoutProps!
        (constraints, [key, layoutProps], i) => {
          const isTarget = outlets.hasOwnProperty(key);
          return [
            ...constraints,
            {
              axis: 'y',
              left: layoutId,
              right: getLayoutKey(layoutId, key),
              gap: layoutProps.top || epsilon,
              equality: true,
            },
          ];
        },
        [],
      ),
  ];
};

export const getGlobalConstraints = (signals, allElements, elements, nodes, [gap, spread]) => {
  const phases = new Sequences.Classical(signals, allElements)
    .getPhases();
  return localize(
    nodes,
    phases
      .reduce(
        (arr, phase, i, orig) => {
          if (i < orig.length - 1) {
            const { [i]: { elements: left }, [i + 1] : { elements: right } } = orig;
            const { index, maxWidth } = left
              .reduce(
                ({ index, maxWidth }, e, i) => {
                  const { width } = elements.get(e);
                  return {
                    index: (width > maxWidth) ? i : index,
                    maxWidth: Math.max(width, maxWidth),
                  };
                },
                {
                  index: -1,
                  maxWidth: Number.NEGATIVE_INFINITY,
                },
              );
            const [...heights] = right
              .map(
                e => elements.get(e).height,
              );
            return [
              ...arr,
              ...right
                .map(
                  right => ({
                    axis: 'x',
                    left: left[index],
                    right,
                    gap: maxWidth + gap,
                    equality: true,
                  }),
                ),
              ...right
                .filter((_, i) => i)
                .map(
                  (e, i) => (
                    {
                      axis: 'y',
                      left: right[0],
                      right: e,
                      gap:  heights
                        .filter((e, j) => (j < i + 1))
                        .reduce(
                          (n, height) => (n + height + spread),
                          0,
                        ),
                      equality: true,
                    }
                  ),
                ),
            ];
          }
          return arr;
        },
        phases
          .reduce(
            (arr, e, i) => {
              const { elements } = e;
              if (i === 0 && elements.length > 1) {
                const [ left ] = elements;
                return elements
                  .map(
                    right => (
                      {
                        axis: 'x',
                        gap: 0,
                        equality: true,
                        left,
                        right,
                      }
                    ),
                  );
              }
              return arr;
            },
            [],
          ),
      ),
  );
};

export const buildConstraintsFor = (signals, nodes) => nodes
  .filter(([_, { constraints }]) => Array.isArray(constraints))
  .map(([_, { constraints }]) => localize(nodes, constraints))
  .reduce((a, e) => [...a, ...e], []);
