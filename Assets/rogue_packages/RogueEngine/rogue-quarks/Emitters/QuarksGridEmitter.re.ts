import * as RE from 'rogue-engine';
import * as Q from 'three.quarks';
import QuarksAddon from '../QuarksAddon.re';

@RE.registerComponent
export default class QuarksGridEmitter extends QuarksAddon {
  private _width = 6;
  @RE.props.num(0)
  get width() {
    return this._width;
  }

  set width(v: number) {
    this._width = v;
    if (!this.emitter) return;
    this.emitter.width = v;
  }

  private _height = 6;
  @RE.props.num(0)
  get height() {
    return this._height;
  }

  set height(v: number) {
    this._height = v;
    if (!this.emitter) return;
    this.emitter.height = v;
  }

  private _column = 6;
  @RE.props.num(0)
  get column() {
    return this._column;
  }

  set column(v: number) {
    this._column = v;
    if (!this.emitter) return;
    this.emitter.column = v;
  }

  private _row = 6;
  @RE.props.num(0)
  get row() {
    return this._row;
  }

  set row(v: number) {
    this._row = v;
    if (!this.emitter) return;
    this.emitter.row = v;
  }

  emitter: Q.GridEmitter;

  init() {
    this.emitter = new Q.GridEmitter({
      width: this.width,
      height: this.height,
      column: this.column,
      row: this.row,
    });

    this.quarks.particleSystem.emitterShape = this.emitter;
  }
}
