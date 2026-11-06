import * as booyah from "@ghom/booyah"
import {
  type Combat,
  DIVINE_ACTIONS,
  type Fighter,
  type Locomotion,
  MAX_ENERGY,
} from "@realms/engine"
import type { CrystalOp } from "@realms/engine/adventure"
import { Container, Graphics, Rectangle, Sprite, Text } from "pixi.js"
import { settings } from "../settings"
import { actionIcon } from "./actionFx"
import {
  describeAction,
  describeDivine,
  describeHp,
  describeStats,
  describeStatus,
  STATUS_COLORS,
} from "./describe"
import type { SceneInput } from "./FightScene"
import { characterTexture } from "./textures"
import { COLORS, MEANING, TEAM_COLORS } from "./theme"
import {
  button,
  clearChildren,
  panel,
  richText,
  type Segment,
  style,
  tag,
  text,
  textResolution,
} from "./ui"
import ViewChip from "./ViewChip"

export { describeAction }

interface HudEvents extends booyah.BaseCompositeEvents {
  action: [actionId: string]
  pass: []
  /** Autonomy: let the active ally act ("Laisser agir" / "Respecter"). */
  letAct: []
  /** Autonomy: force the refused order ("Insister"). */
  insist: []
  /** The Ghom withdraws from the fight ("Se retirer"). */
  withdraw: []
  /** Crystals and cold: select an operation to aim (Extraire, Porter...). */
  crystal: [op: CrystalOp, gain: "elan" | "heal"]
  /** The line-up is done: the fight starts. */
  fight: []
  /** Cancel the planned walk of the active fighter. */
  cancelWalk: []
  /** An action (or pass, or nothing) is hovered in the action bar. */
  hoverChoice: [choice: string | null]
  divine: [divineId: string]
  endAction: [id: string]
  speed: []
  quit: []
  /** Open the settings (text and interface sizes). */
  settings: []
}

/** Water traits shown on the character card. */
export const LOCOMOTION_TRAITS: Record<Locomotion, string | null> = {
  walker: null,
  swimmer: "Nageur (eau profonde)",
  aquatic: "Aquatique (aucune pénalité)",
}

/** Browser storage key of the pinned timeline view. */
const TIMELINE_KEY = "realms.timeline.expanded"
/** Duration of the timeline expanding or collapsing (ms). */
const TIMELINE_ANIMATION = 500

/** The timeline's nodes not about the pointed fighter: this opaque. */
const TIMELINE_FADE = 0.5
/** Timeline steps: piles shown at most. */
const MAX_STEP_PILES = 5

export default class Hud extends ViewChip<HudEvents> {
  private _timeline!: Container
  private _timelineCombat: Combat | null = null
  private _timelinePinned = false
  private _timelineHovered = false
  /** Drawn expansion (0 compact … 1 real scale), animated. */
  private _expansion = 0
  private _expansionTween: booyah.Tween | null = null
  private _landing: { fighter: Fighter; delay: number } | null = null
  /** The steps a hovered walk would add (times), half seen. */
  private _stepPreview: { fighter: Fighter; times: number[] } | null = null
  /** The fighter pointed at, on the board or on the timeline. */
  private _boardFocus: Fighter | null = null
  private _timelineFocus: Fighter | null = null
  /** The timeline's nodes and the fighters they are about. */
  private _owned: { node: Container; fighters: Fighter[]; alpha: number }[] = []
  private _actionBar!: Container
  /** Glows of the buttons suggested now. */
  private _halos: Graphics[] = []
  private _haloTime = 0
  private _card!: Container
  private _divine!: Container
  private _log!: Container
  private _logLines: { text: string }[] = []
  private _tooltip!: Container
  private _tooltipText!: Container
  private _banner!: Text
  /** The line-up panel, before the fight (null: no line-up). */
  private _placement: Container | null = null
  private _bannerTime = 0
  private _end!: Container
  private _speed!: Text
  /** One-line preview above the action bar (e.g. the cost of a move). */
  private _preview!: Container
  private _quit!: Text
  private _settings!: Text
  /** Lets a click through (set by the scene: the tutorial filters them). */
  allows: (input: SceneInput) => boolean = () => true
  /** The texts built once, with their base size (resized by the settings). */
  private _fixedTexts: [Text, number][] = []
  private _width = 0
  private _height = 0

  protected _onActivate() {
    this._timeline = new Container()
    // hover: real durations between turns; click: keep that view
    this._timeline.eventMode = "static"
    this._timeline.cursor = "pointer"
    this._timeline.on("pointerenter", () => {
      this._timelineHovered = true
      this._syncExpansion()
    })
    this._timeline.on("pointerleave", () => {
      this._timelineHovered = false
      this._timelineFocus = null
      this._syncExpansion()
    })
    this._timeline.on("pointertap", () => {
      if (this.allows({ type: "timeline" })) this.toggleTimeline()
    })
    try {
      this._timelinePinned =
        globalThis.localStorage?.getItem(TIMELINE_KEY) === "1"
    } catch {
      // storage blocked: compact by default
    }
    this._expansion = this._timelinePinned ? 1 : 0
    this._actionBar = new Container()
    this._card = new Container()
    this._divine = new Container()
    this._log = new Container()
    this._tooltip = new Container()
    this._tooltip.visible = false
    this._tooltipText = new Container()
    this._tooltip.addChild(new Graphics(), this._tooltipText)
    this._banner = text("", 30, COLORS.text, {
      stroke: { color: 0x000000, width: 6 },
      fontWeight: "700",
    })
    this._banner.anchor.set(0.5)
    this._banner.alpha = 0
    this._end = new Container()
    this._end.visible = false

    this._speed = text("", 13, COLORS.muted)
    this._speed.anchor.set(1, 0)
    this._speed.eventMode = "static"
    this._speed.cursor = "pointer"
    this._speed.on("pointertap", () => this.emit("speed"))

    this._preview = new Container()
    this._preview.visible = false

    this._quit = text("Menu", 13, COLORS.muted)
    this._quit.anchor.set(1, 0)
    this._quit.eventMode = "static"
    this._quit.cursor = "pointer"
    this._quit.visible = false
    this._quit.on("pointertap", () => this.emit("quit"))

    this._settings = text("Réglages", 13, COLORS.muted)
    this._settings.label = "hud:settings"
    this._settings.anchor.set(1, 0)
    this._settings.eventMode = "static"
    this._settings.cursor = "pointer"
    this._settings.on("pointertap", () => this.emit("settings"))

    const help = text(
      "Clic : se déplacer · C : dash · 1-5 : actions · Espace : passer · Échap / clic droit : annuler",
      12,
      COLORS.muted,
    )
    help.position.set(12, 10)
    help.label = "help"
    this._fixedTexts = [
      [help, 12],
      [this._speed, 13],
      [this._quit, 13],
      [this._settings, 13],
      [this._banner, 30],
    ]

    this._container.addChild(
      this._timeline,
      this._card,
      this._divine,
      this._actionBar,
      this._preview,
      this._log,
      help,
      this._speed,
      this._quit,
      this._settings,
      this._banner,
      this._tooltip,
      this._end,
    )
  }

