import * as RE from 'rogue-engine';
import { Audio } from 'three';
import * as THREE from 'three';
import Settings from './Settings.re';
import Warehouse from './Warehouse.re';
import DropshipController, { EquipmentOrder } from './DropshipController.re';
import RogueCharacter from '@RE/RogueEngine/rogue-character/RogueCharacter.re';
import NPCController from './NPCController.re';
import { randomRange } from 'Assets/Helpers/util';
import { shuffle } from 'Assets/Helpers/util';
import MissionTrigger from './MissionTrigger.re';

@RE.registerComponent
export default class Mission001 extends RE.Component {

  // @RE.props.list.audio() audio: Audio[];


  @Settings.require()
  settings: Settings;



  @RE.props.audio() audioWompratStart: Audio;
  @RE.props.audio() audioWompratMid: Audio;
  @RE.props.audio() audioWompratEnd: Audio;
  @RE.props.audio() audioInvasionStartVoice: Audio;
  @RE.props.audio() audioInvasionStartMusic: Audio;
  @RE.props.audio() audioInvasionEnd: Audio;
  @RE.props.audio() audioHomeStrike: Audio;
  @RE.props.audio() audioThanksForPlaying: Audio;

  @RE.props.select() phase = 0;
  phaseOptions = [
    "Bearings",
    "WompratStart",
    "WompratMid",
    "WompratEnd",
    "InvasionStart",
    "InvasionEnd",
    "HomeStrike",
    "Thanks"
  ]

  private dropshipsContainer: THREE.Object3D;
  private missionTriggersGroup: THREE.Object3D;
  private enemiesGroup: THREE.Object3D;
  private bisDropship: THREE.Object3D;
  private bisDropshipHome: THREE.Vector3 = new THREE.Vector3(-175, 30, -55);
  private bisWarehouse: Warehouse;
  private sfWarehouse: Warehouse;
  private troySpawn: THREE.Vector3;
  private playersContainer: THREE.Object3D;
  private defaultSpawn = new THREE.Vector3(0, 0, 0)

  private voiceClips = [
    "audioWompratStart",
    "audioWompratMid",
    "audioWompratEnd",
    "audioInvasionStartVoice",
    "audioInvasionEnd",
    "audioThanksForPlaying",
  ];

  private musicClips = [
    "audioInvasionStartMusic"
  ]


  awake() {

  }

  initializeDropshipsContainer() {
    let existingContainer = RE.Runtime.scene.getObjectByName("Dropships")
    if (!existingContainer) {
      this.dropshipsContainer = new THREE.Object3D()
      this.dropshipsContainer.name = "Dropships";
      RE.Runtime.scene.add(this.dropshipsContainer);
    } else {
      this.dropshipsContainer = existingContainer
    }
  }

  initializeWarehouses() {
    const bisWarehouseName = "BISWarehouse"
    const bisWarehouseObject = RE.Runtime.scene.getObjectByName(bisWarehouseName)
    const sfWarehouseName = "SFWarehouse"
    const sfWarehouseObject = RE.Runtime.scene.getObjectByName(sfWarehouseName)
    this.bisWarehouse = RE.getComponent(Warehouse, bisWarehouseObject)
    this.sfWarehouse = RE.getComponent(Warehouse, sfWarehouseObject)
  }

  initializeSpawnPoints() {
    this.troySpawn = RE.Runtime.scene.getObjectByName('TroySpawn')?.position || this.defaultSpawn
  }

  initializePlayersContainer() {
    this.playersContainer = RE.Runtime.scene.getObjectByName('Players') || (() => {
      let container = new THREE.Object3D()
      container.name = 'Players'
      RE.Runtime.scene.add(container)
      return container
    })()
  }

  setAudioVolume(clips: string[], volumeSetting: number) {
    clips.forEach((clip) => {
      if (this[clip]) this[clip].setVolume(volumeSetting);
    });
  }

  start() {

    this.initializeWarehouses()
    this.initializeDropshipsContainer()
    this.initializeSpawnPoints()
    this.initializePlayersContainer()


    this.setAudioVolume(this.voiceClips, this.settings.voiceoverVolume)
    this.setAudioVolume(this.musicClips, this.settings.musicVolume)


    this.missionTriggersGroup = RE.Runtime.scene.getObjectByName("MissionTriggers") as THREE.Object3D;
    this.enemiesGroup = RE.Runtime.scene.getObjectByName("Enemies") as THREE.Object3D;
  }

