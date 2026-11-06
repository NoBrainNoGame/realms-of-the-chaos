import type * as booyah from "@ghom/booyah"
import {
  AFFINITIES,
  CHARACTERS,
  type CharacterPreset,
  createRng,
  customPreset,
  HP_PER_HEALTH,
  resolveAction,
} from "@realms/engine"
import { Container, Graphics, Sprite } from "pixi.js"
import { settings } from "../settings"
import { arcadeBest, customCharacters, customId } from "../storage"
import Backdrop from "./Backdrop"
import { LOCOMOTION_TRAITS } from "./Hud"
import { registerLook } from "./looks"
import { Puppet } from "./Puppet"
import { characterTexture } from "./textures"
import { COLORS, TEAM_COLORS } from "./theme"
import { type Button, button, clearChildren, panel, text } from "./ui"
import ViewChip from "./ViewChip"

export type PickerMode = "skirmish" | "local" | "arcade"

export interface Difficulty {
  id: "easy" | "normal" | "hard"
  label: string
  /** Stat multiplier of the AI team. */
  multiplier: number
}

export const DIFFICULTIES: Difficulty[] = [
  { id: "easy", label: "Facile", multiplier: 0.85 },
  { id: "normal", label: "Normal", multiplier: 1 },
  { id: "hard", label: "Difficile", multiplier: 1.2 },
]

export const MAX_TEAM = 3

export interface PickerResult {
  mode: PickerMode
  /** Picked teams: one per player (two in a local duel). */
  teams: string[][]
  /** AI team of a skirmish. */
  enemies: string[]
  difficulty: Difficulty
  /** Map seed. */
  seed: number
}

interface PickerEvents extends booyah.BaseCompositeEvents {
  confirm: [result: PickerResult]
  back: []
}

const MODE_TITLES: Record<PickerMode, string> = {
  skirmish: "Escarmouche",
  local: "Duel local",
  arcade: "Arcade",
}

const COLUMNS = 4
const CARD = { width: 150, height: 184, gap: 12 }
const GRID_WIDTH = COLUMNS * (CARD.width + CARD.gap) - CARD.gap
const SHEET_WIDTH = 300
const LAYOUT_WIDTH = GRID_WIDTH + 24 + SHEET_WIDTH

interface Card {
  id: string
  view: Container
  bg: Graphics
  puppet: Puppet
  badge: ReturnType<typeof text>
}

/** A random team of `size` characters (duplicates allowed). */
export function randomTeam(seed: number, size = MAX_TEAM) {
  const rng = createRng(seed)
  const ids = Object.keys(CHARACTERS)
  return Array.from({ length: size }, () => rng.pick(ids))
}

/**
 * Team selection, shared by every mode: 1 to 3 characters per player
 * (both players in turn for a local duel), with the mode's settings.
 *
 * Keyboard: arrows move, Space picks, Enter confirms, Escape goes back,
 * D changes the difficulty, R draws another map.
 */
export default class TeamPicker extends ViewChip<PickerEvents> {
  private _layout!: Container
  private _heading!: ReturnType<typeof text>
  private _hint!: ReturnType<typeof text>
  private _cards: Card[] = []
  private _sheet!: Container
  private _slots!: Container
  private _options!: Container
  private _confirm!: Button
  private _focus = 0
  private _step = 0
  private _picks: string[][]
  private _difficulty = 1
  private _seed: number
  private _enemies: string[]
  /** The characters offered: the eight, then the saved customs. */
  private _roster: Record<string, CharacterPreset> = { ...CHARACTERS }
  /** Ids of the saved customs, in order. */
  private _customIds: string[] = []

  constructor(
    readonly mode: PickerMode,
    options: { seed?: number; teams?: string[][] } = {},
  ) {
    super()
    this._seed = options.seed ?? Math.floor(Math.random() * 1e6)
    for (const c of customCharacters()) {
      const id = customId(c.name)
      this._roster[id] = customPreset(c)
      this._customIds.push(id)
      registerLook(id, c.kit)
    }
    this._picks = Array.from({ length: this.steps }, (_, i) =>
      (options.teams?.[i] ?? [])
        .filter((id) => this._roster[id])
        .slice(0, MAX_TEAM),
    )
    this._enemies = randomTeam(this._seed + 1)
  }

  /** Number of players picking a team. */
  get steps() {
    return this.mode === "local" ? 2 : 1
  }

  get step() {
    return this._step
  }

  get picks(): readonly (readonly string[])[] {
    return this._picks
  }

  get difficulty() {
    return DIFFICULTIES[this._difficulty]
  }

