import type * as booyah from "@ghom/booyah"
import {
  ACTIONS,
  AFFINITIES,
  CHARACTERS,
  CUSTOM_STATS,
  CUSTOM_STEP,
  type CustomCharacter,
  type CustomStatName,
  type CustomStats,
  checkCustom,
  customDefaults,
  customRange,
  customStats,
  HP_PER_HEALTH,
} from "@realms/engine"
import { Container, Graphics } from "pixi.js"
import { generateName } from "../names"
import {
  customCharacters,
  deleteCustom,
  MAX_CUSTOMS,
  saveCustom,
} from "../storage"
import Backdrop from "./Backdrop"
import { Puppet } from "./Puppet"
import { COLORS } from "./theme"
import { type Button, button, clearChildren, panel, text } from "./ui"
import ViewChip from "./ViewChip"

interface CreatorEvents extends booyah.BaseCompositeEvents {
  back: []
}

export const STAT_LABELS: Record<CustomStatName, string> = {
  speed: "Vitesse",
  physicalAttack: "Attaque physique",
  physicalDefense: "Défense physique",
  magicalAttack: "Attaque énergie",
  magicalDefense: "Défense énergie",
  luck: "Chance",
}

const WIDTH = 940
const HEIGHT = 560
const KITS = Object.keys(CHARACTERS)

/**
 * The workshop: a character is a kit (the actions of one of the eight
 * Échos), a name that is picked (never typed) and stats moved by steps.
 * Health is solved so the character stays as strong as its kit.
 *
 * Keyboard: ← → change the kit, N draws another name, Enter saves,
 * Échap goes back.
 */
export default class Creator extends ViewChip<CreatorEvents> {
  private _box!: Container
  private _puppet: Puppet | null = null
  private _size = { width: 0, height: 0 }
  private _dirty = false
  private _kit: string
  private _stats: CustomStats
  private _name: string
  private _nameSeed: number
  /** Name of the saved character being edited, if any. */
  private _editing: string | null = null

  constructor(edit?: string, seed = Math.floor(Math.random() * 1e6)) {
    super()
    const saved = edit ? customCharacters().find((c) => c.name === edit) : null
    this._nameSeed = seed
    if (saved) {
      this._kit = saved.kit
      this._stats = { ...saved.stats }
      this._name = saved.name
      this._editing = saved.name
    } else {
      this._kit = KITS[0]
      this._stats = customDefaults(this._kit)
      this._name = this._freshName()
    }
  }

  // ─── State (mouse, keyboard and tests) ────────────────────────────────────

  get kit() {
    return this._kit
  }

  get name() {
    return this._name
  }

  get stats(): Readonly<CustomStats> {
    return this._stats
  }

  get editing() {
    return this._editing
  }

  /** Health the stats leave (shown live). */
  get health() {
    return customStats(this._kit, this._stats).health
  }

  get character(): CustomCharacter {
    return { name: this._name, kit: this._kit, stats: { ...this._stats } }
  }

  get canSave() {
    if (!checkCustom(this.character).ok) return false
    if (this._editing) return true
    const saved = customCharacters()
    return (
      saved.length < MAX_CUSTOMS || saved.some((c) => c.name === this._name)
    )
  }

  range(stat: CustomStatName) {
    return customRange(this._kit, this._stats, stat)
  }

  canStep(stat: CustomStatName, direction: -1 | 1) {
    const { min, max } = this.range(stat)
    const next = this._stats[stat] + direction * CUSTOM_STEP
    return next >= min - 1e-9 && next <= max + 1e-9
  }

  /** Moves a stat by one step, within its range (false at the bounds). */
  step(stat: CustomStatName, direction: -1 | 1) {
    if (!this.canStep(stat, direction)) return false
    this._stats = {
      ...this._stats,
      [stat]: this._stats[stat] + direction * CUSTOM_STEP,
    }
    this._dirty = true
    return true
  }

  /** Previous (-1) or next (1) kit: the stats start from its own. */
  changeKit(direction: -1 | 1) {
    const i = KITS.indexOf(this._kit)
    this.setKit(KITS[(i + direction + KITS.length) % KITS.length])
  }

  setKit(kit: string) {
    if (!CHARACTERS[kit] || kit === this._kit) return
    this._kit = kit
    this._stats = customDefaults(kit)
    this._puppetKit = null
    this._dirty = true
  }

  /** Draws another generated name (never one already saved). */
  rerollName() {
    this._nameSeed++
    this._name = this._freshName()
    this._dirty = true
  }

  /** Loads a saved character to edit it. */
  edit(name: string) {
    const saved = customCharacters().find((c) => c.name === name)
    if (!saved) return
    this._kit = saved.kit
    this._stats = { ...saved.stats }
    this._name = saved.name
    this._editing = saved.name
    this._puppetKit = null
    this._dirty = true
  }

