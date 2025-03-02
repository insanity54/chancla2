import * as RE from 'rogue-engine';
import RapierKinematicCharacterController from '@RE/RogueEngine/rogue-rapier/Components/RapierKinematicCharacterController.re';
import * as THREE from 'three'
import RogueAnimator from '@RE/RogueEngine/rogue-animator/RogueAnimator.re';
import * as RAPIER from '@dimforge/rapier3d-compat';
import RapierBody, { RapierCollisionInfo } from '@RE/RogueEngine/rogue-rapier/Components/RapierBody.re';
import TowerController from './TowerController.re';
import NPCFPSWeapon from './NPCFPSWeapon.re';
import { randomInt } from 'Assets/Helpers/util';

export type TaskSpec = {
    action: string,
    params: string[]
}

type OnCollisionCallback = (info: RapierCollisionInfo) => void;


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
    @RE.props.num(0, 1) slerpFactor: number = 0.3; // lower is smoother, higher is faster
    @RE.props.num() sensorRange: number = 50;
    @RE.props.audio() audioJumpjet: THREE.PositionalAudio;

    @RapierKinematicCharacterController.require()
    characterController: RapierKinematicCharacterController;

    @RogueAnimator.require()
    animator: RogueAnimator;

    @NPCFPSWeapon.require()
    weapon: NPCFPSWeapon;

    @RapierBody.require()
    body: RapierBody

    private rapierWorld: RAPIER.World;
    private taskSpec: TaskSpec;
    private targetDirection = new THREE.Vector3();
    private targetPosition = new THREE.Vector3();
    // private npcPos
    private dummy = new THREE.Object3D();
    private target: THREE.Object3D | undefined;
    private direction: THREE.Vector3;
    private targetQuaternion: THREE.Quaternion;
    private currentRotation: THREE.Quaternion;
    private sensorCollider?: RAPIER.Collider; // Sensor collider for target detection


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

    static parseJumpjetTask(task: TaskSpec) {
        if (task.params.length !== 4) RE.Debug.logError(`parseJumpjetTask expects 4 params, got ${task.params.length}`);
        let [x, y, z, duration] = task.params.map((n) => parseInt(n))
        return { x, y, z, duration }
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
            // RE.Debug.log("Idling complete.");
            this.loadNextTask()
        }
    }

    handleJumpjetTask() {
        if (this.audioJumpjet && !this.audioJumpjet.isPlaying) this.audioJumpjet.play();
        this.animator.mix("jump")
        const { x, y, z, duration } = NPCController.parseJumpjetTask(this.taskSpec)
        this.characterController.movementDirection.y = y
        this.characterController.movementDirection.x = x
        this.characterController.movementDirection.z = z
        if (this.taskTimer > duration) {
            // delete us to simulate the guy leaving the scene
            this.object3d.parent?.remove(this.object3d)
        }
    }



    acquireTarget(targetName: string, range: number): void {

        // const targets = RE.Runtime.scene.getObjectsByProperty('radarTarget', true)
        // if (targets.length > 0) {
        //     RE.Debug.log(`radarTargets=${JSON.stringify(targets)}`)
        // }
        let targets: THREE.Object3D[] = []
        RE.traverseComponents((component) => {
            if (component.object3d.name !== targetName) return;
            targets.push(component.object3d)
            // component.collider.setTranslationWrtParent(component.object3d.position);
        });

        // RE.Debug.log(`targets=${targets.map((t) => t.name).join(', ')}`)
        // return targets
        // get the closest target
        // targets.sort((a, b) => {
        //     return a.position.distanceTo(this.object3d.position) - b.position.distanceTo(this.object3d.position)
        // })
        this.target = targets[randomInt(0, targets.length)]


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
        this.animator.mix("idle")
        const { target, duration } = NPCController.parseKillTask(this.taskSpec);
        this.characterController.movementDirection.x = 0
        this.characterController.movementDirection.y = 0
        this.characterController.movementDirection.z = 0
        // RE.Debug.clear()
        // RE.Debug.log(`killing ${target} for ${this.taskTimer}/${duration}`);

        // @todo make him shoot the target
        // @todo   * [x] acquire target

        if (!this.target) this.acquireTarget(target, this.sensorRange);
        if (this.target && this.characterController.body) {


            // @todo   * [x] look at target
            this.targetPosition = this.target.position.clone();

            this.direction = this.targetPosition.sub(this.object3d.position).normalize();
            const angle = Math.atan2(this.direction.x, this.direction.z); // Yaw rotation (Y-axis)

            // Convert angle to a quaternion
            this.targetQuaternion = new THREE.Quaternion();
            this.targetQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle);

            // Get current rotation
            this.currentRotation = this.object3d.quaternion.clone();

            // Interpolate smoothly (adjust factor for speed)
            const interpolated = this.currentRotation.slerp(this.targetQuaternion, this.slerpFactor); // 0.2 = smoother, 0.5 = faster

            // Apply rotation to the RigidBody
            // this.object3d.quaternion.slerp(rotationQuaternion, 1);
            this.characterController.body.setRotation(interpolated, true)

        }

        // @todo   * [ ] shoottarget
        // this.fpsWeapon
        // this.weapon.
        //     this.weapon.shoot()




        if (this.taskTimer > duration) {
            // RE.Debug.log("Killing done.");
            this.target = undefined
            this.loadNextTask();
        }
    }

    handleWalkTask() {
        this.animator.mix("walk")
        const { params } = NPCController.parseWalkTask(this.taskSpec);
        const [x, y, z] = params;
        this.destination = new THREE.Vector3(x, y, z);


        // @todo look in the direction of travel

        this.translate()
    }

    resetTasks(): void {
        this.tasks = ["idle,1"];
        this.taskCursor = 0;
        this.loadNextTask()
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
            case 'jumpjet': this.handleJumpjetTask(); break;
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