import * as RE from 'rogue-engine';
import * as THREE from 'three';
import * as Q from 'three.quarks';
import QuarksAddon from './QuarksAddon.re';

const updateBatchRenderer = Q.BatchedParticleRenderer.prototype.update;

Q.BatchedParticleRenderer.prototype.update = function() {
  const dt = RE.App.sceneController.deltaTime;
  updateBatchRenderer.bind(this)(dt);
}

@RE.registerComponent
export default class RogueQuarks extends RE.Component {
  private _onEmitDiedInternalListener = () => {
    this.play();
  }

  onBeforeObjectRemoved(): void {
    this.disposeSystem();
  }

  disposeSystem() {
    let particleSystem = RE.App.sceneController.scene.getObjectByName(this.uuid+this.object3d.uuid) as Q.ParticleEmitter;
    particleSystem?.system?.endEmit();
    particleSystem?.parent?.remove(particleSystem);

    this.particleSystem?.emitter?.parent?.remove(this.particleSystem?.emitter);

    let batchRenderer = RE.App.sceneController.scene.getObjectByName("Q.BatchRenderer") as Q.BatchedRenderer;

    if (batchRenderer) {
      batchRenderer.deleteSystem(particleSystem?.system || this.particleSystem);
    }
  }

  playLabel = "Play";

  @RE.props.button()
  play() {
    if (RE.Runtime.isRunning) return;

    this.particleSystem?.removeAllEventListeners("emitEnd");

    if (this.playLabel === "Play") {
      this.disposeSystem();
      //@ts-ignore
      this.particleSystem = undefined;
      this.playLabel = "Stop";
      this.init();
      this.particleSystem.addEventListener("emitEnd", this._onEmitDiedInternalListener);
    }
    else {
      this.disposeSystem();
      this.playLabel = "Play";
    }
  }

  private _worldSpace = false;
  @RE.props.checkbox() 
  get worldSpace() {
    return this._worldSpace;
  }

  set worldSpace(v: boolean) {
    this._worldSpace = v;
    if (this.particleSystem) this.particleSystem.worldSpace = v;
  }

  private _looping = true;
  @RE.props.checkbox()
  get looping() {
    return this._looping;
  }

  set looping(v: boolean) {
    this._looping = v;
    if (this.particleSystem) this.particleSystem.looping = v;
  }

  @RE.props.select() renderMode = 0;
  renderModeOptions = ["Billboard", "Mesh", "StretchedBillboard", "Trail"];

  private _material: THREE.Material;
  @RE.props.material()
  get material() {
    return this._material;
  }

  set material(v: THREE.Material) {
    this._material = v;
    if (this.particleSystem) this.particleSystem.material = v;
  }
  
  @RE.props.object3d() mesh: THREE.Mesh;

  private _colorA = new THREE.Color();
  @RE.props.color()
  get colorA() {
    return this._colorA;
  }

  set colorA(v: THREE.Color) {
    this._colorA = v;
    if (this.particleSystem?.startColor instanceof Q.ColorRange) {
      this.particleSystem.startColor.a.set(v.r, v.g, v.b, this.alphaA);
    }
  }

  private _alphaA = 1;
  @RE.props.num()
  get alphaA() {
    return this._alphaA;
  }

  set alphaA(v: number) {
    this._alphaA = v;
    if (this.particleSystem?.startColor instanceof Q.ColorRange) {
      this.particleSystem.startColor.a.set(this._colorA.r, this._colorA.g, this._colorA.b, this.alphaA);
    }
  }

  private _colorB = new THREE.Color();
  @RE.props.color()
  get colorB() {
    return this._colorB;
  }

  set colorB(v: THREE.Color) {
    this._colorB = v;
    if (this.particleSystem?.startColor instanceof Q.ColorRange) {
      this.particleSystem.startColor.b.set(v.r, v.g, v.b, this.alphaA);
    }
  }

  private _alphaB = 1;
  @RE.props.num()
  get alphaB() {
    return this._alphaB;
  }

  set alphaB(v: number) {
    this._alphaB = v;
    if (this.particleSystem?.startColor instanceof Q.ColorRange) {
      this.particleSystem.startColor.b.set(this._colorB.r, this._colorB.g, this._colorB.b, this.alphaB);
    }
  }

  private _duration = 1;
  @RE.props.num()
  get duration() {
    return this._duration;
  }

  set duration(v: number) {
    this._duration = v;
    if (this.particleSystem) this.particleSystem.duration = v;
  }

  private _minLife = 0.1;
  @RE.props.num(0)
  get minLife() {
    return this._minLife;
  }

  set minLife(v: number) {
    this._minLife = v;
    if (this.particleSystem) {
      this.particleSystem.startLife = new Q.IntervalValue(this.minLife, this.maxLife);
    }
  }

