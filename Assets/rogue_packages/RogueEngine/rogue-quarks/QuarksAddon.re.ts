import * as RE from 'rogue-engine';
import RogueQuarks from './RogueQuarks.re';

@RE.registerComponent
export default class QuarksAddon extends RE.Component {
  @RogueQuarks.require()
  quarks: RogueQuarks;

  init() {}
}
