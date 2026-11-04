import type * as booyah from "@ghom/booyah"
import {
  type ActionDefinition,
  CHARACTERS,
  type Combat,
  DIVINE_ACTIONS,
  type Fighter,
  type Locomotion,
  MAX_ENERGY,
  STATUSES,
  STEP_DELAY_RATIO,
} from "@realms/engine"
import { Container, Graphics, Sprite, Text } from "pixi.js"
import { STATUS_COLORS } from "./FighterView"
import { characterTexture } from "./textures"
import { COLORS, TEAM_COLORS } from "./theme"
import {
  button,
  clearChildren,
  panel,
  richText,
  type Segment,
  text,
} from "./ui"
import ViewChip from "./ViewChip"

interface HudEvents extends booyah.BaseCompositeEvents {
  action: [actionId: string]
  pass: []
  divine: [divineId: string]
  endAction: [id: string]
  speed: []
  quit: []
}

/** Water traits shown on the character card. */
export const LOCOMOTION_TRAITS: Record<Locomotion, string | null> = {
  walker: null,
  swimmer: "Nageur (eau profonde)",
  aquatic: "Aquatique (aucune pénalité)",
}

export default class Hud extends ViewChip<HudEvents> {
  private _timeline!: Container
  private _actionBar!: Container
  private _card!: Container
  private _divine!: Container
  private _log!: Text
  private _logLines: { text: string }[] = []
  private _tooltip!: Container
  private _tooltipText!: Text
  private _banner!: Text
  private _bannerTime = 0
  private _end!: Container
  private _speed!: Text
  /** One-line preview above the action bar (e.g. the cost of a move). */
  private _preview!: Container
  private _quit!: Text
  private _width = 0
  private _height = 0