  private _maxLife = 0.1;
  @RE.props.num(0)
  get maxLife() {
    return this._maxLife;
  }

  set maxLife(v: number) {
    this._maxLife = v;
    if (this.particleSystem) {
      this.particleSystem.startLife = new Q.IntervalValue(this.minLife, this.maxLife);
    }
  }

  private _minSpeed = 2;
  @RE.props.num(0)
  get minSpeed() {
    return this._minSpeed;
  }

  set minSpeed(v: number) {
    this._minSpeed = v;
    if (this.particleSystem) {
      this.particleSystem.startSpeed = new Q.IntervalValue(this.minSpeed, this.maxSpeed);
    }
  }

  private _maxSpeed = 2;
  @RE.props.num(0)
  get maxSpeed() {
    return this._maxSpeed;
  }

  set maxSpeed(v: number) {
    this._maxSpeed = v;
    if (this.particleSystem) {
      this.particleSystem.startSpeed = new Q.IntervalValue(this.minSpeed, this.maxSpeed);
    }
  }

  private _minSize = 1;
  @RE.props.num(0)
  get minSize() {
    return this._minSize;
  }

  set minSize(v: number) {
    this._minSize = v;
    if (this.particleSystem) {
      this.particleSystem.startSize = new Q.IntervalValue(this.minSize, this.maxSize);
    }
  }

  private _maxSize = 1;
  @RE.props.num(0)
  get maxSize() {
    return this._maxSize;
  }

  set maxSize(v: number) {
    this._maxSize = v;
    if (this.particleSystem) {
      this.particleSystem.startSize = new Q.IntervalValue(this.minSize, this.maxSize);
    }
  }

  private _minRotation = 0;
  @RE.props.num(0)
  get minRotation() {
    return this._minRotation;
  }

  set minRotation(v: number) {
    this._minRotation = v;
    if (this.particleSystem) {
      this.particleSystem.startRotation = new Q.IntervalValue(this.minRotation, this.maxSize);
    }
  }

  private _maxRotation = 10;
  @RE.props.num(0)
  get maxRotation() {
    return this._maxRotation;
  }

  set maxRotation(v: number) {
    this._maxRotation = v;
    if (this.particleSystem) {
      this.particleSystem.startRotation = new Q.IntervalValue(this.minRotation, this.maxSize);
    }
  }

  private _fade = 0;
  @RE.props.num(0, 1) 
  get fade() {
    return this._fade;
  }

  set fade(value: number) {
    this._fade = value;
    if (!this.particleSystem) return;

    this.lifetimeColorGradient.color.keys = [
      [new Q.Vector3(1, 1, 1), 0],
    ];

    this.lifetimeColorGradient.alpha.keys = value > 0 ? [
      [this.fade >= 1 ? 0 : 1, 0],
      [this.fade >= 1 ? 0 : 0.1, 1-(this.fade*1.1)],
      [this.fade >= 1 ? 0 : 0.05, 1-(this.fade*1.05)],
      [0, 1-this.fade]
    ] : [[1,0]];
  }

  private _emissionOverDistance = 0;
  @RE.props.num()
  get emissionOverDistance() {
    return this._emissionOverDistance;
  }

  set emissionOverDistance(v: number) {
    this._emissionOverDistance = v;
    if (this.particleSystem) this.particleSystem.emissionOverDistance = new Q.ConstantValue(v);
  }

  private _emissionOverTime = 2;
  @RE.props.num()
  get emissionOverTime() {
    return this._emissionOverTime;
  }

  set emissionOverTime(v: number) {
    this._emissionOverTime = v;
    if (this.particleSystem) this.particleSystem.emissionOverTime = new Q.ConstantValue(v);
  }

  @RE.props.num() speedFactor = 0;
  @RE.props.num() startLength = 1;
  @RE.props.checkbox() followLocalOrigin = false;

  private _blendTiles = true;
  @RE.props.checkbox()
  get blendTiles() {
    return this._blendTiles;
  }

  set blendTiles(v: boolean) {
    this._blendTiles = v;
    if (this.particleSystem) this.particleSystem.blendTiles = v;
  }

  private _prewarm = true;
  @RE.props.checkbox()
  get prewarm() {
    return this._prewarm;
  }

  set prewarm(v: boolean) {
    this._prewarm = v;
    if (this.particleSystem) this.particleSystem.prewarm = v;
  }

  private _startTileIndex = 0;
  @RE.props.num()
  get startTileIndex() {
    return this._startTileIndex;
  }

  set startTileIndex(v: number) {
    this._startTileIndex = v;
    if (this.particleSystem) this.particleSystem.startTileIndex = new Q.ConstantValue(v);
  }

  private _uTileCount = 1;
  @RE.props.num()
  get uTileCount() {
    return this._uTileCount;
  }

