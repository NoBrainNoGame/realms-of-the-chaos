import * as booyah from "@ghom/booyah"
import { EROSION, type Fighter, type StatusId } from "@realms/engine"
import { Container, Graphics } from "pixi.js"
import { OutlineFilter } from "pixi-filters"
import { STATUS_COLORS } from "./describe"
import { type Facing, Puppet, type PuppetAction } from "./Puppet"
import { COLORS, PUPPET_SCALE, screenFacing, TEAM_COLORS } from "./theme"
import ViewChip from "./ViewChip"

export { STATUS_COLORS } from "./describe"

const HP_WIDTH = 26

export type WaterState = "dry" | "wading" | "swimming"

/** How far the puppet sinks under the water surface (local pixels). */
export const WATER_DEPTH: Record<WaterState, number> = {
  dry: 0,
  wading: 5,
  swimming: 20,
}

/**
 * Visual of a fighter on the board: an isometric puppet plus its HUD bits.
 * Keeps its own *displayed* state (hp, statuses, position) which is updated
 * by animations, so it can lag behind the engine while events are played.
 */
export default class FighterView extends ViewChip {
  private _ground!: Container
  private _body!: Container
  private _puppet!: Puppet
  private _facing: Facing = "SE"
  private _ring!: Graphics
  private _hpBar!: Graphics
  private _statusBar!: Graphics
  private _time = Math.random() * 1000
  private _hp: number
  private _statuses = new Set<StatusId>()
  private _active = false
  private _dead = false
  private _flash = 0
  private _ripple!: Graphics
  private _waterMask!: Graphics
  private _shadow!: Graphics
  private _water: WaterState = "dry"

  private _erosion: number

  constructor(
    public readonly fighter: Fighter,
    /** Max hit points before erosion. */
    private readonly _baseMaxHp: number,
  ) {
    super()
    this._hp = fighter.hp
    this._erosion = fighter.erosion
  }

  get hp() {
    return this._hp
  }

  set hp(value: number) {
    this._hp = Math.max(0, Math.min(this.maxHp, value))
    this._drawHp()
  }

  /** Max hit points shown, reduced by erosion (same rule as the engine). */
  get maxHp() {
    return Math.max(1, this._baseMaxHp - Math.floor(this._erosion))
  }

  /** Lose hit points; part of the wound erodes max hit points for good. */
  wound(amount: number) {
    this._erosion += amount * EROSION
    this.hp = this._hp - amount
  }

  get puppet() {
    return this._puppet
  }

  /** Height of the head above the feet, in local pixels. */
  get headHeight() {
    return this._puppet.headHeight * PUPPET_SCALE
  }

  get water() {
    return this._water
  }

  /** The fighter changed sides: its ring takes the new team's colour. */
  recolor() {
    this._ring
      ?.clear()
      .ellipse(0, 0, 13, 5.8)
      .stroke({ width: 1.6, color: TEAM_COLORS[this.fighter.team], alpha: 0.9 })
  }

  protected _onActivate() {
    const team = TEAM_COLORS[this.fighter.team]

    // everything that follows the ground when a cell sinks
    this._ground = new Container()

    this._shadow = new Graphics()
      .ellipse(0, 0, 11, 4.8)
      .fill({ color: 0x000000, alpha: 0.35 })
    const shadow = this._shadow
    this._ring = new Graphics()
      .ellipse(0, 0, 13, 5.8)
      .stroke({ width: 1.6, color: team, alpha: 0.9 })

    this._body = new Container()
    this._puppet = new Puppet(this.fighter.presetId)
    this._puppet.scale.set(PUPPET_SCALE)
    // ripples around the body at the waterline
    this._ripple = new Graphics()
      .ellipse(0, 0, 10, 4)
      .fill({ color: 0x74c0fc, alpha: 0.55 })
      .ellipse(0, 0, 10, 4)
      .stroke({ width: 1, color: 0xe7f5ff, alpha: 0.8 })
    this._ripple.visible = false
    // everything below the waterline is hidden
    this._waterMask = new Graphics().rect(-60, -200, 120, 201).fill(0xffffff)
    this._body.addChild(this._puppet, this._ripple, this._waterMask)
    this._waterMask.visible = false

    this._hpBar = new Graphics()
    this._statusBar = new Graphics()
    this._placeBars()

    this._ground.addChild(
      shadow,
      this._ring,
      this._body,
      this._hpBar,
      this._statusBar,
    )
    this._container.addChild(this._ground)
    this._container.eventMode = "none"
    this._drawHp()
    this._drawStatuses()
  }

  protected _onTick() {
    const dt = this._lastTickInfo.timeSinceLastTick
    this._time += dt
    if (!this._dead) this._puppet.update(dt)
    this._ring.alpha = this._active
      ? 0.6 + 0.4 * Math.sin(this._time / 150)
      : 0.9

    if (this._flash > 0) {
      this._flash = Math.max(0, this._flash - dt)
      this._puppet.flash(this._flash > 0 ? 0xff9a9a : 0xffffff)
    }
  }

  /** Vertical offset of the cell under the fighter (shockwaves). */
  setGroundOffset(y: number) {
    this._ground.y = y
  }

  /**
   * Water around the fighter: wading sinks the feet, swimming leaves only
   * the chest and head above the surface (with a swim animation).
   */
  setWater(state: WaterState) {
    this._water = state
    // swimmers and aquatics change shape in deep water and handle their
    // own waterline; the others sink and are cut at the surface
    const ownShape = state === "swimming" && this._puppet.hasSwimForm
    this._puppet.y = ownShape ? 0 : WATER_DEPTH[state]
    this._puppet.mask = state === "dry" || ownShape ? null : this._waterMask
    this._waterMask.visible = state !== "dry" && !ownShape
    this._ripple.visible = state !== "dry"
    this._ripple.scale.set(state === "swimming" ? 1.4 : 1)
    this._shadow.visible = state === "dry"
    this._puppet.setSwimming(state === "swimming")
    this._placeBars()
  }