  protected _onTick() {
    // the suggested buttons breathe
    if (this._halos.length) {
      this._haloTime += this._lastTickInfo.timeSinceLastTick
      const alpha = 0.55 + 0.45 * Math.sin(this._haloTime / 260)
      for (const halo of this._halos) halo.alpha = alpha
    }
    if (this._bannerTime > 0) {
      this._bannerTime -= this._lastTickInfo.timeSinceLastTick
      this._banner.alpha = Math.min(1, this._bannerTime / 300)
    }
  }

  /** Where the action bar is on the screen (it widens with the actions). */
  /** The action bar on the screen (the HUD may be scaled). */
  get actionBarBounds() {
    const bar = this._actionBar
    const k = this._container.scale.x
    return {
      x: bar.x * k,
      y: bar.y * k,
      width: bar.width * k,
      height: bar.height * k,
    }
  }

  /** Where a part of the HUD is on the screen (null: empty or hidden). */
  partBounds(
    part: "timeline" | "card" | "divine" | "actionBar" | "log",
  ): Bounds | null {
    const view = {
      timeline: this._timeline,
      card: this._card,
      divine: this._divine,
      actionBar: this._actionBar,
      log: this._log,
    }[part]
    return boundsOf(view)
  }

  /**
   * Where a button of the action bar is: an action id, "pass" or
   * "cancelWalk" (null: not shown now).
   */
  buttonBounds(label: string): Bounds | null {
    const button = this._actionBar.children.find((c) => c.label === label)
    return button ? boundsOf(button) : null
  }

  protected _onResize(width: number, height: number) {
    // the player's interface size (settings): the HUD is laid out smaller
    // or larger, then scaled to the screen
    const scale = settings().uiSize
    this._container.scale.set(scale)
    this._width = width / scale
    this._height = height / scale
    this._layout()
  }

  private _layout() {
    const { _width: w, _height: h } = this
    this._timeline.position.set(
      Math.round(w / 2 - this._timeline.width / 2),
      34,
    )
    this._actionBar.position.set(
      Math.round(w / 2 - this._actionBar.width / 2),
      h - 92,
    )
    this._card.position.set(12, 100)
    this._divine.position.set(w - Math.max(200, this._divine.width) - 12, 100)
    this._log.position.set(12, h - 140)
    this._speed.position.set(w - 12, 10)
    this._placePreview()
    // right to left: speed, Menu, Réglages (their widths follow the text size)
    let right = this._speed.x - this._speed.width - 20
    this._quit.position.set(right, 10)
    if (this._quit.visible) right -= this._quit.width + 20
    this._settings.position.set(right, 10)
    this._banner.position.set(w / 2, h * 0.3)
    this._placement?.position.set(
      Math.round(w / 2 - this._placement.width / 2),
      h - 110,
    )
    if (this._end.visible) this._centerEnd()
  }

  /**
   * A one-line preview above the action bar, in the meaning colors (null
   * hides it). Out of the way of the board, unlike a tooltip.
   */
  setPreview(segments: Segment[] | null) {
    clearChildren(this._preview)
    this._preview.visible = !!segments?.length
    if (!segments?.length) return
    const line = richText(segments, 13)
    line.position.set(10, 5)
    this._preview.addChild(panel(line.width + 20, 26), line)
    this._placePreview()
  }

  /** Text of the preview line (tests, accessibility). */
  get previewText() {
    const parts: string[] = []
    const walk = (c: Container) => {
      if (c instanceof Text) parts.push(c.text)
      for (const child of c.children) walk(child as Container)
    }
    walk(this._preview)
    return this._preview.visible ? parts.join("") : ""
  }

  private _placePreview() {
    if (!this._preview) return
    this._preview.position.set(
      Math.round(this._width / 2 - this._preview.width / 2),
      this._height - 92 - 34,
    )
  }

  /** Shows the Menu button (leave the fight). */
  setQuittable(quittable: boolean) {
    this._quit.visible = quittable
    if (this._width) this._layout()
  }

  /**
   * The settings changed (during the fight): the texts built once take the
   * new text size, and everything the new interface size.
   */
  applySettings() {
    for (const [label, size] of this._fixedTexts) {
      label.style.fontSize = style(size).fontSize ?? size
      label.resolution = textResolution()
    }
    this.resize()
  }

  setSpeed(speed: number) {
    this._speed.text = `Vitesse x${speed}`
    if (this._width) this._layout()
  }

  // ─── Timeline ─────────────────────────────────────────────────────────────

  /** Timeline expanded to real durations (persistent after a click). */
  get timelineExpanded() {
    return this._timelinePinned || this._timelineHovered
  }

  /** Expand or collapse the timeline for good (a click on it). */
  toggleTimeline() {
    this._timelinePinned = !this._timelinePinned
    try {
      globalThis.localStorage?.setItem(
        TIMELINE_KEY,
        this._timelinePinned ? "1" : "0",
      )
    } catch {
      // storage blocked: the choice lasts for this session only
    }
    this._syncExpansion()
  }

