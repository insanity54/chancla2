import * as RE from 'rogue-engine';
import * as THREE from 'three';
import MountPointCollector from './MountPointCollector.re';



/**
 * Mount
 * 
 * The object3d which gets visibly mounted to the kyberpod when it's module is loaded
 */
@RE.registerComponent
export default class Mount extends RE.Component {



  mountNames: string[]


  @RE.props.text() targetMountPoint: string;

  hide() {
    this.object3d.visible = false
  }

  reveal() {
    this.object3d.visible = true
  }

  awake() {
    
  }

  start() {

  }

  update() {

  }
}