  /** HP and status bars follow the head, even when it is half under water. */
  private _placeBars() {
    const top = -this.headHeight - 10 + WATER_DEPTH[this._water]
    this._hpBar.position.set(-HP_WIDTH / 2, top)
    this._statusBar.position.set(0, top - 8)
  }

  setActive(active: boolean) {
    this._active = active
    this._puppet.filters = active
      ? [new OutlineFilter({ thickness: 2, color: 0xffffff, quality: 0.2 })]
      : []
  }

  /**
   * Turn the fighter towards a grid direction (named after the classic
   * view); it is drawn according to the camera.
   */
  setFacing(facing: Facing) {
    this._facing = facing
    this._puppet.setFacing(screenFacing(facing))
  }

  /** Grid direction the fighter looks to. */
  get facing() {
    return this._facing
  }

  /** Draw the facing again, after the camera turned. */
  refreshFacing() {
    this.setFacing(this._facing)
  }

  /** Play a body animation on the puppet. */
  act(kind: PuppetAction, duration: number) {
    this._puppet.act(kind, duration)
  }

  addStatus(status: StatusId) {
    this._statuses.add(status)
    this._drawStatuses()
  }

  removeStatus(status: StatusId) {
    this._statuses.delete(status)
    this._drawStatuses()
  }

  clearStatuses() {
    this._statuses.clear()
    this._drawStatuses()
  }

  // ─── Animations (booyah chips) ────────────────────────────────────────────

  moveChip(
    to: { x: number; y: number },
    duration: number,
    hop = 6,
    walk = true,
  ) {
    // the start is read on the first update: booyah tweens send their first
    // value *before* calling onActivate, so reading it there would see the
    // position already overwritten (the fighter jumped to the world origin)
    let from: { x: number; y: number } | null = null
    return new booyah.Tween({
      from: 0,
      to: 1,
      duration,
      onActivate: () => {
        if (walk) this._puppet.walk(duration + 60)
      },
      onTick: (t) => {
        from ??= { x: this._container.x, y: this._container.y }
        this._container.x = booyah.lerp(from.x, to.x, t)
        this._container.y =
          booyah.lerp(from.y, to.y, t) - Math.sin(t * Math.PI) * hop
      },
      onTerminate: () => {
        this._container.position.set(to.x, to.y)
      },
    })
  }

  /** Short body movement towards a point (melee strikes). */
  lungeChip(toward: { x: number; y: number }, duration: number) {
    return new booyah.Tween({
      from: 0,
      to: 1,
      duration,
      onTick: (t) => {
        const k = Math.sin(t * Math.PI) * 10
        const dx = toward.x - this._container.x
        const dy = toward.y - this._container.y
        const len = Math.hypot(dx, dy) || 1
        this._body.x = (dx / len) * k
        this._body.y = (dy / len) * k * 0.5
      },
      onTerminate: () => {
        this._body.position.set(0, 0)
      },
    })
  }

  hitChip(duration: number) {
    return new booyah.Tween({
      from: 1,
      to: 0,
      duration,
      onActivate: () => {
        this._flash = duration * 0.45
        this._puppet.act("hit", duration)
      },
      onTick: (t) => {
        this._body.x = Math.round(Math.sin(t * 40) * 3 * t)
      },
      onTerminate: () => {
        this._body.x = 0
      },
    })
  }

  dieChip(duration: number) {
    return new booyah.Tween({
      from: 0,
      to: 1,
      duration,
      onActivate: () => {
        this._dead = true
        this._hpBar.visible = false
        this._statusBar.visible = false
        this._ring.visible = false
        this._puppet.filters = []
      },
      onTick: (t) => {
        const side =
          this._puppet.facing === "SW" || this._puppet.facing === "NW" ? 1 : -1
        this._body.rotation =
          side * booyah.easeInCubic(Math.min(1, t * 1.6)) * 1.4
        this._body.y = 4 * t
        this._container.alpha = t < 0.5 ? 1 : 1 - (t - 0.5) / 0.5
      },
    })
  }

  // ─── Drawing ──────────────────────────────────────────────────────────────

  private _drawHp() {
    if (!this._hpBar) return
    const ratio = this._hp / this._baseMaxHp
    const eroded = 1 - this.maxHp / this._baseMaxHp
    const health = this._hp / this.maxHp
    const g = this._hpBar
      .clear()
      .rect(-1, -1, HP_WIDTH + 2, 6)
      .fill(0x000000)
      .rect(0, 0, HP_WIDTH, 4)
      .fill(COLORS.hpBack)
      .rect(0, 0, Math.ceil(HP_WIDTH * ratio), 4)
      .fill(health > 0.5 ? COLORS.heal : health > 0.25 ? 0xfcc419 : COLORS.hp)
    // erosion: the end of the bar that can never be healed back
    const width = Math.round(HP_WIDTH * eroded)
    if (width > 0) g.rect(HP_WIDTH - width, 0, width, 4).fill(COLORS.eroded)
  }

  private _drawStatuses() {
    if (!this._statusBar) return
    const g = this._statusBar.clear()
    const list = [...this._statuses]
    list.forEach((status, i) => {
      const x = (i - (list.length - 1) / 2) * 8
      g.circle(x, 0, 3)
        .fill(STATUS_COLORS[status])
        .stroke({ width: 1, color: 0x000000 })
    })
  }
}
