// HOLOLAB machine manifest v1. Everything in the UI is driven by these records.
// "asset" is only present when a genuine GLB is bundled. Listed parts without
// an asset are learning outlines, not secretly loaded 3D components.
const part = (id, name, description, glbNode = name, children = []) =>
  ({ id, name, description, glbNode, children });

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
    assetState: 'procedural-overview',
    assemblies: [
      {
        id: 'wheel-front', name: 'Front Wheel & Brakes',
        summary: 'Explore the tire, rim, brake rotor, caliper, hub and mounting hardware.',
        asset: { src: '/models/car/wheel-brakes-demo.glb', format: 'glb', status: 'demo', credit: 'HOLOLAB original generated geometry' },
        children: [
          part('tire', 'Tire', 'Rubber tire surrounding the wheel rim.'),
          part('rim', 'Wheel Rim', 'Metal wheel supporting the tire and connecting to the hub.'),
          part('brake-rotor', 'Brake Rotor', 'Disc that rotates with the wheel and provides a friction surface.'),
          part('brake-caliper', 'Brake Caliper', 'Housing that presses brake pads against the rotor.'),
          part('wheel-hub', 'Wheel Hub', 'The wheel mounting point which rotates on a bearing.'),
          part('lug-nuts', 'Lug Nuts', 'Fasteners holding the wheel to the hub.'),
        ],
      },
      {
        id: 'engine-bay', name: 'Engine Compartment',
        summary: 'Find the powertrain and the systems that support its operation.',
        children: [
          part('engine', 'Engine', 'Power-producing assembly.', 'Engine', [
            part('engine-block', 'Engine Block', 'Houses the cylinders.'),
            part('crankshaft', 'Crankshaft', 'Converts piston motion into rotation.'),
          ]),
          part('cooling', 'Cooling System', 'Controls engine operating temperature.'),
          part('intake', 'Air Intake', 'Feeds air into the combustion system.'),
        ],
      },
    ],
  },
  {
    id: 'desktop',
    name: 'Desktop Computer',
    category: 'Computing',
    difficulty: 'Beginner', icon: 'cpu',
    description: 'Meet the chips, circuits and cooling systems that make a desktop PC run.',
    tagLine: 'Look beneath the case.',
    demoType: 'desktop', assetState: 'procedural-overview',
    assemblies: [
      { id: 'motherboard', name: 'Motherboard', summary: 'Discover how the main circuit board connects the hardware.', children: [
        part('cpu', 'CPU', 'Runs program instructions.'), part('ram', 'RAM', 'Short-term working memory.'), part('io', 'I/O Connectors', 'Connects external peripherals.'),
      ] },
      { id: 'graphics', name: 'Graphics Card', summary: 'Study the graphics processor and cooling system.', children: [
        part('gpu', 'GPU', 'Processes graphics workloads.'), part('gpu-cooling', 'Cooling Assembly', 'Moves heat away from the GPU.'),
      ] },
    ],
  },
  {
    id: 'phone',
    name: 'Smartphone', category: 'Electronics', difficulty: 'Beginner', icon: 'phone',
    description: 'Uncover the compact modules packed inside a modern smartphone.',
    tagLine: 'A whole computer in your hand.',
    demoType: 'phone', assetState: 'procedural-overview',
    assemblies: [
      { id: 'display', name: 'Display Assembly', summary: 'Inspect the layers that produce the image and detect touch.', children: [
        part('display-panel', 'Display Panel', 'Produces the visible image.'), part('digitizer', 'Touch Digitizer', 'Detects touch input.'),
      ] },
      { id: 'cameras', name: 'Camera System', summary: 'See how individual modules produce distinct fields of view.', children: [
        part('wide', 'Wide Camera', 'Primary image sensor and lens.'), part('ultrawide', 'Ultrawide Camera', 'Captures a larger field of view.'),
      ] },
    ],
  },
];

export const CATEGORIES = ['All', 'Vehicles', 'Computing', 'Electronics'];
