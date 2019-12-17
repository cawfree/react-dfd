import React from 'react';
import Layout from './Layout';

export { withFlow } from './Diagram';

export const withFlowDiagram = Component => ({ width, height, ...extraProps }) => (
  <Layout
    width={width}
    height={height}
    children={<Component {...extraProps} />}
  />
);
