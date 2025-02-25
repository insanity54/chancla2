import * as RE from 'rogue-engine';
import * as THREE from 'three';
import * as Q from 'three.quarks';
import RogueQuarks from '../RogueQuarks.re';
import QuarksAddon from '../QuarksAddon.re';

@RE.registerComponent
export default class QuarksSizeOverLife extends QuarksAddon {
  private _pStart = 0.1;
  @RE.props.num(0)
  get pStart() {
    return this._pStart;
  }

  set pStart(v: number) {
    this._pStart = v;
    if (!this.bezier) return;
    this.bezier.functions[0][1] = v;
  }

  private _p1 = 1;
  @RE.props.num(0)
  get p1() {
    return this._p1;
  }

  set p1(v: number) {
    this._p1 = v;
    if (!this.bezier) return;
    this.bezier.functions[0][0].p[0] = v;
  }

  private _p2 = 0.75;
  @RE.props.num(0)
  get p2() {
    return this._p2;
  }

  set p2(v: number) {
    this._p2 = v;
    if (!this.bezier) return;
    this.bezier.functions[0][0].p[1] = v;
  }

  private _p3 = 0.5;
  @RE.props.num(0)
  get p3() {
    return this._p3;
  }

  set p3(v: number) {
    this._p3 = v;
    if (!this.bezier) return;
    this.bezier.functions[0][0].p[2] = v;
  }

  private _p4 = 0.25;
  @RE.props.num(0)
  get p4() {
    return this._p4;
  }

  set p4(v: number) {
    this._p4 = v;
    if (!this.bezier) return;
    this.bezier.functions[0][0].p[3] = v;
  }

  bezier: Q.PiecewiseBezier;

  init() {
    this.bezier = new Q.PiecewiseBezier([[
      new Q.Bezier(this.p1, this.p2, this.p3, this.p4), this.pStart
    ]])

    this.quarks.particleSystem.addBehavior(
      new Q.SizeOverLife(
        this.bezier
      )
    );
  }
}
