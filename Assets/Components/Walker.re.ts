import * as RE from 'rogue-engine';
import * as THREE from 'three';
import TaskList, { TaskSpec } from './TaskList.re';
import { lerpV3 } from 'Assets/Helpers/util';

@RE.registerComponent
export default class Walker extends RE.Component {

  @RE.props.vector3() destination: THREE.Vector3;
  @RE.props.checkbox() useTaskList: boolean = true;
  @RE.props.num(0, 1) lambda: number = 1;

  private _taskList: TaskList

  get taskList() {
    return (this._taskList) ? this._taskList : TaskList.get(this.object3d)
  }

  awake() {

  }

  start() {

  }

  update() {
    if (this.useTaskList) {
      let task = TaskList.parseTask(this.taskList.activeTask)
      if (task.action === 'walk') {
        let walkTask = this.parseWalkTask(task)
        RE.Debug.log(`walkTask=${JSON.stringify(walkTask)}`)
        let [x, y, z] = walkTask.params
        let taskDest = new THREE.Vector3(x, y, z)
        this.updatePosition(taskDest)
      }
    } else {
      this.updatePosition(this.destination)
    }
  }

  updatePosition(dest: THREE.Vector3) {
    let { x, y, z } = dest
    // RE.Debug.clear()
    // RE.Debug.log(`Walking to x=${x}, y=${y}, z=${z}`)
    lerpV3(
      this.object3d.position,
      dest,
      this.lambda,
      RE.Runtime.deltaTime / 5
    );
  }



  parseWalkTask(task: TaskSpec) {
    if (task.params.length !== 3) RE.Debug.logError(`TaskSpec params was length ${task.params.length} but it must be exactly 3.`);
    return {
      action: task.action,
      params: task.params.map(parseInt)
    }
  }


}
