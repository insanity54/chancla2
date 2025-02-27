import RogueCharacter from '@RE/RogueEngine/rogue-character/RogueCharacter.re';
import * as RE from 'rogue-engine';
import RapierKinematicCharacterController from '@RE/RogueEngine/rogue-rapier/Components/RapierKinematicCharacterController.re';
import * as THREE from 'three'


export type TaskSpec = {
    action: string,
    params: string[]
}

@RE.registerComponent
export default class NPCController extends RE.Component {

    @RE.props.vector2() lookSpeed = new THREE.Vector2(5, 5);
    @RE.props.vector3() destination = this.object3d.position.clone()


    @RE.props.text() activeTask: string = '';
    @RE.props.text() activeTaskAction: string = '';
    @RE.props.list.text() tasks: string[] = [];



    @RapierKinematicCharacterController.require()
    characterController: RapierKinematicCharacterController;



    private targetDirection = new THREE.Vector3();
    private dummy = new THREE.Object3D();


    private inputVelocity = new THREE.Vector3();

    // private _characterController: RapierKinematicCharacterController;

    private localFWD = new THREE.Vector3();




    static parseTask(activeTask: string): TaskSpec {
        let s = activeTask.split(',')
        return {
            action: s.shift() || '',
            params: s
        }
    }



    static parseWalkTask(task: TaskSpec) {
        if (task.params.length !== 3) RE.Debug.logError(`TaskSpec params was length ${task.params.length} but it must be exactly 3.`);
        // RE.Debug.log(`parseWalkTask! task.params=${JSON.stringify(task.params)}`)
        return {
            action: task.action,
            params: task.params.map((n) => parseInt(n))
        }
    }



    // get characterController() {
    //     if (!this._characterController) {
    //         return RapierKinematicCharacterController.get(this.object3d);
    //     }
    //     return this._characterController;
    // }

    awake() {
        if (!RE.Runtime.isRunning) return;

    }

    start() {
        // if (!this.characterController) {
        //     RE.Debug.logError("NPC is missing a Rapier Kinematic Character Controller!!!!!!!!!!!!!!")
        // }
    }

    update() {
        // this.object3d.getWorldDirection(this.localFWD);

        // this.characterController.movementDirection.x = 0
        // this.characterController.movementDirection.y = 0
        // this.characterController.movementDirection.z = 0

        if (this.activeTaskAction === 'idle') {
            return;
        }

        else if (this.activeTaskAction === 'walk') {
            // this.setRotation();
            this.translate();
        }

        // let tasks = this.taskList.tasks
        else if (this.activeTask === '') {
            // get a task
            this.getNextTask()


            // if (taskSpec.action === 'walk') NPCController.walk(taskSpec.params);
            // if (taskSpec.action === 'kill') NPCController.kill(taskSpec.params);

        }

        // RE.Debug.log(`tasks=${JSON.stringify(tasks)}`)
        // * Get the first task in the TaskList
        // * Parse the task to get the task type, args
        // * Execute the first task


    }



    getNextTask() {
        this.activeTask = this.tasks.shift() || ''

        const taskSpec: TaskSpec = NPCController.parseTask(this.activeTask)

        this.activeTaskAction = taskSpec.action
        // run the task
        if (taskSpec.action === 'walk') {
            const { action, params } = NPCController.parseWalkTask(taskSpec)
            const [x, y, z] = params
            // RE.Debug.log(`params=${JSON.stringify(params)} x=${x}, y=${y}, z=${z}`)
            this.destination = new THREE.Vector3(x, y, z)
        }

    }

    axesToDestination(): { x: number; y: number } {
        const forward = this.destination.clone().normalize(); // Ensure a unit direction vector

        // Create a rightward axis perpendicular to the forward direction
        const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

        // Vertical axis (simplified to just use Y component)
        const up = new THREE.Vector3(0, 1, 0);

        return { x: right.x, y: up.y };
    }


    setRotation() {
        // if (!this.characterController?.body) return;


        // Calculate the direction to the destination
        const direction = new THREE.Vector3();
        direction.subVectors(this.destination, this.object3d.position).normalize();

        // Create a dummy object to calculate the target rotation
        this.dummy.position.copy(this.object3d.position);
        this.dummy.lookAt(this.destination);

        // Get the target rotation from the dummy object
        this.dummy.getWorldDirection(this.targetDirection);

        // Smoothly rotate the object toward the destination
        const targetQuaternion = new THREE.Quaternion();
        targetQuaternion.setFromRotationMatrix(this.dummy.matrix);

        // Optionally, use slerp for smooth interpolation
        this.object3d.quaternion.slerp(targetQuaternion, (this.lookSpeed.x / 10) * RE.Runtime.deltaTime);

        // Apply the rotation to the character controller
        // this.characterController.body.setRotation(this.object3d.quaternion, true);
    }

    translate() {
        if (!this.characterController) {
            RE.Debug.logError("NPCController is missing characterController")
            return;
        }
        // RE.Debug.log('translating')

        // Calculate the direction to the destination
        const direction = new THREE.Vector3();
        direction.subVectors(this.destination, this.object3d.position).normalize();

        // Calculate the distance to the destination
        const distanceToDestination = this.object3d.position.distanceTo(this.destination);

        // Stop moving if the object is close enough to the destination
        if (distanceToDestination < 1) {
            RE.Debug.log(`destination ${JSON.stringify(this.destination)} reached`)
            this.inputVelocity.z = 0; // Stop moving
            this.getNextTask()
            return;
        }


        // Calculate the velocity in the direction of the waypoint
        this.inputVelocity.z = this.lookSpeed.x * RE.Runtime.deltaTime;

        // Set the movement direction for the character controller
        this.characterController.movementDirection.set(
            direction.x, // Move in the X direction toward the waypoint
            0,           // No vertical movement (Y axis)
            direction.z  // Move in the Z direction toward the waypoint
        );

    }

}