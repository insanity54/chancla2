import RogueCharacter from '@RE/RogueEngine/rogue-character/RogueCharacter.re';
import * as RE from 'rogue-engine';
import { Audio } from 'three';

@RE.registerComponent


/**
 * Game, in the strictest sense of the word.
 * 
 * Games have win conditions.
 * Games have lose conditions.
 * 
 * This component tracks the statistics leading up to a win or a loss.
 */
export default class Game extends RE.Component {

  @RE.props.num() kills: number = 0;
  @RE.props.num() easterEggs: number = 0;

  @RE.props.num() killsToWin: number = 15;

  @RE.props.checkbox() win: boolean = false;
  @RE.props.checkbox() lose: boolean = false;
  @RE.props.checkbox() fallOut: boolean = false; // player fell off the map

  @RE.props.audio() winSFX: Audio;
  @RE.props.audio() loseSFX: Audio;
  @RE.props.num() volume: number = 1;

  @RE.props.text() playerSpawn: string = "PlayerSpawn";
  @RE.props.prefab() playerPrefab: RE.Prefab;

  awake() {

  }

  start() {

  }

  winCondition() {
    return this.kills >= this.killsToWin
  }

  loseCondition() {
    return this.fallOut
  }

  doWin() {
    this.win = true
    this.winSFX.play(0.5)
  }

  doLose() {
    this.lose = true
    this.loseSFX.play(0.5)
  }

  assertPlayer() {
    let player = RE.getComponentByName("Player")
    if (!player) {
      let playerGroup = RE.App.currentScene.children.find((obj) => obj.name === 'Players')
      this.playerPrefab.instantiate(playerGroup)

    }
  }

  update() {
    if (!this.win && !this.lose) {
      if (this.winCondition()) {
        this.doWin()
      } else if (this.loseCondition()) {
        this.doLose()
      }
    }
    this.assertPlayer()
  }
}
