import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import WebCola from 'react-cola';
import { isEqual } from 'lodash';
import { Map } from 'immutable';
import { withDataflow } from 'react-dataflow';
import { useMutator } from 'react-use-mutator';

import { getConstraintsFor, getGlobalConstraints, buildConstraintsFor } from './Constraints';
import { getLayoutKey } from './Introspection';
import Link, { getLinksFor } from './Links';
import { absoluteFill, createStylesBuffer, useStylesBuffer } from './Styles';

const LayoutContext = React
  .createContext();

const ParentContext = React
  .createContext();

export const LayoutTypes = Object
  .freeze(
    {
      Group: 'Group',
      Link: 'Link',
      Node: 'Node',
    },
  );

const Empty = ({ children, ...extraProps }) => (
  <React.Fragment
    children={children}
  />
);

const LayoutHocs = Object
  .freeze(
    {
      [LayoutTypes.Group]: Component => ({ children, layoutId, ...extraProps }) => {
        return (
          <Component
            {...extraProps}
          >
            <ParentContext.Provider
              value={layoutId}
            >
              {children}
            </ParentContext.Provider>
          </Component>
        );
      },
      [LayoutTypes.Link]: Component => ({ layoutId, ...extraProps }) => (
        <Component
          {...extraProps}
        />
      ),
      [LayoutTypes.Node]: Component => ({ layoutId, ...extraProps }) => {
        return (
          <Component
            {...extraProps}
          />
        );
      },
    },
  );

const throwOnInvalidProps = (diagramProps) => {
  if (!diagramProps || typeof diagramProps !== 'object') {
    throw new Error(
      `react-dfd: A <Component /> wrapped withLayout did not define valid static diagramProps. Expected object, encountered ${diagramProps}.`,
    );
  }
  const { type } = diagramProps;
  if (Object.values(LayoutTypes).indexOf(type) < 0) {
    throw new Error(
      `react-dfd: diagramProps must define a valid string "type" property. Expected one of ${JSON.stringify(Object.values(LayoutTypes))}, encountered ${type}.`,
    );
  }
  switch (type) {
    case LayoutTypes.Node:
      const { width, height } = diagramProps;
      if (isNaN(width) || width <= 0) {
        throw new Error(
          `react-dfd: A <Component /> of type Node must define a positive numeric width property. Encountered: ${JSON.stringify(width)}.`,
        );
      } else if (isNaN(height) || height <= 0) {
        throw new Error(
          `react-dfd: A <Component /> of type Node must define a positive numeric height property. Encountered: ${JSON.stringify(height)}.`,
        );
      }
    break;
    default:
      /* diagramProps have passed validation  */
  }
};

const useLayouts = (arrayOfConfig) => {
  const [ arr ] = useState(
    () => [],
  );
  const { registerLayout } = useContext(
    LayoutContext,
  );
  const keys = arrayOfConfig
    .map(([ parentId, layoutId ]) => getLayoutKey(parentId, layoutId));
  const [ stylesBuffer, setStylesBuffer, mutateStylesBuffer ] = useStylesBuffer(keys);
  useEffect(
    () => {
      if (!isEqual(arrayOfConfig, arr[0])) {
        arr[0] = arrayOfConfig;
        const nextStyles = createStylesBuffer(
          keys,
          stylesBuffer,
          mutateStylesBuffer,
        );
        arrayOfConfig
          .map(
            ([ parentId, layoutId, diagramProps ], i) => {
              const layoutKey = getLayoutKey(parentId, layoutId);
              const { setStyles } = nextStyles;
              const { [layoutKey]: setStyle } = setStyles;
              return registerLayout(
                layoutKey,
                {
                  setStyle,
                  parentId,
                  layoutKey,
                  ...diagramProps,
                },
              );
            },
          );
        setStylesBuffer(nextStyles);
      }
      // TODO: Implement safe unmounting.
      return () => null;
    },
    [arrayOfConfig, arr, keys, registerLayout, setStylesBuffer, mutateStylesBuffer, stylesBuffer],
  );
  return keys.map(k => stylesBuffer.styles[k]);
};

