import { RigidBodyType } from '@dimforge/rapier3d-compat';
import RapierCuboid from '@RE/RogueEngine/rogue-rapier/Components/Colliders/RapierCuboid.re';
import RapierBody from '@RE/RogueEngine/rogue-rapier/Components/RapierBody.re';
import { disable, enable, loadComponentsRecursive } from '_Rogue/Engine/Controller/Functions';
import * as RE from 'rogue-engine';

@RE.registerComponent
export default class Item extends RE.Component {


  // @RapierBody.require(true)
  // rapierBody: RapierBody;

  // @RapierCuboid.require(true)
  // rapierCuboid: RapierCuboid;

  rapierBody: RapierBody
  rapierCuboid: RapierCuboid

  /**
   * ammoCount for when the item is dropped and we need to store the Weapon's ammo in the Item's metadata
   */
  @RE.props.num() ammoCount: number = 2;

  /**
   * visibly hide and disable physics
   */
  hide() {
    this.object3d.visible = false
    // const rapierBody = RE.getComponent(RapierBody, this.object3d)
    // if (rapierBody) RE.removeComponent(rapierBody);
  }

  reveal() {
    this.object3d.visible = true

  }

  setPhysics(state: boolean) {
    RE.Debug.log(`setting physics to ${state}`)
    // const rapierBody = RE.getComponent(RapierBody, this.object3d)
    // const rapierCuboid = RE.getComponent(RapierCuboid, this.object3d)
    
    const rapierBody = RE.getComponentByName('RapierBody', this.object3d, true)
    const rapierCuboid = RE.getComponentByName('RapierCuboid', this.object3d, true)


    if (!rapierBody) {
      RE.Debug.logError(`rapierBody was not found on Item, which is never supposed to happen.`)
      return;
    }

    if (!rapierCuboid) {
      RE.Debug.logError(`rapierCuboid was not found on Item, which is never supposed to happen.`)
      return;
    }


    
    
    RE.Debug.log(JSON.stringify(rapierBody))
    RE.Debug.log(JSON.stringify(rapierCuboid))

    // none of the following has any effect
    rapierBody.enabled = state;
    rapierCuboid.enabled = state;

    // this.rapierBody.body.setEnabled(state)
    // this.rapierCuboid.body.setEnabled(state)

    // RE.setEnabled(this.rapierCuboid.object3d, state)
    // RE.setEnabled(this.rapierBody.object3d, state)

  }

  awake() {

  }

  start() {


  }

  update() {

  }
}