  setTimeline(combat: Combat) {
    this._timelineCombat = combat
    this._redrawTimeline()
  }

  /**
   * Preview of where a fighter lands on the timeline if it does what is
   * hovered (an action, a sprint, a pass): a ghost portrait at that wait.
   * null removes it.
   */
  /** The steps a walk being aimed would add, at their times. */
  setStepPreview(preview: { fighter: Fighter; times: number[] } | null) {
    const same = (a: number[] = [], b: number[] = []) =>
      a.length === b.length && a.every((t, i) => Math.abs(t - b[i]) < 0.5)
    if (
      preview?.fighter === this._stepPreview?.fighter &&
      same(preview?.times, this._stepPreview?.times)
    )
      return
    this._stepPreview = preview
    this._redrawTimeline()
  }

  /**
   * The fighter pointed at on the board: on the timeline, what is not
   * about it fades to half.
   */
  setFocus(fighter: Fighter | null) {
    if (fighter === this._boardFocus) return
    this._boardFocus = fighter
    this._applyFocus()
  }

  /** The fighter the timeline is focused on (tests). */
  get timelineFocus() {
    return this._timelineFocus ?? this._boardFocus
  }

  private _own(node: Container, fighters: Fighter[]) {
    this._owned.push({ node, fighters, alpha: node.alpha })
  }

  private _applyFocus() {
    const focus = this.timelineFocus
    for (const { node, fighters, alpha } of this._owned)
      node.alpha =
        focus && !fighters.includes(focus) ? alpha * TIMELINE_FADE : alpha
  }

  setLanding(landing: { fighter: Fighter; delay: number } | null) {
    const same =
      landing?.fighter === this._landing?.fighter &&
      Math.round(landing?.delay ?? -1) ===
        Math.round(this._landing?.delay ?? -1)
    this._landing = landing
    if (!same) this._redrawTimeline()
  }

  /** The ghost of the landing preview (tests). */
  get landingGhost(): Container | null {
    return (
      (this._timeline.children.find(
        (c) => c.label === "landing",
      ) as Container) ?? null
    )
  }

  /** Animates the timeline towards its current target view. */
  private _syncExpansion() {
    const target = this.timelineExpanded ? 1 : 0
    if (this._expansionTween) {
      if (this._expansionTween.state === "active")
        this._terminateChildChip(this._expansionTween)
      this._expansionTween = null
    }
    if (this._expansion === target) {
      this._redrawTimeline()
      return
    }
    if (this.state !== "active") {
      this._expansion = target
      this._redrawTimeline()
      return
    }
    // a full change lasts half a second, an interrupted one less
    const tween = new booyah.Tween({
      from: this._expansion,
      to: target,
      duration: TIMELINE_ANIMATION * Math.abs(target - this._expansion),
      easing: booyah.easeInOutCubic,
      onTick: (value) => {
        this._expansion = value
        this._redrawTimeline()
      },
      onTerminate: () => {
        this._expansion = target
        this._redrawTimeline()
      },
    })
    this._expansionTween = tween
    this._activateChildChip(tween)
  }

  /** How expanded the timeline is drawn (0 compact … 1 real scale). */
  get timelineExpansion() {
    return this._expansion
  }

