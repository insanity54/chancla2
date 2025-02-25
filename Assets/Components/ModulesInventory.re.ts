/**
 * Modules are the Kyberpod's inventory to to speak.
 * Players can select an active modules and activate it.
 * If the module is a weapon, activating = shooting
 */
import * as RE from 'rogue-engine';
import * as THREE from 'three';
import Weapon from './Weapon.re';
import Accelerator from './Accelerator.re';
import Warehouse from './Warehouse.re';
import Module from './Module.re';
import MountPointCollector from './MountPointCollector.re';
import Item from './Item.re';
import { getObjectComponent, getObjectComponents, playSound, randomRange } from 'Assets/Helpers/util';
// import MountPoint from './MountPoint.re';
import Mount from './Mount.re';


type ModuleInventoryItem = {
  obj: THREE.Object3D;
}


@RE.registerComponent
export default class ModulesInventory extends RE.Component {

  @RE.props.object3d() armory: THREE.Object3D;
  @RE.props.object3d() defaultModule: THREE.Object3D; // the module that activates when none is selected
  @RE.props.object3d() module0: THREE.Object3D;
  @RE.props.object3d() module1: THREE.Object3D;
  @RE.props.object3d() module2: THREE.Object3D;
  @RE.props.object3d() module3: THREE.Object3D;
  @RE.props.object3d() module4: THREE.Object3D;
  @RE.props.object3d() module5: THREE.Object3D;
  @RE.props.object3d() module6: THREE.Object3D;
  @RE.props.object3d() module7: THREE.Object3D;
  @RE.props.object3d() module8: THREE.Object3D;
  @RE.props.object3d() module9: THREE.Object3D;
  @RE.props.audio(true) emptySFX: THREE.PositionalAudio;
  @RE.props.audio(true) selectSFX: THREE.PositionalAudio;
  @RE.props.audio(true) deselectSFX: THREE.PositionalAudio;
  @RE.props.audio(true) errorSFX: THREE.PositionalAudio;
  @RE.props.audio(true) ejectSFX: THREE.PositionalAudio;
  @RE.props.num() selectedModule: number = -1;
  @RE.props.component(Weapon) weapon: Weapon;
  @RE.props.checkbox() defaultCrosshair = true;


  crosshairDiv = document.createElement("div");
  isShooting = false;

  onHit = (intersection: THREE.Intersection) => {
    const { x, y, z } = intersection.point
    // RE.Debug.log(`ModulesInventory sees an OnHit at ${x}, ${y}, ${z}`)
    // @todo apply damage to enemy characters


    // const enemyCharacter = RogueCharacter.get(intersection.object, true);

    // if (enemyCharacter?.type === "Friendly") return;

    // const damagePoint = DamagePoint.get(intersection.object);

    // if (damagePoint) {
    //   return damagePoint.applyDamage(this.fpsWeapon.damage/this.fpsWeapon.shots);
    // }

    // enemyCharacter?.applyDamage(this.fpsWeapon.damage/this.fpsWeapon.shots);

  }

  start() {
    // RE.Debug.log(`start() has been called.`)
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
    if (this.weapon) {
      this.armedControls();
    } else {
      this.alternateControls();
    }

  }

  getShootInput() {
    return this.weapon.firingMode === 0 ? RE.Input.getDown("Fire") : RE.Input.getPressed("Fire");
  }


  armedControls() {
    if (this.weapon.canShoot && this.getShootInput()) {
      let vec = new THREE.Vector3

      RE.Runtime.camera.getWorldDirection(vec)
      // RE.Debug.log(`armedControls is this.weapon.shoot() now`)
      this.weapon.shoot();

      this.isShooting = true;
    } else {
      this.isShooting = false;
    }
  }

  alternateControls() {

    if (RE.Input.getDown('Fire')) {
      const module = this.getSelectedModule(this.selectedModule)
      if (!module) {
        RE.Debug.logWarning(`there was not a module selected.`);
        return
      }
      const mount = module.children.find((mod) => mod.name === 'Mount')
      if (!mount) {
        RE.Debug.logError('failed to get mount')
        return
      }
      const accelerator = RE.getComponent(Accelerator, this.object3d)
      if (!accelerator) {
        RE.Debug.logWarning(`no accellerator found`)
      } else {
        // RE.Debug.log('activating accelerator!')
        accelerator.activate(this.object3d);
      }
    }

  }

  private playSelectSFX() {
    this.selectSFX.setRolloffFactor(0.07);
    this.selectSFX.play();
  }

  private playDeselectSFX() {
    this.deselectSFX.isPlaying && this.deselectSFX.stop();
    this.deselectSFX.setRolloffFactor(0.07);
    this.deselectSFX.setVolume(0.3)
    this.deselectSFX.play();
  }

  private playErrorSFX() {
    this.errorSFX.isPlaying && this.errorSFX.stop()
    this.errorSFX.setRolloffFactor(0.07)
    this.errorSFX.play()
  }

