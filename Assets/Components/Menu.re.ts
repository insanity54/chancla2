import * as RE from 'rogue-engine';
import UIComponent from './UIComponent.re';

@RE.registerComponent
export default class Menu extends RE.Component {


    @RE.props.component(UIComponent) ui: UIComponent;

    awake(): void {
    }

    start() {
        setTimeout(() => this.ui.show())
    }

    update() {
    }
}