  private _redrawTimeline() {
    const combat = this._timelineCombat
    if (!combat) return
    clearChildren(this._timeline)
    this._owned = []
    const t = this._expansion
    const size = 44
    const gap = 6
    // the fighters in order, and the ghost of the landing preview among
    // them, at its wait (after the fighters due at the same time)
    const entries: { fighter: Fighter; wait: number; ghost: boolean }[] = combat
      .timelineOrder()
      .map((fighter) => ({
        fighter,
        wait: Math.max(0, Math.round(fighter.nextActionAt - combat.time)),
        ghost: false,
      }))
    if (this._landing && combat.activeFighter === this._landing.fighter) {
      const wait = Math.max(1, Math.round(this._landing.delay))
      const index = entries.filter((e) => e.wait <= wait).length
      entries.splice(index, 0, {
        fighter: this._landing.fighter,
        wait,
        ghost: true,
      })
    }
    const waits = entries.map((e) => e.wait)

    const hint = text(
      this._landing
        ? "→ ordre de jeu · ◌ : votre prochain tour après ce choix"
        : "→ ordre de jeu · survoler : durées réelles",
      11,
      COLORS.muted,
    )
    // compact: the portraits in a row, and the hint under them
    const compactWidth = Math.max(
      entries.length * (size + gap) - gap + 16,
      Math.ceil(hint.width) + 16,
    )
    const compactPlaces = entries.map((_, i) => 8 + i * (size + gap))

    // real scale: at least twice as wide, on a single row; the axis spans
    // exactly from the first to the last portrait
    const first = Math.min(...waits)
    const axis = 2 * compactWidth - 16 - size
    const range = Math.max(...waits) - first
    const scale = range > 0 ? axis / range : 0
    // real positions, then pushed apart (keeping the order) so close
    // turns never overlap
    const xs = waits.map((wait) => (wait - first) * scale)
    const spacing = size + 2
    for (let i = 1; i < xs.length; i++)
      xs[i] = Math.max(xs[i], xs[i - 1] + spacing)
    for (let i = xs.length - 1; i >= 0; i--) {
      const limit = i === xs.length - 1 ? axis : xs[i + 1] - spacing
      xs[i] = Math.max(0, Math.min(xs[i], limit))
    }
    const expandedWidth = 16 + size + axis

    const ease = (a: number, b: number) => a + (b - a) * t
    const width = ease(compactWidth, expandedWidth)
    const height = ease(size + 26, size + 46)
    const places = entries.map((_, i) => ({
      x: ease(compactPlaces[i], 8 + xs[i]),
      y: 6,
    }))
    const axisY = height - 26

    this._timeline.addChild(
      panel(width, height, t > 0.5 ? MEANING.time : COLORS.panelBorder),
    )
    if (t > 0) {
      // the time axis, in the meaning color of time, fading in
      const scaleNode = new Container()
      scaleNode.alpha = t
      const line = new Graphics()
        .moveTo(8 + size / 2, axisY)
        .lineTo(8 + size / 2 + axis * t, axisY)
        .stroke({ width: 1.5, color: MEANING.time, alpha: 0.8 })
      const step = range > 200 ? 50 : range > 80 ? 20 : 10
      const last = first + range
      // the two ends, and round values in between (not too close to them)
      const ticks = [first]
      for (let v = Math.ceil((first + 1) / step) * step; v < last; v += step)
        if (v - first >= step / 2 && last - v >= step / 2) ticks.push(v)
      if (range > 0) ticks.push(last)
      for (const v of ticks) {
        const x = 8 + size / 2 + (v - first) * scale * t
        line
          .moveTo(x, axisY - 3)
          .lineTo(x, axisY + 3)
          .stroke({
            width: 1,
            color: MEANING.time,
          })
        const start = v === first
        const end = v === last && range > 0
        const tick = text(v === 0 ? "maintenant" : `${v}`, 10, MEANING.time)
        tick.anchor.set(start ? 0 : end ? 1 : 0.5, 0)
        tick.position.set(x + (start ? -4 : end ? 4 : 0), axisY + 5)
        scaleNode.addChild(tick)
      }
      scaleNode.addChild(line)
      this._timeline.addChild(scaleNode)
      if (range > 0)
        this._drawSteps(
          combat,
          first,
          last,
          (v) => 8 + size / 2 + (v - first) * scale * t,
          axisY,
          t,
          waits,
        )
    }
    if (t < 1) {
      hint.alpha = 1 - t
      hint.position.set(8, size + 9)
      this._timeline.addChild(hint)
    }
    if (this._timelinePinned) {
      // locked on the real scale (a click unlocks it)
      const lock = new Graphics()
        .roundRect(0, 5, 10, 8, 1.5)
        .fill(MEANING.time)
        .moveTo(2.5, 5)
        .lineTo(2.5, 2.5)
        .arc(5, 2.5, 2.5, Math.PI, 0)
        .lineTo(7.5, 5)
        .stroke({ width: 1.6, color: MEANING.time })
      lock.label = "lock"
      lock.position.set(width - 16, height - 18)
      this._timeline.addChild(lock)
    }

    entries.forEach(({ fighter, wait, ghost }, i) => {
      const slot = new Container()
      slot.position.set(places[i].x, places[i].y)
      const active = !ghost && combat.activeFighter === fighter
      if (t > 0) {
        // a line from the portrait down to its exact time on the axis
        const real = 8 + (wait - first) * scale * t - places[i].x
        slot.addChild(
          new Graphics()
            .moveTo(size / 2, size)
            .lineTo(size / 2 + real, axisY - places[i].y)
            .stroke({
              width: 1,
              color: ghost ? MEANING.time : TEAM_COLORS[fighter.team],
              alpha: (ghost ? 1 : 0.6) * t,
            }),
        )
      }
      slot.addChild(
        new Graphics()
          .roundRect(0, 0, size, size, 4)
          .fill({ color: 0x15121f, alpha: ghost ? 0.5 : 1 })
          .stroke({
            width: active || ghost ? 3 : 2,
            color: ghost
              ? MEANING.time
              : active
                ? 0xffffff
                : TEAM_COLORS[fighter.team],
          }),
      )
      const portrait = new Sprite(characterTexture(fighter.presetId))
      portrait.scale.set(2.5)
      portrait.anchor.set(0.5, 0)
      portrait.position.set(size / 2, 2)
      portrait.alpha = ghost ? 0.55 : 1
      const mask = new Graphics().rect(2, 2, size - 4, size - 4).fill(0xffffff)
      portrait.mask = mask
      slot.addChild(mask, portrait)

      const label = text(
        active ? "▶" : ghost ? `◌${wait}` : `${wait}`,
        11,
        // waits are time: yellow (the active fighter's ▶ stays white)
        active ? COLORS.text : MEANING.time,
        { stroke: { color: 0x000000, width: 3 } },
      )
      label.anchor.set(1, 1)
      label.position.set(size - 3, size - 1)
      slot.addChild(label)

      this._own(slot, [fighter])
      if (ghost) {
        slot.label = "landing"
        this._timeline.addChild(slot)
        return
      }
      slot.eventMode = "static"
      slot.on("pointerover", () => {
        this._tipUnderTimeline(
          `${fighter.name} — prochain tour dans ${tag("time", `${wait} temps`)}`,
          slot,
        )
        this._timelineFocus = fighter
        this._applyFocus()
      })
      slot.on("pointerout", () => {
        this.hideTooltip()
        this._timelineFocus = null
        this._applyFocus()
      })
      this._timeline.addChild(slot)
    })
    this._applyFocus()
    this._timeline.hitArea = new Rectangle(0, 0, width, height)
    this._layout()
  }