export const withLayout = (Component, layoutId) => (props) => {
  const { diagramProps } = Component; 
  throwOnInvalidProps(diagramProps);
  const parentId = useContext(ParentContext);
  const { inlets, outlets } = diagramProps;
  const { type } = diagramProps;
  const [ HocComponent ] = useState(
    () => LayoutHocs[type](Component),
  );
  const [ terminalLayoutProps ] = useState(
    () => Object
      .keys(
        {
          ...inlets,
          ...outlets,
        },
      )
      .reduce(
        (obj, k, i) => {
          const isOutlet = outlets.hasOwnProperty(k);
          const [_, Component, style ] = isOutlet? outlets[k] : inlets[k];
          //const hasStyle = Array.isArray(def) && def[2] && typeof def[2] === 'object';
          //const terminalStyle = hasStyle ? def[2] : {};
          //const hasComponent = Array.isArray(def) && def[1] && typeof def[1] === 'function';
          //const Component = hasComponent ? def[1] : Empty;
          return {
            ...obj,
            [k]: {
              // TODO: Need to define this somewhere appropriate.
              type: LayoutTypes.Node,
              ...absoluteFill(
                isOutlet ? diagramProps.width * 0.5: 0,
                isOutlet ? Object.keys(outlets).indexOf(k) * 20 : Object.keys(inlets).indexOf(k) * 20,
                diagramProps.width * 0.5,
                20,
              ),
              ...style,
              //...terminalStyle,
              Component,
            },
          };
        },
        {},
      ),
  );
  // XXX: Layouts define the interaction/configuration of items we render
  //      using the Layout.
  const styles = useLayouts(
    [
      [
        parentId,
        layoutId,
        {
          ...diagramProps,
          constraints: getConstraintsFor(
            layoutId,
            diagramProps,
            terminalLayoutProps,
          ),
        },
      ],
      ...Object
        .entries(terminalLayoutProps)
        .map(
          ([k, diagramProps]) => ([
            layoutId,
            k,
            diagramProps,
          ]),
        ),
    ],
  );
  return (
    <div
      style={styles[0]}
    >
      <HocComponent
        {...props}
        layoutId={layoutId}
      />
      {Object.entries(terminalLayoutProps)
        .map(
          ([k, { type, Component, ...style }], i) => (
            <Component
              key={i}
              style={style}
            />
          ),
        )}
    </div>
  );
};

const Layout = ({ children, subscribe, spread, renderLink, width, height, ...extraProps }) => {
  // eslint-disable-next-line no-unused-vars
  const [ useElements, mutateLayouts ] = useMutator(
    () => Map({}),
  );
  const [ registerLayout ] = useState(
    () => (layoutId, e) => mutateLayouts(
      elements => elements
        .set(
          layoutId,
          e,
        ),
    ),
  );
  const [ unregisterLayout ] = useState(
    () => layoutId => mutateLayouts(
      elements => elements
        .delete(
          layoutId,
        ),
    ),
  );
  const [ value ] = useState(
    () => ({
      registerLayout,
      unregisterLayout,
    }),
  );
  const [ renderLayout ] = useState(
    () => (layout) => {
      layout
        .nodes()
        .map(
          ({ setStyle, x, y, width, height }) => setStyle(
            absoluteFill(x, y, width, height),
          ),
        );
      return (
        <>
          {layout.links().map(renderLink)}
        </>
      );
    },
  );
  const [ useLayout, mutateLayout ] = useMutator(
    () => (
      {
        nodes: [],
        links: [],
        groups: [],
        constraints: [],
      }
    ),
  );
  useEffect(
    () => subscribe(
      (signals, allElements) => {
        const elements = mutateLayouts();
        const nodes = elements
          .entrySeq()
          .toArray()
          .filter(
            ([_, { type }]) => (type === LayoutTypes.Node),
          );
        const links = getLinksFor(signals, nodes);
        const nextLayout = {
          nodes: nodes.map(([_, n]) => n),
          links,
          groups: [],
          constraints: [
            ...buildConstraintsFor(signals, nodes),
            ...getGlobalConstraints(signals, allElements, elements, nodes, [spread, 15]),
          ],
        };
        // TODO: Make mutations smarter than this.
        if (!isEqual(mutateLayout().nodes, nextLayout.nodes)) {
          mutateLayout(() => nextLayout);
        }
      },
    ) && undefined,
    [mutateLayout, mutateLayouts, spread, subscribe],
  );
  const [ onHandleLayout ] = useState(
    () => (cola, nodes, links, constraints) => cola
      .symmetricDiffLinkLengths(spread)
      .avoidOverlaps(true)
      .nodes(nodes)
      .links(links)
      .constraints(constraints),
  );
  const layout = useLayout();
  return (
    <LayoutContext.Provider
      value={value}
    >
      <WebCola
        width={width}
        height={height}
        renderLayout={renderLayout}
        onHandleLayout={onHandleLayout}
        {...layout}
      />
      {children}
    </LayoutContext.Provider>
  );
};

Layout.propTypes = {
  subscribe: PropTypes.func,
  spread: PropTypes.number,
  renderLink: PropTypes.func,
};

Layout.defaultProps = {
  subscribe: (signals, elements) => null,
  spread: 75,
  renderLink: ({ source, target }, i) => (
    <Link
      key={i}
      x0={source.x}
      y0={source.y + source.height * 0.5}
      x1={target.x}
      y1={target.y + target.height * 0.5}
    />
  ),
};

export default withDataflow(Layout);
