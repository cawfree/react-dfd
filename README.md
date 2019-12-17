# react-dfd
Clean, prettified and intuitive Dataflow Digrams for React.

<p align="center">
  <img src ="./assets/dfd.gif" width="442" height="270" alt="react-dfd"/>
</p>

## Why does this exist?
[react-dfd]() allows us to create [React](https://github.com/facebook/react) applications that rely upon the principles of _dataflow_, with the added benefit of being able to visualize the resultant diagrams.

  - This enables simple inspection of the relationships between modules of your app.
  - It ensures clean, readable flow diagrams without requiring the developer to worry about all the wiring.
  - Since it's backed by React, it's trivial to:
    - Easily design, introduce and publish new blocks.
    - Share your diagrams over the web, or in native runtimes.
    - Wrap up complex stateful behaviour inside simple-to-use, intuitive building blocks.
  - Design dataflow algorithms using the React DOM directly:
    - You don't need to allocate any abstractions.
    - It abides by core React principles, so it behaves the way you'd expect it to.

## Getting Started

Using [`npm`]():

```bash
npm install --save react-dfd
```

Using [`yarn`]():

```bash
yarn add react-dfd
```

## Preface

This project is a frontend compatible with [react-dataflow](https://github.com/cawfree/react-dataflow). If you haven't already, it's advisable to check out the [tutorial](https://github.com/cawfree/react-dataflow) on how to write applications for [React](https://github.com/facebook/react) using wires.

## Tutorial

### Simple Indicator

```javascript
import React from 'react';
import PropTypes from 'prop-types';
import { useWire } from 'react-dataflow';
import Bulb from 'react-bulb'; // grab an LED
import Switch from 'react-switch';

import { withFlow, withFlowDiagram } from 'react-dfd';

// XXX: Define a simple LightBulb, which will turn on
//      when the active prop becomes truthy.
const LightBulb = ({ active }) => (
  <Bulb
    size={20}
    color={active ? 'lime' : 'green'}
  />
);

// XXX: It is important to know the size of the component
//      before rendering, so we need to provide the width
//      and height.
FlowBulb.diagramProps = {
  width: 40,
  height: 40,
  // XXX: Inlets describe the configuration of input props which
  //      can be wired to, alongside how you want them to be
  //      rendered and positioned on the diagram.
  inlets: {
    // XXX: Describe a boolean input, which we'll draw using
    //      just an empty fragment. We'll position this 10 units
    //      from the top of the FlowBulb (this helps to control
    //      where wires are drawn to).
    active: [PropTypes.bool, React.Fragment, { top: 10 }],
  },
};

const FlowLightBulb = withFlow(LightBulb);

// XXX: Define a class which will draw a switch, which when
//      toggled, will export the current value to the 
//      connected wires.
const Toggle = ({ Export }) => {
  const [ checked, onChange ] = useState(false);
  // XXX: When the Switch is pressed, we will export the property
  //      "pressed" along any connected wires.
  return (
    <Export
      pressed={checked}
    >
      <Switch
        onChange={onChange}
        checked={checked}
      />
    </Export>
  );
};

const FlowToggle = withFlow(Toggle);

// XXX: Here's the resulting app! Just toggle the... toggle... to turn the LightBulb on and off.
const App = () => {
  const wire = useWire();
  return (
    <>
      <FlowToggle
        pressed={wire}
      />
      <FlowLightBulb
        active={wire}
      />
    </>
  );
};

export default withFlowDiagram(
  (props) => (
    <App
      {...props}
      width={500}
      height={500}
    />
  ),
);

```

## License
[MIT]()

<p align="center">
  <a href="https://www.buymeacoffee.com/cawfree">
    <img src="https://cdn.buymeacoffee.com/buttons/default-orange.png" alt="Buy @cawfree a coffee" width="232" height="50" />
  </a>
</p>