  /**
   * The steps of the planned walks, on the real-scale axis: a small yellow
   * arrow in a ring, with a badge of who steps. A fighter's steps in a
   * row (no turn, no other step between) pile up; past the first few
   * piles or the axis' end, they are not shown.
   */
  private _drawSteps(
    combat: Combat,
    first: number,
    last: number,
    xOf: (wait: number) => number,
    axisY: number,
    alpha: number,
    turns: number[],
  ) {
    const preview = this._stepPreview
    const steps = combat.aliveFighters
      .flatMap((fighter) =>
        combat
          .stepTimes(fighter)
          .map((at) => ({ fighter, wait: at - combat.time, ghost: false })),
      )
      .concat(
        (preview?.times ?? []).map((at) => ({
          fighter: preview!.fighter,
          wait: at - combat.time,
          ghost: true,
        })),
      )
      .filter((s) => s.wait >= first)
      .sort((a, b) => a.wait - b.wait)
    // piles: a fighter's next step close to its previous pile joins it
    const piles: {
      fighter: Fighter
      waits: number[]
      x: number
      ghost: boolean
    }[] = []
    const later: typeof steps = []
    for (const step of steps) {
      const x = xOf(step.wait)
      // the fighter's previous pile, if nothing happens since: no turn,
      // no other step
      const pile = piles[piles.length - 1]
      const since = pile?.waits[pile.waits.length - 1] ?? 0
      const quiet =
        pile?.fighter === step.fighter &&
        pile.ghost === step.ghost &&
        !turns.some((w) => w > since && w < step.wait) &&
        later.length === 0
      if (quiet) pile.waits.push(step.wait)
      else if (step.wait <= last && piles.length < MAX_STEP_PILES)
        piles.push({
          fighter: step.fighter,
          waits: [step.wait],
          x,
          ghost: step.ghost,
        })
      else later.push(step)
    }
    const taken = new Map<number, number>()
    const place = (x: number) => {
      // piles at the same place stack upwards
      const column = Math.round(x / 8)
      const stack = taken.get(column) ?? 0
      taken.set(column, stack + 1)
      return axisY - stack * 15
    }
    for (const { fighter, waits, x, ghost } of piles) {
      const marker = new Container()
      // a walk being aimed: its steps half seen
      marker.label = ghost ? "stepPreview" : "step"
      marker.alpha = ghost ? alpha * 0.5 : alpha
      marker.position.set(x, place(x))
      // the pile: one ring per step behind the first (three at most)
      const depth = Math.min(waits.length, 3)
      for (let k = depth - 1; k >= 0; k--) {
        const ring = new Graphics()
          .circle(k * 2.5, -k * 2.5, 6.5)
          .fill(0x15121f)
          .stroke({ width: 1.5, color: MEANING.path })
        if (k === 0)
          ring
            .poly([
              -3.5, -1, 0.5, -1, 0.5, -3.5, 4, 0, 0.5, 3.5, 0.5, 1, -3.5, 1,
            ])
            .fill(MEANING.path)
        marker.addChild(ring)
      }
      if (waits.length > 1) {
        const count = text(`${waits.length}`, 9, MEANING.path, {
          stroke: { color: 0x000000, width: 3 },
        })
        count.anchor.set(0.5, 0)
        count.position.set(0, 6)
        marker.addChild(count)
      }
      // the badge: who steps
      const badge = new Container()
      badge.position.set(6 + (depth - 1) * 2.5, -6 - (depth - 1) * 2.5)
      const ring = new Graphics()
        .circle(0, 0, 5)
        .fill(0x15121f)
        .stroke({ width: 1.2, color: TEAM_COLORS[fighter.team] })
      const face = new Sprite(characterTexture(fighter.presetId))
      face.anchor.set(0.5, 0)
      face.scale.set(0.7)
      face.position.set(0, -5)
      const mask = new Graphics().circle(0, 0, 4.4).fill(0xffffff)
      face.mask = mask
      badge.addChild(ring, mask, face)
      marker.addChild(badge)
      marker.eventMode = "static"
      const when = `${tag("time", `${Math.round(waits[0])} temps`)}`
      marker.on("pointerover", () =>
        this._tipUnderTimeline(
          waits.length > 1
            ? `${fighter.name} avance de ${waits.length} pas, dès ${when}`
            : `${fighter.name} avance d'un pas dans ${when}`,
          marker,
        ),
      )
      marker.on("pointerout", () => this.hideTooltip())
      this._own(marker, [fighter])
      this._timeline.addChild(marker)
    }
  }

  // ─── Action bar ───────────────────────────────────────────────────────────

  /**
   * The active fighter's actions (none when it isn't a local player's
   * turn). `suggested`: the actions worth using now, or the pass button.
   */
  setActions(
    fighter: Fighter | null,
    combat: Combat,
    selected: string | null,
    suggested: { actions: readonly string[]; pass: boolean } = {
      actions: [],
      pass: false,
    },
  ) {
    clearChildren(this._actionBar)
    this._halos = []
    // the buttons are rebuilt: none of them is hovered any more
    this.emit("hoverChoice", null)

    if (fighter?.controller !== "human" || combat.activeFighter !== fighter) {
      const waiting = text(
        combat.state === "ended"
          ? ""
          : combat.activeFighter
            ? `${combat.activeFighter.name} réfléchit…`
            : "…",
        16,
        COLORS.muted,
      )
      this._actionBar.addChild(waiting)
      this._layout()
      return
    }

    const size = 64
    // an ally that refused an order: only two answers are left
    const refusal = combat.refusal
    if (refusal && refusal.fighterId === fighter.id) {
      this._refusalButtons(fighter, combat, size)
      this._layout()
      return
    }
    const actions = combat.actionsOf(fighter)
    actions.forEach((action, i) => {
      const cooldown = fighter.cooldowns[action.id] ?? 0
      const b = button({
        width: size,
        height: size,
        icon: action.combo?.baseId ?? actionIcon(action),
        accent: action.combo ? COLORS.combo : undefined,
        hotkey: `${i + 1}`,
        label: cooldown > 0 ? `⌛${cooldown - 1}` : undefined,
        labelColor: MEANING.time,
        onTap: () => this.emit("action", action.id),
        onOver: () => {
          this.showTooltip(
            describeAction(action, combat, fighter),
            b.view.getGlobalPosition(),
            true,
          )
          this.emit("hoverChoice", action.id)
        },
        onOut: () => {
          this.hideTooltip()
          this.emit("hoverChoice", null)
        },
      })
      b.setState({
        enabled: cooldown === 0,
        selected: selected === action.id,
        suggested: suggested.actions.includes(action.id),
      })
      if (suggested.actions.includes(action.id)) this._halos.push(b.halo)
      // combined actions show the partner who unlocked them
      if (action.combo) {
        const partner = new Sprite(
          characterTexture(action.combo.partnerPresetId),
        )
        partner.scale.set(1.25)
        partner.position.set(size - 22, -10)
        b.view.addChild(partner)
      }
      b.view.label = action.id
      b.view.position.set(i * (size + 8) + (action.combo ? 12 : 0), 0)
      this._actionBar.addChild(b.view)
    })
    const combos = actions.filter((a) => a.combo).length

    // with a planned walk, passing lets the fighter walk on
    const walking = fighter.path.length > 0
    const pass = button({
      width: 96,
      height: size,
      label: walking ? "Avancer" : "Passer",
      hotkey: "␣",
      onTap: () => this.emit("pass"),
      onOver: () => {
        this.showTooltip(
          walking
            ? `Termine le tour sans agir : ${fighter.name} avance sur son trajet et rejoue juste après le prochain personnage.`
            : "Termine le tour sans agir : vous rejouez juste après le prochain personnage.",
          pass.view.getGlobalPosition(),
          true,
        )
        this.emit("hoverChoice", "pass")
      },
      onOut: () => {
        this.hideTooltip()
        this.emit("hoverChoice", null)
      },
    })
    pass.view.label = "pass"
    if (suggested.pass) {
      pass.setState({ suggested: true })
      this._halos.push(pass.halo)
    }
    pass.view.position.set(
      actions.length * (size + 8) + 12 + (combos ? 12 : 0),
      0,
    )
    this._actionBar.addChild(pass.view)
    const afterGestures = this._autonomyButtons(
      fighter,
      combat,
      size,
      pass.view.x + 96 + 8,
    )
    const after = this._crystalButtons(fighter, combat, size, afterGestures)

    // a planned walk: a click adds a stop, so cancelling needs a button
    if (fighter.path.length) {
      const cancel = button({
        width: 112,
        height: size,
        label: "Annuler\nle trajet",
        hotkey: "⌫",
        accent: COLORS.path,
        onTap: () => this.emit("cancelWalk"),
        onOver: () =>
          this.showTooltip(
            `Efface le trajet prévu (${tag("move", `${fighter.path.length} cases`)}). Un clic sur la carte ajoute une étape au trajet.`,
            cancel.view.getGlobalPosition(),
            true,
          ),
        onOut: () => this.hideTooltip(),
      })
      cancel.view.position.set(after, 0)
      cancel.view.label = "cancelWalk"
      this._actionBar.addChild(cancel.view)
    }
    this._layout()
  }

