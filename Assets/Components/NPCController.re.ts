import * as RE from 'rogue-engine';
import RapierKinematicCharacterController from '@RE/RogueEngine/rogue-rapier/Components/RapierKinematicCharacterController.re';
import * as THREE from 'three'
import RogueAnimator from '@RE/RogueEngine/rogue-animator/RogueAnimator.re';

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
    @RE.props.checkbox() repeat: boolean = true;
    @RE.props.num() taskCursor: number = 0;
    @RE.props.num() taskTimer: number = 0;


    @RapierKinematicCharacterController.require()
    characterController: RapierKinematicCharacterController;

    @RogueAnimator.require()
    animator: RogueAnimator;

    private taskSpec: TaskSpec;
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

    static parseKillTask(task: TaskSpec) {
        if (task.params.length !== 2) RE.Debug.logError(`parseKillTask expects 2 params. Got ${task.params.length}.`);
        let [target, duration] = task.params
        return { target, duration: parseInt(duration) }
    }



    static parseIdleTask(task: TaskSpec) {
        if (task.params.length !== 1) RE.Debug.logError(`parseIdleTask expects 1 params. Got ${task.params.length}.`);
        let [duration] = task.params
        return { duration: parseInt(duration) }
    }

    awake() {
        if (!RE.Runtime.isRunning) return;

    }

    start() {
        if (!this.characterController) {
            RE.Debug.logError("NPC is missing a Rapier Kinematic Character Controller!!!!!!!!!!!!!!")
        }
    }

    update() {
        // this.object3d.getWorldDirection(this.localFWD);
        this.animator.setBaseAction('idle')

        this.taskTimer += RE.Runtime.deltaTime
        if (this.activeTask === "") this.loadNextTask();
        this.processTask()
    }

    handleIdleTask() {
        this.animator.mix("idle")
        this.characterController.movementDirection.x = 0
        this.characterController.movementDirection.y = 0
        this.characterController.movementDirection.z = 0
        const { duration } = NPCController.parseIdleTask(this.taskSpec)
        if (this.taskTimer > duration) {
            RE.Debug.log("Idling complete.");
            this.loadNextTask()
        }
    }


    /** 
     * handleKillTask
     * find a target with that name within (500 distance(?))
     * look at the target
     * shoot the target
     * relocate 3-9 units
     * repeat
     */
    handleKillTask() {
        this.animator.mix("dance")
        const { target, duration } = NPCController.parseKillTask(this.taskSpec);
        this.characterController.movementDirection.x = 0
        this.characterController.movementDirection.y = 0
        this.characterController.movementDirection.z = 0
        // RE.Debug.clear()
        // RE.Debug.log(`killing ${target} for ${this.taskTimer}/${duration}`);
        if (this.taskTimer > duration) {
            RE.Debug.log("Killing done.");
            this.loadNextTask();
        }
    }

    handleWalkTask() {
        this.animator.mix("walk")
        const { params } = NPCController.parseWalkTask(this.taskSpec);
        const [x, y, z] = params;
        this.destination = new THREE.Vector3(x, y, z);
        this.translate()
    }

    // Get the next task and update the cursor
    loadNextTask(): void {
        this.resetTaskTimer();

        if (!this.tasks.length) {
            this.activeTask = "";
            return;
        }

        this.activeTask = this.tasks[this.taskCursor];

        // Move to the next task, looping if necessary
        this.taskCursor = (this.taskCursor + 1) % this.tasks.length;
    }

    // Parse and process the task
    processTask(): void {
        this.taskSpec = NPCController.parseTask(this.activeTask);
        this.activeTaskAction = this.taskSpec.action;

        switch (this.activeTaskAction) {
            case 'idle': this.handleIdleTask(); break;
            case 'walk': this.handleWalkTask(); break;
            case 'kill': this.handleKillTask(); break
            default: this.handleIdleTask(); break;
        }


    }

    resetTaskTimer() {
        this.taskTimer = 0
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
            // RE.Debug.log(`destination ${JSON.stringify(this.destination)} reached`)
            this.inputVelocity.z = 0; // Stop moving
            return this.loadNextTask();
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