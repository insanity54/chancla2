import * as RE from 'rogue-engine';
import Task from './Task.re'


export type TaskSpec = {
  action: string,
  params: (string | number)[]
}

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

    // let tasks = this.taskList.tasks
    if (this.activeTask === '') {
      // get a task
      this.completeActiveTask()

      let taskSpec: TaskSpec = TaskList.parseTask(this.activeTask)

      this.activeTaskAction = taskSpec.action
      // run the task
      // if (taskSpec.action === 'walk') NPCController.walk(taskSpec.params);
      // if (taskSpec.action === 'kill') NPCController.kill(taskSpec.params);

    }

    // RE.Debug.log(`tasks=${JSON.stringify(tasks)}`)
    // * Get the first task in the TaskList
    // * Parse the task to get the task type, args
    // * Execute the first task


  }

  completeActiveTask() {
    this.activeTask = this.taskList.tasks.shift() || ''
  }

  static parseTask(activeTask: string): TaskSpec {
    let s = activeTask.split(',')
    return {
      action: s.shift() || '',
      params: s
    }
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