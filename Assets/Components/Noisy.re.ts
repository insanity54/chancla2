import * as RE from 'rogue-engine';
import { PositionalAudio } from 'three';

@RE.registerComponent
export default class Noisy extends RE.Component {

  @RE.props.audio(true) spawnSFX: PositionalAudio;
  @RE.props.num() volume: number = 1;
  @RE.props.num() rolloffFactor: number = 0.07;

  start() {
    this.spawnSFX.isPlaying && this.spawnSFX.stop();
    this.spawnSFX.setRolloffFactor(this.rolloffFactor);
    this.spawnSFX.setVolume(this.volume)
    this.spawnSFX.play()
  }
}
