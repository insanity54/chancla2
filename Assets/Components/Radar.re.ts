import RAPIER from '@dimforge/rapier3d-compat';
import RapierBall from '@RE/RogueEngine/rogue-rapier/Components/Colliders/RapierBall.re';
import RogueRapier from '@RE/RogueEngine/rogue-rapier/Lib/RogueRapier';
import * as RE from 'rogue-engine';
import { Object3D } from 'three';
import RapierBody, { RapierCollisionInfo } from '@RE/RogueEngine/rogue-rapier/Components/RapierBody.re';

@RE.registerComponent
/**
 * Radar
 * 
 * Radar is a RogueBody sensor with RogueBall collider that gets shared among every Character that needs Radar.
 * It's a Radar timeshare, where we use minimal memory to serve all our Characters.
 * The radar is meant to jump around to the xyz of a Character with radar, 
 * perform collision detection within the radar's range, and report the colliding objects.
 * 
 */
export default class Radar extends RE.Component {


  @RapierBall.require()
  collider: RapierBall;

  @RapierBody.require()
  body: RapierBody

  awake() {

  }

  start() {

  }

  update() {

  }

  getCollisions(targetName: string, range: number, exclude: Object3D): Object3D[] {
    // * [x] get a handle on the Collider
    // this.collider

    // * [ ] get the colliding objects
    // const collisions: RAPIER.Collider[] = [];

    // RogueRapier.world.bodies

    this.body.onCollisionStart = (info: RapierCollisionInfo) => {
      console.log("Collision started!");
      console.log("Own Collider:", info.ownCollider);
      console.log("Other Collider:", info.otherCollider);
      console.log("Other Body:", info.otherBody);
    };

    // * [ ] filter by objects not matching exclude param
    // * [ ] filter by objects with name matching targetName
    // * [ ] sort by distance

    return [] // @todo
  }


  // private detectCollisions(): RAPIER.Collider[] {
  //     const collisions: RAPIER.Collider[] = [];

  //     // Query the Rapier world for intersections with the sensor collider
  //     this.rapierWorld.(this.sensorCollider!, (collider) => {
  //         collisions.push(collider);
  //     });

  //     return collisions;
  // }


}
