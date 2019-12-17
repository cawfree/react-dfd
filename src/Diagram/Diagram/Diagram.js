import React, { useState } from 'react';
import uuidv4 from 'uuid/v4';
import { withWires } from 'react-dataflow';

import { withLayout, LayoutTypes } from '../../Layout';

const throwOnBadFlowProps = (flowProps) => {
  if (!flowProps || typeof flowProps !== 'object') {
    throw new Error(
      `react-dfd: A <Component /> wrapped withLayout did not define valid static flowProps. Expected object, encountered ${flowProps}.`,
    );
  }
  const { type } = flowProps;
  if (Object.values(LayoutTypes).indexOf(type) < 0) {
    throw new Error(
      `react-dfd: flowProps must define a valid string "type" property. Expected one of ${JSON.stringify(Object.values(LayoutTypes))}, encountered ${type}.`,
    );
  }
  switch (type) {
    case LayoutTypes.Node:
      const { width, height } = flowProps;
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
      /* flowProps have passed validation  */
  }
};

const throwOnBadInletsOrOutlets = (inlets, outlets) => {
  // TODO: actually validate
};

export const withFlow = Component => ({ ...extraProps }) => { 
  const { flowProps } = Component;
  throwOnBadFlowProps(flowProps);
  const { inlets, outlets } = flowProps;
  throwOnBadInletsOrOutlets(inlets, outlets);
  const [ elementId ] = useState(
    () => uuidv4(),
  );
  const [ FlowableComponent ] = useState(
    () => {
      const FlowableComponent = (props) => (
        <Component {...props} />
      );
      FlowableComponent.exportPropTypes = (
        outlets || {}
      );
      return FlowableComponent;
    },
  );
  const [ Flowable ] = useState(
    () => withLayout(
      Object
        .assign(
          withWires(FlowableComponent, { key: elementId }),
          {
            flowProps: {
              type: LayoutTypes.Node,
              ...flowProps,
              inlets: inlets ||{},
              outlets: outlets || {},
            },
          },
        ),
      elementId,
    ),
  );
  return (
    <Flowable
      {...extraProps}
    />
  );
};
