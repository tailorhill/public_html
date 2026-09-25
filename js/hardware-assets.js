import * as THREE from 'three';
import { GLTFLoader } from '../vendor/GLTFLoader.js';

// Blender assets use a 3 cm strap as reference. Convert glTF Y-up back to
// the viewer's hardware plane: X along strap, Y across strap, Z outward.
const templates = new Map();
let loading;
export function loadHardwareAssets() {
  if (!loading) {
    const loader = new GLTFLoader();
    loading = Promise.allSettled(['side-release', 'd-ring', 'tri-glide', 'roller-buckle', 'keeper', 'half-slip-ring', 'split-keeper'].map(async name => {
      const gltf = await loader.loadAsync(new URL(`../assets/hardware/${name}.glb`, import.meta.url).href);
      gltf.scene.updateMatrixWorld(true);
      const parts = [];
      const basis = new THREE.Matrix4().makeRotationX(Math.PI / 2);
      gltf.scene.traverse(o => {
        if (!o.isMesh) return;
        const geometry = o.geometry.clone();
        geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(basis, o.matrixWorld));
        parts.push({ name: o.name, geometry });
        o.geometry.dispose();
        for (const mat of Array.isArray(o.material) ? o.material : [o.material]) mat.dispose();
      });
      templates.set(name, parts);
    })).then(results => {
      for (const result of results) if (result.status === 'rejected') console.warn('Blender-beslag kunde inte laddas; använder reservmodell.', result.reason);
      return templates.size;
    });
  }
  return loading;
}

export function hardwareAsset(name, width, material) {
  const parts = templates.get(name);
  if (!parts) return null;
  const group = new THREE.Group();
  group.name = `blender-${name}`;
  group.userData.blenderAsset = name;
  for (const part of parts) {
    // Independent geometry: the viewer disposes each instance on rebuild.
    const geo = part.geometry.clone();
    geo.scale(width / 3, width / 3, width / 3);
    const mesh = new THREE.Mesh(geo, material);
    mesh.name = part.name;
    mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh);
  }
  return group;
}
