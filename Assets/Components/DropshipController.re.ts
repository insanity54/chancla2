import * as RE from 'rogue-engine';
import * as THREE from 'three';
import RapierThirdPersonController from '@RE/RogueEngine/rogue-rapier/Components/Controllers/RapierThirdPersonController.re';
import { randomRange, randomInt } from '../Helpers/util';
import Warehouse from './Warehouse.re';
import { Vector3 } from 'three.quarks';

RE.Input.bindButton("Request", { Keyboard: 'KeyR' })


enum State {
  Hovering,
  Turning,
  Flying,
  Dropping,
}

export type EquipmentOrder = {
  items: string[],
  pos: THREE.Vector3
}

function lerpV3(a: THREE.Vector3, b: THREE.Vector3, t: number, h: number) {
  a.x = THREE.MathUtils.damp(a.x, b.x, t, h);
  a.y = THREE.MathUtils.damp(a.y, b.y, t, h);
  a.z = THREE.MathUtils.damp(a.z, b.z, t, h);
}


@RE.registerComponent
export default class DropshipController extends RE.Component {

  @RE.props.num() speed: number;
  @RE.props.num(1) caution: number;
  @RE.props.num() baseY: number;
  @RE.props.num() requestX: number;
  @RE.props.num() requestY: number;
  @RE.props.num() requestZ: number;
  @RE.props.num() dropTimeout: number = 0.2;
  @RE.props.num() dropTimeCounter: number = 0.2;
  @RE.props.num() dropSpreadSize: number = 1;
  @RE.props.checkbox() rateLimited: boolean = false;
  @RE.props.num() itemCounter: number = 0;
  @RE.props.select() state = 0;
  @RE.props.object3d() warehouseObject: THREE.Object3D;
  @RE.props.audio(true) dropSFX: THREE.PositionalAudio;
  @RE.props.audio(true) flySFX: THREE.PositionalAudio;
  @RE.props.audio(true) turnSFX: THREE.PositionalAudio;
  @RE.props.audio(true) idleSFX: THREE.PositionalAudio;
  @RE.props.num() cargoBayYOffset: number = -1;

  stateOptions = ["hovering", "turning", "flying", "dropping"];
  itemsContainer: THREE.Object3D;
  qToRequestVector: THREE.Quaternion;
  warehouse: Warehouse;


  // @RE.props.button() request = () => { 

  //   const player = RapierThirdPersonController.get('RapierThirdPersonController')
  //   if (!player) {
  //     RE.Debug.logWarning('player object not found')
  //     return;
  //   }

  //   this.queueRequest(this.getRandomEquipmentOrder())
  // };

  private queue: EquipmentOrder[] = [];
  private localFWD = new THREE.Vector3();
  private appliedDirection = new THREE.Vector3();
  private dummy = new THREE.Object3D();
  private camDirection = new THREE.Vector3();
  private targetDirection = new THREE.Vector3();
  private inputDirection = new THREE.Vector3();
  private inputVelocity = new THREE.Vector3();



  dropshipsContainer: THREE.Object3D;

  getSpreadOffset(index: number) {
    RE.Debug.log(`getSpreadOffset index=${index}`)

    // if there are multiple items in the order, spread them out
    // otherwise, drop the single item in the order on the exact coordinate 
    // (necessary for mission 001 when a tower kills a NPC)
    if (index > 0) {
      return new Vector3(randomRange(-2, 2), this.cargoBayYOffset, randomRange(-2, 2))
    } else {
      return new Vector3(0, this.cargoBayYOffset, 0)
    }
  }


  /**
   * getRandomEquipmentOrder
   * 
   * Create a random EquipmentOrder. Helpful during testing.
   */
  getRandomEquipmentOrder(): EquipmentOrder {
    // RE.Debug.clear()
    if (!this.warehouse.items || this.warehouse.items.length === 0) {
      RE.Debug.logError("No items found in warehouse");
    }
    const availableItems = this.warehouse.items.map((m) => m.name)


    // RE.Debug.log(`availableItems as follows. ${JSON.stringify(availableItems)}`)
    const pos = new THREE.Vector3(randomRange(-100, 100), randomRange(0, 10), randomRange(-100, 100))
    const itemCount = randomInt(1, 8)
    let items: string[] = []
    for (let i = 0; i < itemCount; i++) {
      const randomIndex = randomInt(0, availableItems.length)
      items.push(availableItems[randomIndex])
    }
    const randomOrder = { pos, items }
    // RE.Debug.log(`random equipment order as follows. ${JSON.stringify(randomOrder)}`)
    return randomOrder
  }

