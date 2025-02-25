import * as RE from 'rogue-engine';
import Game from './Game.re';

/**
 * updates Game.fallOut when object3d is below n
 */

@RE.registerComponent
export default class Fallable extends RE.Component {

  @RE.props.num() deathY: number = -20;

  awake() {

  }

  start() {

  }

  update() {
    if (this.object3d.position.y < this.deathY) {
      this.keepScore()

    }
  }

  keepScore() {
    const game = Game.get()
    game.fallOut = true
  }

}