  update() {
    if (this.phase === 0) this.waitForWompratStart();
    else if (this.phase === 1) this.waitForWompratKilled();
    else if (this.phase === 2) this.waitForWompratsKilled();
    else if (this.phase === 3) this.waitForInvasionStart();
    else if (this.phase === 4) this.waitForThreeEnemyKyberpods();
    else if (this.phase === 5) this.waitForTwoEnemyKyberpodsKilled();
    else if (this.phase === 6) this.waitForEnemyKyberpodGTFO();
    else if (this.phase === 7) this.waitForEnemyKyberpodsKilled(0);
    else if (this.phase === 8) this.waitForReturnToBase();
    else if (this.phase === 9) this.waitForEnemyKyberpodsKilled(1);
  }

  // reset() {
  //   this.phase = 0
  //   this.voiceClips.concat(this.musicClips).forEach((clip) => {
  //     if (this[clip]) this[clip].stop()
  //   })
  // }

  // trigger objects with true .triggered property tell us that the trigger has not been tripped
  triggerExists(name: string) {
    return this.missionTriggersGroup.children.find((tObj) => {
      let tComponent = RE.getComponent(MissionTrigger, tObj)
      return (tObj.name === name && tComponent.triggered === false)
    })
  }

  /**
   * Name is ignored for now. Finding enemies by name doesn't work in the build artifcct due to a bug in RE
   * @bug @blocking @see https://discord.com/channels/669681919692242954/746385722495467530/1345708197364629535
   */
  enemyExists(_name: string, count: number = 1): boolean {
    // let matches = 0
    // for (let i = 0; i < this.enemiesGroup.children.length; i++) {
    //   if (this.enemiesGroup.children[i].name === name) matches++;
    // }
    // if (matches === count) return true;
    if (this.enemiesGroup.children.length === count) return true;
    else return false;
  }

  // enemyExists(name: string, count: number = 1): boolean {
  //   let matchCount = 0;

  //   for (const enemy of this.enemiesGroup.children) {
  //     if (enemy.name === name) {
  //       matchCount++;
  //     }
  //   }
  //   if (matchCount === count) return true;

  //   return false;
  // }

  waitForWompratStart() {
    // player can explore the base without starting the mission
    // as soon as player leaves the base, we enter next phase
    if (this.triggerExists('WompratStart')) return;
    this.audioWompratStart.play() // Player is prompted to visit farm 6.
    this.phase++
  }


  /**
   * When the player reaches the InvasionStart trigger,
   *   * [x] BIS dropship swoops in
   *   * [x] BIS dropship drops a light energy tower and 3 kyberpods
   *   * [x] BIS kyberpods attack player
   */
  waitForInvasionStart(): void {
    if (this.triggerExists('InvasionStart')) return;
    // spawn dropship

    const dropshipName = 'BISDropship'
    const { prefab: dropshipPrefab } = this.bisWarehouse.getPrefab(dropshipName)

    RE.Debug.log(`items found=${this.bisWarehouse.items.map((i) => i.name).join(', ')} itemNames=${this.bisWarehouse.itemsNames.map((i) => i).join(', ')}`)
    if (!dropshipPrefab) {
      RE.Debug.logError(`${dropshipName} not found in ${this.bisWarehouse.name}`);
      return
    }

    let orders: EquipmentOrder[] = [
      {
        items: [
          "LightEnergyTower"
        ],
        pos: new THREE.Vector3(110, 1, -9)
      },
      {
        items: [
          "EnemyKyberpod",
          "EnemyKyberpod",
          "EnemyKyberpod"
        ],
        pos: new THREE.Vector3(121, 1, 3)
      },
      {
        items: [],
        pos: this.bisDropshipHome
      }
    ]

    this.bisDropship = dropshipPrefab.instantiate(this.dropshipsContainer)
    this.bisDropship.position.copy(this.bisDropshipHome)

    let bisDropshipComponent = RE.getComponent(DropshipController, this.bisDropship)
    orders.forEach((order) => { bisDropshipComponent.queueRequest(order) })

    this.audioInvasionStartMusic.play()
    this.phase++
  }



