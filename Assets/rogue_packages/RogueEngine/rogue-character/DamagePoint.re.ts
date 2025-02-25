import * as RE from 'rogue-engine';
import RogueCharacter from '@RE/RogueEngine/rogue-character/RogueCharacter.re';

@RE.registerComponent
export default class DamagePoint extends RE.Component {
  @RE.props.num(0) multiplier = 1;

  applyDamage(damage: number) {
    const enemyCharacter = RogueCharacter.get(this.object3d, true);

    const actualDamage = damage * this.multiplier;

    enemyCharacter?.applyDamage(actualDamage);
  }
}
