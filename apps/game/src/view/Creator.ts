import type * as booyah from "@ghom/booyah"
import {
  type ActionDefinition,
  AFFINITIES,
  CHARACTERS,
  CUSTOM_STATS,
  CUSTOM_STEP,
  type CustomCharacter,
  type CustomStatName,
  type CustomStats,
  checkCustom,
  checkSpell,
  customDefaults,
  customRange,
  customStats,
  HP_PER_HEALTH,
  MAX_SPELLS,
  PICKABLE_ACTIONS,
  previewSpell,
  resolveAction,
  type SpellRecipe,
} from "@realms/engine"
import { Container, Graphics } from "pixi.js"
import { generateName } from "../names"
import {
  customCharacters,
  deleteCustom,
  MAX_CUSTOMS,
  saveCustom,
} from "../storage"
import { actionIcon } from "./actionFx"
import Backdrop from "./Backdrop"
import { Puppet } from "./Puppet"
import SpellForge from "./SpellForge"
import { COLORS } from "./theme"
import { type Button, button, clearChildren, panel, text } from "./ui"
import ViewChip from "./ViewChip"

interface CreatorEvents extends booyah.BaseCompositeEvents {
  back: []
}

type Spells = (string | SpellRecipe)[]

/** What a slot shows of a spell. */
export function spellInfo(entry: string | SpellRecipe) {
  if (typeof entry === "string") {
    const action = resolveAction({}, entry)
    return {
      name: action.name,
      cost: action.timeCost,
      description: action.description,
      icon: actionIcon(action),
      forged: false,
    }
  }
  const check = checkSpell(entry)
  const action: ActionDefinition | null = check.ok ? check.action : null
  return {
    name: entry.name,
    cost: previewSpell(entry).cost,
    description: action?.description ?? "",
    icon: action ? actionIcon(action) : "kick",
    forged: true,
  }
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
const HEIGHT = 720
const PAGE = 10
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
  /** Own spells (undefined: the kit's actions, untouched). */
  private _spells: Spells | undefined
  /** The spell choice being made for a slot, page by page. */
  private _chooser: { slot: number; page: number } | null = null
  private _forge: SpellForge | null = null

  constructor(edit?: string, seed = Math.floor(Math.random() * 1e6)) {
    super()
    const saved = edit ? customCharacters().find((c) => c.name === edit) : null
    this._nameSeed = seed
    if (saved) {
      this._kit = saved.kit
      this._stats = { ...saved.stats }
      this._spells = saved.spells ? clone(saved.spells) : undefined
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
    return customStats(this._kit, this._stats, this._spells).health
  }

  /** The spells shown: the kit's own actions until the player changes them. */
  get spells(): Readonly<Spells> {
    return this._spells ?? CHARACTERS[this._kit].actions
  }

  /** Whether the spells were changed (they are then saved). */
  get ownSpells() {
    return this._spells !== undefined
  }

  get character(): CustomCharacter {
    const character: CustomCharacter = {
      name: this._name,
      kit: this._kit,
      stats: { ...this._stats },
    }
    if (this._spells) character.spells = clone(this._spells)
    return character
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
    return customRange(this._kit, this._stats, stat, this._spells)
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
    this._spells = undefined
    this._stats = customDefaults(kit)
    this._puppetKit = null
    this._dirty = true
  }

  // ─── Spells ───────────────────────────────────────────────────────────────

  /** The spells as the player owns them (the kit's, when untouched). */
  private _own(): Spells {
    return this._spells ?? CHARACTERS[this._kit].actions.slice(0, MAX_SPELLS)
  }

  /**
   * Puts a spell in a slot (the next free one adds it). Stats are kept
   * when they still fit, and start over from balanced ones otherwise.
   */
  setSpell(slot: number, spell: string | SpellRecipe) {
    const spells = this._own().slice()
    if (slot < 0 || slot > spells.length || slot >= MAX_SPELLS) return false
    spells[slot] = clone(spell)
    return this._setSpells(spells)
  }

  canRemoveSpell(slot: number) {
    return this.spells.length > 1 && slot >= 0 && slot < this.spells.length
  }

  removeSpell(slot: number) {
    if (!this.canRemoveSpell(slot)) return false
    const spells = this._own().slice()
    spells.splice(slot, 1)
    return this._setSpells(spells)
  }

  /** Back to the kit's own actions. */
  resetSpells() {
    if (!this._spells) return
    this._spells = undefined
    this._refit()
    this._dirty = true
  }

  private _setSpells(spells: Spells) {
    const ids = spells.map((s) =>
      typeof s === "string" ? s : `spell:${s.name}`,
    )
    if (new Set(ids).size !== ids.length) return false
    this._spells = spells
    this._refit()
    this._dirty = true
    return true
  }

  /** Re-clamps the stats on what the new spells allow (health follows). */
  private _refit() {
    const spells = this._spells
    const stats = { ...this._stats }
    for (let pass = 0; pass < 3; pass++) {
      for (const stat of CUSTOM_STATS) {
        const { min, max } = customRange(this._kit, stats, stat, spells)
        if (min <= max) stats[stat] = Math.min(max, Math.max(min, stats[stat]))
      }
      if (checkCustom({ ...this.character, stats }).ok) {
        this._stats = stats
        return
      }
    }
    this._stats = customDefaults(this._kit, spells)
  }

  /** The choice of a spell for a slot (the existing actions, or the forge). */
  openChooser(slot: number) {
    if (slot < 0 || slot > this.spells.length || slot >= MAX_SPELLS) return
    this._chooser = { slot, page: 0 }
    this._dirty = true
  }

  closeChooser() {
    this._chooser = null
    this._dirty = true
  }

  get chooser(): Readonly<{ slot: number; page: number }> | null {
    return this._chooser
  }

  get pages() {
    return Math.ceil(PICKABLE_ACTIONS.length / PAGE)
  }

  chooserPage(direction: -1 | 1) {
    if (!this._chooser) return
    const page = this._chooser.page + direction
    if (page < 0 || page >= this.pages) return
    this._chooser = { ...this._chooser, page }
    this._dirty = true
  }

  /** Picks an existing action for the slot being chosen. */
  pickAction(id: string) {
    if (!this._chooser || !PICKABLE_ACTIONS.includes(id)) return false
    const ok = this.setSpell(this._chooser.slot, id)
    if (ok) this._chooser = null
    return ok
  }

  get forge() {
    return this._forge
  }

  /** Opens the forge for a slot (a forged spell there is modified). */
  openForge(slot: number) {
    if (this._forge || slot < 0 || slot > this.spells.length) return null
    if (slot >= MAX_SPELLS) return null
    const spells = this._own()
    const current = spells[slot]
    const taken = spells
      .filter((_, i) => i !== slot)
      .flatMap((s) => (typeof s === "string" ? [] : [s.name]))
    const forge = new SpellForge(
      typeof current === "object" ? current : undefined,
      taken,
      this._nameSeed + 77 + slot,
    )
    this._forge = forge
    this._box.visible = false
    this._activateChildChip(forge)
    this._subscribeOnce(forge, "done", (recipe: SpellRecipe) => {
      this.setSpell(slot, recipe)
      this._closeForge()
    })
    this._subscribeOnce(forge, "cancel", () => this._closeForge())
    return forge
  }

  private _closeForge() {
    if (!this._forge) return
    this._terminateChildChip(this._forge)
    this._forge = null
    this._chooser = null
    this._box.visible = true
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
    this._spells = saved.spells ? clone(saved.spells) : undefined
    this._name = saved.name
    this._editing = saved.name
    this._puppetKit = null
    this._dirty = true
  }

  /** Starts a new character. */
  startNew() {
    this._editing = null
    this._kit = KITS[0]
    this._spells = undefined
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
    // the forge has its own keys
    if (this._forge) return false
    if (this._chooser) {
      if (key !== "Escape") return false
      this.closeChooser()
      return true
    }
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
    if (this._chooser) {
      this._buildChooser()
      return
    }

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
    const kitNote = text(
      "Son apparence et son affinité. Ses sorts se choisissent plus bas.",
      11,
      COLORS.muted,
      { lineHeight: 15, wordWrap: true, wordWrapWidth: 276 },
    )
    kitNote.position.set(12, top + 236)
    const kitPanel = panel(300, 440)
    kitPanel.position.set(0, top)
    this._box.addChild(
      kitPanel,
      shadow,
      this._puppet,
      kitName,
      kitTitle,
      kitNote,
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
    if (!checkCustom(this.character).ok) {
      const warn = text(
        "Cette composition est trop forte ou trop faible : changez un sort ou une qualité.",
        12,
        0xff6b6b,
        { wordWrap: true, wordWrapWidth: 340, lineHeight: 15 },
      )
      warn.label = "creator:warning"
      warn.position.set(x, note.y + note.height + 8)
      this._box.addChild(warn)
    }

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

    this._buildSlots(512)

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

  /** The spells of the character: one card per slot. */
  private _buildSlots(y: number) {
    const spells = this.spells
    const slots = Math.max(MAX_SPELLS, spells.length)
    const gap = 12
    const width = (WIDTH - gap * (slots - 1)) / slots
    const heading = text(
      this.ownSpells ? "Sorts" : "Sorts (ceux de son modèle)",
      16,
      COLORS.text,
      { fontWeight: "700" },
    )
    heading.position.set(0, y)
    this._box.addChild(heading)
    if (this.ownSpells) {
      const reset = button({
        width: 190,
        height: 24,
        label: "Rétablir ceux du modèle",
        onTap: () => this.resetSpells(),
      })
      reset.view.label = "creator:spells:reset"
      reset.view.position.set(WIDTH - 190, y - 2)
      this._box.addChild(reset.view)
    }
    const top = y + 28
    for (let i = 0; i < slots; i++) {
      const x = i * (width + gap)
      const card = panel(width, 120)
      card.position.set(x, top)
      this._box.addChild(card)
      const entry = spells[i]
      if (entry === undefined) {
        const add = button({
          width: width - 24,
          height: 36,
          label: "+ Ajouter un sort",
          onTap: () => this.openChooser(i),
        })
        add.view.label = `creator:spell:${i}:add`
        add.view.position.set(x + 12, top + 42)
        this._box.addChild(add.view)
        continue
      }
      const info = spellInfo(entry)
      const name = text(info.name, 15, 0xffe066, { fontWeight: "700" })
      name.position.set(x + 10, top + 8)
      const cost = text(`Délai : ${info.cost.toFixed(2)}`, 11, COLORS.muted)
      cost.anchor.set(1, 0)
      cost.position.set(x + width - 10, top + 11)
      const short =
        info.description.length > 110
          ? `${info.description.slice(0, 107)}…`
          : info.description
      const description = text(short, 11, COLORS.text, {
        wordWrap: true,
        wordWrapWidth: width - 20,
        lineHeight: 14,
      })
      description.position.set(x + 10, top + 30)
      this._box.addChild(name, cost, description)
      const buttons: [string, string, () => void, boolean, number?][] = [
        ["Changer", "change", () => this.openChooser(i), true],
        ...(info.forged
          ? ([["Modifier", "edit", () => this.openForge(i), true]] as [
              string,
              string,
              () => void,
              boolean,
            ][])
          : []),
        [
          "Retirer",
          "remove",
          () => this.removeSpell(i),
          this.canRemoveSpell(i),
          0xff6b6b,
        ],
      ]
      const bw = (width - 20 - 6 * (buttons.length - 1)) / buttons.length
      buttons.forEach(([label, id, onTap, enabled, color], j) => {
        const b = button({
          width: bw,
          height: 26,
          label,
          labelColor: color,
          onTap,
        })
        b.view.label = `creator:spell:${i}:${id}`
        b.view.position.set(x + 10 + j * (bw + 6), top + 88)
        b.setState({ enabled })
        this._box.addChild(b.view)
      })
    }
  }

  /** Choice of the spell of a slot: an existing action, or the forge. */
  private _buildChooser() {
    const chooser = this._chooser!
    const top = 56
    const back = panel(WIDTH, 590)
    back.position.set(0, top)
    this._box.addChild(back)
    const heading = text(
      `Sort ${chooser.slot + 1} : choisir une action ou en forger une`,
      18,
      COLORS.text,
      { fontWeight: "700" },
    )
    heading.position.set(16, top + 12)
    this._box.addChild(heading)
    const forge = button({
      width: 260,
      height: 40,
      label: "Forger un sort",
      onTap: () => this.openForge(chooser.slot),
    })
    forge.view.label = "creator:forge"
    forge.view.position.set(WIDTH - 276, top + 8)
    this._box.addChild(forge.view)

    const taken = new Set(this.spells.filter((_, i) => i !== chooser.slot))
    const ids = PICKABLE_ACTIONS.slice(
      chooser.page * PAGE,
      (chooser.page + 1) * PAGE,
    )
    const hint = text("", 12, COLORS.text, {
      wordWrap: true,
      wordWrapWidth: WIDTH - 32,
      lineHeight: 16,
    })
    hint.position.set(16, top + 480)
    ids.forEach((id, i) => {
      const action = resolveAction({}, id)
      const col = i % 2
      const row = Math.floor(i / 2)
      const b = button({
        width: 446,
        height: 44,
        inline: true,
        icon: actionIcon(action),
        label: `${action.name} · délai ${action.timeCost.toFixed(2)}`,
        onTap: () => this.pickAction(id),
        onOver: () => {
          hint.text = action.description
        },
      })
      b.view.label = `creator:pick:${id}`
      b.view.position.set(16 + col * 458, top + 64 + row * 54)
      b.setState({
        enabled: !taken.has(id),
        selected: this.spells[chooser.slot] === id,
      })
      this._box.addChild(b.view)
    })
    this._box.addChild(hint)

    const prev = this._small("‹", () => this.chooserPage(-1), "creator:page:-")
    prev.view.position.set(16, top + 540)
    prev.setState({ enabled: chooser.page > 0 })
    const page = text(`${chooser.page + 1} / ${this.pages}`, 14, COLORS.text)
    page.anchor.set(0.5, 0)
    page.position.set(78, top + 546)
    const next = this._small("›", () => this.chooserPage(1), "creator:page:+")
    next.view.position.set(120, top + 540)
    next.setState({ enabled: chooser.page < this.pages - 1 })
    const cancel = button({
      width: 150,
      height: 36,
      label: "Annuler",
      onTap: () => this.closeChooser(),
    })
    cancel.view.label = "creator:chooser:cancel"
    cancel.view.position.set(WIDTH - 166, top + 540)
    this._box.addChild(prev.view, page, next.view, cancel.view)
    this._place()
  }

  private _small(label: string, onTap: () => void, id: string): Button {
    const b = button({ width: 36, height: 36, label, onTap })
    b.view.label = id
    return b
  }
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
