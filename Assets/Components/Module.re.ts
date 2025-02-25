import * as RE from 'rogue-engine';
import Mount from './Mount.re';
import Item from './Item.re';
import { Object3D, Vector3 } from 'three';
import Warehouse from './Warehouse.re';
import MountPointCollector from './MountPointCollector.re';
import ModulesInventory from './ModulesInventory.re';

enum Mode {
  'Item',
  'Mount'
}

/**
 * Module
 * 
 * An equippable thing that a player can use
 * 
 */
@RE.registerComponent
export default class Module extends RE.Component {

  @RE.props.num() ammoCount: number = -1; // -1 is special, it means use the default
  mode = Mode.Item

  

  get mountComp(): Mount | null {
    const mountObject = this.object3d.children.find((c) => c.name === 'Mount')
    if (!mountObject) {
      RE.Debug.logError(`failed to access ${this.object3d.name} module's Mount`)
      return null
    }
    const mountComponent = RE.getComponent(Mount, mountObject)
    return mountComponent
  }

  get itemComp(): Item |  null {
    const itemObject = this.object3d.children.find((c) => c.name === 'Item')
    if (!itemObject) {
      RE.Debug.logError(`failed to access ${this.object3d.name} module's Item`)
      return null
    }
    const itemComponent = RE.getComponent(Item, itemObject)
    return itemComponent
  }

  /**
   * deleteItem()
   * 
   * Deletes the Module's Item 
   * Useful when we are working with a Module that is attached to a Kyberpod and we don't need it's physics based Item
   */
  deleteItem() {
    this.itemComp && this.object3d.remove(this.itemComp.object3d)
  }

  /**
   * deleteMount()
   * 
   * Deletes the Module's Mount
   * Useful when we are working with a Module that is on the ground and we don't need it's Mount object
   */
  deleteMount() {
    this.mountComp && this.object3d.remove(this.mountComp.object3d)
  }

  setMode(nextMode: Mode) {
    if (this.mode === Mode.Item && nextMode === Mode.Mount) {
      // disable physics
      if (!this.itemComp) throw new Error(`while attempting to setMode(${nextMode}), this.itemComp was null.`);
      this.itemComp.setPhysics(false)
      // hide item
      // reveal mount
    } else if (this.mode === Mode.Mount && nextMode === Mode.Item) {
      // enable physics
      // hide mount
      // reveal item
    }
    this.mode = nextMode;
  }

  static getMountPointObject(module: Module): Object3D {
    if (!module.mountComp) {
      const msg = `during getMountPointObject(), the module passed to us was missing mountComp.`
      RE.Debug.logError(msg)
      throw new Error(msg)
    }
    const targetMountPointName = module.mountComp.targetMountPoint
    const targetMountPointObject = MountPointCollector.findMountPointObject(targetMountPointName)
    if (!targetMountPointObject) {
      const msg = `failed to findMountPointObject named ${targetMountPointName}`
      RE.Debug.logError(msg);
      throw new Error(msg)
    }
    return targetMountPointObject
  }

  static attachToMount(module: Module, mountPointTargetObj: Object3D) {
    mountPointTargetObj.attach(module.object3d)
    module.object3d.position.set(0, 0, 0)
  }

