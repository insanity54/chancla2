import * as RE from 'rogue-engine';
import { Audio } from 'three';


@RE.registerComponent
export default class Mission001 extends RE.Component {

  // @RE.props.list.audio() audio: Audio[];


  @RE.props.audio() audioIntro: Audio;
  @RE.props.audio() audioWompratStart: Audio;
  @RE.props.audio() audioWompratMid: Audio;
  @RE.props.audio() audioWompratEnd: Audio;
  @RE.props.audio() audioInvasionStart: Audio;
  @RE.props.audio() audioInvasionEnd: Audio;
  @RE.props.audio() audioThanksForPlaying: Audio;

  @RE.props.select() phase = 0;
  phaseOptions = [
    "Idle",
    "Intro",
    "Womprat",
    "Invasion",
    "Swarm",
    "Thanks"
  ]


  awake() {

  }

  start() {

  }

  update() {
    if (this.phase === 0) this.doPhaseIdle();
    else if (this.phase === 1) this.doPhaseIntro();
    else if (this.phase === 2) this.doPhaseWomprat();
    else if (this.phase === 3) this.doPhaseInvasion();
    else if (this.phase === 4) this.doPhaseSwarm();
    else if (this.phase === 5) this.doPhaseThanks();
  }

  doPhaseIdle() {
    // player can explore the base without starting the mission
    // as soon as player leaves the base, we enter next phase

  }

  doPhaseIntro() {

  }

  doPhaseWomprat() {

  }

  doPhaseInvasion() {

  }

  doPhaseSwarm() {

  }

  doPhaseThanks() {

  }

}
