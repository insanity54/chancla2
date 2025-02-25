import * as RE from 'rogue-engine';
import * as Q from 'three.quarks';
import QuarksAddon from '../QuarksAddon.re';

@RE.registerComponent
export default class QuarksBurst extends QuarksAddon {
  private _time = 0;
  @RE.props.num(0)
  get time() {
    return this._time;
  }

  set time(v: number) {
    this._time = v;
    if (!this.burst) return;
    this.burst.time = v;
  }

  private _minCount = 100;
  @RE.props.num(0)
  get minCount() {
    return this._minCount;
  }

  set minCount(v: number) {
    this._minCount = v;
    if (!this.burst) return;
    this.burst.count = new Q.IntervalValue(v, this.maxCount);
  }

  private _maxCount = 100;
  @RE.props.num(0)
  get maxCount() {
    return this._maxCount;
  }

  set maxCount(v: number) {
    this._maxCount = v;
    if (!this.burst) return;
    this.burst.count = new Q.IntervalValue(v, this.maxCount);
  }

  private _cycle = 1;
  @RE.props.num(0)
  get cycle() {
    return this._cycle;
  }

  set cycle(v: number) {
    this._cycle = v;
    if (!this.burst) return;
    this.burst.cycle = v;
  }

  private _interval = 0.01;
  @RE.props.num(0)
  get interval() {
    return this._interval;
  }

  set interval(v: number) {
    this._interval = v;
    if (!this.burst) return;
    this.burst.interval = v;
  }

  private _probability = 1;
  @RE.props.num(0)
  get probability() {
    return this._probability;
  }

  set probability(v: number) {
    this._probability = v;
    if (!this.burst) return;
    this.burst.probability = v;
  }

  burst: Q.BurstParameters;

  init() {
    this.burst = {
      time: this.time,
      count: new Q.IntervalValue(this.minCount, this.maxCount),
      cycle: this.cycle,
      interval: this.interval,
      probability: this.probability,
    };

    this.quarks.particleSystem.emissionBursts.push(this.burst);
  }
}