  /** The tier of an ally, in words (Adventure autonomy). */
  static tierLabel(tier: string): string {
    return (
      {
        bound: "Lié",
        confident: "Confiant",
        reserved: "Réservé",
        wary: "Méfiant",
        broken: "Rompu",
      }[tier] ?? tier
    )
  }

  /**
   * "Laisser agir" and "Se retirer", after the pass button, when the fight
   * has autonomy. Returns the x where the next button goes.
   */
  private _autonomyButtons(
    fighter: Fighter,
    combat: Combat,
    size: number,
    from: number,
  ): number {
    let x = from
    const rules = combat.adventure?.rules
    const gesture = (
      label: string,
      tip: string,
      event: "letAct" | "withdraw",
      width = 112,
    ) => {
      const b = button({
        width,
        height: size,
        label,
        onTap: () => this.emit(event),
        onOver: () => this.showTooltip(tip, b.view.getGlobalPosition(), true),
        onOut: () => this.hideTooltip(),
      })
      b.view.label = event
      b.view.position.set(x, 0)
      this._actionBar.addChild(b.view)
      x += width + 8
    }
    if (rules?.autonomy)
      gesture(
        "Laisser\nagir",
        `${fighter.name} joue son tour lui-même, comme il l'entend. Toujours possible. Ne rien lui ordonner de tout le combat renforce sa confiance.`,
        "letAct",
      )
    if (rules?.withdraw)
      gesture(
        "Se retirer",
        "Le Ghom lâche prise et quitte le combat : plus aucune Influence, plus aucun ordre.",
        "withdraw",
        104,
      )
    return x
  }

  /** The operation being aimed (Extraire, Porter, Geler...), if any. */
  crystalMode: { op: CrystalOp; gain: "elan" | "heal" } | null = null

  /**
   * Crystal and cold buttons, after the autonomy ones, only for the
   * operations the rules have. Returns the x where the next button goes.
   */
  private _crystalButtons(
    fighter: Fighter,
    combat: Combat,
    size: number,
    from: number,
  ): number {
    const kit = combat.adventure?.crystals
    if (!kit) return from
    let x = from
    const ready = kit.available(fighter)
    const entries: {
      op: CrystalOp
      gain: "elan" | "heal"
      label: string
      tip: string
    }[] = [
      {
        op: "extract",
        gain: "elan",
        label: "Extraire\n(Élan)",
        tip: "Brise un cristal voisin : l'équipe gagne de l'Élan. Sa jumelle devient du verre mort et une Lacune s'ouvre.",
      },
      {
        op: "extract",
        gain: "heal",
        label: "Extraire\n(soin)",
        tip: "Brise un cristal voisin : les alliés proches sont soignés. Sa jumelle devient du verre mort et une Lacune s'ouvre.",
      },
      {
        op: "detach",
        gain: "elan",
        label: "Détacher",
        tip: "Détache une géode de son support, sans la briser : elle reste au sol.",
      },
      {
        op: "carry",
        gain: "elan",
        label: "Porter",
        tip: "Prend une géode voisine. Elle tombe si le porteur tombe ; deux porteurs de jumelles sont liés.",
      },
      {
        op: "deposit",
        gain: "elan",
        label: "Déposer",
        tip: "Pose la géode portée sur une case voisine, ou sur un socle.",
      },
      {
        op: "bridge",
        gain: "elan",
        label: "Pont de\ncristal",
        tip: "Pose la géode portée en pont sur l'eau ou un trou : les cases deviennent praticables.",
      },
      {
        op: "gel",
        gain: "elan",
        label: "Geler",
        tip: "Refroidit un combattant ou une case d'eau : il ne peut plus bouger ni agir un moment.",
      },
      {
        op: "thaw",
        gain: "elan",
        label: "Dégeler",
        tip: "Réchauffe un combattant gelé ou une case de glace.",
      },
    ]
    for (const entry of entries) {
      if (!kit.has(entry.op)) continue
      const usable = ready.includes(entry.op)
      const mode = this.crystalMode
      const chosen =
        !!mode &&
        mode.op === entry.op &&
        (entry.op !== "extract" || mode.gain === entry.gain)
      const b = button({
        width: 104,
        height: size,
        label: entry.label,
        onTap: () => {
          if (usable) this.emit("crystal", entry.op, entry.gain)
        },
        onOver: () =>
          this.showTooltip(
            usable ? entry.tip : `${entry.tip} (Rien à portée.)`,
            b.view.getGlobalPosition(),
            true,
          ),
        onOut: () => this.hideTooltip(),
      })
      b.setState({ enabled: usable, selected: chosen })
      b.view.label = `crystal-${entry.op}-${entry.gain}`
      b.view.position.set(x, 0)
      this._actionBar.addChild(b.view)
      x += 104 + 8
    }
    return x
  }

