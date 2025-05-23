import * as RE from 'rogue-engine';
import * as THREE from 'three';
import * as Q from 'three.quarks';
import QuarksAddon from '../QuarksAddon.re';

@RE.registerComponent
export default class QuarksCircleEmitter extends QuarksAddon {
  @RE.props.select() mode = 0;
  modeOptions = ["Burst", "Loop", "PingPong", "Random"];

  private _radius = 4;
  @RE.props.num(0)
  get radius() {
    return this._radius;
  }

  set radius(v: number) {
    this._radius = v;
    if (!this.emitter) return;
    this.emitter.radius = v;
  }

  private _thickness = 1;
  @RE.props.num(0)
  get thickness() {
    return this._thickness;
  }

  set thickness(v: number) {
    this._thickness = v;
    if (!this.emitter) return;
    this.emitter.thickness = v;
  }

  private _arc = 360;
  @RE.props.num(0)
  get arc() {
    return this._arc;
  }

  set arc(v: number) {
    this._arc = v;
    if (!this.emitter) return;
    this.emitter.arc = THREE.MathUtils.degToRad(v);
  }

  private _speed = 1;
  @RE.props.num(0)
  get speed() {
    return this._speed;
  }

  set speed(v: number) {
    this._speed = v;
    if (!this.emitter) return;
    this.emitter.speed = new Q.ConstantValue(v);
  }

  private _spread = 0;
  @RE.props.num(0)
  get spread() {
    return this._spread;
  }

  set spread(v: number) {
    this._spread = v;
    if (!this.emitter) return;
    this.emitter.spread = v;
  }


  emitter: Q.CircleEmitter;

  init() {
    this.emitter = new Q.CircleEmitter({
      mode: Q.EmitterMode[this.modeOptions[this.mode]],
      radius: this.radius,
      thickness: this.thickness,
      arc: THREE.MathUtils.degToRad(this.arc),
      speed: new Q.ConstantValue(this.speed),
      spread: this.spread,
    });

    this.quarks.particleSystem.emitterShape = this.emitter;
  }
}
