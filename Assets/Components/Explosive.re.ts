import RogueCharacter from '@RE/RogueEngine/rogue-character/RogueCharacter.re';
import * as RE from 'rogue-engine';
import * as THREE from 'three';

@RE.registerComponent
export default class Explosive extends RE.Component {

  @RE.props.prefab() explosion: RE.Prefab;
  @RE.props.checkbox() explode: boolean = false;
  character: RogueCharacter

  get explosionsContainer() {
    let explosionsContainer = RE.Runtime.scene.getObjectByName("Explosions") as THREE.Object3D;
    if (!explosionsContainer) {
      explosionsContainer = new THREE.Object3D();
      explosionsContainer.name = "Explosions";
      RE.Runtime.scene.add(explosionsContainer);
    }
    return explosionsContainer
  }

  awake() {
    this.character = RE.getComponent(RogueCharacter, this.object3d)
  }


  update() {
    if (this.explode) {


      const explosionObj = this.explosion.instantiate(this.explosionsContainer);
      explosionObj.position.copy(this.object3d.position);
      if (!this.object3d.parent) {
        RE.Debug.logError("Explosive this.object3d.parent is missing parent")
      } else {
        this.object3d.parent.remove(this.object3d);
      }

      setTimeout(() => explosionObj.parent?.remove(explosionObj), 2000)
    }
  }
}
