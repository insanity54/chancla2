import * as RE from 'rogue-engine';


@RE.registerComponent
export default class Task extends RE.Component {

    @RE.props.select() taskType = 0;
    taskTypeOptions = [
        "Walk",
        "Kill"
    ]

    awake() {

    }

    start() {

    }

    update() {

    }

}