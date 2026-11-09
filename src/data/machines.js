// A machine is a lightweight catalog record. Each assembly will later map to a
// separately loadable GLB and a lesson file. Today's previews are procedural.
export const MACHINES = [
  {
    id: 'car',
    name: 'Passenger Car',
    category: 'Vehicles',
    difficulty: 'Intermediate',
    icon: 'car',
    description: 'Understand the major systems of a car, from its wheels to its engine.',
    tagLine: 'A machine made of machines.',
    demoType: 'car',
    assetState: 'procedural-demo',
    assemblies: [
      { id: 'wheel-front', name: 'Front Wheel & Brakes', summary: 'Explore wheel construction and the components that create braking force.', children: ['Tire', 'Wheel rim', 'Brake rotor', 'Brake caliper', 'Wheel hub'] },
      { id: 'engine-bay', name: 'Engine Compartment', summary: 'Find the powertrain and the systems that support its operation.', children: ['Engine', 'Cooling system', 'Air intake'] },
    ],
  },
  {
    id: 'desktop',
    name: 'Desktop Computer',
    category: 'Computing',
    difficulty: 'Beginner',
    icon: 'cpu',
    description: 'Meet the chips, circuits and cooling systems that make a desktop PC run.',
    tagLine: 'Look beneath the case.',
    demoType: 'desktop',
    assetState: 'procedural-demo',
    assemblies: [
      { id: 'motherboard', name: 'Motherboard', summary: 'Discover how the central circuit board links the main hardware together.', children: ['CPU', 'RAM', 'I/O connectors'] },
      { id: 'graphics', name: 'Graphics Card', summary: 'Study the graphics processor and the cooling hardware around it.', children: ['GPU', 'Cooling assembly'] },
    ],
  },
  {
    id: 'phone',
    name: 'Smartphone',
    category: 'Electronics',
    difficulty: 'Beginner',
    icon: 'phone',
    description: 'Uncover the compact modules packed inside a modern smartphone.',
    tagLine: 'A whole computer in your hand.',
    demoType: 'phone',
    assetState: 'procedural-demo',
    assemblies: [
      { id: 'display', name: 'Display Assembly', summary: 'Inspect the layers that produce the display and detect touch.', children: ['Display panel', 'Touch digitizer'] },
      { id: 'cameras', name: 'Camera System', summary: 'See how distinct camera modules produce different fields of view.', children: ['Wide camera', 'Ultrawide camera'] },
    ],
  },
];

export const CATEGORIES = ['All', 'Vehicles', 'Computing', 'Electronics'];
