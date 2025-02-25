import RogueCharacter from '@RE/RogueEngine/rogue-character/RogueCharacter.re';
import * as RE from 'rogue-engine';

@RE.registerComponent
export default class Explosive extends RE.Component {

  @RE.props.prefab() explosion: RE.Prefab;
  @RE.props.checkbox() explode: boolean = false;
  character: RogueCharacter

  awake() {
    this.character = RE.getComponent(RogueCharacter, this.object3d)
  }

  update() {
    if (this.explode) {
      const obj = this.explosion.instantiate();
      obj.position.copy(this.object3d.position);
      if (!this.object3d.parent) {
        RE.Debug.logError("Explosive this.object3d.parent is missing parent")
      } else {
        this.object3d.parent.remove(this.object3d);
      }

      setTimeout(() => obj.parent?.remove(obj), 500)
    }
  }
}
