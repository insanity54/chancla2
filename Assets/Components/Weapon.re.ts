import * as RE from 'rogue-engine';
import * as THREE from 'three';
import RAPIER from '@dimforge/rapier3d-compat';
import RapierBody from '@RE/RogueEngine/rogue-rapier/Components/RapierBody.re';
import RogueRapier from '@RE/RogueEngine/rogue-rapier/Lib/RogueRapier';
import RapierCollider from '@RE/RogueEngine/rogue-rapier/Components/Colliders/RapierCollider';
import RapierThirdPersonController from '@RE/RogueEngine/rogue-rapier/Components/Controllers/RapierThirdPersonController.re';
import Module from './Module.re';
import { randomRange, lerpV3 } from 'Assets/Helpers/util';

type BulletParticle = {
  obj: THREE.Object3D;
  prevPos: THREE.Vector3;
  startPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  distance: number;
  t: number;
}

type DebugSphere = {
  obj: THREE.Object3D;
  t: number;
}


const fullMuzzleFlashScale = new THREE.Vector3(1, 1, 1);
const zeroDistance = 300


@RE.registerComponent
export default class Weapon extends RE.Component {



  @RE.props.prefab() projectileParticle: RE.Prefab;
  @RE.props.num() particleSpeed = 500;
  @RE.props.audio(true) shotSFX: THREE.PositionalAudio;
  @RE.props.num(0, 0.5) shotSFXRolloff = 0.07;
  @RE.props.object3d() barrel: THREE.Object3D;
  @RE.props.prefab() muzzleFlash: RE.Prefab;
  @RE.props.vector3() muzzleFlashScale = new THREE.Vector3(1, 1, 1);
  muzzleFlashObj: THREE.Object3D;

  @RE.props.select() firingMode = 0;
  firingModeOptions = ["Semi-Auto", "Auto"];


  @RE.props.num() firingRate = 40;
  @RE.props.num() fireRateCounter = 0;
  @RE.props.num() reloadTime = 2000;
  @RE.props.num() reloadCounter = 0;
  @RE.props.num() magSize = 300;
  @RE.props.num() totalRounds = 150;
  @RE.props.num() curRounds = this.totalRounds;
  @RE.props.num() loadedRounds = this.magSize;
  
  
  
  @RE.props.checkbox() cocked = false;
  @RE.props.checkbox() overheat = false;
  @RE.props.num() heatPerShot = 10;
  @RE.props.num() maxHeat = 100;
  @RE.props.num() cooldownRate = 300;
  @RE.props.num() curHeat = 0;

  @RE.props.num(1) shots = 1;
  @RE.props.num(0) spread = 0;
  @RE.props.prefab() explosion: RE.Prefab;

  @RE.props.checkbox() equipped = false;
  
  overheated = false;
  playerObject: THREE.Object3D;
  projectilesContainer: THREE.Object3D;
  explosionsContainer: THREE.Object3D;
  debugContainer: THREE.Object3D;

  @RapierThirdPersonController.require(true)
  tpsController: RapierThirdPersonController;

  raycaster = new THREE.Raycaster();
  rayOrigin = new THREE.Vector3();
  rayDir = new THREE.Vector3();
  rapierRay = new RAPIER.Ray(this.rayOrigin, this.rayDir);

  module: Module;

  private bullets: {[uuid: string]: BulletParticle} = {};
  private debugObjects: {[uuid: string]: DebugSphere} = {};


  onHit = (intersection: THREE.Intersection) => {}



  awake() {

  }


  get isReloading() {
    return this.reloadCounter !== 0;
  }

  get canShoot() {
    // if (!this.equipped) return false;
    return this.fireRateCounter === 0 && this.loadedRounds > 0 && !this.isReloading && !this.overheated && this.cocked;
  }

  

  calculateFiringRate() {
    if (this.fireRateCounter !== 0) {
      this.fireRateCounter -= RE.Runtime.deltaTime * 1000;
      if (this.fireRateCounter < 0) this.fireRateCounter = 0;
    }
  }



  private doReload() {
    if (!this.isReloading || this.curRounds <= 0) return;

    this.reloadCounter -= RE.Runtime.deltaTime * 1000;

    if (this.reloadCounter <= 0) {
      this.reloadCounter = 0;
      const curRounds = this.curRounds - (this.magSize - this.loadedRounds);
      this.loadedRounds = this.curRounds < this.magSize ? this.curRounds : this.magSize;
      this.curRounds = Math.max(0, curRounds);
    }
  }

