import * as RE from 'rogue-engine';
import RogueCharacter from '@RE/RogueEngine/rogue-character/RogueCharacter.re';
import { Object3D } from 'three';

@RE.registerComponent
export default class HUD extends RE.Component {


  healthbar: HTMLDivElement;
  shieldbar: HTMLDivElement;


  hudEl: HTMLDivElement;
  shieldEl: HTMLDivElement;
  healthEl: HTMLDivElement;

  private character: RogueCharacter;
  private curHP: number;
  private curShield: number;

  start() {


    // this.infoUI.div.style.pointerEvents = "none";

    // this.healthbar = this.infoUI.div.querySelector(".health-bar-inner") as HTMLDivElement;
    // this.shieldbar = this.infoUI.div.querySelector(".shield-bar-inner") as HTMLDivElement;


    this.hudEl = document.createElement("div");
    this.shieldEl = document.createElement("div");
    this.healthEl = document.createElement("div");
    this.shieldEl.textContent = "SHIELD x"
    this.healthEl.textContent = "HEALTH y"
    this.hudEl.appendChild(this.healthEl)
    this.hudEl.appendChild(this.shieldEl)
    RE.Runtime.uiContainer.appendChild(this.hudEl)


    // private createDivWithStyle(styles: Partial<Record<string, string>>): HTMLElement {
    //   const div = document.createElement('div');
    //   Object.assign(div.style, styles);
    //   if (styles.textContent) div.textContent = styles.textContent;
    //   return div;
    // }
    // this.stat = Stats();
    // this.stat.setMode(0);
    // this.stat.domElement.style.position = 'absolute';
    // this.stat.domElement.style.left = '0';
    // this.stat.domElement.style.top = '0';
    // RE.Runtime.uiContainer.appendChild( this.stat.domElement );
  }

  update() {
    if (!this.character) {
      const playersGroup = RE.Runtime.scene.getObjectByName("Players") as Object3D;
      let characterObject = playersGroup.children.find((player) => player.name === 'FirstPersonCharacter')
      if (characterObject) this.character = RogueCharacter.get(characterObject);
    } else {
      this.curHP = Math.floor(this.character.curHP);
      this.curShield = Math.floor(this.character.curShield);
      this.healthEl.textContent = `HP ${this.curHP}`
      this.shieldEl.textContent = `SHIELD ${this.curShield}`
    }
  }
}

