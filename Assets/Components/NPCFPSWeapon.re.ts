import RapierCollider from '@RE/RogueEngine/rogue-rapier/Components/Colliders/RapierCollider';
import RogueRapier from '@RE/RogueEngine/rogue-rapier/Lib/RogueRapier';
import RAPIER from '@dimforge/rapier3d-compat';
import * as RE from 'rogue-engine';
import * as THREE from 'three';
import RapierBody from '@RE/RogueEngine/rogue-rapier/Components/RapierBody.re';
import * as RFPS from '@RE/RogueEngine/rapier-fps';
import RapierKinematicCharacterController from '@RE/RogueEngine/rogue-rapier/Components/RapierKinematicCharacterController.re';

const q1 = new THREE.Quaternion();
const q2 = new THREE.Quaternion();
const q3 = new THREE.Quaternion();

type BulletParticle = {
    obj: THREE.Object3D;
    startPos: THREE.Vector3;
    targetPos: THREE.Vector3;
    distance: number;
    t: number;
}

@RE.registerComponent
export default class NPCFPSWeapon extends RE.Component {
    // @RE.props.select() firingStyle = 0;
    // firingStyleOptions = ["Raycast", "Projectile"];

    @RE.props.num(0) damage = 35;

    @RE.props.num(1) shots = 1;
    @RE.props.num(0) spread = 0;

    @RE.props.prefab() projectileParticle: RE.Prefab;
    @RE.props.num() particleSpeed = 15;

    @RE.props.audio(true) shotSFX: THREE.PositionalAudio;
    @RE.props.num(0, 1) shotSFXVolume = 1;
    @RE.props.num(0, 0.5) shotSFXRolloff = 0.07;
    @RE.props.audio(true) reloadSFX: THREE.PositionalAudio;
    @RE.props.object3d() barrel: THREE.Object3D;
    @RE.props.prefab() muzzleFlash: RE.Prefab;
    @RE.props.vector3() muzzleFlashScale = new THREE.Vector3(1, 1, 1);
    muzzleFlashObj: THREE.Object3D;

    @RE.props.select() firingMode = 0;
    firingModeOptions = ["Semi-Auto", "Auto"];

    @RE.props.num() firingRate = 200;
    @RE.props.num() fireRateCounter = 0;
    @RE.props.num() reloadTime = 2000;
    @RE.props.num() reloadCounter = 0;
    @RE.props.num() magSize = 30;
    @RE.props.num() totalRounds = 150;
    @RE.props.num() curRounds = this.totalRounds;
    @RE.props.num() loadedRounds = this.magSize;

    @RE.props.vector3() hipRecoilMin = new THREE.Vector3(8, 6, 10);
    @RE.props.vector3() hipRecoilMax = new THREE.Vector3(10, 6, 10);

    @RE.props.vector3() aimedRecoilMin = new THREE.Vector3(2, 4, 7);
    @RE.props.vector3() aimedRecoilMax = new THREE.Vector3(4, 4, 7);

    @RE.props.checkbox() overheat = false;
    @RE.props.num() heatPerShot = 10;
    @RE.props.num() maxHeat = 100;
    @RE.props.num() cooldownRate = 300;
    @RE.props.num() curHeat = 0;

    @RE.props.vector3() hipPos = new THREE.Vector3();
    @RE.props.vector3() aimPos = new THREE.Vector3();
    @RE.props.vector3() reloadPos = new THREE.Vector3();
    @RE.props.num() swaySmoothness = 8;
    @RE.props.num() swayAmount = 8;
    @RE.props.num(0) idleBobbing = 1;
    @RE.props.num(0) movementBobbing = 1;
    @RE.props.num(0, 1) aimMovementFactor = 0.3;
    @RE.props.checkbox() isEquiped = false;

    bulletMark = new THREE.Mesh(new THREE.SphereGeometry(0.02));

    // isEquiped = false;
    overheated = false;

    curAimPos = this.hipPos;

    swayDir = new THREE.Vector3();
    projectilesContainer: THREE.Object3D;

    private parent = this.object3d.parent
    private bullets: { [uuid: string]: BulletParticle } = {};

    // @RapierFirstPersonController.require(true)
    // fpsController: RapierFirstPersonController;

    // @NPCFPSController.require(true)
    // fpsController: NPCFPSController

    @RapierKinematicCharacterController.require(true)
    rkcc: RapierKinematicCharacterController

    get isReloading() {
        return this.reloadCounter !== 0;
    }

    get isAiming() {
        return this.curAimPos === this.aimPos;
    }

    get canShoot() {
        if (!this.isEquiped) return false;
        return this.fireRateCounter === 0 && this.loadedRounds > 0 && !this.isReloading && !this.overheated;
    }

