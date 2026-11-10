#!/usr/bin/env python3
"""Generate an original lightweight, multipart GLB for loader verification.

Uses trimesh + numpy; the generated GLB is bundled so users do NOT need Python.
"""
from pathlib import Path
import numpy as np
import trimesh

root = Path(__file__).resolve().parents[1]
out = root / 'public/models/car/wheel-brakes-demo.glb'
out.parent.mkdir(parents=True, exist_ok=True)
scene = trimesh.Scene()


def add(name, geometry, color):
    # Node names are canonical and mapped to part IDs in machines.js.
    geometry.visual = trimesh.visual.ColorVisuals(geometry, vertex_colors=np.array(color, dtype=np.uint8))
    scene.add_geometry(geometry, node_name=name, geom_name=name)


def torus_ring(outer, inner, thickness, translation=(0,0,0), sections=48):
    mesh = trimesh.creation.annulus(r_min=inner, r_max=outer, height=thickness, sections=sections)
    mesh.apply_translation(translation)
    return mesh

add('Tire', torus_ring(1.18, 0.75, 0.65, (0, 0, 0.04)), [28, 46, 61, 255])
# Rim is its own 3D node; a ring + spokes + center are connected for intuitive selection.
rim_parts = [torus_ring(0.79, 0.43, 0.45, (0, 0, 0.28))]
for theta in np.linspace(0, 2 * np.pi, 7, endpoint=False):
    bar = trimesh.creation.box(extents=(0.69, 0.12, 0.16))
    bar.apply_translation((0.46, 0, 0.55))
    bar.apply_transform(trimesh.transformations.rotation_matrix(theta, (0, 0, 1)))
    rim_parts.append(bar)
rim_parts.append(trimesh.creation.cylinder(radius=0.42, height=0.17, sections=32, transform=trimesh.transformations.translation_matrix((0,0,0.55))))
add('Wheel Rim', trimesh.util.concatenate(rim_parts), [92, 169, 198, 255])
add('Brake Rotor', torus_ring(0.68, 0.18, 0.12, (0, 0, -0.37)), [114, 173, 182, 255])
caliper = trimesh.creation.box(extents=(0.28, 0.43, 0.38))
caliper.apply_translation((0.53, 0.45, -0.35))
add('Brake Caliper', caliper, [43, 159, 185, 255])
hub = trimesh.creation.cylinder(radius=0.21, height=0.34, sections=32)
hub.apply_translation((0, 0, -0.19))
add('Wheel Hub', hub, [105, 205, 218, 255])
# Five lug nuts treated as a single selectable cluster for our small demo.
lugs = []
for theta in np.linspace(0, 2*np.pi, 5, endpoint=False):
    x, y = 0.28 * np.cos(theta), 0.28 * np.sin(theta)
    nut = trimesh.creation.cylinder(radius=0.075, height=0.11, sections=12)
    nut.apply_translation((x, y, 0.69))
    lugs.append(nut)
add('Lug Nuts', trimesh.util.concatenate(lugs), [167, 209, 230, 255])

out.write_bytes(scene.export(file_type='glb'))
print(f'Generated {out} ({out.stat().st_size:,} bytes)')