  awake() {
    if (!RE.Runtime.isRunning) return;
  }

  start() {
    RE.Runtime.rogueDOMContainer.onclick = () => RE.Runtime.isRunning && RE.Input.mouse.lock();

    this.dropshipsContainer = RE.Runtime.scene.getObjectByName("Dropships") as THREE.Object3D;
    this.itemsContainer = RE.Runtime.scene.getObjectByName("Items") as THREE.Object3D;
    this.warehouse = RE.getComponent(Warehouse, this.warehouseObject)

    if (!this.dropshipsContainer) {
      this.dropshipsContainer = new THREE.Object3D();
      this.dropshipsContainer.name = "Dropships";
      RE.Runtime.scene.add(this.dropshipsContainer);
    }

    if (!this.itemsContainer) {
      this.itemsContainer = new THREE.Object3D();
      this.itemsContainer.name = "Items";
      RE.Runtime.scene.add(this.itemsContainer);
    }
  }

  cooldown() {

    // update the dropTimeCounter
    this.dropTimeCounter += 1 * RE.Runtime.deltaTime
    // this.dropTimeCounter = Math.min(this.dropTimeCounter, this.dropTimeout)

    // reset the rate limit when it's time
    if (this.rateLimited && (this.dropTimeCounter >= this.dropTimeout)) {
      this.rateLimited = false;
    }
  }

  static getNextItem(order: EquipmentOrder, itemCounter: number): string | null {
    if (itemCounter > order.items.length) {
      return null
    } else {
      return order.items[itemCounter + 1]
    }

  }

  // controls() {

  //   if (RE.Input.getDown("Order Tower")) {
  //     RE.Debug.log(`REQUEST INPUT WAS PRESSED`)
  //     const dropship = RE.Runtime.scene.getObjectByName("Dropship") as THREE.Object3D;
  //     if (!dropship) RE.Debug.logError(`failed to get dropship`);
  //     else this.queueRequest(this.getRandomEquipmentOrder())
  //   }
  // }