  /** After a refusal: "Respecter" (the ally acts alone) or "Insister". */
  private _refusalButtons(fighter: Fighter, combat: Combat, size: number) {
    const cost = combat.adventure?.insistCost ?? 0
    const energy = combat.teams[fighter.team].energy
    const respect = button({
      width: 128,
      height: size,
      label: "Respecter\nson refus",
      onTap: () => this.emit("letAct"),
      onOver: () =>
        this.showTooltip(
          `${fighter.name} joue son tour lui-même. Sa confiance grandit.`,
          respect.view.getGlobalPosition(),
          true,
        ),
      onOut: () => this.hideTooltip(),
    })
    respect.view.label = "letAct"
    this._actionBar.addChild(respect.view)
    const insist = button({
      width: 128,
      height: size,
      label: `Insister\n(${cost} d'Élan)`,
      accent: COLORS.path,
      onTap: () => this.emit("insist"),
      onOver: () =>
        this.showTooltip(
          `Force l'ordre refusé. Coûte ${cost} d'Élan, et ${fighter.name} s'en souviendra : sa confiance baisse.`,
          insist.view.getGlobalPosition(),
          true,
        ),
      onOut: () => this.hideTooltip(),
    })
    insist.setState({ enabled: energy >= cost })
    insist.view.label = "insist"
    insist.view.position.set(136, 0)
    this._actionBar.addChild(insist.view)
  }

  // ─── Character card ───────────────────────────────────────────────────────

  setCard(fighter: Fighter | null, combat: Combat) {
    clearChildren(this._card)
    if (!fighter) return

    const preset = combat.presetOf(fighter)
    const lines: Container[] = []

    const portrait = new Sprite(characterTexture(fighter.presetId))
    portrait.scale.set(3)
    portrait.position.set(8, 8)
    const name = text(fighter.name, 18, TEAM_COLORS[fighter.team], {
      fontWeight: "700",
    })
    name.position.set(64, 10)
    const tier = combat.adventure?.tierOf(fighter)
    const title = text(
      `${preset.title} · ${combat.teams[fighter.team].name}${
        tier ? ` · ${Hud.tierLabel(tier)}` : ""
      }`,
      12,
      COLORS.muted,
    )
    // the lines flow down: the player's text size can make them taller
    title.position.set(64, Math.max(32, name.y + name.height))
    const hp = richText(describeHp(fighter, combat), 13)
    hp.position.set(64, Math.max(48, title.y + title.height + 2))
    lines.push(portrait, name, title, hp)

    // each stat in the color of what it changes
    const stats = richText(describeStats(fighter), 12, {
      color: COLORS.muted,
      lineHeight: 16,
    })
    stats.position.set(10, Math.max(66, hp.y + hp.height + 4))
    lines.push(stats)
    const width = Math.ceil(
      Math.max(
        200,
        64 + title.width + 10,
        64 + name.width + 10,
        stats.width + 20,
      ),
    )

    let y = Math.max(122, stats.y + stats.height + 6)
    const trait = LOCOMOTION_TRAITS[fighter.locomotion]
    if (trait) {
      const label = text(trait, 12, MEANING.water)
      label.position.set(10, y)
      lines.push(label)
      y += 18
    }
    if (combat.isSwimming(fighter)) {
      const label = richText(
        `En train de nager : ${tag("time", "+50 % de temps")}`,
        12,
        { color: MEANING.water },
      )
      label.position.set(10, y)
      lines.push(label)
      y += 18
    }
    if (fighter.path.length) {
      // a planned walk: how far, how long, in how many of its turns
      const time = combat.movementTime(fighter, fighter.path)
      const turns = combat.turnsFor(fighter, time)
      const n = fighter.path.length
      const label = richText(
        `En route : ${tag("move", `${n} case${n > 1 ? "s" : ""}`)}, ${tag("time", `${Math.round(time)} temps`)} (${tag("time", `${turns} tour${turns > 1 ? "s" : ""}`)})`,
        12,
        { color: COLORS.muted },
      )
      label.position.set(10, y)
      lines.push(label)
      y += 18
    }
    for (const status of fighter.statuses) {
      const dot = new Graphics()
        .circle(14, y + 8, 5)
        .fill(STATUS_COLORS[status.id])
      const label = richText(
        describeStatus(status.id, status.turns, status.value),
        12,
        { wrap: width - 32 },
      )
      label.position.set(24, y)
      lines.push(dot, label)
      y += Math.max(18, Math.ceil(label.height) + 2)
    }

    this._card.addChild(
      panel(width, y + 8, TEAM_COLORS[fighter.team]),
      ...lines,
    )
  }

  // ─── Divine powers ────────────────────────────────────────────────────────

