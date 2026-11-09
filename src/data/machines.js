// One catalog entry per machine. In later weeks, each assembly will reference
// its own GLB asset and educational content file.
export const MACHINES = [
  {
    id: 'car',
    name: 'Passenger Car',
    category: 'VEHICLES',
    description: 'Explore how a car is organized, one assembly at a time.',
    demoType: 'car',
    assetState: 'procedural-demo',
    assemblies: [
      { id: 'wheel-front', name: 'Front Wheel & Brakes', children: ['tire', 'rim', 'rotor', 'caliper', 'hub'] },
      { id: 'engine-bay', name: 'Engine Compartment', children: ['engine', 'cooling', 'intake'] },
    ],
  },
  {
    id: 'desktop',
    name: 'Desktop Computer',
    category: 'COMPUTING',
    description: 'Discover the electronics and cooling inside a PC.',
    demoType: 'desktop',
    assetState: 'procedural-demo',
    assemblies: [
      { id: 'motherboard', name: 'Motherboard', children: ['cpu', 'ram', 'connectors'] },
      { id: 'graphics', name: 'Graphics Card', children: ['gpu', 'cooler'] },
    ],
  },
  {
    id: 'phone',
    name: 'Smartphone',
    category: 'ELECTRONICS',
    description: 'Inspect the main electronic modules inside a phone.',
    demoType: 'phone',
    assetState: 'procedural-demo',
    assemblies: [
      { id: 'display', name: 'Display Assembly', children: ['panel', 'digitizer'] },
      { id: 'cameras', name: 'Camera System', children: ['wide', 'ultrawide'] },
    ],
  },
];
