import * as RE from 'rogue-engine';

@RE.registerComponent
export default class Warehouse extends RE.Component {

    @RE.props.list.prefab() items: RE.Prefab[];
    @RE.props.list.text() itemsNames: string[];
    @RE.props.list.text() itemsContainers: string[];

    awake(): void {
        if (this.items.length !== this.itemsNames.length) {
            RE.Debug.logError(`Warehouse ${this.object3d.name} items length (${this.items.length}) MUST be the same length as itemsNames (${this.itemsNames.length}). Have you named all the prefabs in this Warehouse?`)
        }
        if (this.items.length !== this.itemsContainers.length) {
            RE.Debug.logError(`Warehouse ${this.object3d.name} items length (${this.items.length}) MUST be the same length as itemsContainers (${this.itemsContainers.length}). Have you assigned containers for all the prefabs in this Warehouse?`)
        }
    }


    // @bug we can't look up the prefab by the prefab name because there is a build bug which renames the prefabs names to GUID
    // @bug @blocking @see https://discord.com/channels/669681919692242954/746385722495467530/1345708197364629535
    // findItemPrefab(name: string): RE.Prefab | false {
    //     if (!name) throw new Error(`findItemPrefab() 'name' param is required`);
    //     const mod = this.items.find((m) => m.name === name)
    //     return (!!mod) ? mod : false
    // }
    getPrefab(name: string): { prefab: RE.Prefab | undefined, container: string | undefined } {
        let i = 0;
        let pre: RE.Prefab | undefined;
        let cont: string | undefined;
        this.items.forEach(p => {
            if (this.itemsNames[i] == name) {
                pre = p;
                cont = this.itemsContainers[i];
            }
            i++;
        });
        return { prefab: pre, container: cont };
    }
}
