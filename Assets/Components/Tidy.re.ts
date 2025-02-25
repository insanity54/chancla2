import * as RE from 'rogue-engine';

/**
 * Tidy cleans up after itself by deleting itself after a timeout
 */
@RE.registerComponent
export default class Tidy extends RE.Component {


    @RE.props.num() timeout: number = 1000;

    start() {
        let obj = this.object3d
        setTimeout(() => obj.parent?.remove(obj), this.timeout)
    }

}
