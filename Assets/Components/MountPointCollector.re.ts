import * as RE from 'rogue-engine';
import * as THREE from 'three'



@RE.registerComponent
export default class MountPointCollector extends RE.Component {

  // Function to get the names of all Object3D's in a hierarchy
  getMountNames(object: THREE.Object3D): string[] {
    if (!object) {
      RE.Debug.logError(`getMountNames object was undef`)
    }
    const names: string[] = [];

    object.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Object3D && child.name) {
        names.push(child.name);
      }
    });

    // Use Set to remove duplicates and convert back to an array
    return Array.from(new Set(names)).filter((name) => name.startsWith('Mount')).sort();
  }

  static findMountPointObject(targetMountPoint: string) : THREE.Object3D | null {
    const mountPointObjects = MountPointCollector.getMountPointObjects(RE.Runtime.scene)
    const mountPoint = mountPointObjects.find((mp) => {
      return (mp.name === targetMountPoint)
    })
    if (!mountPoint) return null;
    else return mountPoint
  }

  static getMountPointObjects(parent: THREE.Object3D): THREE.Object3D[] {
    const objects: THREE.Object3D[] = []
    parent.traverse((child) => {
      if (child instanceof THREE.Object3D) {
        objects.push(child)
      }
    })
    return objects
  }


  @RE.props.button()
  getMountPointList() {
    this.mountPointList = this.getMountNames(RE.Runtime.scene);
  }

  @RE.props.list.text() mountPointList: string[];



  awake() {
    // this.mountPointList = this.getMountNames(RE.Runtime.scene)
  }

  start() {

  }

  update() {

  }
}
