import RapierFirstPersonController from '@RE/RogueEngine/rogue-rapier/Components/Controllers/RapierFirstPersonController.re';
import * as RE from 'rogue-engine';
import * as THREE from 'three';
import KTFPSWeapon from './KTFPSWeapon.re';
import RAPIER from '@dimforge/rapier3d-compat';
import RogueRapier from '@RE/RogueEngine/rogue-rapier/Lib/RogueRapier';
import * as RFPS from '@RE/RogueEngine/rapier-fps';
import DamagePoint from '@RE/RogueEngine/rogue-character/DamagePoint.re';
import RogueCharacter from '@RE/RogueEngine/rogue-character/RogueCharacter.re';
import RapierBody from '@RE/RogueEngine/rogue-rapier/Components/RapierBody.re';
import RapierCollider from '@RE/RogueEngine/rogue-rapier/Components/Colliders/RapierCollider';
import { drawLine } from 'Assets/Helpers/util';
import Warehouse from './Warehouse.re';

RE.Input.bindButton("Fire", { Mouse: 0 });
RE.Input.bindButton("Aim", { Mouse: 2, Gamepad: 6 });
RE.Input.bindButton("Reload", { Keyboard: "KeyR" });
RE.Input.bindButton("Next Weapon", { Mouse: "WheelDown" });
RE.Input.bindButton("Previous Weapon", { Mouse: "WheelUp" });
RE.Input.bindButton("Pickup Weapon", { Keyboard: "KeyG" });
RE.Input.bindButton("Drop Weapon", { Keyboard: "KeyQ" });
RE.Input.bindButton("Sprint", { Keyboard: "ShiftLeft" });
RE.Input.bindAxes("Look", {
  Mouse: [0.2, 0.2],
  Gamepad: { x: 2, y: 3, mult: [10, 5] },
  Touch: { area: "right", mult: [2, 2] }
});

const q1 = new THREE.Quaternion();
const q2 = new THREE.Quaternion();
const q3 = new THREE.Quaternion();

const packageWeaponMap = {
  "ammocan": "Chaingun",
  "RollersPackage": "Rollers",
  "IDK": "AK47"
}

@RE.registerComponent
export default class KTFPSController extends RE.Component {
  @RE.props.list.object3d() weapons: THREE.Object3D[] = [];
  @RE.props.vector3() holsterPosition = new THREE.Vector3(0, -1, -1);
  @RE.props.checkbox() defaultCrosshair = true;
  @RE.props.num(0, 1) aimLookSpeedFactor = 0.3;
  @RE.props.num(0, 1) aimSpeedFactor = 0.5;
  @RE.props.num(0, 1) duckedSpeedFactor = 0.5;
  @RE.props.num(0) duckAmount = 0.5;
  @RE.props.num(1) sprintFactor = 1.5;
  @RE.props.num(0) camShakeFactor = 0.3;
  @RE.props.num(0) headBobbingAmt = 0.2;
  @RE.props.num(0) sprintStaminaSpend = 20;
  @RE.props.num() maxSlots = 9;
  @RE.props.num() maxPickupDistance = 3;

  @RapierFirstPersonController.require()
  fpController: RapierFirstPersonController;

  @RogueCharacter.require()
  character: RogueCharacter;

  fpsWeapon: KTFPSWeapon;
  selectedWeapon = 0;