    start() {
        if (this.muzzleFlash) {
            this.muzzleFlashObj = this.muzzleFlash.instantiate(this.object3d);
            this.muzzleFlashObj?.position.copy(this.barrel.position);
            this.muzzleFlashObj?.scale.set(0, 0, 0);
            this.muzzleFlashObj && (this.muzzleFlashObj.visible = false);
        }

        this.projectilesContainer = RE.Runtime.scene.getObjectByName("Projectiles") as THREE.Object3D;

        if (!this.projectilesContainer) {
            this.projectilesContainer = new THREE.Object3D();
            this.projectilesContainer.name = "Projectiles";
            RE.Runtime.scene.add(this.projectilesContainer);
        }
    }

    update() {
        this.animateMuzzleFlash();
        this.calculateFiringRate();
        this.doReload();
        this.cooldown();

        this.updateParticles();
    }

    cooldown() {
        this.curHeat -= this.cooldownRate * RE.Runtime.deltaTime;
        this.curHeat = Math.max(0, this.curHeat);

        if (this.overheated && this.curHeat <= 0) {
            this.curHeat = 0;
            this.overheated = false;
        }
    }

    calculateFiringRate() {
        if (this.fireRateCounter !== 0) {
            this.fireRateCounter -= RE.Runtime.deltaTime * 1000;
            if (this.fireRateCounter < 0) this.fireRateCounter = 0;
        }
    }

    shoot() {
        if (!this.canShoot) return;

        if (this.overheat) {
            this.curHeat += this.heatPerShot;

            if (this.curHeat >= this.maxHeat) {
                this.overheated = true;
            }
        }

        // RE.Debug.log(`Shooting from this.parent.name=${this.parent?.name}, this.name=${this.name}, this.parent.type=${this.parent?.type}`)
        if (!this.parent) return;

        this.fireRateCounter = this.firingRate;
        this.loadedRounds -= 1;

        this.muzzleFlashObj?.scale.set(0, 0, 0);
        this.muzzleFlashObj?.rotateZ(THREE.MathUtils.degToRad(90));
        this.muzzleFlashObj && (this.muzzleFlashObj.visible = true);

        for (let i = 0; i < this.shots; i++) {
            const bullet = this.projectileParticle.instantiate(this.projectilesContainer);
            this.barrel.getWorldPosition(bullet.position);
            this.parent.getWorldQuaternion(bullet.quaternion);

            q1.copy(this.object3d.quaternion);

            const distance = 20;
            const targetPos = this.object3d.position.clone();

            if (this.spread > 0) {
                let rotateX = Math.min(RFPS.randomRange(-this.spread, this.spread), this.spread);
                let rotateY = Math.min(RFPS.randomRange(-this.spread, this.spread), this.spread);

                bullet.rotateX(THREE.MathUtils.degToRad(rotateX));
                bullet.rotateY(THREE.MathUtils.degToRad(rotateY));

                this.object3d.rotateX(THREE.MathUtils.degToRad(rotateX));
                this.object3d.rotateY(THREE.MathUtils.degToRad(rotateY));
            } else {
                this.object3d.quaternion.copy(this.object3d.quaternion);
            }

            const startPos = bullet.position.clone();

            bullet.translateZ(distance);
            targetPos.copy(bullet.position);
            bullet.translateZ(-distance);

            this.bullets[bullet.uuid] = { obj: bullet, targetPos, distance, startPos, t: 0 };

            this.shootRaycast((intersection) => {
                this.bullets[bullet.uuid].targetPos.copy(intersection.point);
                this.bullets[bullet.uuid].distance = bullet.position.distanceTo(targetPos);

                bullet.lookAt(targetPos);

                this.onHit(intersection);
            });

            this.object3d.quaternion.copy(q1);
        }

        if (this.shotSFX) {
            this.shotSFX.isPlaying && this.shotSFX.stop();
            const detune = RFPS.randomRange(-100, 100);
            this.shotSFX.detune = detune;
            this.shotSFX.setRolloffFactor(this.shotSFXRolloff);
            this.shotSFX.setVolume(this.shotSFXVolume);
            this.shotSFX.play();
        }

        this.recoil();
    }

    onHit = (intersection: THREE.Intersection) => { }

    raycaster = new THREE.Raycaster();
    rayOrigin = new THREE.Vector3();
    rayDir = new THREE.Vector3();
    rapierRay = new RAPIER.Ray(this.rayOrigin, this.rayDir);

