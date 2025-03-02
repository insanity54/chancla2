// import RogueCharacter from '@RE/RogueEngine/rogue-character/RogueCharacter.re';
import { randomInt } from 'Assets/Helpers/util';
import * as RE from 'rogue-engine';
import { Audio } from 'three';
import * as THREE from 'three';
import UIComponent from './UIComponent.re';
import MissionTrigger from './MissionTrigger.re';
import Mission001 from './Mission001.re';
import HUD from './HUD.re';

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

  @RE.props.component(UIComponent) gameOverUI: UIComponent;

  retryButton: HTMLButtonElement;

  @HUD.require()
  hud: HUD;

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
    setTimeout(() => {
      RE.App.loadScene('thanks')
    }, 6000)
  }

  doLose() {
    this.lose = true
    this.loseSFX.play(0.5)

    this.gameOverUI.show();
    setTimeout(() => {
      RE.App.loadScene("thanks")
    }, 6000)
  }

  // setupUI() {
  //   // IDK why this works with 2 onNextFrame() but not 1
  //   // This double onNextFrame idea comes from RobotDeathmatch https://github.com/BeardScript/RobotDeathmatch/blob/0bef27913d7ac6e06f28c4eea44cea8a2f00af39/Assets/Components/GameLogic.re.ts#L67
  //   // this.retryButton = this.gameOverUI.container.querySelector('#retry') as HTMLButtonElement;


  //   // RE.onNextFrame(() => {
  //   //   RE.onNextFrame(() => {
  //   //     if (!this.retryButton) {
  //   //       RE.Debug.log("failed to get retryButton element")
  //   //       return;
  //   //     }

  //   //     this.retryButton.onpointerdown = () => {
  //   //       this.reset()
  //   //       this.gameOverUI.hide();
  //   //     }
  //   //   })
  //   // })

  // }

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
    // this.assertPlayer()
  }

  clearEnemies() {
    let enemiesContainer = RE.Runtime.scene.getObjectByName("Enemies") as THREE.Object3D;
    enemiesContainer.children.forEach((enemy) => {
      enemy.parent?.remove(enemy)
    })
  }

  resetMissionTriggers() {
    let missionTriggersContainer = RE.Runtime.scene.getObjectByName("MissionTriggers")
    missionTriggersContainer?.children.forEach((mtObj) => {
      let mtComponent = RE.getComponent(MissionTrigger, mtObj)
      mtComponent.reset()
    })
  }

  setupHUD() {
    this.hud.start()
  }

  resetMission() {
    let missionComponent = RE.getComponent(Mission001, this.object3d)
    missionComponent.reset()
  }

  /**
   * reset the game
   * 
   *   * clear enemies
   *   * reset triggers
   *   * respawn player
   *   * setup HUD
   */
  reset() {
    this.win = false;
    this.lose = false;
    this.kills = 0;
    this.deaths = 0;

    this.clearEnemies()
    this.resetMission()
    this.resetMissionTriggers()
    this.assertPlayer()
    this.setupHUD()
  }



}