  ray = new RAPIER.Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 });

  curDucking = 0;

  standingY = 0;
  halfHeight = 0;

  headBobSpeedCurve = 0;
  idleBobSpeedCurve = 0;
  movementBobSpeedCurve = 0;

  initialCamPos = new THREE.Vector3();
  vel = new THREE.Vector3();
  bobPosition = new THREE.Vector3();
  swayDir = new THREE.Vector3();
  shootDir = new THREE.Vector3();
  camDir = new THREE.Vector3();

  camera: THREE.PerspectiveCamera;

  speed = 0;
  curSpeed = 0;
  lookSpeed = new THREE.Vector2();

  isSprinting = false;

  initialQ: THREE.Quaternion;
  isShooting = false;

  crosshairDiv = document.createElement("div");

  targetedItem: THREE.Object3D
  raycaster = new THREE.Raycaster();
  rayOrigin = new THREE.Vector3();
  rayDir = new THREE.Vector3();
  rapierRay = new RAPIER.Ray(this.rayOrigin, this.rayDir);
  itemsContainer: THREE.Object3D;

  private equipping = false;
  private collider: RAPIER.Collider;

  onHit = (intersection: THREE.Intersection) => {
    // RE.Debug.clear()
    // RE.Debug.log(`KTFPSController onHit intersection with ${intersection.object.name}`)
    const enemyCharacter = RogueCharacter.get(intersection.object, true);

    if (enemyCharacter?.type === "Friendly") return;

    const damagePoint = DamagePoint.get(intersection.object);

    if (damagePoint) {
      return damagePoint.applyDamage(this.fpsWeapon.damage / this.fpsWeapon.shots);
    }

    enemyCharacter?.applyDamage(this.fpsWeapon.damage / this.fpsWeapon.shots);
  }

  awake() {
    RE.Input.mouse.lock();
  }

  start() {
    this.speed = this.fpController.characterController.speed;
    this.standingY = this.fpController.cameraOffset.y;

    this.curSpeed = this.speed;
    this.lookSpeed.copy(this.fpController.lookSpeed);

    const crosshair = this.crosshairDiv;
    crosshair.style.width = "5px";
    crosshair.style.height = "5px";
    crosshair.style.borderRadius = "50%";
    crosshair.style.background = "#0f08";
    crosshair.style.position = "absolute";
    crosshair.style.bottom = "calc(50% - 2.5px)";
    crosshair.style.left = "calc(50% - 2.5px)";

    if (this.defaultCrosshair) {
      RE.Runtime.uiContainer.append(crosshair);
    }
  }

  update() {
    if (!this.fpController.characterController.initialized) return;
    if (!this.fpController?.characterController?.body) return;
    if (!this.collider && this.fpController && this.fpController.characterController.body.numColliders() > 0) {
      this.collider = this.fpController.characterController?.body?.collider(0);
      if (!this.collider) return;
      const shape = this.collider?.shape as RAPIER.Capsule;
      this.halfHeight = shape.halfHeight;
    }

    if (!this.collider) return;

    this.curSpeed = this.speed;

    if (this.camera !== this.fpController.camera) {
      this.camera = this.fpController.camera as THREE.PerspectiveCamera;
      this.camera.near = 0;
      this.initialCamPos.copy(this.camera.position);
      this.selectWeapon(0);
    }

    this.weapons.forEach((weapon, i) => {
      if (this.selectedWeapon === i) return;

      if (weapon.parent !== this.camera) {
        this.camera.attach(weapon);
      }

      if (weapon.position.distanceTo(this.holsterPosition) < 0.01) {
        if (weapon.visible) weapon.visible = false;
        return;
      }
      weapon.position.lerp(this.holsterPosition, 50 * RE.Runtime.deltaTime);
    });

    this.isSprinting = false;

    const stamina = this.character.stamina;
    const curStamina = this.character.curStamina;

    if (RE.Input.getPressed("Sprint")) {
      let { y: vAxis } = RE.Input.getAxes("Move");
      if (vAxis < 0) {
        this.isSprinting = true;
        this.character.spendStamina(0);
      }
    }

    const shape = this.collider.shape as RAPIER.Capsule;

    if (RE.Input.getDown("Drop Weapon")) {
      RE.Debug.log("@todo Drop Weapon")
    }

    if (RE.Input.getDown("Pickup Weapon")) {
      // get Weapon package under the crosshair
      // get range to weapon
      // compute isInRange
      // compute isFreeSlot

      this.shootRaycast((intersection) => {

        // The Module Item we are intersecting is usually a child of the parent Module object, so we need to get a handle on that parent.
        if (!intersection.object) return;
        if (!intersection.object?.parent) {
          RE.Debug.logError(`intersection.object.parent was missing. this should never happen`)
          return
        }

        // our grabber-ray made contact with an object
        const intersectingObject = intersection.object


        // get a handle on the Weapon package, aka, "item"
        // find the KTFPSWeapon that maps to that package
        const weaponName = packageWeaponMap[intersectingObject.name]
        if (!weaponName) {
          RE.Debug.logWarning("intersecting Object did not have a name")
          return;
        }

        RE.Debug.log(`Looking for weaponName=${weaponName} from intersectingObject.name=${intersectingObject.name}`)


        // get the appropriate weapon from the warehouse
        const warehouseObject = RE.Runtime.scene.getObjectByName("SolFront Warehouse") as THREE.Object3D;
        const warehouseComp = Warehouse.get(warehouseObject)
        const weaponPrefab = warehouseComp.findItemPrefab(weaponName)

        if (!weaponPrefab) {
          RE.Debug.logError(`failed to get ${weaponName} prefab`)
          return;
        }
        // const weaponComponent = KTFPSWeapon.get(weaponObject)


        let rangeToWeapon = intersection.distance
        let isInRange = rangeToWeapon <= this.maxPickupDistance
        let isFreeSlot = this.weapons.length < this.maxSlots
        if (isFreeSlot && isInRange) {
          const weaponObject = weaponPrefab.instantiate()
          this.loadWeapon(weaponObject)

          let target = RE.getComponent(RapierBody, intersectingObject, true)
          if (target.object3d.parent) {
            target.object3d.parent.remove(target.object3d)
          }

        }


      })


    }

    if (RE.Input.getDown("Next Weapon")) {
      if (this.weapons.length <= 1) return;
      if (this.fpsWeapon) {
        let newIndex = this.selectedWeapon + 1;
        if (newIndex > this.weapons.length - 1) newIndex = 0;

        this.selectWeapon(newIndex);
      }
    }

    if (RE.Input.getDown("Previous Weapon")) {
      if (this.weapons.length <= 1) return;
      if (this.fpsWeapon) {
        let newIndex = this.selectedWeapon - 1;
        if (newIndex < 0) newIndex = this.weapons.length - 1;

        this.selectWeapon(newIndex);
      }
    }

    if (this.fpsWeapon) {
      this.armedControls();
    }

    if (this.isSprinting && (!stamina || curStamina > 0) && (!this.fpsWeapon || (this.fpsWeapon && this.fpsWeapon.fireRateCounter === 0 && !this.fpsWeapon.isReloading))) {
      this.curSpeed = this.speed * this.sprintFactor;
      this.character.spendStamina(this.sprintStaminaSpend * RE.Runtime.deltaTime);
    }

    this.fpController.characterController.speed = this.curSpeed;

    this.headBobbing();
  }



  getShootInput() {
    return this.fpsWeapon.firingMode === 0 ? RE.Input.getDown("Fire") : RE.Input.getPressed("Fire");
  }

  armedControls() {
    if (RE.Input.getDown("Reload")) {
      this.fpsWeapon.reload();
    }

    if (!this.fpsWeapon.isReloading && (RE.Input.getPressed("Aim") || RE.Input.mouse.isRightButtonPressed)) {
      this.isSprinting = false;
      this.fpsWeapon.aim();
    }
    else if (!this.fpsWeapon.isReloading) {
      if (this.isSprinting && this.fpsWeapon.fireRateCounter === 0) {
        this.fpsWeapon.curAimPos = this.holsterPosition;
      } else {
        this.fpsWeapon.hipAim();
      }
    }

    if (this.fpsWeapon.canShoot && this.getShootInput()) {
      this.fpsWeapon.shoot();
      this.isShooting = true;
    } else {
      this.camShake();
      this.sway();
      this.idleBobbing();
      this.movementBobbing();
      this.isShooting = false;
    }

    if (this.fpsWeapon.isAiming) {
      this.fpController.lookSpeed.copy(this.lookSpeed).multiplyScalar(this.aimLookSpeedFactor);
      this.curSpeed = this.curSpeed * this.aimSpeedFactor;
    } else {
      this.fpController.lookSpeed.copy(this.lookSpeed);
      // this.curSpeed = this.speed;
    }
  }

  loadWeapon(weaponObject: THREE.Object3D) {
    let slot = this.weapons.length
    this.weapons[slot] = weaponObject
    RE.Debug.log(`Loading weapon ${weaponObject.name} into slot=${slot}`)

    this.selectWeapon(slot)
  }

  unloadWeapon(i: number) {

  }

  selectWeapon(i: number) {
    if (!this.weapons[i] || this.equipping) return;

    if (this.fpsWeapon) {
      this.fpsWeapon.reloadCounter = 0;
      this.fpsWeapon.isEquiped = false;
    }

    this.fpsWeapon = KTFPSWeapon.get(this.weapons[i]);

    this.fpsWeapon.onHit = this.onHit;

    this.camera.attach(this.fpsWeapon.object3d);
    this.camera.getWorldDirection(this.camDir);
    this.camera.getWorldPosition(this.shootDir);
    this.shootDir.add(this.camDir.multiplyScalar(20));

    this.fpsWeapon.object3d.lookAt(this.shootDir);
    this.fpsWeapon.isEquiped = true;
    this.selectedWeapon = i;
    this.fpsWeapon.object3d.visible = true;

    this.equipping = true;

    setTimeout(() => {
      this.equipping = false;
    }, 300);
  }

  camShake() {
    if (this.fpsWeapon && this.isShooting) {
      const recoil = this.fpsWeapon.isAiming ? this.fpsWeapon.aimedRecoilMin.x : this.fpsWeapon.hipRecoilMin.x;
      const recoilY = this.fpsWeapon.isAiming ? this.fpsWeapon.aimedRecoilMin.x : this.fpsWeapon.hipRecoilMin.x;

      const deltaRotY = (Math.random() < 0.5 ? (recoil) : -recoil) * this.camShakeFactor;
      const deltaRotX = (Math.random() < 0.5 ? (recoilY) : -recoilY) * this.camShakeFactor;

      this.swayDir.set(0, 1, 0);
      q2.setFromAxisAngle(this.swayDir, THREE.MathUtils.degToRad(deltaRotY + 180));

      this.swayDir.set(1, 0, 0);
      q1.setFromAxisAngle(this.swayDir, THREE.MathUtils.degToRad(deltaRotX));
      q3.setFromAxisAngle(this.swayDir, THREE.MathUtils.degToRad(deltaRotX * 10 * RE.Runtime.deltaTime));

      q2.multiply(q1.multiply(q3));

      RE.Runtime.camera.quaternion.slerp(q2, this.fpsWeapon.swaySmoothness * RE.Runtime.deltaTime);
      return;
    }

    if (!this.initialQ) this.initialQ = RE.Runtime.camera.quaternion.clone();

    RE.Runtime.camera.quaternion.slerp(this.initialQ, this.fpsWeapon.swaySmoothness * RE.Runtime.deltaTime);
  }

  sway() {
    if (!this.fpsWeapon) return;

    const factor = this.fpsWeapon.isAiming ? this.fpsWeapon.aimMovementFactor : 1;

    const deltaRotX = RE.Input.mouse.movementY * RE.Runtime.deltaTime * this.fpsWeapon.swayAmount * factor;
    const deltaRotY = RE.Input.mouse.movementX * RE.Runtime.deltaTime * -this.fpsWeapon.swayAmount * factor;

    this.swayDir.set(0, 1, 0);
    q2.setFromAxisAngle(this.swayDir, THREE.MathUtils.degToRad(deltaRotY + 180));

    this.swayDir.set(1, 0, 0);
    q1.setFromAxisAngle(this.swayDir, THREE.MathUtils.degToRad(deltaRotX));

    this.swayDir.set(0, 0, 1);
    q3.setFromAxisAngle(this.swayDir, THREE.MathUtils.degToRad(deltaRotY * 1.5));

    q2.multiply(q1);
    q2.multiply(q3);

    this.fpsWeapon.object3d.quaternion.slerp(q2, this.fpsWeapon.swaySmoothness * RE.Runtime.deltaTime);
  }

  idleBobbing() {
    if (!this.fpsWeapon) return;

    const factor = this.fpsWeapon.isAiming ? this.fpsWeapon.aimMovementFactor : 1;

    const isGrounded = this.fpController.characterController.isGrounded;
    const velocity = this.fpController.characterController.body.linvel();
    const movement = this.fpController.characterController.movementDirection;

    this.vel.set(velocity.x, velocity.y, velocity.z);

    if (movement.length() !== 0 || !isGrounded) {
      this.fpsWeapon.object3d.position.lerp(this.fpsWeapon.curAimPos, 0.3);
      return;
    }

    this.idleBobSpeedCurve += RE.Runtime.deltaTime * 2;

    const amount = 0.002 * this.fpsWeapon.idleBobbing;

    this.bobPosition.x = (Math.cos(this.idleBobSpeedCurve) * amount * factor) - (movement.x * 0.00002);
    this.bobPosition.y = (Math.sin(this.idleBobSpeedCurve) * amount * factor) - (movement.z * 0.00002);
    this.bobPosition.z = 0;

    this.bobPosition.add(this.fpsWeapon.object3d.position);

    this.fpsWeapon.object3d.position.lerp(this.bobPosition, 0.5);
  }

  movementBobbing() {
    if (!this.fpsWeapon) return;

    const factor = this.fpsWeapon.isAiming ? this.fpsWeapon.aimMovementFactor : 1;

    const isGrounded = this.fpController.characterController.isGrounded;
    const velocity = this.fpController.characterController.body.linvel();
    const movement = this.fpController.characterController.movementDirection;

    this.vel.set(velocity.x, velocity.y, velocity.z);

    if (movement.length() === 0 || !isGrounded) {
      this.fpsWeapon.object3d.position.lerp(this.fpsWeapon.curAimPos, 0.3);
      return;
    }

    this.movementBobSpeedCurve += RE.Runtime.deltaTime * this.vel.length() * 2;
    const amountX = 0.0005 * this.fpsWeapon.movementBobbing;
    const amountY = 0.001 * this.fpsWeapon.movementBobbing;

    this.bobPosition.x = (Math.cos(this.movementBobSpeedCurve) * amountX * factor) - (movement.x * 0.00002);
    this.bobPosition.y = (Math.sin(this.movementBobSpeedCurve) * amountY * factor) - (this.vel.z * 0.00002);
    this.bobPosition.z = 0;

    this.bobPosition.add(this.fpsWeapon.object3d.position);

    this.fpsWeapon.object3d.position.lerp(this.bobPosition, 0.5);
  }

  headBobbing() {
    const isGrounded = this.fpController.characterController.isGrounded;
    const velocity = this.fpController.characterController.body.linvel();

    this.vel.set(velocity.x, velocity.y, velocity.z);

    if (this.vel.length() < 0.001 || !isGrounded) {
      RE.Runtime.camera.position.lerp(this.initialCamPos, 0.1);
      return;
    }

    this.headBobSpeedCurve += RE.Runtime.deltaTime * this.vel.length() * 2;

    this.bobPosition.set(0, 0, 0);

    this.bobPosition.x = (Math.cos(this.headBobSpeedCurve * 0.5) * RFPS.randomRange(0.005, 0.007)) * 0.5;
    this.bobPosition.y = (Math.sin(this.headBobSpeedCurve) * RFPS.randomRange(0.010, 0.015));

    this.bobPosition.add(RE.Runtime.camera.position);

    RE.Runtime.camera.position.lerp(this.bobPosition, this.headBobbingAmt * this.vel.length());
  }

  private shootRaycast(onHit: (intersection: THREE.Intersection<THREE.Object3D>) => void) {
    RE.Runtime.camera.getWorldPosition(this.rayOrigin);
    RE.Runtime.camera.getWorldDirection(this.rayDir);

    const rigidbodies = RE.getComponents(RapierBody);
    const bodies = rigidbodies.filter(body => body.object3d !== this.object3d && body.type !== 1)
      .map(body => body.object3d);

    this.raycaster.set(this.rayOrigin, this.rayDir);
    const intersections = this.raycaster.intersectObjects(bodies, true);

    if (intersections.length > 0) {
      RE.Debug.log(`raycast intersected with a Rapier rigidbody.`)
      return onHit(intersections[0]);
    }

    // Calculate the destination point for the line
    const rayLength = 500; // Set the desired length of the ray
    const rayDestination = new THREE.Vector3().copy(this.rayOrigin).addScaledVector(this.rayDir, rayLength);

    // drawLine(this.rayOrigin, rayDestination, 0x00ff00);
    const playerCharacterBody = RE.getComponent(RapierBody, this.object3d) // the body we want to exclude from ray selection


    const result = RogueRapier.world.castRay(this.rapierRay, 1000, true, undefined, undefined, undefined, playerCharacterBody.body);

    if (result) {
      const components = RE.getComponents(RapierCollider as any) as RapierCollider[];
      const collider = components.find(comp => comp.collider === result.collider);
      if (!collider) return;

      if (!collider?.object3d?.parent) {
        RE.Debug.logError(`collider object3d parent was missing`)
      }
      const obj = collider.object3d instanceof THREE.Mesh ? collider.object3d : collider.object3d.parent;
      if (!obj) return;

      this.raycaster.set(this.rayOrigin, this.rayDir);
      const intersections = this.raycaster.intersectObject(obj, true);

      if (intersections.length < 1) return;
      RE.Debug.log(`Raycast intersected with a THREE object3d.`)

      onHit(intersections[0]);
    }
  }

  bobbing(tgt: THREE.Vector3, x: number, y: number, speedCurve: number, reset?: boolean) {
    const isGrounded = this.fpController.characterController.isGrounded;
    const velocity = this.fpController.characterController.body.linvel();

    this.vel.set(velocity.x, velocity.y, velocity.z);

    if (this.vel.length() < 0.001 || !isGrounded) {
      RE.Runtime.camera.position.lerp(this.initialCamPos, 0.1);
      return;
    }

    speedCurve += RE.Runtime.deltaTime * this.vel.length() * 2;

    tgt.set(0, 0, 0);

    tgt.x = x;
    tgt.y = y;

    tgt.add(RE.Runtime.camera.position);

    RE.Runtime.camera.position.lerp(tgt, 0.2 * this.vel.length());
  }
}