  getSelectedModule(selection?: number) {
    if (selection === -1) return this.defaultModule;
    selection = selection || this.selectedModule
    return this.getModuleNumber(selection)
  }

  getModuleNumber(num: number): THREE.Object3D {
    return this[`module${num}`]
  }

  getModuleList() {
    return [
      this.module0,
      this.module1,
      this.module2,
      this.module3,
      this.module4,
      this.module5,
      this.module6,
      this.module7,
      this.module8,
      this.module9,
    ]
  }


  loadModuleIntoSlot(moduleObject: RE.Prefab | THREE.Object3D, slot: number): Boolean {

    let success = false
    let targetSlot = this.getModuleNumber(slot)
    if (!targetSlot) {

      if (moduleObject instanceof RE.Prefab) {
        RE.Debug.logError(`module is a Prefab, but we were expecting an Object3d.`)
        return success = false;
      }

      // ensure that our moduleObject has a Mount Object as a child
      // RE.Debug.log(`moduleObject children as follows. ${JSON.stringify(moduleObject.children.map((m) => m.name))}`)

      const mountObject = moduleObject.children.find((c) => c.name === 'Mount')
      if (!mountObject) {
        RE.Debug.logError(`The moduleObject did not have a Mount object as child, which is a strict requirement.`)
      } else {

        // add the ground item to module inventory prop slot
        this[`module${slot}`] = moduleObject

        // get the Mount component so we know which mount point to attach to
        const mountComponent = RE.getComponent(Mount, moduleObject)
        if (!mountComponent) {
          RE.Debug.logWarning(`we failed to get the mountComponent `)
        } else {
          RE.Debug.log(`We got the mountComponent and we will be mounting to ${mountComponent.targetMountPoint}.`)

          const mountPointObjects = MountPointCollector.getMountPointObjects(this.object3d)
          const targetMountPointObject = mountPointObjects.find((mp) => mp.name === mountComponent.targetMountPoint)
          if (!targetMountPointObject) {
            RE.Debug.logError('failed to get targetMountPointObject')
          } else {
            // reparent the Mount to the MountPoint's parent
            targetMountPointObject.add(moduleObject)
            success = true
          }
        }
      }

    } else {
      RE.Debug.logError(`target slot slot=${slot} is already loaded`)
    }
    return success
  }

  /**
   * 
   * dropModule
   * 
   * drop a module
   * if no module is specified, we drop the selected module.
   */
  dropModule(moduleNumber?: number) {
    moduleNumber = moduleNumber || this.selectedModule
    // RE.Debug.log(`dropping module ${moduleNumber}`)

    // * get a handle on the module we are dropping
    const moduleObj: THREE.Object3D = this[`module${moduleNumber}`]
    const moduleComp = RE.getComponent(Module, moduleObj)

    if (moduleNumber === -1 || !moduleObj) {
      this.playErrorSFX()
      return;
    }

    if (!moduleComp) {
      RE.Debug.logError(`while attempting to drop module ${moduleNumber}, Module Component of ${moduleObj.name} was not found! (this should never happen)`)
      return;
    }



    // * Re-mount the module at the Kyberpod's MountModuleEjectPort
    const targetMountName = 'MountNose' // @todo create and use literal 'MountModuleEjectPort'
    const targetMountPointObject = MountPointCollector.findMountPointObject(targetMountName)
    if (!targetMountPointObject) {
      RE.Debug.logError(`failed to find ${targetMountName}`);
      return;
    }


    Module.unequip(moduleComp, targetMountPointObject)


    // * set some accelleration on the module item to eject it from the kyberpod

    // * play module ejection SFX
    if (this.ejectSFX) {
      playSound(this.ejectSFX, true, true)
    }


    // * remove module from Props()
    this[`module${moduleNumber}`] = undefined
  }

  // playSound(this.errorSFX, true, false, 0.07, 0.5)


  selectModule(nextSelection: number) {
    const prevSelection = this.selectedModule

    // Check if the selected module is loaded
    const moduleObject = this.getSelectedModule(nextSelection)


    // Toggle module selection if it's the same as the previous one
    if (prevSelection === nextSelection) {
      // RE.Debug.log(`prevSelection is the same as nextSelection`)
      this.selectedModule = -1;
      this.weapon
      this.playDeselectSFX();
      // this.weapon = RE.getComponent(Weapon, this.defaultModule, false)
    } else {
      // RE.Debug.log(`WE GOT OURSELVES A WEAPON MY DUDE`)
      this.selectedModule = nextSelection;
      this.playSelectSFX()
      // this.weapon = RE.getComponent(Weapon, moduleObject, false)
    }
    if (this.weapon) {
      this.weapon.onHit = this.onHit
    }
  }

  getVacantModuleSlot(): number {
    const list = this.getModuleList()
    let vacantIndex: number = -1
    for (const [index, module] of list.entries()) {
      if (!module) {
        vacantIndex = index;
        break
      }
    }
    if (vacantIndex < 0) {
      RE.Debug.logWarning(`modules list has no vacancy`)
    }
    return vacantIndex
  }



}
