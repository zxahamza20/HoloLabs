# HOLOLAB — Asset acceptance checklist

Before adding a real GLB model, verify:

- [ ] License permits our intended use (including modification and redistribution if needed).
- [ ] Author and download URL are recorded below.
- [ ] GLB opens correctly in a viewer.
- [ ] Distinct components have sensible node or mesh names.
- [ ] Each planned detachable part is separate geometry (not welded to another part).
- [ ] Origins, axes, pivot points, and scale are reasonable.
- [ ] Hidden internal parts actually exist, or a separate assembly model can be added.
- [ ] Polygon count and textures suit an 8 GB unified-memory MacBook.
- [ ] No unnecessary 4K/8K textures.
- [ ] We can focus on one assembly without loading the complete detailed machine.

Run `npm run inspect:glb -- path/to/file.glb` to print node/mesh names.

## Candidate record template

Name:
Source URL:
Author:
License:
Attribution required:
Download date:
File size:
Mesh/node count:
Separately modeled parts:
Missing internals:
Decision (accept/reject/prototype-only):

## Suggested starting points

- Khronos glTF Sample Assets: https://github.khronos.org/glTF-Assets/
- Poly Haven (CC0 assets; always inspect specific asset): https://polyhaven.com/models
- Sketchfab downloadable models (license varies): https://sketchfab.com

A nice exterior car model is not automatically a disassemblable engineering model.