  /** Starts a new character. */
  startNew() {
    this._editing = null
    this._kit = KITS[0]
    this._stats = customDefaults(this._kit)
    this._name = this._freshName()
    this._puppetKit = null
    this._dirty = true
  }

  save() {
    if (!this.canSave) return false
    // renamed: the old entry goes
    if (this._editing && this._editing !== this._name)
      deleteCustom(this._editing)
    saveCustom(this.character)
    this.emit("back")
    return true
  }

  remove() {
    if (!this._editing) return
    deleteCustom(this._editing)
    this.startNew()
  }

  back() {
    this.emit("back")
  }

  private _freshName() {
    const taken = new Set(customCharacters().map((c) => c.name))
    let name = generateName(this._nameSeed)
    for (let i = 0; i < 50 && taken.has(name); i++)
      name = generateName(++this._nameSeed)
    return name
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  private _puppetKit: string | null = null

  protected _onActivate() {
    this._activateChildChip(new Backdrop())
    this._box = new Container()
    this._container.addChild(this._box)
    this._build()
    this._subscribe(window, "keydown", (e: KeyboardEvent) => {
      if (this.handleKey(e.key)) e.preventDefault()
    })
  }

  protected _onTick() {
    this._puppet?.update(this._lastTickInfo.timeSinceLastTick)
    if (this._dirty) this._build()
  }

  protected _onResize(width: number, height: number) {
    this._size = { width, height }
    this._place()
  }

  handleKey(key: string): boolean {
    switch (key) {
      case "ArrowLeft":
        this.changeKit(-1)
        return true
      case "ArrowRight":
        this.changeKit(1)
        return true
      case "n":
      case "N":
        this.rerollName()
        return true
      case "Enter":
        this.save()
        return true
      case "Escape":
        this.back()
        return true
    }
    return false
  }

  // ─── Building ─────────────────────────────────────────────────────────────

  private _place() {
    if (!this._box || !this._size.width) return
    const k = Math.max(
      0.4,
      Math.min(
        1.25,
        (this._size.width - 32) / WIDTH,
        (this._size.height - 32) / HEIGHT,
      ),
    )
    this._box.scale.set(k)
    this._box.position.set(
      Math.round((this._size.width - WIDTH * k) / 2),
      Math.round((this._size.height - HEIGHT * k) / 2),
    )
  }

  private _build() {
    this._dirty = false
    // the puppet outlives the rebuilds (it keeps animating)
    if (this._puppet) this._box.removeChild(this._puppet)
    clearChildren(this._box)
    const preset = CHARACTERS[this._kit]
    if (this._puppetKit !== this._kit || !this._puppet) {
      this._puppet?.destroy({ children: true })
      this._puppet = new Puppet(this._kit)
      this._puppetKit = this._kit
      this._puppet.walk(1500)
    }

    const title = text(
      this._editing ? "Atelier — modifier un Écho" : "Atelier — forger un Écho",
      28,
      COLORS.text,
      { fontWeight: "700", stroke: { color: 0x000000, width: 5 } },
    )
    this._box.addChild(title)

    // left: the kit (box coordinates)
    const top = 56
    const prev = this._small("‹", () => this.changeKit(-1), "creator:prev")
    prev.view.position.set(12, top + 70)
    const next = this._small("›", () => this.changeKit(1), "creator:next")
    next.view.position.set(300 - 12 - 36, top + 70)
    const shadow = new Graphics()
      .ellipse(150, top + 170, 30, 10)
      .fill({ color: 0x000000, alpha: 0.35 })
    this._puppet.scale.set(1.8)
    this._puppet.position.set(150, top + 170)
    const kitName = text(`Actions de ${preset.name}`, 16, COLORS.text, {
      fontWeight: "700",
    })
    kitName.anchor.set(0.5, 0)
    kitName.position.set(150, top + 184)
    const kitTitle = text(
      `${preset.title} · ${AFFINITIES[preset.affinity].name}`,
      11,
      COLORS.text,
    )
    kitTitle.anchor.set(0.5, 0)
    kitTitle.position.set(150, top + 206)
    const actions = text(
      preset.actions
        .filter((a) => a !== "kick")
        .map((a) => `• ${ACTIONS[a].name} — ${ACTIONS[a].description}`)
        .join("\n"),
      12,
      COLORS.text,
      { lineHeight: 16, wordWrap: true, wordWrapWidth: 276 },
    )
    actions.position.set(12, top + 232)
    // the card ends with its content
    const kitPanel = panel(300, actions.y + actions.height + 14 - top)
    kitPanel.position.set(0, top)
    this._box.addChild(
      kitPanel,
      shadow,
      this._puppet,
      kitName,
      kitTitle,
      actions,
      prev.view,
      next.view,
    )

    // middle: name and stats
    const x = 332
    const midPanel = panel(372, 440)
    midPanel.position.set(316, top)
    this._box.addChild(midPanel)
    const nameLabel = text("Nom", 12, COLORS.muted)
    nameLabel.position.set(x, 68)
    const nameText = text(this._name, 24, 0xffe066, { fontWeight: "700" })
    nameText.position.set(x, 86)
    const reroll = button({
      width: 120,
      height: 36,
      label: "Autre nom",
      onTap: () => this.rerollName(),
    })
    reroll.view.label = "creator:name"
    reroll.view.position.set(x + 220, 88)
    this._box.addChild(nameLabel, nameText, reroll.view)

    CUSTOM_STATS.forEach((stat, i) => {
      const y = 144 + i * 44
      const label = text(STAT_LABELS[stat], 14, COLORS.text)
      label.position.set(x, y + 8)
      const value = text(String(this._stats[stat]), 16, 0xffe066, {
        fontWeight: "700",
      })
      value.anchor.set(0.5, 0)
      value.position.set(x + 240, y + 7)
      const minus = this._small(
        "−",
        () => this.step(stat, -1),
        `creator:${stat}:-`,
      )
      minus.view.position.set(x + 170, y)
      minus.setState({ enabled: this.canStep(stat, -1) })
      const plus = this._small(
        "+",
        () => this.step(stat, 1),
        `creator:${stat}:+`,
      )
      plus.view.position.set(x + 274, y)
      plus.setState({ enabled: this.canStep(stat, 1) })
      this._box.addChild(label, value, minus.view, plus.view)
    })

    const health = text(
      `PV : ${Math.round(this.health * HP_PER_HEALTH)}  (santé ${Math.round(this.health * 100) / 100})`,
      16,
      COLORS.text,
      { fontWeight: "700" },
    )
    health.position.set(x, 144 + CUSTOM_STATS.length * 44 + 8)
    const note = text(
      "Plus une qualité monte, plus la santé baisse : votre Écho reste aussi fort que celui dont il reprend les actions.",
      11,
      COLORS.text,
      { wordWrap: true, wordWrapWidth: 340, lineHeight: 15 },
    )
    note.position.set(x, health.y + 28)
    this._box.addChild(health, note)

    // right: saved characters
    const rx = 716
    const savedPanel = panel(224, 440)
    savedPanel.position.set(704, top)
    this._box.addChild(savedPanel)
    const savedTitle = text("Vos Échos", 16, COLORS.text, { fontWeight: "700" })
    savedTitle.position.set(rx, 68)
    this._box.addChild(savedTitle)
    const saved = customCharacters()
    if (!saved.length) {
      const none = text("Aucun pour l'instant.", 12, COLORS.text)
      none.position.set(rx, 96)
      this._box.addChild(none)
    }
    saved.forEach((c, i) => {
      const b = button({
        width: 200,
        height: 28,
        label: `${c.name} (${CHARACTERS[c.kit].name})`,
        onTap: () => this.edit(c.name),
      })
      b.view.label = `creator:saved:${c.name}`
      b.setState({ selected: c.name === this._editing })
      b.view.position.set(rx, 96 + i * 32)
      this._box.addChild(b.view)
    })
    if (this._editing) {
      const fresh = button({
        width: 200,
        height: 28,
        label: "+ Nouveau",
        onTap: () => this.startNew(),
      })
      fresh.view.label = "creator:new"
      fresh.view.position.set(rx, 96 + saved.length * 32 + 6)
      this._box.addChild(fresh.view)
    }

    // bottom: save, delete, back
    const back = button({
      width: 150,
      height: 44,
      label: "Retour",
      onTap: () => this.back(),
    })
    back.view.label = "creator:back"
    back.view.position.set(0, HEIGHT - 44)
    const save = button({
      width: 200,
      height: 44,
      label: "Enregistrer",
      onTap: () => this.save(),
    })
    save.view.label = "creator:save"
    save.view.position.set(WIDTH - 200, HEIGHT - 44)
    save.setState({ enabled: this.canSave })
    this._box.addChild(back.view, save.view)
    if (this._editing) {
      const del = button({
        width: 150,
        height: 44,
        label: "Supprimer",
        labelColor: 0xff6b6b,
        onTap: () => this.remove(),
      })
      del.view.label = "creator:delete"
      del.view.position.set(WIDTH - 200 - 12 - 150, HEIGHT - 44)
      this._box.addChild(del.view)
    }
    this._place()
  }

  private _small(label: string, onTap: () => void, id: string): Button {
    const b = button({ width: 36, height: 36, label, onTap })
    b.view.label = id
    return b
  }
}
