import * as RE from 'rogue-engine';
import Explosive from './Explosive.re';

@RE.registerComponent
export default class Bounded extends RE.Component {

  @RE.props.num() outThresholdY: number = -5;
  @RE.props.checkbox() fallOut: boolean = false;


  awake() {

  }

  start() {

  }

  update() {
    if (this.object3d.position.y < this.outThresholdY) {
      let explosive = Explosive.get(this.object3d)
      if (explosive) {
        explosive.explode = true
      } else {
        if (this.object3d.parent) {
          this.object3d.parent.remove(this.object3d)
        } else {
          RE.Debug.logError(`failed to remove ${this.object3d.name}`)
        }
      }
    }


  }

}
