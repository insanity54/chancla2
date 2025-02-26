import RogueAnimator from '@RE/RogueEngine/rogue-animator/RogueAnimator.re'
import * as RE from 'rogue-engine'
import * as THREE from 'three'
import RapierBody from '@RE/RogueEngine/rogue-rapier/Components/RapierBody.re';

@RE.registerComponent
export default class TowerController extends RE.Component {

  @RogueAnimator.require()
  animator: RogueAnimator;

  @RapierBody.require()
  rapierBody: RapierBody;

  @RE.props.num() startupSeconds: number = 5;
  @RE.props.checkbox() running: boolean = false;
  @RE.props.checkbox() warming: boolean = false;
  @RE.props.num() runtime: number = 0;
  @RE.props.audio(true) warmupSFX: THREE.PositionalAudio;
  // @RE.props.audio(true) ambientSFX: THREE.PositionalAudio;

  @RE.props.num() targetY: number = 0; // default to 0.


  start() {
    // this.getTerrainHeight(this.object3d.position)
  }

  update() {


    this.animator.setBaseAction('idle')

    const fixed = this.rapierBody.body.isFixed()

    if (fixed) {

      // warm up the rotator
      if (!this.warming) {
        this.warmupSFX.play()
        this.warming = true
      }

      // start the rotator
      if (!this.running) {
        this.runtime += RE.Runtime.deltaTime
        if (this.runtime >= this.startupSeconds) {
          this.running = true
        }
      }

      if (this.running) {
        // // loop the ambient
        // this causing audio popping and sometimes this.ambientSFX shows as undefined so I'm deleting this feature for now
        // if (this.warming && !this.ambientSFX.isPlaying) {
        //   this.ambientSFX.play()
        // }
        this.animator.mix('rotate')
      } else {
        this.animator.mix('idle')
      }

    }
  }

}