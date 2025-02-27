import * as RE from 'rogue-engine';
import Task from './Task.re'



@RE.registerComponent
export default class TaskList extends RE.Component {

  @RE.props.text() activeTask: string = '';
  @RE.props.text() activeTaskAction: string = '';
  @RE.props.list.text() tasks: string[] = [];


  get taskList() {
    return (!this._taskList) ? TaskList.get(this.object3d) : this._taskList;
  }

  private _taskList: TaskList;
  private taskAction: string;
  private taskParams: string[];


  awake() {

  }

  start() {

  }


  update() {

  }


  // taskSpecParser(spec: string): TaskSpec {
  //   // Split the spec string into parts
  //   const parts = spec.split(',');

  //   // Extract the action (first part)
  //   const action = parts[0].trim();

  //   // Extract the parameters (remaining parts)
  //   const params = parts.slice(1).map(param => {
  //     // Try to parse numbers, otherwise keep as strings
  //     const parsed = parseFloat(param);
  //     return isNaN(parsed) ? param.trim() : parsed;
  //   });

  //   // Return the TaskSpec object
  //   return {
  //     action,
  //     params,
  //   };
  // }

}