  /**
   * equip
   * 
   * given an Item, equip the Module onto our Kyberpod
   */
  static equip(module: Module) {




    // instantiate replacement module 
    const replacementModule = Module.instantiateFromArmory(module)

    // delete original Module
    module.object3d.parent?.remove(module.object3d)

    // delete Module's Item
    replacementModule.deleteItem()    
    
    // attach Mount to MountPoint
    const mountPointTargetObj = this.getMountPointObject(replacementModule)
    Module.attachToMount(replacementModule, mountPointTargetObj)

    
    // put the module in the ModuleInventory Props list
    const modulesInventory = RE.getComponent(ModulesInventory, replacementModule.object3d, true)
    modulesInventory.loadModuleIntoSlot(replacementModule.object3d, modulesInventory.getVacantModuleSlot())



    // // delete the item object
    // const module2ItemComp = module.itemComp?.object3d
    // if (!module2ItemComp) {
    //   RE.Debug.logError(`Failed to get module2 Item Component`)
    //   return;
    // }
    // module.object3d.remove(module2ItemComp)

    // // make the mount object visible
    // module.mountComp?.reveal()


    // const module1Obj = intersectingObject

    // // get the ammoCount of the Module we just picked up
    // const ammoCount = module1Comp.ammoCount

    
    // // instantiate a new Module of the same kind
    // const module2Obj = Module.instantiateFromArmory(module1Comp)
    // if (!module2Obj) {
    //   RE.Debug.logError('failed to instantiate module2Obj')
    //   return;
    // }

    
    // // get a handle on the Mount Component
    // const mount = module1Comp.mountComp
    // if (!mount) {
    //   RE.Debug.logError(`failed to get module.mount of intersectingObject.name=${intersectingObject.name}`)
    //   return;
    // }
    
    
    
    // // instantiate a new module using the mountPoint as parent
    
    
    // const targetMountPointObject = Module.getMountPointObject(module2Comp)
    // if (!targetMountPointObject) throw new Error('failed to get targetMountPointObject');
    
    // // RE.Debug.log('delete the Module we just picked up')
    // module1Comp.object3d.parent?.remove(module1Comp.object3d)
    
    // // reparent the module object as a child of the MointPoint
    // Module.equip(module2Comp, targetMountPointObject)
    



  }

  /**
   * unequip
   * 
   * Given a Module, unequip and eject an Item
   */
  static unequip(module: Module, mountPoint: Object3D) {

    // mountPoint.add(module.object3d)

    // re-instantiate the module so we can get an instance that has an Item
    const newModuleObj = this.instantiateFromArmory(module, mountPoint)
    if (!newModuleObj) throw new Error(`While unequipping, we failed to instantiate a new instance of ${module.name}`);
    
    // @todo apply ammoCount to Module props so we can preserve the old ammo count onto the new Module instance

    // delete the original Module
    module.object3d.parent?.remove(module.object3d)
    
    const newModuleComp = RE.getComponent(Module, newModuleObj.object3d, true)

    // reparent module to the Scene's Items object
    const itemsContainer = RE.Runtime.scene.getObjectByName('Items')
    itemsContainer?.add(newModuleObj.object3d)
    
    if (!newModuleComp.itemComp) {
      RE.Debug.logError(`moduleComp.item is falsy`)
      return;
    }
    if (!newModuleComp.mountComp) {
      RE.Debug.logError(`moduleComp.mount is falsy`)
      return;
    }
    // delete the Mount object since we don't need it
    newModuleComp.object3d.remove(newModuleComp.mountComp.object3d)

    RE.Debug.log(`translate to the ejection port MountPoint position ${JSON.stringify(mountPoint.position)}`)
    // mountPoint.getWorldPosition(newModuleComp.itemComp.object3d.position)
    const vec = new Vector3(0, 0, 0)
    mountPoint.getWorldPosition(vec)
    newModuleComp.object3d.position.copy(vec)
    newModuleComp.object3d.translateZ(1)
    
    RE.Debug.log(`@todo Eject the object`)
    // newModuleComp.itemComp.rapierBody.body.addForce(new Vector3(1, 3, 0), false)
    // RE.Debug.log(`itemComp.rapierBody=${JSON.stringify(newModuleComp.itemComp.rapierBody)}`)
  }
  
  /**
   * instantiate()
   * 
   * instantiate a new Module of the same kind
   */
  static instantiateFromArmory(module: Module, parent?: Object3D): Module {
    if (!parent) {
      const itemsContainer = RE.Runtime.scene.getObjectByName('Items')
      if (!itemsContainer) {
        const msg = 'Items container was missing from scene!'
        RE.Debug.logError(msg)
        throw new Error(msg)
      }
      parent = itemsContainer
    }
    const armory = RE.getComponent(Warehouse, RE.Runtime.scene.getObjectByName('Armory'))
    const modulePrefab = armory.findModulePrefab(module.name)
    if (!modulePrefab) {
      const msg = `failed to get modulePrefab ${module.name} from Armory.`
      RE.Debug.logError(msg)
      throw new Error(msg)
    }
    return RE.getComponent(Module, modulePrefab.instantiate(parent))
  }


  awake() {

  }

  start() {
    
  }
  
  update() {
    
  }
}