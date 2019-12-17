import React, { useState } from 'react';
import uuidv4 from 'uuid/v4';
import { withWires } from 'react-dataflow';

import { withLayout, LayoutTypes } from '../../Layout';

const throwOnBadDiagramProps = (diagramProps) => {
  // TODO: actually validate
};

const throwOnBadInletsOrOutlets = (inlets, outlets) => {
  // TODO: actually validate
};

export const withFlow = Component => ({ ...extraProps }) => { 
  const { diagramProps } = Component;
  throwOnBadDiagramProps(diagramProps);
  const { inlets, outlets } = diagramProps;
  throwOnBadInletsOrOutlets(inlets, outlets);
  const [ elementId ] = useState(
    () => uuidv4(),
  );
  const [ FlowableComponent ] = useState(
    () => {
      const FlowableComponent = (props) => (
        <Component {...props} />
      );
      FlowableComponent.exportPropTypes = outlets;
      return FlowableComponent;
    },
  );
  const [ Flowable ] = useState(
    () => withLayout(
      Object
        .assign(
          withWires(FlowableComponent, { key: elementId }),
          {
            diagramProps: {
              type: LayoutTypes.Node,
              ...diagramProps,
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