  set uTileCount(v: number) {
    this._uTileCount = v;
    if (this.particleSystem) this.particleSystem.uTileCount = v;
  }

  private _vTileCount = 1;
  @RE.props.num()
  get vTileCount() {
    return this._vTileCount;
  }

  set vTileCount(v: number) {
    this._vTileCount = v;
    if (this.particleSystem) this.particleSystem.vTileCount = v;
  }

  private _renderOrder = 0;
  @RE.props.num()
  get renderOrder() {
    return this._renderOrder;
  }

  set renderOrder(v: number) {
    this._renderOrder = v;
    if (this.particleSystem) this.particleSystem.renderOrder = v;
  }

  particleSystem: Q.ParticleSystem;
  batchSystem = new Q.BatchedParticleRenderer();
  lifetimeColorGradient = new Q.Gradient();

  awake() {
    //@ts-ignore
    this.particleSystem = undefined;
  }

  start() {
    this.init();
  }

  init() {

    this.particleSystem = new Q.ParticleSystem(
      {
        looping: this.looping,
        worldSpace: this.worldSpace,

        instancingGeometry: this.mesh?.geometry || undefined,

        autoDestroy: true,

        duration: this.duration,
        startLife: new Q.IntervalValue(this.minLife, this.maxLife),
        startSpeed: new Q.IntervalValue(this.minSpeed, this.maxSpeed),
        startRotation: new Q.IntervalValue(this.minRotation, this.maxRotation),
        startSize: new Q.IntervalValue(this.minSize, this.maxSize),
        startLength: new Q.ConstantValue(this.startLength),
        startColor: new Q.ColorRange(
          new Q.Vector4(...this.colorA.toArray(), this.alphaA),
          new Q.Vector4(...this.colorB.toArray(), this.alphaB)
        ),

        emissionOverDistance: new Q.ConstantValue(this.emissionOverDistance),
        emissionOverTime: new Q.ConstantValue(this.emissionOverTime),
        emissionBursts: [],

        shape: new Q.PointEmitter(),

        material:
          this.material ||
          new THREE.PointsMaterial({
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false,
            transparent: true,
          }),
        startTileIndex: new Q.ConstantValue(this.startTileIndex),
        uTileCount: this.uTileCount,
        vTileCount: this.vTileCount,
        renderOrder: this.renderOrder,
        blendTiles: this.blendTiles,
        prewarm: this.prewarm,
        speedFactor: this.speedFactor,
        
        renderMode: Q.RenderMode[this.renderModeOptions[this.renderMode]],
        rendererEmitterSettings: {
          startLength: new Q.ConstantValue(this.startLength),
          speedFactor: new Q.ConstantValue(this.speedFactor),
          followLocalOrigin: this.followLocalOrigin,
        },
      }
    );

    this.lifetimeColorGradient = new Q.Gradient(
      [
        [new Q.Vector3(1, 1, 1), 0],
      ], this.fade > 0 ? [
        [this.fade >= 1 ? 0 : 1, 0],
        [this.fade >= 1 ? 0 : 0.1, 1-(this.fade*1.1)],
        [this.fade >= 1 ? 0 : 0.05, 1-(this.fade*1.05)],
        [0, 1-this.fade]
      ] : [[1,0]]
    );

    this.particleSystem.addBehavior(new Q.ColorOverLife(this.lifetimeColorGradient));

    // if (this.particleSystem.renderMode === Q.RenderMode.Trail)
    // this.particleSystem.addBehavior(
    //   new Q.ApplyForce(new Q.Vector3(0, 0, 1), new Q.ConstantValue(20000))
    // );

    let batchRenderer = RE.App.sceneController.scene.getObjectByName("Q.BatchRenderer") as Q.BatchedRenderer;
    this.batchSystem = batchRenderer || new Q.BatchedParticleRenderer();
    this.batchSystem.name = "Q.BatchRenderer";

    this.particleSystem.emitter.name = this.uuid+this.object3d.uuid;

    if (!RE.Runtime.isRunning) {
      this.particleSystem.emitter.userData.isEditorObject = true;
      this.batchSystem.userData.isEditorObject = true;
    }

    !batchRenderer && RE.App.sceneController.scene.add(this.batchSystem);

    this.batchSystem.visible = true;

    this.object3d.add(this.particleSystem.emitter);
    this.batchSystem.addSystem(this.particleSystem);

    this.particleSystem.emitter.visible = true;

    const addons = RE.getObjectComponents(this.object3d).filter(c => c.enabled && c instanceof QuarksAddon) as QuarksAddon[];

    addons.forEach(c => c.init());
  }

  static updated = false;

  beforeUpdate() {
    RogueQuarks.updated = false;
  }

  update() {
    if (!RogueQuarks.updated) {
      this.batchSystem.update(RE.App.sceneController.deltaTime);
      RogueQuarks.updated = true;
    }
  }
}