  setDivine(
    combat: Combat,
    team: number,
    canUse: boolean,
    selected: string | null,
  ) {
    clearChildren(this._divine)
    const energy = combat.teams[team].energy

    const title = text("Influences du Ghom", 15, COLORS.energy, {
      fontWeight: "700",
    })
    // wider with a larger text (settings)
    const width = Math.ceil(Math.max(200, title.width + 20))
    title.position.set(10, 8)
    const pips = new Graphics()
    for (let i = 0; i < MAX_ENERGY; i++) {
      pips
        .roundRect(10 + i * 30, 32, 24, 8, 3)
        .fill(i < energy ? COLORS.energy : 0x3a3150)
    }

    const children: Container[] = [title, pips]
    Object.values(DIVINE_ACTIONS).forEach((divine, i) => {
      const b = button({
        width: width - 20,
        height: 40,
        label: divine.name,
        icon: divine.id,
        inline: true,
        onTap: () => this.emit("divine", divine.id),
        onOver: () =>
          this.showTooltip(describeDivine(divine), b.view.getGlobalPosition()),
        onOut: () => this.hideTooltip(),
      })
      b.setState({
        enabled: canUse && energy >= divine.cost,
        selected: selected === divine.id,
      })
      // its cost in Élan, in the Élan color
      const cost = text(`${divine.cost} ✦`, 12, MEANING.elan)
      cost.anchor.set(1, 0.5)
      cost.position.set(width - 30, 20)
      b.view.addChild(cost)
      b.view.position.set(10, 50 + i * 46)
      children.push(b.view)
    })

    this._divine.addChild(panel(width, 50 + 3 * 46 + 6), ...children)
    if (this._width) this._layout()
  }

  // ─── Log, tooltip, banner, end ────────────────────────────────────────────

  log(line: string) {
    this._logLines.push({ text: line })
    this._logLines = this._logLines.slice(-7)
    clearChildren(this._log)
    this._log.addChild(
      richText(this._logLines.map((l) => l.text).join("\n"), 13, {
        color: COLORS.muted,
        lineHeight: 17,
      }),
    )
  }

  /** A tooltip of the timeline: under it, never over the axis. */
  private _tipUnderTimeline(content: string, node: Container) {
    const bounds = this._timeline.getBounds()
    const scale = this._container.scale.x
    // showTooltip puts it 50 under the given point
    this.showTooltip(content, {
      x: node.getGlobalPosition().x,
      y: bounds.y + bounds.height + (6 - 50) * scale,
    })
  }

  showTooltip(
    content: string,
    global: { x: number; y: number },
    above = false,
  ) {
    const scale = this._container.scale.x
    const at = { x: global.x / scale, y: global.y / scale }
    clearChildren(this._tooltipText)
    this._tooltipText.addChild(
      richText(content, 13, { wrap: 260, lineHeight: 17 }),
    )
    this._tooltipText.position.set(8, 6)
    const bg = this._tooltip.children[0] as Graphics
    bg.clear()
      .roundRect(
        0,
        0,
        this._tooltipText.width + 16,
        this._tooltipText.height + 12,
        4,
      )
      .fill({ color: 0x0f0c17, alpha: 0.95 })
      .stroke({ width: 1, color: COLORS.panelBorder })
    const x = Math.min(at.x, this._width - this._tooltip.width - 8)
    const y = above ? at.y - this._tooltip.height - 8 : at.y + 50
    this._tooltip.position.set(Math.max(8, x), Math.max(8, y))
    this._tooltip.visible = true
  }

  showTooltipAt(content: string, global: { x: number; y: number }) {
    this.showTooltip(content, { x: global.x + 16, y: global.y - 60 })
  }

  hideTooltip() {
    this._tooltip.visible = false
  }

  /**
   * Before the fight: how to place the team, and the button that starts
   * the fight (false removes it).
   */
  setPlacement(on: boolean) {
    if (this._placement) {
      this._placement.destroy({ children: true })
      this._placement = null
    }
    if (on) {
      const box = new Container()
      box.label = "placement"
      const hint = text(
        "Placez votre équipe : un personnage, puis une case bleue",
        14,
        COLORS.text,
      )
      const go = button({
        width: 190,
        height: 40,
        label: "Combattre (Entrée)",
        onTap: () => this.emit("fight"),
      })
      go.view.label = "fight"
      const width = Math.max(hint.width, 190) + 32
      box.addChild(panel(width, 96))
      hint.position.set(Math.round((width - hint.width) / 2), 12)
      go.view.position.set(Math.round((width - 190) / 2), 44)
      box.addChild(hint, go.view)
      this._placement = box
      this._container.addChild(box)
    }
    this._actionBar.visible = !on
    if (this._width) this._layout()
  }

  get placing() {
    return this._placement !== null
  }

  banner(message: string, color = COLORS.text) {
    this._banner.text = message
    this._banner.style.fill = color
    this._bannerTime = 1100
    this._banner.alpha = 1
  }

  showEnd(
    message: string,
    color: number,
    actions: { id: string; label: string }[] = [
      { id: "restart", label: "Rejouer" },
    ],
  ) {
    clearChildren(this._end)
    const title = text(message, 40, color, {
      fontWeight: "700",
      stroke: { color: 0x000000, width: 8 },
    })
    title.anchor.set(0.5, 0)
    title.position.set(160, 20)
    this._end.addChild(panel(320, 110 + actions.length * 58), title)
    actions.forEach((action, i) => {
      const view = button({
        width: 220,
        height: 48,
        label: action.label,
        onTap: () => this.emit("endAction", action.id),
      })
      view.view.position.set(50, 96 + i * 58)
      view.view.label = `end:${action.id}`
      this._end.addChild(view.view)
    })
    this._end.visible = true
    this._centerEnd()
  }

  private _centerEnd() {
    // below the timeline, so the final board stays visible
    this._end.position.set(Math.round(this._width / 2 - 160), 120)
  }
}

/** A rectangle of the screen. */
export interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

function boundsOf(view: Container): Bounds | null {
  if (!view.visible || view.children.length === 0) return null
  const { x, y, width, height } = view.getBounds()
  return width > 0 && height > 0 ? { x, y, width, height } : null
}
