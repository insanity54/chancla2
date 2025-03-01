import RapierFirstPersonController from '@RE/RogueEngine/rogue-rapier/Components/Controllers/RapierFirstPersonController.re';
import RapierBody, { RapierCollisionInfo } from '@RE/RogueEngine/rogue-rapier/Components/RapierBody.re';
import * as RE from 'rogue-engine';
import { Object3D } from 'three';
import Mission001 from './Mission001.re';

@RE.registerComponent
export default class MissionTrigger extends RE.Component {
  @RE.props.checkbox() inverted: boolean = false;
  @RE.props.num() missionPhase: number = 0;

  @RapierBody.require()
  rapierBody: RapierBody;


  awake() {

  }

  start() {
    if (this.inverted) {
      this.rapierBody.onCollisionEnd = (info: RapierCollisionInfo) => {
        if (!this.isRequiredMissionPhase()) {
          RE.Debug.log(`${this.object3d.name} requires phase ${this.missionPhase}, but we are on ${this.getMissionPhase()}`);
          return;
        }
        if (this.getPlayer(info)) {
          RE.Debug.log(`MissionTrigger ${this.object3d.name} collision end. ended collision with ${info.otherBody.object3d.name}`)
          this.rapierBody.object3d.parent?.remove(this.rapierBody.object3d)
        }
      }
    } else {
      this.rapierBody.onCollisionStart = (info: RapierCollisionInfo) => {
        if (!this.isRequiredMissionPhase()) {
          RE.Debug.log(`${this.object3d.name} requires phase ${this.missionPhase}, but we are on ${this.getMissionPhase()}`);
          return;
        }
        if (this.getPlayer(info)) {
          RE.Debug.log(`MissionTrigger ${this.object3d.name} collision start. collision with ${info.otherBody.object3d.name}`)
          this.rapierBody.object3d.parent?.remove(this.rapierBody.object3d)
        }
      }
    }
  }

  update() {
  }

  isRequiredMissionPhase() {
    return (this.getMissionPhase() === this.missionPhase)
  }

  getMissionPhase() {
    const missionComponent = RE.getComponent(Mission001, RE.Runtime.scene)
    return missionComponent.phase
  }

  getPlayer(info: RapierCollisionInfo) {
    return RapierFirstPersonController.get(info.otherBody.object3d)
  }
}
