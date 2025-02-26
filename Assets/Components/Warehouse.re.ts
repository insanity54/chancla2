import * as RE from 'rogue-engine';

@RE.registerComponent
export default class Warehouse extends RE.Component {

  @RE.props.list.prefab() items: RE.Prefab[]

  awake() {

  }

  start() {

  }

  update() {

  }

  findItemPrefab(name: string): RE.Prefab | false {
    if (!name) throw new Error(`findItemPrefab() 'name' param is required`);
    const mod = this.items.find((m) => m.name === name)
    return (!!mod) ? mod : false
  }
}
