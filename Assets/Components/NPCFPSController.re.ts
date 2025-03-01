import * as RE from 'rogue-engine';
import NPCFPSWeapon from './NPCFPSWeapon.re';
import * as THREE from 'three';
import RogueCharacter from '@RE/RogueEngine/rogue-character/RogueCharacter.re';
import DamagePoint from '@RE/RogueEngine/rogue-character/DamagePoint.re';
import NPCController from './NPCController.re';


@RE.registerComponent
export default class NPCFPSController extends RE.Component {

  @RE.props.list.object3d() weapons: THREE.Object3D[] = [];
  @RE.props.vector3() holsterPosition = new THREE.Vector3(0, -1, -1);
  @RE.props.num(0, 1) aimLookSpeedFactor = 0.3;
  @RE.props.num(0, 1) aimSpeedFactor = 0.5;
  @RE.props.num(0, 1) duckedSpeedFactor = 0.5;
  @RE.props.num(1) sprintFactor = 1.5;
  @RE.props.num(0) camShakeFactor = 0.3;
  @RE.props.num(0) headBobbingAmt = 0.2;
  @RE.props.num(0) sprintStaminaSpend = 20;
  @RE.props.checkbox() equipping = false;

  kyberpodDir = new THREE.Vector3();
  shootDir = new THREE.Vector3();
  isShooting = false;

  npcfpsWeapon: NPCFPSWeapon;
  selectedWeapon = 0;


  @NPCController.require(true)
  npcController: NPCController

  // private equipping = false;

  awake() {

  }

  start() {
    this.selectWeapon(0);
  }

  update() {
    this.weapons.forEach((weapon, i) => {
      if (this.selectedWeapon === i) return;

      if (weapon.position.distanceTo(this.holsterPosition) < 0.01) {
        if (weapon.visible) weapon.visible = false;
        return;
      }
      weapon.position.lerp(this.holsterPosition, 50 * RE.Runtime.deltaTime);
    });

    if (this.npcfpsWeapon) {
      this.armedControls();
    }
  }

  getShootInput() {
    if (!this.npcfpsWeapon) return false;
    const parent = this.npcfpsWeapon.object3d.parent
    const parentName = parent?.name
    if (parentName !== 'EnemyKyberpod') return false;
    // return true if it's task is kill
    return (this.npcController.activeTaskAction === 'kill')
  }

  selectWeapon(i: number) {
    if (!this.weapons[i] || this.equipping) return;


    if (this.npcfpsWeapon) {
      this.npcfpsWeapon.reloadCounter = 0;
      this.npcfpsWeapon.isEquiped = false;
    }


    this.npcfpsWeapon = NPCFPSWeapon.get(this.weapons[i]);

    this.npcfpsWeapon.onHit = this.onHit;


    // const bullet = this.projectileParticle.instantiate(this.projectilesContainer);
    // this.barrel.getWorldPosition(bullet.position);
    // this.object3d.getWorldQuaternion(bullet.quaternion);

    // this.object3d.add(this.npcfpsWeapon.object3d)
    this.object3d.attach(this.npcfpsWeapon.object3d);

    // this.object3d.getWorldPosition(this.npcfpsWeapon.object3d.position);
    // this.object3d.getWorldQuaternion(this.npcfpsWeapon.object3d.quaternion);


    // Now set the position and quaternion
    // this.npcfpsWeapon.object3d.position.copy(this.object3d.getWorldPosition(new THREE.Vector3()));
    // this.npcfpsWeapon.object3d.quaternion.copy(this.object3d.getWorldQuaternion(new THREE.Quaternion()));

    this.npcfpsWeapon.object3d.position.set(0, 0.7, 0)
    // this.npcfpsWeapon.object3d.position.set(0, 0, 0);
    // this.npcfpsWeapon.object3d.setRotationFromQuaternion(new THREE.Quaternion(0, 0, 0))
    // this.npcfpsWeapon.object3d.rotation.set(1, 1, 1);


    // this.camera.attach(this.npcfpsWeapon.object3d);
    // this.camera.getWorldDirection(this.camDir);
    // this.camera.getWorldPosition(this.shootDir);



    // here
    // this.object3d.getWorldDirection(this.kyberpodDir)
    // this.shootDir.add(this.kyberpodDir.multiplyScalar(20));

    // this.npcfpsWeapon.object3d.lookAt(this.shootDir);
    this.npcfpsWeapon.isEquiped = true;
    this.selectedWeapon = i;
    this.npcfpsWeapon.object3d.visible = true;

    this.equipping = true;

    setTimeout(() => {
      this.equipping = false;
    }, 300);
  }


  onHit = (intersection: THREE.Intersection) => {
    const friendlyCharacter = RogueCharacter.get(intersection.object, true);

    if (friendlyCharacter?.type === "Enemy") return;

    const damagePoint = DamagePoint.get(intersection.object);

    if (damagePoint) {
      return damagePoint.applyDamage(this.npcfpsWeapon.damage / this.npcfpsWeapon.shots);
    }

    friendlyCharacter?.applyDamage(this.npcfpsWeapon.damage / this.npcfpsWeapon.shots);
  }

  armedControls() {
    if (this.npcfpsWeapon.canShoot && this.getShootInput()) {
      this.npcfpsWeapon.shoot();
      this.isShooting = true;
    } else {
      this.isShooting = false;
    }
  }
}
