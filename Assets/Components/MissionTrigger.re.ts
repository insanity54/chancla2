import RapierBody, { RapierCollisionInfo } from '@RE/RogueEngine/rogue-rapier/Components/RapierBody.re';
import * as RE from 'rogue-engine';

@RE.registerComponent
export default class MissionTrigger extends RE.Component {
  @RE.props.text() label: string = "";
  @RE.props.checkbox() inverted: boolean = false;

  @RapierBody.require()
  rapierBody: RapierBody;


  awake() {

  }

  start() {
    if (this.inverted) {
      this.rapierBody.onCollisionEnd = (info: RapierCollisionInfo) => {
        RE.Debug.log(`MissionTrigger ${this.label} collision end. ended collision with ${info.otherBody.object3d.name}`)
      }
    } else {

      this.rapierBody.onCollisionStart = (info: RapierCollisionInfo) => {
        RE.Debug.log(`MissionTrigger ${this.label} collision start. collision with ${info.otherBody.object3d.name}`)

        // RE.Debug.log(`Collision where I am at y=${this.object3d.position.y}`)
        // RE.Debug.log(`name=${info.otherBody.name} layers=${JSON.stringify(info.otherBody.object3d.layers)}`)
        // RE.Debug.clear()
        // RE.Debug.log(`collision with ${info.otherBody.object3d.name}`)

      }
    }
  }

  update() {

  }
}