  get seed() {
    return this._seed
  }

  get enemies(): readonly string[] {
    return this._enemies
  }

  get focusedId() {
    return this._cards[this._focus]?.id ?? Object.keys(this._roster)[0]
  }

  get canConfirm() {
    const team = this._picks[this._step]
    return team.length >= 1 && team.length <= MAX_TEAM
  }

  // ─── Actions (mouse, keyboard and tests) ──────────────────────────────────

  /** Adds the character to the current team, or removes it. */
  toggle(id: string) {
    const team = this._picks[this._step]
    const index = team.lastIndexOf(id)
    if (index >= 0) team.splice(index, 1)
    else if (team.length < MAX_TEAM) team.push(id)
    this._refresh()
  }

  /** Adds one more copy of a character (duplicates are allowed). */
  add(id: string) {
    const team = this._picks[this._step]
    if (team.length < MAX_TEAM) team.push(id)
    this._refresh()
  }

  removeAt(index: number) {
    this._picks[this._step].splice(index, 1)
    this._refresh()
  }

  confirm() {
    if (!this.canConfirm) return
    if (this._step < this.steps - 1) {
      this._step++
      this._refresh()
      return
    }
    this.emit("confirm", {
      mode: this.mode,
      teams: this._picks.map((t) => [...t]),
      enemies: [...this._enemies],
      difficulty: this.difficulty,
      seed: this._seed,
    })
  }

  back() {
    if (this._step > 0) {
      this._step--
      this._refresh()
      return
    }
    this.emit("back")
  }

  cycleDifficulty() {
    this._difficulty = (this._difficulty + 1) % DIFFICULTIES.length
    this._refresh()
  }

  rerollMap() {
    this._seed = Math.floor(Math.random() * 1e6)
    this._refresh()
  }

  rerollEnemies() {
    this._enemies = randomTeam(Math.floor(Math.random() * 1e6))
    this._refresh()
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  protected _onActivate() {
    this._activateChildChip(new Backdrop())
    this._layout = new Container()
    this._container.addChild(this._layout)

    this._heading = text("", 30, COLORS.text, {
      fontWeight: "700",
      stroke: { color: 0x000000, width: 5 },
    })
    this._hint = text(
      "Flèches : choisir · Espace : ajouter/retirer · Entrée : valider · Échap : retour",
      12,
      COLORS.muted,
    )
    this._hint.y = 40
    this._layout.addChild(this._heading, this._hint)

    const ids = Object.keys(this._roster)
    for (const [i, id] of ids.entries()) {
      this._cards.push(this._createCard(id, i))
    }

    this._sheet = new Container()
    this._sheet.position.set(GRID_WIDTH + 24, 70)
    this._slots = new Container()
    this._options = new Container()
    this._layout.addChild(this._sheet, this._slots, this._options)

    const rows = Math.ceil(ids.length / COLUMNS)
    const bottom = 70 + rows * (CARD.height + CARD.gap) + 6
    this._slots.position.set(0, bottom)
    this._options.position.set(0, bottom + 74)

    const back = button({
      width: 150,
      height: 44,
      label: "Retour",
      onTap: () => this.back(),
    })
    back.view.label = "picker:back"
    back.view.position.set(LAYOUT_WIDTH - 150 - 12 - 200, bottom + 6)
    this._confirm = button({
      width: 200,
      height: 44,
      label: "Combattre !",
      onTap: () => this.confirm(),
    })
    this._confirm.view.label = "picker:confirm"
    this._confirm.view.position.set(LAYOUT_WIDTH - 200, bottom + 6)
    this._layout.addChild(back.view, this._confirm.view)

    this._subscribe(window, "keydown", (e: KeyboardEvent) => this._onKey(e))
    this._refresh()
  }

  protected _onTick() {
    const dt = this._lastTickInfo.timeSinceLastTick
    for (const card of this._cards) card.puppet.update(dt)
  }

  protected _onResize(width: number, height: number) {
    const contentHeight = this._layout.height + 20
    // the player's interface size, as long as the screen has room
    const scale = Math.min(
      1.25 * settings().uiSize,
      (width - 32) / LAYOUT_WIDTH,
      (height - 32) / contentHeight,
    )
    this._layout.scale.set(Math.max(0.4, scale))
    this._layout.position.set(
      Math.round((width - LAYOUT_WIDTH * this._layout.scale.x) / 2),
      Math.round(Math.max(16, (height - contentHeight * scale) / 2)),
    )
  }

  // ─── Building ─────────────────────────────────────────────────────────────

  private _createCard(id: string, index: number): Card {
    const preset = this._roster[id]
    const view = new Container()
    view.label = `card:${id}`
    view.position.set(
      (index % COLUMNS) * (CARD.width + CARD.gap),
      70 + Math.floor(index / COLUMNS) * (CARD.height + CARD.gap),
    )
    view.eventMode = "static"
    view.cursor = "pointer"
    const bg = new Graphics()
    const shadow = new Graphics()
      .ellipse(CARD.width / 2, 124, 24, 9)
      .fill({ color: 0x000000, alpha: 0.35 })
    const puppet = new Puppet(id)
    puppet.scale.set(1.6)
    puppet.position.set(CARD.width / 2, 124)
    const name = text(preset.name, 16, COLORS.text, { fontWeight: "700" })
    name.anchor.set(0.5, 0)
    name.position.set(CARD.width / 2, 136)
    const title = text(
      this._customIds.includes(id)
        ? `Forgé · ${CHARACTERS[this._kitOf(id)].name}`
        : preset.title,
      11,
      this._customIds.includes(id) ? COLORS.combo : COLORS.muted,
    )
    title.anchor.set(0.5, 0)
    title.position.set(CARD.width / 2, 158)
    const badge = text("", 14, 0x15121f, { fontWeight: "700" })
    badge.position.set(8, 6)
    view.addChild(bg, shadow, puppet, name, title, badge)

    view.on("pointerover", () => this._setFocus(index))
    view.on("pointertap", () => {
      this._setFocus(index)
      this.toggle(id)
    })
    this._layout.addChild(view)
    return { id, view, bg, puppet, badge }
  }

  private _kitOf(id: string) {
    return customCharacters().find((c) => customId(c.name) === id)?.kit ?? id
  }

  private _setFocus(index: number) {
    if (index === this._focus) return
    this._focus = index
    this._cards[index].puppet.walk(900)
    this._refresh()
  }

  private _onKey(e: KeyboardEvent) {
    const n = this._cards.length
    const moves: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -COLUMNS,
      ArrowDown: COLUMNS,
    }
    if (e.key in moves) {
      e.preventDefault()
      this._setFocus((this._focus + moves[e.key] + n) % n)
    } else if (e.key === " ") {
      e.preventDefault()
      this.toggle(this.focusedId)
    } else if (e.key === "Enter") {
      e.preventDefault()
      this.confirm()
    } else if (e.key === "Escape") {
      this.back()
    } else if ((e.key === "d" || e.key === "D") && this.mode === "skirmish") {
      this.cycleDifficulty()
    } else if (e.key === "r" || e.key === "R") {
      this.rerollMap()
    }
  }

