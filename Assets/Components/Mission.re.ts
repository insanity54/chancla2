import * as RE from 'rogue-engine';


export type TaskSpec = {
    action: string,
    params: (string | number)[]
}

@RE.registerComponent
export default class Mission extends RE.Component {

    @RE.props.text() activeTask: string = '';
    @RE.props.text() activeTaskAction: string = '';
    @RE.props.list.text() tasks: string[] = [];


    //   get taskList() {
    //     return (!this._taskList) ? TaskList.get(this.object3d) : this._taskList;
    //   }
}