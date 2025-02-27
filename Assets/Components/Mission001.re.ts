import * as RE from 'rogue-engine';
import { Audio } from 'three';
import MissionTrigger from './MissionTrigger.re';
import * as THREE from 'three';

@RE.registerComponent
export default class Mission001 extends RE.Component {

  // @RE.props.list.audio() audio: Audio[];


  @RE.props.audio() audioWompratStart: Audio;
  @RE.props.audio() audioWompratMid: Audio;
  @RE.props.audio() audioWompratEnd: Audio;
  @RE.props.audio() audioInvasionStart: Audio;
  @RE.props.audio() audioInvasionEnd: Audio;
  @RE.props.audio() audioThanksForPlaying: Audio;

  @RE.props.select() phase = 0;
  phaseOptions = [
    "Bearings",
    "WompratStart",
    "WompratMid",
    "WompratEnd",
    "InvasionStart",
    "InvasionEnd",
    "Swarm",
    "Thanks"
  ]

  private missionTriggersGroup: THREE.Object3D;
  private enemiesGroup: THREE.Object3D;

  awake() {

  }

  start() {
    this.missionTriggersGroup = RE.Runtime.scene.getObjectByName("MissionTriggers") as THREE.Object3D;
    this.enemiesGroup = RE.Runtime.scene.getObjectByName("Enemies") as THREE.Object3D;
  }

  update() {
    if (this.phase === 0) this.waitForIntroStart();
    else if (this.phase === 1) this.waitForWompratKilled();
    else if (this.phase === 2) this.waitForWompratsKilled();
    else if (this.phase === 3) this.doPhaseWompratEnd();
    else if (this.phase === 4) this.doPhaseInvasion();
    else if (this.phase === 5) this.doPhaseSwarm();
    else if (this.phase === 6) this.doPhaseThanks();
  }

  // trigger objects exist in the scene until they are tripped
  triggerExists(name: string) {
    return this.missionTriggersGroup.children.find((tObj) => tObj.name === name)
  }

  enemyExists(name: string) {
    return this.enemiesGroup.children.find((eObj) => eObj.name === name)
  }

  waitForIntroStart() {
    // player can explore the base without starting the mission
    // as soon as player leaves the base, we enter next phase
    if (this.triggerExists('IntroStart')) return;
    this.audioWompratStart.play() // Player is prompted to visit farm 6.
    this.phase++
  }

  waitForWompratKilled() {
    // either womprat must be dead
    if (this.enemyExists('SpacePig1') && this.enemyExists('SpacePig2')) return;
    this.audioWompratMid.play() // "Another one bites the dust"
    this.phase++
  }

  waitForWompratsKilled() {
    // both womprats must be dead
    if (this.enemyExists('SpacePig1') || this.enemyExists('SpacePig2')) return;
    this.audioWompratEnd.play() // "I'm all cleaned up"
    this.phase++
    // The phase where player kills womprats
    // as soon as player kills one womprat, we enter next phase
    // if (this.triggerExists('Womprat'))
    // @todo implement a trigger which fires when enemy dies
  }

  doPhaseWompratMid() {
    // as soon as the last womprat is killed, we enter next phase

    // @todo implement a trigger which fires when womprats are dead.
    // @todo implement a trigger which fires when womprats are dead.
    // @todo implement a trigger which fires when womprats are dead.
  }

  doPhaseWompratEnd() {
    // Player encounters BIS invaders.
    // as soon as 
  }

  doPhaseInvasion() {

  }

  doPhaseSwarm() {

  }

  doPhaseThanks() {

  }

}
