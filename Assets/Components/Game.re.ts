import RogueCharacter from '@RE/RogueEngine/rogue-character/RogueCharacter.re';
import { randomInt } from 'Assets/Helpers/util';
import * as RE from 'rogue-engine';
import { Audio } from 'three';
import * as THREE from 'three';

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
  @RE.props.num() deaths: number = 0;
  @RE.props.num() easterEggs: number = 0;

  @RE.props.num() killsToWin: number = 15;

  @RE.props.checkbox() win: boolean = false;
  @RE.props.checkbox() lose: boolean = false;

  @RE.props.audio() winSFX: Audio;
  @RE.props.audio() loseSFX: Audio;
  @RE.props.num() volume: number = 1;

  @RE.props.text() playerSpawn: string = "PlayerSpawn";
  @RE.props.prefab() playerPrefab: RE.Prefab;

  get spawnpointsContainer() {
    let spawnpointsContainer = RE.Runtime.scene.getObjectByName("PlayerSpawnPoints") as THREE.Object3D;
    if (!spawnpointsContainer) {
      throw new Error("PlayerSpawnPoints container is missing!")
    }
    return spawnpointsContainer
  }

  awake() {

  }

  start() {

  }

  winCondition() {
    return this.kills >= this.killsToWin
  }

  loseCondition() {
    return this.deaths > 0
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
    let player = RE.Runtime.scene.getObjectByName("FirstPersonCharacter") as THREE.Object3D;
    if (!player) {
      let playerGroup = RE.Runtime.scene.getObjectByName("Players")
      if (!playerGroup) RE.Debug.logError("Cannot find Players group");
      let playerObject = this.playerPrefab.instantiate(playerGroup)
      const spawnPointCount = this.spawnpointsContainer.children.length
      let selectedSpawnPoint = this.spawnpointsContainer.children[randomInt(0, spawnPointCount)]
      // RE.Debug.log(`spawnPointCount=${spawnPointCount} selectedSpawnPoint=${selectedSpawnPoint.name}`)
      selectedSpawnPoint.getWorldPosition(playerObject.position)
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