  protected _onActivate() {
    this._timeline = new Container()
    this._actionBar = new Container()
    this._card = new Container()
    this._divine = new Container()
    this._log = text("", 13, COLORS.muted, { lineHeight: 17 })
    this._tooltip = new Container()
    this._tooltip.visible = false
    this._tooltipText = text("", 13, COLORS.text, {
      wordWrap: true,
      wordWrapWidth: 240,
      lineHeight: 17,
    })
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

    const help = text(
      "Clic : se déplacer · C : course · 1-5 : actions · Espace : passer · Échap / clic droit : annuler",
      12,
      COLORS.muted,
    )
    help.position.set(12, 10)
    help.label = "help"

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
      this._banner,
      this._tooltip,
      this._end,
    )
  }

  protected _onTick() {
    if (this._bannerTime > 0) {
      this._bannerTime -= this._lastTickInfo.timeSinceLastTick
      this._banner.alpha = Math.min(1, this._bannerTime / 300)
    }
  }

  protected _onResize(width: number, height: number) {
    this._width = width
    this._height = height
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
    this._divine.position.set(w - 212, 100)
    this._log.position.set(12, h - 140)
    this._speed.position.set(w - 12, 10)
    this._placePreview()
    this._quit.position.set(w - 110, 10)
    this._banner.position.set(w / 2, h * 0.3)
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
  }

  setSpeed(speed: number) {
    this._speed.text = `Vitesse x${speed}`
  }

  // ─── Timeline ─────────────────────────────────────────────────────────────

  setTimeline(combat: Combat) {
    clearChildren(this._timeline)
    const order = combat.timelineOrder()
    const size = 44
    const gap = 6
    const width = order.length * (size + gap) - gap + 16

    this._timeline.addChild(panel(width, size + 26))
    const arrow = text("→ ordre de jeu", 11, COLORS.muted)
    arrow.position.set(8, size + 9)
    this._timeline.addChild(arrow)

    order.forEach((fighter, i) => {
      const slot = new Container()
      slot.position.set(8 + i * (size + gap), 6)
      const active = combat.activeFighter === fighter
      slot.addChild(
        new Graphics()
          .roundRect(0, 0, size, size, 4)
          .fill(0x15121f)
          .stroke({
            width: active ? 3 : 2,
            color: active ? 0xffffff : TEAM_COLORS[fighter.team],
          }),
      )
      const portrait = new Sprite(characterTexture(fighter.presetId))
      portrait.scale.set(2.5)
      portrait.anchor.set(0.5, 0)
      portrait.position.set(size / 2, 2)
      const mask = new Graphics().rect(2, 2, size - 4, size - 4).fill(0xffffff)
      portrait.mask = mask
      slot.addChild(mask, portrait)

      const wait = Math.max(0, Math.round(fighter.nextActionAt - combat.time))
      const label = text(active ? "▶" : `${wait}`, 11, COLORS.text, {
        stroke: { color: 0x000000, width: 3 },
      })
      label.anchor.set(1, 1)
      label.position.set(size - 3, size - 1)
      slot.addChild(label)

      slot.eventMode = "static"
      slot.on("pointerover", () =>
        this.showTooltip(
          `${fighter.name} — prochain tour dans ${wait}`,
          slot.getGlobalPosition(),
        ),
      )
      slot.on("pointerout", () => this.hideTooltip())
      this._timeline.addChild(slot)
    })
    this._layout()
  }

  // ─── Action bar ───────────────────────────────────────────────────────────

  setActions(fighter: Fighter | null, combat: Combat, selected: string | null) {
    clearChildren(this._actionBar)

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
    const actions = combat.actionsOf(fighter)
    actions.forEach((action, i) => {
      const cooldown = fighter.cooldowns[action.id] ?? 0
      const b = button({
        width: size,
        height: size,
        icon: action.combo?.baseId ?? action.id,
        accent: action.combo ? COLORS.combo : undefined,
        hotkey: `${i + 1}`,
        label: cooldown > 0 ? `⌛${cooldown - 1}` : undefined,
        onTap: () => this.emit("action", action.id),
        onOver: () =>
          this.showTooltip(
            describeAction(action, combat, fighter),
            b.view.getGlobalPosition(),
            true,
          ),
        onOut: () => this.hideTooltip(),
      })
      b.setState({ enabled: cooldown === 0, selected: selected === action.id })
      // combined actions show the partner who unlocked them
      if (action.combo) {
        const partner = new Sprite(
          characterTexture(action.combo.partnerPresetId),
        )
        partner.scale.set(1.25)
        partner.position.set(size - 22, -10)
        b.view.addChild(partner)
      }
      b.view.position.set(i * (size + 8) + (action.combo ? 12 : 0), 0)
      this._actionBar.addChild(b.view)
    })
    const combos = actions.filter((a) => a.combo).length

    const pass = button({
      width: 96,
      height: size,
      label: "Passer",
      hotkey: "␣",
      onTap: () => this.emit("pass"),
      onOver: () =>
        this.showTooltip(
          "Termine le tour sans agir : vous rejouez juste après le prochain personnage.",
          pass.view.getGlobalPosition(),
          true,
        ),
      onOut: () => this.hideTooltip(),
    })
    pass.view.position.set(
      actions.length * (size + 8) + 12 + (combos ? 12 : 0),
      0,
    )
    this._actionBar.addChild(pass.view)
    this._layout()
  }

  // ─── Character card ───────────────────────────────────────────────────────

  setCard(fighter: Fighter | null, combat: Combat) {
    clearChildren(this._card)
    if (!fighter) return

    const width = 200
    const preset = CHARACTERS[fighter.presetId]
    const lines: Container[] = []

    const portrait = new Sprite(characterTexture(fighter.presetId))
    portrait.scale.set(3)
    portrait.position.set(8, 8)
    const name = text(fighter.name, 18, TEAM_COLORS[fighter.team], {
      fontWeight: "700",
    })
    name.position.set(64, 10)
    const title = text(
      `${preset.title} · ${combat.teams[fighter.team].name}`,
      12,
      COLORS.muted,
    )
    title.position.set(64, 32)
    const hp = text(`PV ${fighter.hp} / ${combat.maxHp(fighter)}`, 13)
    hp.position.set(64, 48)
    lines.push(portrait, name, title, hp)

    // stats may be scaled by difficulty: show them rounded
    const s = Object.fromEntries(
      Object.entries(fighter.stats).map(([k, v]) => [k, Math.round(v)]),
    ) as typeof fighter.stats
    const stats = text(
      [
        `Vitesse ${s.speed}   Chance ${s.luck}`,
        `Atq. phys. ${s.physicalAttack}   Déf. ${s.physicalDefense}`,
        `Atq. én. ${s.magicalAttack}   Déf. ${s.magicalDefense}`,
      ].join("\n"),
      12,
      COLORS.muted,
      { lineHeight: 16 },
    )
    stats.position.set(10, 66)
    lines.push(stats)

    let y = 122
    const trait = LOCOMOTION_TRAITS[fighter.locomotion]
    if (trait) {
      const label = text(trait, 12, 0x66d9e8)
      label.position.set(10, y)
      lines.push(label)
      y += 18
    }
    if (combat.isSwimming(fighter)) {
      const label = text("En train de nager : +50 % de temps", 12, 0xffa94d)
      label.position.set(10, y)
      lines.push(label)
      y += 18
    }
    if (fighter.path.length) {
      // a planned walk: how far, how long, in how many of its turns
      const time = combat.movementTime(fighter, fighter.path)
      const turns = combat.turnsFor(fighter, time)
      const label = text(
        `En route : ${fighter.path.length} case${fighter.path.length > 1 ? "s" : ""}, ${Math.round(time)} temps (${turns} tour${turns > 1 ? "s" : ""})`,
        12,
        COLORS.path,
      )
      label.position.set(10, y)
      lines.push(label)
      y += 18
    }
    for (const status of fighter.statuses) {
      const def = STATUSES[status.id]
      const dot = new Graphics()
        .circle(14, y + 8, 5)
        .fill(STATUS_COLORS[status.id])
      const label = text(
        `${def.name} (${status.turns}t)${status.value ? ` · ${status.value}` : ""}`,
        12,
      )
      label.position.set(24, y)
      lines.push(dot, label)
      y += 18
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
    const width = 200

    const title = text("Influences du Ghom", 15, COLORS.energy, {
      fontWeight: "700",
    })
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
        label: `${divine.name} (${divine.cost})`,
        icon: divine.id,
        inline: true,
        onTap: () => this.emit("divine", divine.id),
        onOver: () =>
          this.showTooltip(
            `${divine.name} — ${divine.cost} d'Élan\n${divine.description}`,
            b.view.getGlobalPosition(),
          ),
        onOut: () => this.hideTooltip(),
      })
      b.setState({
        enabled: canUse && energy >= divine.cost,
        selected: selected === divine.id,
      })
      b.view.position.set(10, 50 + i * 46)
      children.push(b.view)
    })

    this._divine.addChild(panel(width, 50 + 3 * 46 + 6), ...children)
  }

  // ─── Log, tooltip, banner, end ────────────────────────────────────────────

  log(line: string) {
    this._logLines.push({ text: line })
    this._logLines = this._logLines.slice(-7)
    this._log.text = this._logLines.map((l) => l.text).join("\n")
  }

  showTooltip(content: string, at: { x: number; y: number }, above = false) {
    this._tooltipText.text = content
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

export function describeAction(
  action: ActionDefinition,
  combat: Combat,
  fighter: Fighter,
) {
  const range =
    action.launch.shape === "point"
      ? "Sur soi"
      : `Portée ${action.launch.min ?? 0}-${action.launch.max}${
          action.launch.max > 1 ? " (+1 par niveau au-dessus de la cible)" : ""
        }${action.lineOfSight ? ", ligne de vue" : ""}`
  if (action.movement) {
    const step = Math.round(
      combat.baseStepDelay(fighter) *
        STEP_DELAY_RATIO *
        combat.delayMultiplier(fighter),
    )
    return `${action.name} (C)\n${action.description}\nJusqu'à ${action.movement.maxSteps} cases, en contournant les obstacles et en traversant les alliés\ncoût : le temps du trajet (environ ${step} par case sur terrain plat)`
  }
  const cost = Math.round(
    combat.baseDelay(fighter) *
      action.timeCost *
      combat.delayMultiplier(fighter),
  )
  const cooldown = action.cooldown
    ? ` · recharge ${action.cooldown} tour(s)`
    : ""
  const combo = action.combo ? "\n✦ Intrication" : ""
  return `${action.name}${combo}\n${action.description}\n${range}\ncoût ${cost} temps${cooldown}`
}
