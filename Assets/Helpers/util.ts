import * as THREE from 'three'
import * as RE from 'rogue-engine'

export function randomRange(min: number, max: number, floor = false) {
  let rand = Math.random() * (max - min);
  return floor ? Math.floor(rand) + min : rand + min;
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min) + min);
}


export function lerpV3(a: THREE.Vector3, b: THREE.Vector3, t: number, h: number) {
  a.x = THREE.MathUtils.damp(a.x, b.x, t, h);
  a.y = THREE.MathUtils.damp(a.y, b.y, t, h);
  a.z = THREE.MathUtils.damp(a.z, b.z, t, h);
}

export function getObjectComponents<T extends RE.Component>(
  componentType: new (...args: any[]) => T,
  object: THREE.Object3D
): T[] {
  const components: T[] = [];

  // Helper function to recursively find components in children
  function findComponents(object: THREE.Object3D) {
    const component = RE.getComponent(componentType, object);
    if (component) {
      components.push(component);
    }

    // Traverse children and check for the component on each
    object.children.forEach((child) => findComponents(child));
  }

  findComponents(object); // Start from the given object
  return components;
}


export function getObjectComponent<T extends RE.Component>(componentType: new (...args: any[]) => T, object: THREE.Object3D): T | false {
  const component = RE.getComponent(componentType, object);
  if (component) {
    return component;
  }
  if (object?.parent) {
    return getObjectComponent(componentType, object.parent);
  }
  return false;
}


export function playSound(sfx: THREE.PositionalAudio, restart?: boolean, randomDetune?: boolean, rolloff?: number, volume?: number, delay?: number) {
  if (restart) {
    sfx.isPlaying && sfx.stop();
  }
  if (randomDetune) {
    const detune = randomRange(-100, 100);
    sfx.detune = detune;
  }
  if (rolloff) {
    sfx.setRolloffFactor(0.07);
  }
  if (volume) {
    sfx.setVolume(volume);
  }
  if (delay) {
    sfx.play(delay);
  } else {
    sfx.play();
  }
}



export function drawLine(startPos: THREE.Vector3, endPos: THREE.Vector3, color?: number) {

  // Create geometry for the line representing the ray
  const points = [startPos, endPos];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  // Create a material for the line
  const material = new THREE.LineBasicMaterial({ color: color || 0x00ff00 });

  // Create the line object
  const line = new THREE.Line(geometry, material);

  // Add the line to the scene
  RE.Runtime.scene.add(line);  // Assuming `this.scene` is a reference to your Three.js scene
}



