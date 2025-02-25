import RogueCharacter from '@RE/RogueEngine/rogue-character/RogueCharacter.re';
import * as RE from 'rogue-engine';
import RapierKinematicCharacterController from '@RE/RogueEngine/rogue-rapier/Components/RapierKinematicCharacterController.re';
import * as THREE from 'three'
import TaskList from './TaskList.re';

@RE.registerComponent
export default class NPCController extends RE.Component {

    @RE.props.vector2() lookSpeed = new THREE.Vector2(5, 5);
    @RE.props.vector3() destination = this.object3d.position.clone()


    private targetDirection = new THREE.Vector3();
    private dummy = new THREE.Object3D();

    private _taskList: TaskList

    private inputVelocity = new THREE.Vector3();

    private _characterController: RapierKinematicCharacterController;

    private localFWD = new THREE.Vector3();

    get taskList() {
        return (!this._taskList) ? TaskList.get(this.object3d) : this._taskList
    }


    get characterController() {
        if (!this._characterController) {
            return RapierKinematicCharacterController.get(this.object3d);
        }
        return this._characterController;
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
        this.object3d.getWorldDirection(this.localFWD);

        this.characterController.movementDirection.x = 0
        this.characterController.movementDirection.y = 0
        this.characterController.movementDirection.z = 0


        if (this.taskList.activeTask && this.taskList.activeTaskAction === 'walk') {
            this.setRotation();
            this.translate();
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
        if (!this.characterController?.body) return;


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
        this.characterController.body.setRotation(this.object3d.quaternion, true);
    }

    translate() {
        if (!this.characterController) return;

        // Calculate the direction to the destination
        const direction = new THREE.Vector3();
        direction.subVectors(this.destination, this.object3d.position).normalize();

        // Calculate the distance to the destination
        const distanceToDestination = this.object3d.position.distanceTo(this.destination);

        // Stop moving if the object is close enough to the destination
        if (distanceToDestination < 1) {
            this.inputVelocity.z = 0; // Stop moving
            this.taskList.completeActiveTask()
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