    private shootRaycast(onHit: (intersection: THREE.Intersection<THREE.Object3D>) => void) {
        this.object3d.getWorldPosition(this.rayOrigin);
        this.object3d.getWorldDirection(this.rayDir);

        const rigidbodies = RE.getComponents(RapierBody);
        const bodies = rigidbodies.filter(body => body.object3d !== this.object3d.parent && body.type !== 1)
            .map(body => body.object3d);

        this.raycaster.set(this.rayOrigin, this.rayDir);
        const intersections = this.raycaster.intersectObjects(bodies, true);

        if (intersections.length > 0) {
            // RE.Debug.log(`intersections with ${intersections.length} RapierBodies. ${intersections.map(i => i.object.name).join(', ')}`)
            return onHit(intersections[0]);
        }

        const res = RogueRapier.world.castRay(this.rapierRay, 1000, true, undefined, undefined, undefined, this.rkcc.characterColliders[0]?.body);

        if (res) {
            const components = RE.getComponents(RapierCollider as any) as RapierCollider[];
            const collider = components.find(comp => comp.collider === res.collider);
            if (!collider) return;

            const obj = collider.object3d instanceof THREE.Mesh ? collider.object3d : collider.object3d.parent;
            if (!obj) return;

            this.raycaster.set(this.rayOrigin, this.rayDir);
            const intersections = this.raycaster.intersectObject(obj, true);

            if (intersections.length < 1) return;
            // RE.Debug.log(`intersections with ${intersections.length} RapierColliders (${intersections.map((i) => i.object.name).join(', ')})`)

            onHit(intersections[0]);
        }

        else {
            RE.Debug.log("No intersections!")
        }
    }

    updateParticles() {
        const remove: BulletParticle[] = [];
        for (let uuid in this.bullets) {
            const bullet = this.bullets[uuid];
            RFPS.lerpV3(bullet.obj.position, bullet.targetPos, 0.2, this.particleSpeed * (10 / bullet.distance) * RE.Runtime.deltaTime);

            const distance = bullet.obj.position.distanceTo(bullet.startPos);

            if (distance >= (bullet.distance * 0.85)) remove.push(bullet);
        }

        remove.forEach(bullet => {
            delete this.bullets[bullet.obj.uuid];
            bullet.obj.parent?.remove(bullet.obj);
        });
    }

    aim() {
        this.curAimPos = this.aimPos;
    }

    hipAim() {
        this.curAimPos = this.hipPos;
    }

    reload() {
        if (this.curRounds <= 0) return;

        if (this.reloadCounter === 0 && this.loadedRounds < this.magSize) {
            if (this.reloadSFX) {
                this.reloadSFX.isPlaying && this.reloadSFX.stop();
                this.reloadSFX.duration = this.reloadTime / 1000;
                this.reloadSFX.play();
            }

            this.reloadCounter = this.reloadTime;
        }
    }

    private doReload() {
        if (!this.isReloading || this.curRounds <= 0) return;

        this.reloadCounter -= RE.Runtime.deltaTime * 1000;

        this.curAimPos = this.reloadPos;

        if (this.reloadCounter <= 0) {
            this.reloadCounter = 0;
            const curRounds = this.curRounds - (this.magSize - this.loadedRounds);
            this.loadedRounds = this.curRounds < this.magSize ? this.curRounds : this.magSize;
            this.curRounds = Math.max(0, curRounds);
        }
    }

    recoil() {
        const recoil = this.isAiming ?
            RFPS.randomRange(this.aimedRecoilMin.x, this.aimedRecoilMax.x, true) :
            RFPS.randomRange(this.hipRecoilMin.x, this.hipRecoilMax.x, true);

        const recoilY = this.isAiming ?
            RFPS.randomRange(this.aimedRecoilMin.y, this.aimedRecoilMax.y, true) :
            RFPS.randomRange(this.hipRecoilMin.y, this.hipRecoilMax.y, true);

        this.object3d.position.z += (this.isAiming ?
            RFPS.randomRange(this.aimedRecoilMin.z, this.aimedRecoilMax.z) :
            RFPS.randomRange(this.hipRecoilMin.z, this.hipRecoilMax.z)
        ) * 0.001;

        const deltaRotY = Math.random() < 0.5 ? recoil : -recoil;
        const deltaRotX = Math.random() < 0.5 ? recoilY : -recoilY;

        this.swayDir.set(0, 1, 0);
        q2.setFromAxisAngle(this.swayDir, THREE.MathUtils.degToRad(deltaRotY + 180));

        this.swayDir.set(1, 0, 0);
        q1.setFromAxisAngle(this.swayDir, THREE.MathUtils.degToRad(deltaRotX));
        q3.setFromAxisAngle(this.swayDir, THREE.MathUtils.degToRad(deltaRotX * 10 * RE.Runtime.deltaTime));

        q2.multiply(q1.multiply(q3));

        this.object3d.quaternion.slerp(q2, this.swaySmoothness * RE.Runtime.deltaTime);
    }

    animateMuzzleFlash() {
        if (!this.isEquiped) return;
        const fullSize = this.muzzleFlashScale.z - 0.01;

        if (this.muzzleFlashObj?.visible && this.muzzleFlashObj?.scale.z >= fullSize) {
            this.muzzleFlashObj.visible = false;
        }

        if (this.muzzleFlashObj?.visible && this.muzzleFlashObj?.scale.z <= fullSize) {
            this.muzzleFlashObj?.scale.lerp(this.muzzleFlashScale, RE.Runtime.deltaTime * 80);
        }
    }
}