  update() {
    this.cooldown()
    // this.controls() // you gotta buy thru the shop UI now! <3

    if (this.state === State.Hovering) {
      if (this.queue.length > 0) {
        const { x, y, z } = this.queue[0].pos
        this.requestX = x
        this.requestY = y
        this.requestZ = z
        this.state = State.Turning;
        if (this.flySFX) {
          this.flySFX.isPlaying && this.flySFX.stop();
          const detune = randomRange(-100, 100);
          this.flySFX.detune = detune;
          this.flySFX.setRolloffFactor(0.07);
          this.flySFX.play(2.51);
        }
      }
      else return
    } else if (this.state === State.Turning) {
      this.qToRequestVector = this.getQuaternionToRequestVector()
      if (this.object3d.quaternion.angleTo(this.qToRequestVector) > 0.1) {
        this.updateRotation()
      } else {
        this.state = State.Flying
      }
    } else if (this.state === State.Flying) {

      const distance = this.object3d.position.distanceTo(new THREE.Vector3(this.requestX, this.requestY + (this.baseY * this.caution), this.requestZ))


      // RE.Debug.clear()
      // const { x, y, z } = this.object3d.position
      // RE.Debug.log(`requestX=${this.requestX}, requestY=${this.requestY}, requestZ=${this.requestZ} distance=${distance}`)
      if (distance < 10) {
        this.state = State.Dropping;
      } else {
        this.updatePosition()
      }
    } else if (this.state === State.Dropping) {

      if (this.queue.length === 0) {
        this.state = State.Hovering
      } else {
        RE.Debug.clear()
        RE.Debug.log(`dropping. btw queue length is ${this.queue.length}, item length is ${this.queue.at(0)?.items.length}`)
        if (this.rateLimited) {
          RE.Debug.log('rate limited')
        } else {
          RE.Debug.log('actually dropping')
          // const order = this.queue.splice(0, 1)

          const order = this.queue[0]
          const startItemCount = order.items.length
          RE.Debug.log(`order=${JSON.stringify(order)}`)


          const item = order.items.shift()
          if (!item) {
            this.queue.shift();
            this.state = State.Hovering
          } else {
            // RE.Debug.log(`item=${item} simulated drop`)

            const itemPrefab = this.warehouse.items.find((m) => m.name === item)

            if (!itemPrefab) {
              RE.Debug.logError(`Dropship could not find ${item}`)
            } else {
              if (this.flySFX) {
                this.dropSFX.isPlaying && this.dropSFX.stop();
                const detune = randomRange(-100, 100);
                this.dropSFX.detune = detune;
                this.dropSFX.setRolloffFactor(0.07);
                this.dropSFX.play();
              }


              const itemObject = itemPrefab.instantiate(this.itemsContainer)
              let itemSpawnPoint = this.object3d.position.clone()
              itemSpawnPoint.add(this.getSpreadOffset(order.items.length))
              itemObject.position.copy(itemSpawnPoint)


              // const itemComponent = RE.getComponent(Module, itemObject)
              // const itemObject = moduleComponent?.itemComp?.instantiate(this.itemsContainer)

              // delete the moduleObject since all we needed from it was the Item
              // this.itemsContainer.remove(moduleObject)
              // moduleObject.remove()


              // const freshObject = itemObject.clone()

              // RE.Debug.log(`${freshObject.name}`)
              // freshObject.parent = this.itemsContainer
              // freshObject.position.copy(this.object3d.position)
            }

            const endItemCount = order.items.length
            if (startItemCount !== endItemCount) {
              this.rateLimited = true
              this.dropTimeCounter = 0
            }

          }


          // if (!itemName) {
          //   this.itemCounter = 0
          //   this.state = State.Hovering
          // } else {
          //   RE.Debug.log(JSON.stringify(order))
          //   this.itemCounter += 1
          //   const itemObject = this.armaments.find((a) => a.name === itemName)
          //   if (!itemObject) return RE.Debug.logError(`itemObject ${itemName} was not found in armaments`);
          //   // drop item
          //   itemObject.copy(this.itemsContainer);
          //   itemObject.position.copy(this.object3d.position)
          // }

        }
      }
    }
  }



  get Y() {
    return (this.baseY * this.caution + this.requestY)
  }

  /**
   * getQuaternionToRequestVector
   * 
   * This is so cool! This solution made me smile.
   * It borrows from BeardScript's FPSWeapon which translates a bullet, copies the bullet position, then reverts the translation. 
   * I think it does that to raytrace between the two points.
   * Anyway, in our solution, we..
   *   * store the current Quaternion
   *   * look at where we want to go
   *   * store the Quaternion
   *   * revert to the original Quaternion
   */
  getQuaternionToRequestVector() {
    const curQ = this.object3d.quaternion.clone();
    // Look towards the target but keep current pitch and roll
    const targetPos = new THREE.Vector3(this.requestX, this.object3d.position.y, this.requestZ);
    this.object3d.lookAt(targetPos);
    const qToV = this.object3d.quaternion.clone();
    this.object3d.quaternion.copy(curQ);
    return qToV;
  }

  updateRotation() {
    this.object3d.quaternion.slerp(this.qToRequestVector, this.speed * RE.Runtime.deltaTime)
  }

  updatePosition() {
    lerpV3(
      this.object3d.position,
      new THREE.Vector3(this.requestX, this.Y, this.requestZ),
      this.speed,
      RE.Runtime.deltaTime
    );
  }


  queueRequest(equipmentOrder: EquipmentOrder) {
    this.queue.push(equipmentOrder)
  }



  setRotation() {

    let { x: hAxis, y: vAxis } = RE.Input.getAxes("Move");
    let { x: rhAxis } = RE.Input.getAxes("Look");


    this.object3d.localToWorld(this.camDirection);

    this.appliedDirection.copy(this.object3d.position).add(this.camDirection);
    this.dummy.position.copy(this.object3d.position);
    this.dummy.lookAt(this.appliedDirection);
    this.dummy.getWorldDirection(this.targetDirection);

    this.object3d.rotateY(-rhAxis * 4 * RE.Runtime.deltaTime);

  }

  translate() {
    this.inputVelocity.z = this.inputDirection.length();
    this.targetDirection.multiplyScalar(this.inputVelocity.length());


  }

}

