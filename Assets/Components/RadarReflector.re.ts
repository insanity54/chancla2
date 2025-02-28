import * as RE from 'rogue-engine';
import Radar from './Radar.re';

@RE.registerComponent
/**
 * RadarReflector is a component which responds to Radar.
 * Mechs with stealth should NOT have this Component ;-)
 * 
 */
export default class RadarReflector extends RE.Component {
  awake() {

  }

  start() {
    // // * [ ] register with Radar Component
    // const radarScannerObject = RE.Runtime.scene.getObjectByName('RadarScanner')
    // const radarScannerComponent = RE.getComponent(Radar, radarObject)
    // radarScannerComponent.registerReflector(this.object3d)
  }

  update() {

  }
}