  private _teamColor() {
    return this.mode === "local" ? TEAM_COLORS[this._step] : TEAM_COLORS[0]
  }

  private _refresh() {
    if (!this._heading) return
    const color = this._teamColor()
    const who =
      this.mode === "local"
        ? `${this._step === 0 ? "Joueur bleu" : "Joueur rouge"} : `
        : ""
    this._heading.text = `${MODE_TITLES[this.mode]} — ${who}choisissez 1 à ${MAX_TEAM} Échos`
    this._heading.style.fill = this.mode === "local" ? color : COLORS.text

    const team = this._picks[this._step]
    const full = team.length >= MAX_TEAM
    this._cards.forEach((card, i) => {
      const count = team.filter((id) => id === card.id).length
      const focused = i === this._focus
      card.bg
        .clear()
        .roundRect(0, 0, CARD.width, CARD.height, 8)
        .fill({ color: focused ? 0x352b4d : COLORS.panel, alpha: 0.95 })
        .stroke({
          width: count ? 3 : 2,
          color: count ? 0xffe066 : focused ? 0xffffff : COLORS.panelBorder,
        })
      card.badge.text = count ? `×${count}` : ""
      card.badge.style.fill = 0xffe066
      card.view.alpha = full && !count ? 0.55 : 1
    })

    this._drawSheet(this.focusedId)
    this._drawSlots()
    this._drawOptions()

    const last = this._step === this.steps - 1
    const confirmLabel = !last
      ? "Suivant"
      : this.mode === "arcade"
        ? "Commencer"
        : "Combattre !"
    this._confirm.setLabel(confirmLabel)
    this._confirm.setState({ enabled: this.canConfirm })
  }

