import * as RE from 'rogue-engine';
import Game from './Game.re';
import RogueCharacter from '@RE/RogueEngine/rogue-character/RogueCharacter.re';
import Explosive from './Explosive.re';
import Bounded from './Bounded.re';

@RE.registerComponent


export default class Killable extends RE.Component {
    @RE.props.checkbox() killed: boolean = false;
    character: RogueCharacter
    explosive: Explosive
    bounded: Bounded

    awake() {
        this.character = RE.getComponent(RogueCharacter, this.object3d)
        this.explosive = RE.getComponent(Explosive, this.object3d)
        this.bounded = RE.getComponent(Bounded, this.object3d)
    }

    @RE.props.num() souls: number = 1;
    keepScore() {
        const game = Game.get()
        if (this.character.type === "Enemy") {
            game.kills += this.souls
        } else {
            game.deaths += this.souls
        }
    }

    explode() {
        this.explosive.explode = true
    }

    cleanup() {
        const obj = this.object3d
        if (!obj) return;
        if (!obj.parent) {
            RE.Debug.logError("cleanup obj.parent is missing!")
        } else {
            obj.parent.remove(obj)
        }
    }

    kill() {
        this.keepScore()
        this.explode()
        setTimeout(this.cleanup, 2000)
    }


    update() {
        if (
            (this.character.curHP === 0)
            || (this.bounded && this.bounded.fallOut)
        ) {
            this.kill()
        }
    }
}
