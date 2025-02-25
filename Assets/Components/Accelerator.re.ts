
import * as RE from 'rogue-engine';
import * as THREE from 'three';
import RapierKinematicCharacterController from '@RE/RogueEngine/rogue-rapier/Components/RapierKinematicCharacterController.re';

@RE.registerComponent
export default class Accelerator extends RE.Component {

  @RE.props.audio(true) activateSFX: THREE.PositionalAudio;
  // @RE.props.num() jumpjetTimer: number = 0; // Tracks time jumpjet has been active
  // @RE.props.num() maxJumpjetDuration: number = 2
  // @RE.props.num() jumpjetPower: number = 33
  // @RE.props.num() forwardPower: number = 55; // New: forward thrust power

  public isActivated = false;

  awake() {

  }

  start() {
    // this.rapierBody = RapierBody.get('RapierBody', this.object3d, true)
    // RE.Debug.log(`Accelerator start. object3d.name=${this.object3d.name}`)

    // this.rapierBody = RE.getComponent(RapierBody, this.object3d, true)
    // this.rapierBody = RE.getComponent(RapierKinematicCharacterController, this.object3d, true)
  }

  activate() {
    // // Check if the RapierBody component is available
    // if (!this.rapierBody) {
    //   RE.Debug.logError(`Accelerator activation failed because there was no rapierBody.`);
    //   // this.rapierBody = RE.getComponent(RapierBody, this.object3d, true)
    //   return;
    // }
    // this.rapierBody = RE.getComponent(RapierBody, object3d, true)


    // // Apply an impulse to propel the object upwards and a little forward
    // RE.Debug.log(`Accellerator activate! ${this.object3d.name}`)
    // // console.log(JSON.stringify(this.rapierBody))

    // const impulse = new THREE.Vector3(0, 10, 5); // Adjust values as necessary for desired effect
    // RE.Debug.log(`rapierBody.body ${this.rapierBody?.body}`)
    // this.rapierBody.body.applyImpulse(impulse, true);
    
    // RE.Debug.log('hi this is activate()')

    // If this object has StickyController, we need to set the RapierBody to Dynamic so we can move

    this.activateSFX.isPlaying && this.activateSFX.stop();
    this.activateSFX.setRolloffFactor(0.07);
    this.activateSFX.setVolume(0.7)
    this.activateSFX.play()


    // const controller = RE.getComponent(RapierKinematicCharacterController, this.object3d, true)
    // controller.activateJumpjet()


    // Check if the RapierBody component is available
    // if (!this.object3d?.parent?.object3d?.rapierBody) 
    // if (!this.rapierBody) {
    //   RE.Debug.logError(`RapierBody not found on this Accelerator! (this should never happen)`)
    //   return;
    // }
    
    // Calculate the upward and forward velocity
    // The player is RapierBody type RAPIER.RigidBodyType.KinematicPositionBased
    // which means it' can't be acted on by external forces.
    // Instead, we need to modify the RapierKinematicCharacterController.playerVelocity directly.

    // this.startJumpjet()
  }

  // startJumpjet() {
  //   if (this.jumpjetTimer <= 0) {
  //     this.upwardVelocity = this.jumpjetPower; // Apply upward power
  //     this.jumpjetTimer = this.maxJumpjetDuration; // Start jumpjet duration

  //     // Calculate the forward velocity based on object orientation
  //     const forwardDirection = new THREE.Vector3();
  //     this.object3d.getWorldDirection(forwardDirection); // Get the forward direction
  //     forwardDirection.normalize().multiplyScalar(this.forwardPower);
  //     this.forwardVelocity.copy(forwardDirection);
  //   }
  // }

  // update() {
  //   if (this.jumpjetTimer > 0) {
  //     this.jumpjetTimer -= RE.Runtime.deltaTime;

  //     // Reduce upward velocity due to gravity
  //     this.upwardVelocity += this.gravity * RE.Runtime.deltaTime;

  //     // Cap velocity if the jumpjet is still active
  //     if (this.jumpjetTimer > 0) {
  //       this.upwardVelocity = Math.max(this.upwardVelocity, 0); // No downward movement while powered
  //     }


  //     // Get the current position of the character
  //     const currentTranslation = this.rapierBody.body.translation();
  //     this.position.set(currentTranslation.x, currentTranslation.y, currentTranslation.z);

  //     // Update position based on velocity
  //     this.position.y += this.upwardVelocity * RE.Runtime.deltaTime;

  //     // Apply the new position to the kinematic body
  //     this.rapierBody.body.setNextKinematicTranslation({
  //       x: this.position.x,
  //       y: this.position.y,
  //       z: this.position.z,
  //     });
      
  //   } else {
  //     // Gravity takes full effect if jumpjet is off
  //     this.upwardVelocity += this.gravity * RE.Runtime.deltaTime;

  //   }

  // }


  update() {
    // if (this.jumpjetTimer > 0) {
    //   this.jumpjetTimer -= RE.Runtime.deltaTime;

    //   // Reduce upward velocity due to gravity
    //   this.upwardVelocity += this.gravity * RE.Runtime.deltaTime;

    //   // Cap upward velocity if the jumpjet is still active
    //   if (this.jumpjetTimer > 0) {
    //     this.upwardVelocity = Math.max(this.upwardVelocity, 0); // No downward movement while powered
    //   }

    //   // Get the current position of the character
    //   const currentTranslation = this.rapierBody.body.translation();
    //   this.position.set(currentTranslation.x, currentTranslation.y, currentTranslation.z);

    //   // Update position based on both velocities
    //   this.position.addScaledVector(this.forwardVelocity, RE.Runtime.deltaTime); // Forward motion
    //   this.position.y += this.upwardVelocity * RE.Runtime.deltaTime; // Upward motion

    //   // Apply the new position to the kinematic body
    //   this.rapierBody.body.setNextKinematicTranslation({
    //     x: this.position.x,
    //     y: this.position.y,
    //     z: this.position.z,
    //   });
      
    // } else {
    //   // Gravity takes full effect if jumpjet is off
    //   this.upwardVelocity += this.gravity * RE.Runtime.deltaTime;
    // }
  }
}