  start() {
    if (!this.debugContainer) {
      this.debugContainer = new THREE.Object3D();
      this.debugContainer.name = "Debug";
      RE.Runtime.scene.add(this.debugContainer);
    }
    
    if (this.muzzleFlash) {
      this.muzzleFlashObj = this.muzzleFlash.instantiate(this.object3d);
      this.muzzleFlashObj?.position.copy(this.barrel.position);
      this.muzzleFlashObj?.scale.set(0, 0, 0);
      this.muzzleFlashObj && (this.muzzleFlashObj.visible = false);
    }

    // onHit is meant to be overriden by another Component, wherein health is deducted appropriately
    this.onHit = (intersection: THREE.Intersection) => {}


    this.projectilesContainer = RE.Runtime.scene.getObjectByName("Projectiles") as THREE.Object3D;

    if (!this.projectilesContainer) {
      this.projectilesContainer = new THREE.Object3D();
      this.projectilesContainer.name = "Projectiles";
      RE.Runtime.scene.add(this.projectilesContainer);
    }

    this.explosionsContainer = RE.Runtime.scene.getObjectByName("Explosions") as THREE.Object3D;

    if (!this.explosionsContainer) {
      this.explosionsContainer = new THREE.Object3D();
      this.explosionsContainer.name = "Explosions";
      RE.Runtime.scene.add(this.explosionsContainer);
    }

  }

  updateDebugs() {
    const choppingBlock: DebugSphere[] = [];
    for (let uuid in this.debugObjects) {
      const sphere = this.debugObjects[uuid];
      if (sphere.t >= 10) choppingBlock.push(sphere);
      sphere.t += RE.Runtime.deltaTime
    }
    choppingBlock.forEach(sphere => {
      delete this.debugObjects[sphere.obj.uuid];
      sphere.obj.parent?.remove(sphere.obj);
    });
  }


  update() {
    this.animateMuzzleFlash();
    this.calculateFiringRate();
    this.doReload();
    this.cooldown();
    this.updateDebugs();

    this.updateParticles();

    // @todo maybe this belongs in a equip() function which runs when the weapon is attached to a module inventory?
    if (!this.playerObject) {
      if (!this.object3d.parent) {
        RE.Debug.logError(`Weapon parent is missing`)
      } else {
        this.playerObject = this.object3d.parent

      }
    }



    // point the weapon in the same direction as the camera
    const mountObject = this.object3d.parent?.children.find((o) => o.name.includes('Mount'))
    if (mountObject) {
      RE.Runtime.camera.getWorldQuaternion(mountObject.quaternion)
      // RE.Debug.log(`mountObject=${mountObject.name}, rotation x=${mountObject.rotation.x}, y=${mountObject.rotation.y}, z=${mountObject.rotation.z}`)
      mountObject.rotateY(Math.PI)
      // we have to apply the inverse of the kyberpod's orientation to gimbal the weapon to point in the same direction as camera
      // if (this.object3d.parent) {
      const inverted = mountObject.quaternion.clone().invert()
      mountObject.applyQuaternion(inverted)
      // }
    }

  }



  updateParticles() {
    const choppingBlock: BulletParticle[] = [];
    // RE.Debug.log('updateParticles')
    for (let uuid in this.bullets) {
      const bullet = this.bullets[uuid];
      // RE.Debug.log(`bullet=${JSON.stringify(bullet)}`)
      
      lerpV3(bullet.obj.position, bullet.targetPos, 0.2, this.particleSpeed * (10/bullet.distance) * RE.Runtime.deltaTime);

      if (bullet.t >= 3) {
        choppingBlock.push(bullet);
      } else {
        bullet.t += RE.Runtime.deltaTime
      }

      const { x, y, z } = bullet.prevPos
      this.shootReverseRaycast(bullet.prevPos, bullet.obj.position, (intersection) => {
        // if we are here, it means the projectile hit something!
        // const explosion = this.explosion.instantiate(this.explosionsContainer);
        // explosion.position.copy(intersection.point)
        // RE.Debug.log(`we have intersected`)

        choppingBlock.push(bullet)
        this.onHit(intersection)
      })
      
      bullet.prevPos.copy(bullet.obj.position)
    }
    
    choppingBlock.forEach(bullet => {
      delete this.bullets[bullet.obj.uuid];
      bullet.obj.parent?.remove(bullet.obj);
    });
  }

