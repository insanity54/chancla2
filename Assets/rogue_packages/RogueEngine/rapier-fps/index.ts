import * as THREE from 'three';

export function randomRange(min: number, max: number, floor = false) {
  let rand = Math.random() * (max - min);
  return floor ? Math.floor(rand) + min : rand + min;
}

export function lerpV3(a: THREE.Vector3, b: THREE.Vector3, t: number, h: number) {
  a.x = THREE.MathUtils.damp(a.x, b.x, t, h);
  a.y = THREE.MathUtils.damp(a.y, b.y, t, h);
  a.z = THREE.MathUtils.damp(a.z, b.z, t, h);
}
