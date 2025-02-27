import * as RE from 'rogue-engine';

@RE.registerComponent
export default class Settings extends RE.Component {

  @RE.props.num(0, 1) voiceoverVolume: number = 0.5;
  @RE.props.num(0, 1) sfxVolume: number = 0.5;
  @RE.props.num(0, 1) musicVolume: number = 0.5;

  awake() {

  }

  start() {

  }

  update() {

  }
}
