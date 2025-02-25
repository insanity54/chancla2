import { playSound } from 'Assets/Helpers/util';
import * as RE from 'rogue-engine';
import * as THREE from 'three';

RE.Input.bindButton("Order Tower", { Keyboard: "KeyT" });

@RE.registerComponent
export default class Shopper extends RE.Component {

  @RE.props.audio(false) affirmativeSFX: THREE.Audio;

  awake() {

  }

  start() {

  }

  update() {
    if (RE.Input.getDown("Order Tower")) {
      this.affirmativeSFX.isPlaying && this.affirmativeSFX.stop();
      this.affirmativeSFX.setVolume(0.5)
      this.affirmativeSFX.play()

    }
  }
}
