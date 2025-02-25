import RogueCharacter from '@RE/RogueEngine/rogue-character/RogueCharacter.re';
import * as RE from 'rogue-engine';
import RapierKinematicCharacterController from '@RE/RogueEngine/rogue-rapier/Components/RapierKinematicCharacterController.re';
import * as THREE from 'three'
import { TaskSpec } from './TaskList.re'
import TaskList from './TaskList.re';
import NPCController from './NPCController.re';

/**
 * Workers do Tasks
 * 
 * Workers process tasks from TaskList.re.ts
 */
@RE.registerComponent
export default class Worker extends RE.Component {




    awake() {

    }

    start() {

    }



}