  private _drawSheet(id: string) {
    clearChildren(this._sheet)
    const preset = this._roster[id]
    const s = preset.stats
    const portrait = new Sprite(characterTexture(id))
    portrait.scale.set(3)
    portrait.position.set(12, 12)
    const name = text(preset.name, 20, COLORS.text, { fontWeight: "700" })
    name.position.set(72, 12)
    const trait = LOCOMOTION_TRAITS[preset.locomotion ?? "walker"]
    const title = text(
      `${preset.title} · ${AFFINITIES[preset.affinity].name}${trait ? `\n${trait}` : ""}`,
      12,
      COLORS.muted,
      { lineHeight: 16 },
    )
    title.position.set(72, 38)
    const stats = text(
      [
        `PV ${Math.round(s.health * HP_PER_HEALTH)}   Vitesse ${s.speed}   Chance ${s.luck}`,
        `Attaque  phys. ${s.physicalAttack}   én. ${s.magicalAttack}`,
        `Défense  phys. ${s.physicalDefense}   én. ${s.magicalDefense}`,
      ].join("\n"),
      12,
      COLORS.text,
      { lineHeight: 17 },
    )
    stats.position.set(12, 86)
    const actions = text(
      preset.actions
        .filter((a) => a !== "kick")
        .map((a) => {
          const action = resolveAction(preset, a)
          return `• ${action.name} — ${action.description}`
        })
        .join("\n"),
      12,
      COLORS.text,
      { lineHeight: 16, wordWrap: true, wordWrapWidth: SHEET_WIDTH - 24 },
    )
    actions.position.set(12, 148)
    const combo = text(
      `Intrication : avec un allié sur sa case, ${AFFINITIES[preset.affinity].description}.`,
      11,
      COLORS.combo,
      { wordWrap: true, wordWrapWidth: SHEET_WIDTH - 24, lineHeight: 15 },
    )
    combo.position.set(12, actions.y + actions.height + 10)
    const height = Math.max(
      CARD.height * 2 + CARD.gap,
      combo.y + combo.height + 14,
    )
    this._sheet.addChild(
      panel(SHEET_WIDTH, height),
      portrait,
      name,
      title,
      stats,
      actions,
      combo,
    )
  }

  private _drawSlots() {
    clearChildren(this._slots)
    const color = this._teamColor()
    this._picks.forEach((team, step) => {
      if (this.mode !== "local" && step > 0) return
      const row = new Container()
      row.x = step * 250
      const current = step === this._step
      row.alpha = current ? 1 : 0.6
      for (let i = 0; i < MAX_TEAM; i++) {
        const slot = new Container()
        slot.position.set(i * 62, 0)
        slot.addChild(
          new Graphics()
            .roundRect(0, 0, 56, 56, 6)
            .fill(0x15121f)
            .stroke({
              width: 2,
              color: this.mode === "local" ? TEAM_COLORS[step] : color,
            }),
        )
        const id = team[i]
        if (id) {
          const portrait = new Sprite(characterTexture(id))
          portrait.scale.set(3)
          portrait.anchor.set(0.5)
          portrait.position.set(28, 28)
          slot.addChild(portrait)
          if (current) {
            slot.eventMode = "static"
            slot.cursor = "pointer"
            slot.on("pointertap", () => this.removeAt(i))
          }
        }
        row.addChild(slot)
      }
      this._slots.addChild(row)
    })
  }

  private _drawOptions() {
    clearChildren(this._options)
    const items: { label: string; onTap: () => void; id: string }[] = []
    if (this.mode === "skirmish") {
      items.push(
        {
          id: "difficulty",
          label: `Difficulté : ${this.difficulty.label} (D)`,
          onTap: () => this.cycleDifficulty(),
        },
        {
          id: "enemies",
          label: `Adversaires : ${this._enemies.map((e) => CHARACTERS[e].name).join(", ")} (relancer)`,
          onTap: () => this.rerollEnemies(),
        },
      )
    }
    if (this.mode !== "arcade") {
      items.push({
        id: "map",
        label: `Carte n°${this._seed} (R : relancer)`,
        onTap: () => this.rerollMap(),
      })
    } else {
      const best = arcadeBest()
      const record = text(
        best
          ? `Record : ${best.score} points, ${best.waves} Marée(s)`
          : "Aucun record pour l'instant.",
        14,
        COLORS.muted,
      )
      record.position.set(0, 12)
      this._options.addChild(record)
    }
    let x = 0
    for (const item of items) {
      const width = Math.max(150, item.label.length * 7.4 + 24)
      const b = button({
        width,
        height: 38,
        label: item.label,
        onTap: item.onTap,
      })
      b.view.label = `option:${item.id}`
      b.view.x = x
      x += width + 10
      this._options.addChild(b.view)
    }
  }
}
