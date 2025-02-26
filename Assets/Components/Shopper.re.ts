import * as RE from 'rogue-engine';
import * as THREE from 'three';
import DropshipController from './DropshipController.re';

RE.Input.bindButton("Order Tower", { Keyboard: "KeyT" });

@RE.registerComponent
export default class Shopper extends RE.Component {

  @RE.props.audio(false) affirmativeSFX: THREE.Audio;

  awake() {

  }

  start() {

  }

  order() {
    // RE.Debug.log("@todo order()")
    const dropshipObject = RE.Runtime.scene.getObjectByName("SolFront Dropship") as THREE.Object3D;

    // RE.Debug.log(`dropshipObject=${JSON.stringify(dropshipObject)}`)
    // const dropship = DropshipController.get(dropshipObject)
    const dropship = RE.getComponent(DropshipController, dropshipObject)
    if (!dropship) RE.Debug.logError(`failed to get dropship`);
    else dropship.queueRequest(dropship.getRandomEquipmentOrder())
  }


  update() {
    if (RE.Input.getDown("Order Tower")) {
      this.affirmativeSFX.isPlaying && this.affirmativeSFX.stop();
      this.affirmativeSFX.setVolume(0.5)
      this.affirmativeSFX.play()
      this.order()
    }
  }
}
