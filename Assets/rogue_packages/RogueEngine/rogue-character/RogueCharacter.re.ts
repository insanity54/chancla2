import * as RE from 'rogue-engine';

@RE.registerComponent
export default class RogueCharacter extends RE.Component {
  @RE.props.select() type = "Friendly";
  typeOptions = [
    {name: "Friendly", value: "Friendly"}, 
    {name: "Enemy", value: "Enemy"}
  ];

  @RE.props.num(0) hp = 100;
  @RE.props.num(0) shield = 100;
  @RE.props.num(0) armor = 10;
  @RE.props.num(0) stamina = 100;

  @RE.props.num(0) hpRegen = 20;
  @RE.props.num(0) shieldRegen = 20;
  @RE.props.num(0) staminaRegen = 20;

  @RE.props.num(0) hpRegenWait = 1.5;
  @RE.props.num(0) shieldRegenWait = 1.5;
  @RE.props.num(0) staminaRegenWait = 1;

  @RE.props.num(0) curHP = this.hp;
  @RE.props.num(0) curShield = this.shield;
  @RE.props.num(0) curStamina = this.stamina;

  curHpRegenWait = 0;
  curShieldRegenWait = 0;
  curStaminaRegenWait = 0;

  afterUpdate() {
    if (this.curHP === 0) return;

    this.curHpRegenWait = Math.max(this.curHpRegenWait - RE.Runtime.deltaTime, 0);

    if (this.hpRegen > 0 && this.curHP < this.hp && this.curHpRegenWait === 0) {
      this.curHP = Math.min(this.curHP + (this.hpRegen * RE.Runtime.deltaTime), this.hp);
    }

    this.curShieldRegenWait = Math.max(this.curShieldRegenWait - RE.Runtime.deltaTime, 0);

    if (this.shieldRegen > 0 && this.curShield < this.shield && this.curShieldRegenWait === 0) {
      this.curShield = Math.min(this.curShield + (this.shieldRegen * RE.Runtime.deltaTime), this.shield);
    }

    this.curStaminaRegenWait = Math.max(this.curStaminaRegenWait - RE.Runtime.deltaTime, 0);

    if (this.staminaRegen > 0 && this.curStamina < this.shield && this.curStaminaRegenWait === 0) {
      this.curStamina = Math.min(this.curStamina + (this.staminaRegen * RE.Runtime.deltaTime), this.stamina);
    }
  }

  spendStamina(amount: number) {
    if (amount < 0) return;
    this.curStamina = Math.max(this.curStamina - amount, 0);
    this.curStaminaRegenWait = this.staminaRegenWait;
  }

  recoverStamina(amount: number) {
    if (amount < 0) return;
    this.curStamina = Math.min(this.curStamina + amount, this.stamina);
  }

  recoverShield(amount: number) {
    if (amount < 0) return;
    this.curShield = Math.min(this.curShield + amount, this.shield);
  }

  heal(amount: number) {
    if (amount < 0) return;
    this.curHP = Math.min(this.curHP + amount, this.hp);
  }

  applyDamage(damage: number) {
    if (damage < 0) return;
    let actualDamage = damage;

    if (this.shield > 0) {
      this.curShieldRegenWait = this.shieldRegenWait;
    }

    this.curHpRegenWait = this.hpRegenWait;

    if (this.shield > 0 && this.curShield > 0) {
      actualDamage = this.curShield - damage;
      this.curShield = Math.max(actualDamage, 0);
  
      actualDamage = Math.abs(actualDamage);

      if (this.curShield > 0) return;
    }

    actualDamage = Math.max(actualDamage - this.armor, 0);

    this.curHP = Math.max(this.curHP - actualDamage, 0);
  }
}
