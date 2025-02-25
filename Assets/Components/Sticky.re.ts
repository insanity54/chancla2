import * as THREE from 'three';
import RapierBody, { RapierCollisionInfo } from '@RE/RogueEngine/rogue-rapier/Components/RapierBody.re';
import { RigidBodyType } from '@dimforge/rapier3d-compat';


import * as RE from 'rogue-engine';
import { randomInt, randomRange } from 'Assets/Helpers/util';

@RE.registerComponent
export default class Sticky extends RE.Component {

  @RE.props.audio(true) stickSFX: THREE.PositionalAudio;

  @RapierBody.require()
  rapierBody: RapierBody;

  start() {

    if (!this.rapierBody) {
      RE.Debug.logError(`${this.name} is missing RapierBody, which is required for StickyController.`);
    } else {
      this.rapierBody.onCollisionStart = (info: RapierCollisionInfo) => {
        // RE.Debug.log(`Collision where I am at y=${this.object3d.position.y}`)
        // RE.Debug.log(`name=${info.otherBody.name} layers=${JSON.stringify(info.otherBody.object3d.layers)}`)
        // RE.Debug.clear()
        // RE.Debug.log(`collision with ${info.otherBody.object3d.name}`)

        const terrainObjects = RE.Tags.getWithAny('Terrain')
        // RE.Debug.log('terrainObjects list: '+terrainObjects.map((a) => a.name).join(', '))
        if (terrainObjects.some((tO) => tO.name === info.otherBody.object3d.name)) {
          // this.alignToTop(info)
          this.stickInPlace()
        }
      }
    }
  }

  createDebugSphere(position: THREE.Vector3, color: number = 0xff0000, size: number = 0.1): THREE.Mesh {
    const sphereGeometry = new THREE.SphereGeometry(size, 16, 16); // Creates a small sphere geometry
    const sphereMaterial = new THREE.MeshBasicMaterial({ color, wireframe: true }); // Creates a wireframe material for visibility
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.copy(position);
    return sphere;
  }

  alignToTop(info: RapierCollisionInfo) {
    // Get the bounding box of the other collider
    const otherCollider = info.otherBody.object3d;
    const boundingBox = new THREE.Box3().setFromObject(otherCollider);

    const idk = this.object3d
    // RE.Debug.log(`idk.position.x=${idk.position.x} ${idk.position.y} ${idk.position.z}`)

    const sphere = this.createDebugSphere(idk.position, 0x00ff00, randomRange(0.1, 5))
    RE.Runtime.scene.add(sphere)

    // const projectilesContainer = RE.Runtime.scene.getObjectByName("Projectiles") as THREE.Object3D;
    // const projectiles = RE.Runtime.scene.add(sphere);

    // projectilesContainer.attach(sphere)

    // // Calculate the top point of the collider
    // const topPoint = new THREE.Vector3(
    //   (boundingBox.min.x + boundingBox.max.x) / 2,
    //   boundingBox.max.y,
    //   (boundingBox.min.z + boundingBox.max.z) / 2
    // );
    // RE.Debug.log(`topPoint.y=${topPoint.y}`)

    // // Align the current object to the top point of the other collider
    // this.rapierBody.object3d.position.set(topPoint.x, topPoint.y, topPoint.z);
    // this.rapierBody.object3d.updateMatrixWorld();
  }

  stickInPlace() {
    this.rapierBody.body.setBodyType(RigidBodyType.Fixed, true);
    this.rapierBody.body.lockRotations(true, true);
    this.rapierBody.body.lockTranslations(true, true);
    // @todo possible performance enhancement-- can and should we disable the Rapier collider colliderEvents at this point?
    //       Will it free up cycles or does it not matter?
    this.stickSFX.play()
  }

}
