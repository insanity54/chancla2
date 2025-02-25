import * as RE from 'rogue-engine';
import Module from './Module.re';

@RE.registerComponent
export default class Warehouse extends RE.Component {

  @RE.props.list.prefab() modules: RE.Prefab[]

  awake() {

  }

  start() {

  }

  update() {

  }

  findModulePrefab(name: string): RE.Prefab | false {
    if (!name) throw new Error(`findModulePrefab() 'name' param is required`);
    const mod = this.modules.find((m) => m.name === name)
    return (!!mod) ? mod : false
  }
}