  shoot() {
    if (!this.canShoot) return;

    if (this.overheat) {
      this.curHeat += this.heatPerShot;

      if (this.curHeat >= this.maxHeat) {
        this.overheated = true;
      }
    }

    this.fireRateCounter = this.firingRate;
    this.loadedRounds -= 1;

    this.muzzleFlashObj?.scale.set(0, 0, 0);
    this.muzzleFlashObj?.rotateZ(THREE.MathUtils.degToRad(90));
    this.muzzleFlashObj && (this.muzzleFlashObj.visible = true);

    for (let i = 0; i < this.shots; i++) {
      const bullet = this.projectileParticle.instantiate(this.projectilesContainer);
      this.barrel.getWorldPosition(bullet.position);
      this.object3d.getWorldQuaternion(bullet.quaternion);

      const distance = zeroDistance
      const targetPos = this.shootFixedRaycast(distance)

      // const distance = 1000;
      // const targetPos = RE.Runtime.camera.position.clone();


      const startPos = bullet.position.clone();
      // this.drawDebugSphere(startPos, 0x0ff000, 2)
      // // const rayEnd = new THREE.Vector3().copy(startPos).multiplyScalar(1000).add(startPos);

      // bullet.translateZ(-distance);
      // targetPos.copy(bullet.position);
      // bullet.translateZ(distance);
      // this.drawDebugLine(startPos, targetPos, 0x0000FF)

      const prevPos = bullet.position.clone()

      this.bullets[bullet.uuid] = {obj: bullet, prevPos, targetPos, distance, startPos, t: 0};


      // this.bullets[bullet.uuid].targetPos.copy(intersection.point);

      // save the total distance to the bullet object. this is one of the ways we later know when to destroy the bullet (when the bullet has travelled it's complete distance)
      // this.bullets[bullet.uuid].distance = bullet.position.distanceTo(targetPos);

      // Zero the bullet's trajectory using the raycast from the camera to where the camera is pointing
      // bullet.lookAt(targetPos);
      // this.shootPredictiveRaycast((intersection) => {
      // });


    }

    if (this.shotSFX) {
      this.shotSFX.isPlaying && this.shotSFX.stop();
      const detune = randomRange(-100, 100);
      this.shotSFX.detune = detune;
      this.shotSFX.setRolloffFactor(this.shotSFXRolloff);
      this.shotSFX.play();
    }

  }

  private drawDebugLine(startPos: THREE.Vector3, endPos: THREE.Vector3, color?: number) {
    
    color = color || Math.floor(Math.random() * 0xffffff); // Random hex color if not passed a specific color

    // Create geometry for the line representing the ray
    const points = [startPos, endPos];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
  
    // Create a material for the line
    const material = new THREE.LineBasicMaterial({ color: color || 0x00ff00 }); 
  
    // Create the line object
    const line = new THREE.Line(geometry, material);
  
    // Add the line to the scene
    this.debugObjects[line.uuid] = {obj: line, t: 0}
    this.debugContainer.add(line)
  }
  
  // Helper function to create a debug sphere at a given position
  private drawDebugSphere(position: THREE.Vector3, color: number = 0xff0000, size: number = 0.4) {
    const sphereGeometry = new THREE.SphereGeometry(size, 16, 16); // Creates a small sphere geometry
    const sphereMaterial = new THREE.MeshBasicMaterial({ color, wireframe: true }); // Creates a wireframe material for visibility
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.copy(position);
    this.debugObjects[sphere.uuid] = {obj: sphere, t: 0};
    this.debugContainer.add(sphere)
  }

  /**
   * shootReverseRaycast
   * 
   * Shoot a reverse raycast to determine if a projectile passed through an object in the last frame
   * 
   * @param rayOrign 
   * @param rayDest 
   * @param onHit 
   */
  private shootReverseRaycast(rayOrigin: THREE.Vector3, rayDest: THREE.Vector3, onHit: (intersection: THREE.Intersection<THREE.Object3D>) => void) {
    
    // let rayDir = new THREE.Vector3().subVectors(rayDest, rayOrigin).normalize();
    // rayDir.copy(rayDest)
    // rayDir.normalize()
    this.drawDebugLine(rayOrigin, rayDest)

    
    const rayDir = new THREE.Vector3().subVectors(rayOrigin, rayDest).normalize();
    this.raycaster.set(rayOrigin, rayDir)
    

    // RE.Debug.log(`rapierRay origin=${JSON.stringify(rapierRay.origin)} dir=${JSON.stringify(rapierRay.dir)}`)

    const rigidbodies = RE.getComponents(RapierBody);

    // Get rigidbodies that are not the player and not RapierBody Fixed type.
    const bodies = rigidbodies
      .filter((body) => body.object3d !== this.tpsController.object3d && body.type !== 1)
      .map((body) => body.object3d);

    this.raycaster.set(rayOrigin, rayDir)

    const intersections = this.raycaster.intersectObjects(bodies, true)
    if (intersections.length > 0) {
      RE.Debug.log(` >> there was ${intersections.length} intersections with RapierBody`)
      this.drawDebugSphere(intersections[0].point, 0x0000ff, 6)
      return onHit(intersections[0])
    }

    const res = RogueRapier.world.castRay(
      this.rapierRay, 
      1000, 
      true, 
      undefined, 
      undefined, 
      undefined, 
      this.tpsController.characterController.body
    )


    if (res) {
      const components = RE.getComponents(RapierCollider as any) as RapierCollider[];
      const collider = components.find((comp) => comp.collider === res.collider)
      if (!collider) {
        RE.Debug.log(`there was no collider`)
        return;
      }
      const obj = (collider.object3d instanceof THREE.Mesh) ? collider.object3d : collider.object3d.parent;
      if (!obj) {
        RE.Debug.log(`there was no obj`)
        return;
      }
      // RE.Debug.log(JSON.stringify(obj))

      this.raycaster.set(rayOrigin, rayDir)
      const intersections = this.raycaster.intersectObject(obj, true);

      if (intersections.length < 1) {
        RE.Debug.log(`there was no intersection on any collider`)
        return;
      }

      this.drawDebugSphere(intersections[0].point, 0x00ff00, 5)
      onHit(intersections[0])


    }

  }

