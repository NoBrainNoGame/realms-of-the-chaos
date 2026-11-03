import ViewChip from "./ViewChip"
import FightScene, { type SceneOptions } from "./FightScene"
import Gallery from "./Gallery"

/** Root chip: runs fights and restarts them with a new seed. */
export default class Game extends ViewChip {
  private _scene: FightScene | null = null

  constructor(
    private readonly _options: Omit<SceneOptions, "seed"> & {
      seed: number | null
      gallery?: boolean
    },
  ) {
    super()
  }

  protected _onActivate() {
    if (this._options.gallery) {
      this._activateChildChip(new Gallery())
      return
    }
    this._start(this._options.seed ?? randomSeed())
  }

  private _start(seed: number) {
    if (this._scene) this._terminateChildChip(this._scene)
    const scene = new FightScene({ ...this._options, seed })
    this._scene = scene
    this._activateChildChip(scene)
    this._subscribeOnce(scene, "restart", () => this._start(randomSeed()))
  }
}

const randomSeed = () => Math.floor(Math.random() * 1_000_000)
