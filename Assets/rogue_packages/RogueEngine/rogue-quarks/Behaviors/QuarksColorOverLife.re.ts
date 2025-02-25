import * as RE from 'rogue-engine';
import * as THREE from 'three';
import * as Q from 'three.quarks';
import RogueQuarks from '../RogueQuarks.re';
import QuarksAddon from '../QuarksAddon.re';

@RE.registerComponent
export default class QuarksColorOverLife extends QuarksAddon {
  @RE.props.color() c1 = new THREE.Color();
  @RE.props.color() c2 = new THREE.Color();
  @RE.props.color() c3 = new THREE.Color();
  @RE.props.color() c4 = new THREE.Color();

  @RE.props.num() a1 = 1;
  @RE.props.num() a2 = 1;
  @RE.props.num() a3 = 1;
  @RE.props.num() a4 = 1;

  lifetimeColorGradient: Q.Gradient;

  init() {
    this.lifetimeColorGradient = new Q.Gradient(
      [
        [new Q.Vector3().fromArray(this.c1.toArray()), 0.00],
        [new Q.Vector3().fromArray(this.c2.toArray()), 0.25],
        [new Q.Vector3().fromArray(this.c3.toArray()), 0.50],
        [new Q.Vector3().fromArray(this.c4.toArray()), 0.75]
      ], [
        [this.a1,0], [this.a2, 0.25], [this.a3, 0.5], [this.a4, 0.75]
      ]
    );

    this.quarks.particleSystem.addBehavior(
      new Q.ColorOverLife(this.lifetimeColorGradient)
    );
  }
}