  waitForThreeEnemyKyberpods() {
    if (!this.enemyExists('EnemyKyberpod', 3)) {
      RE.Debug.log(`there are ${this.enemiesGroup.children.length} enemies.`)
      return;
    }

    RE.Debug.log("THREE E KYBERPODSS!!!!! 33333333");

    // program the kyberpod task lists
    RE.Debug.log(`enemies=${this.enemiesGroup.children.map((e) => e.name).join(', ')}`)
    let kyberpods = this.enemiesGroup.children
    kyberpods.forEach((kyberpod) => {
      let npcControllerComponent = RE.getComponent(NPCController, kyberpod)
      npcControllerComponent.resetTasks()
      let tasks = [
        "idle,1",
        `walk,${randomRange(110, 140, true)},0,${randomRange(-7, -49, true)}`,
        `kill,FirstPersonCharacter,${randomRange(3, 9, true)}`,
        `walk,${randomRange(110, 140, true)},0,${randomRange(-7, -49, true)}`
      ]
      shuffle(tasks)
      npcControllerComponent.tasks = tasks
    })

    this.audioInvasionStartVoice.play() // "CODE RED!"
    this.phase++

  }

  waitForTwoEnemyKyberpodsKilled() {
    if (!this.enemyExists('EnemyKyberpod', 1)) return;
    RE.Debug.log('TWO E KYBERPODS!!! ~~~~ <3')
    // make the remaining enemy kyberpod invulnerable and make him GTFO
    let remainingEnemyKyberpod = this.enemiesGroup.children.find((e) => e.name === "EnemyKyberpod")
    let character = RE.getComponent(RogueCharacter, remainingEnemyKyberpod)
    character.armor = 1000

    // @todo jumpjet
    let npcController = RE.getComponent(NPCController, remainingEnemyKyberpod)
    npcController.resetTasks()
    npcController.tasks = [
      "jumpjet,1,1,1,2" // @todo jj params aren't meaningful. and jj doesn't look right (not an parabolic flight path)
    ]
    npcController.repeat = false

    this.phase++
  }

  waitForEnemyKyberpodGTFO() {
    if (!this.enemyExists('EnemyKyberpod', 0)) return;
    this.audioInvasionEnd.play() // "the third one jumped. he's gone."

    this.phase++
  }

  waitForEnemyKyberpodsKilled(iteration: number) {
    if (this.enemyExists('EnemyKyberpod')) return;

    // Iteration 0 happens when the invasion is thwarted
    if (iteration === 0) {

      let troyKyberpodName = 'TroyKyberpod'
      let { prefab: troyPrefab, container } = this.sfWarehouse.getPrefab(troyKyberpodName)
      if (!troyPrefab) {
        RE.Debug.logError(`${troyKyberpodName} not found`)
      } else {

        let troyObject = troyPrefab.instantiate(this.playersContainer)
        troyObject.position.copy(this.troySpawn)
      }
      this.audioInvasionEnd.play() // "Look at all the karnage"

      // Iteration 1 happens when BIS raids SolFront base
    } else {
      this.audioThanksForPlaying.play()
      // @todo show credits
      setTimeout(() => {
        RE.App.loadScene("thanks")
      }, 5000)
    }
    this.phase++
  }

  waitForWompratKilled() {
    // either womprat must be dead
    // if (this.enemyExists('SpacePig1') && this.enemyExists('SpacePig2')) return;  // @bug @blocking @see https://discord.com/channels/669681919692242954/746385722495467530/1345708197364629535
    if (this.enemyExists('_', 2)) return;
    this.audioWompratMid.play() // "Another one bites the dust"
    this.phase++
  }

  waitForWompratsKilled() {
    // both womprats must be dead
    // if (this.enemyExists('SpacePig1') || this.enemyExists('SpacePig2')) return; // * @bug @blocking @see https://discord.com/channels/669681919692242954/746385722495467530/1345708197364629535
    if (this.enemyExists('_', 1)) return;
    this.audioWompratEnd.play() // "I'm all cleaned up"
    this.phase++
    // The phase where player kills womprats
    // as soon as player kills one womprat, we enter next phase
    // if (this.triggerExists('Womprat'))
    // @todo implement a trigger which fires when enemy dies
  }

  waitForReturnToBase() {
    if (this.triggerExists('ReturnToBase')) return;
    this.audioThanksForPlaying.play()
    this.phase++
  }

}