  private shootFixedRaycast(distance: number) {

    // const raycaster = new THREE.Raycaster();
    const rayOrigin = new THREE.Vector3();
    const rayDir = new THREE.Vector3();
    // const rapierRay = new RAPIER.Ray(rayOrigin, rayDir);

    RE.Runtime.camera.parent?.getWorldPosition(rayOrigin);

    
    RE.Runtime.camera.getWorldDirection(rayDir);
    
    const rayEnd = new THREE.Vector3().copy(rayDir).multiplyScalar(distance).add(rayOrigin);
    // RE.Debug.log(`origin=${JSON.stringify(rayOrigin)}, rayEnd=${JSON.stringify(rayEnd)}`)
    this.drawDebugLine(rayOrigin, rayEnd, 0xFFFF00)
    this.drawDebugLine(new THREE.Vector3(0, 0, 0), rayEnd, 0x00FFFF)
    return rayEnd
  }


  /**
   * shootPredictiveRaycast
   * 
   * Shoot a raycast from the camera to the center of the screen where the camera is pointing.
   * Useful for zeroing the third person controller weapon
   * 
   * @param onHit 
   * @returns 
   */
  private shootPredictiveRaycast(onHit: (intersection: THREE.Intersection<THREE.Object3D>) => void) {

    const raycaster = new THREE.Raycaster();
    let rayDir = new THREE.Vector3();
    let rayOrigin = new THREE.Vector3();
    const rapierRay = new RAPIER.Ray(rayOrigin, rayDir);

    RE.Runtime.camera.parent?.getWorldPosition(rayOrigin);
    RE.Runtime.camera.getWorldDirection(rayDir);

    const rayEnd = new THREE.Vector3().copy(rayDir).multiplyScalar(zeroDistance).add(rayOrigin);
    this.drawDebugLine(rayOrigin, rayEnd, 0x00ff00)

    // detect intersections with visual objects
    const rigidbodies = RE.getComponents(RapierBody);
    const bodies = rigidbodies.filter(body => body.object3d !== this.tpsController.object3d && body.type !== 1)
    .map(body => body.object3d);

    raycaster.set(rayOrigin, rayDir);
    const intersections = raycaster.intersectObjects(bodies, true);

    if (intersections.length > 0) {
      return onHit(intersections[0]);
    }

    // detect intersections with physics bodies
    const res = RogueRapier.world.castRay(rapierRay, zeroDistance, true, undefined, undefined, undefined, this.tpsController.characterController.body);

    if (res) {
      const components = RE.getComponents(RapierCollider as any) as RapierCollider[];
      const collider = components.find(comp => comp.collider === res.collider);
      if (!collider) return;

      const obj = collider.object3d instanceof THREE.Mesh ? collider.object3d : collider.object3d.parent;
      if (!obj) return;

      raycaster.set(rayOrigin, rayDir);
      const intersections = raycaster.intersectObject(obj, true);

      if (intersections.length < 1) return;

      onHit(intersections[0]);
    }
  }



  animateMuzzleFlash() {
    if (!this.equipped) {
      return;
    }
    const fullSize = fullMuzzleFlashScale.z - 0.01;

    // // when the muzzle flash reaches full size, make it disappear.
    // if (this.muzzleFlash?.visible && this.muzzleFlash?.scale.z >= fullSize) {
    //   this.muzzleFlash.visible = false;
    // }

    // // if the muzzle flash hasn't reached full size, scale it up
    // if (this.muzzleFlash?.visible && this.muzzleFlash?.scale.z <= fullSize) {
    //   this.muzzleFlash?.scale.lerp(fullMuzzleFlashScale, RE.Runtime.deltaTime * 80);
    // }
  }



  cooldown() {
    this.curHeat -= this.cooldownRate * RE.Runtime.deltaTime;
    this.curHeat = Math.max(0, this.curHeat);

    if (this.overheated && this.curHeat <= 0) {
      this.curHeat = 0;
      this.overheated = false;
    }
  }



}
