import type * as booyah from "@ghom/booyah"
import {
  createRng,
  describeSpell,
  generateSpell,
  generateSpellName,
  previewSpell,
  SPELL_COST,
  SPELL_PARTS,
  SPELL_WEIGHTS,
  type SpellEffect,
  type SpellPreview,
  type SpellRecipe,
} from "@realms/engine"
import { Container, Graphics } from "pixi.js"
import { COLORS } from "./theme"
import { type Button, button, clearChildren, panel, text } from "./ui"
import ViewChip from "./ViewChip"

interface SpellForgeEvents extends booyah.BaseCompositeEvents {
  done: [recipe: SpellRecipe]
  cancel: []
}

const WIDTH = 940
const HEIGHT = 640
const RED = 0xff6b6b
const GOLD = 0xffe066

/** Value at which a spell costs the maximum delay (the gauge is full). */
export const MAX_VALUE =
  ((SPELL_COST.max - SPELL_WEIGHTS.base) / SPELL_WEIGHTS.slope) **
  (1 / SPELL_WEIGHTS.curve)

const TARGETS: Record<string, string> = {
  enemy: "Ennemi",
  ally: "Allié",
  self: "Soi-même",
  any: "N'importe qui",
  emptyCell: "Case vide",
}
const SHAPES: Record<string, string> = {
  none: "Aucune",
  diamond: "Losange",
  square: "Carré",
  line: "Ligne",
  diagonal: "Diagonale",
}
const AFFECTS: Record<string, string> = {
  enemies: "Ennemis",
  allies: "Alliés",
  all: "Tous",
}
const KINDS: Record<string, string> = {
  "damage:physical": "Dégâts physiques",
  "damage:magical": "Dégâts magiques",
  heal: "Soin",
  push: "Poussée",
  delay: "Retard",
  "status:poisoned": "Poison",
  "status:slowed": "Lenteur",
  "status:hasted": "Hâte",
  "status:shielded": "Bouclier",
  "status:enraged": "Rage",
}
const HOSTILE_KINDS = [
  "damage:physical",
  "damage:magical",
  "push",
  "delay",
  "status:poisoned",
  "status:slowed",
]
const HELPFUL_KINDS = ["heal", "status:shielded", "status:hasted"]

/** The effect a kind starts with. */
function effectOf(kind: string): SpellEffect {
  switch (kind) {
    case "damage:physical":
      return { type: "damage", kind: "physical", power: 5 }
    case "damage:magical":
      return { type: "damage", kind: "magical", power: 5 }
    case "heal":
      return { type: "heal", power: 6 }
    case "push":
      return { type: "push", distance: 1 }
    case "delay":
      return { type: "delay", amount: 10 }
    case "status:poisoned":
      return { type: "status", status: "poisoned", turns: 2, value: 3 }
    case "status:shielded":
      return { type: "status", status: "shielded", turns: 2, value: 10 }
    default:
      return {
        type: "status",
        status: kind.slice(7) as "slowed" | "hasted" | "enraged",
        turns: 2,
      }
  }
}

const kindOf = (e: SpellEffect) =>
  e.type === "damage"
    ? `damage:${e.kind}`
    : e.type === "status"
      ? `status:${e.status}`
      : e.type

const hostileEffect = (e: SpellEffect) =>
  HOSTILE_KINDS.includes(kindOf(e)) ||
  (e.type === "status" && ["poisoned", "slowed"].includes(e.status))

/** One row of the forge: a list of values to step through. */
interface Choice {
  label: string
  list: unknown[]
  index: number
  wrap: boolean
  show(value: unknown): string
  apply(value: unknown): void
}

/**
 * The spell forge: every part of a recipe is a list of values to step
 * through (never typed), and the engine prices the result live: the delay
 * is derived, a spell that is too powerful is refused with its reason.
 *
 * Keyboard: N draws another name, Enter validates, Échap cancels.
 */
export default class SpellForge extends ViewChip<SpellForgeEvents> {
  private _box!: Container
  private _size = { width: 0, height: 0 }
  private _dirty = false
  private _recipe: SpellRecipe
  private _seed: number
  private readonly _taken: ReadonlySet<string>

  /**
   * @param initial the recipe to modify (a fresh attack otherwise)
   * @param taken names the character's other spells already use
   */
  constructor(
    initial?: SpellRecipe,
    taken: Iterable<string> = [],
    seed = Math.floor(Math.random() * 1e6),
  ) {
    super()
    this._taken = new Set(taken)
    this._seed = seed
    this._recipe = initial
      ? (JSON.parse(JSON.stringify(initial)) as SpellRecipe)
      : generateSpell(seed, "attack")
    if (this._taken.has(this._recipe.name))
      this._recipe.name = this._freshName()
  }

  // ─── State (mouse, keyboard and tests) ────────────────────────────────────

  get recipe(): Readonly<SpellRecipe> {
    return this._recipe
  }

  get preview(): SpellPreview {
    return previewSpell(this._recipe)
  }

  /** Whether the recipe can be validated (valid, and not too powerful). */
  get canValidate() {
    return this.preview.reason === null && !this._taken.has(this._recipe.name)
  }

  get description() {
    return describeSpell(this._recipe)
  }

  /** Keys of the rows now shown (for `step`). */
  get keys(): string[] {
    return this._rows().map((r) => r.key)
  }

  /** The text shown for a row. */
  valueOf(key: string): string | null {
    const choice = this._choice(key)
    return choice ? choice.show(choice.list[choice.index]) : null
  }

  canStep(key: string, direction: -1 | 1) {
    return this._next(key, direction) !== undefined
  }

  /** Moves a part to its previous or next value (false when it cannot). */
  step(key: string, direction: -1 | 1) {
    const choice = this._choice(key)
    const next = this._next(key, direction)
    if (!choice || next === undefined) return false
    choice.apply(next.value)
    this._normalize()
    this._dirty = true
    return true
  }

  get canAddEffect() {
    return this._recipe.effects.length < SPELL_PARTS.maxEffects
  }

  /** Adds a second effect that fits the first (false when full). */
  addEffect() {
    if (!this.canAddEffect) return false
    const present = this._recipe.effects.map(kindOf)
    const pool = hostileEffect(this._recipe.effects[0])
      ? HOSTILE_KINDS
      : HELPFUL_KINDS
    const kind = pool.find((k) => !present.includes(k))
    if (!kind) return false
    this._recipe.effects.push(effectOf(kind))
    this._normalize()
    this._dirty = true
    return true
  }

  removeEffect(index: number) {
    if (this._recipe.effects.length < 2 || !this._recipe.effects[index])
      return false
    this._recipe.effects.splice(index, 1)
    this._normalize()
    this._dirty = true
    return true
  }

  /** Draws another generated name (never one the character already has). */
  rerollName() {
    this._recipe.name = this._freshName()
    this._dirty = true
  }

  validate() {
    if (!this.canValidate) return false
    this.emit("done", JSON.parse(JSON.stringify(this._recipe)) as SpellRecipe)
    return true
  }

  cancel() {
    this.emit("cancel")
  }

  private _freshName() {
    for (let i = 0; i < 200; i++) {
      const name = generateSpellName(createRng(++this._seed))
      if (!this._taken.has(name)) return name
    }
    return `${generateSpellName(createRng(this._seed))} ${this._seed}`.slice(
      0,
      20,
    )
  }

  /** Keeps parts consistent after a change (the engine judges the rest). */
  private _normalize() {
    const r = this._recipe
    if (r.target === "self") {
      r.launch = { shape: "point", min: 0, max: 0 }
    } else if (r.launch.shape === "point") {
      r.launch = { shape: "diamond", min: 0, max: 1 }
    }
    if (r.launch.min > r.launch.max) r.launch.min = r.launch.max
    if (r.area) {
      const hostile = r.effects.some(hostileEffect)
      const ok = hostile ? ["enemies", "all"] : ["allies", "all"]
      if (!r.affects || !ok.includes(r.affects))
        r.affects = hostile ? "enemies" : "allies"
    } else {
      delete r.affects
    }
    if (!r.cooldown) delete r.cooldown
  }

  // ─── Rows ─────────────────────────────────────────────────────────────────

  private _next(key: string, direction: -1 | 1) {
    const choice = this._choice(key)
    if (!choice) return undefined
    const { list, index, wrap } = choice
    let i = index + direction
    if (wrap) i = (i + list.length) % list.length
    if (i < 0 || i >= list.length || i === index) return undefined
    return { value: list[i] }
  }

  private _choice(key: string): Choice | null {
    const r = this._recipe
    const num = (list: readonly number[], current: number) => ({
      list: [...list],
      index: Math.max(0, list.indexOf(current)),
      wrap: false,
      show: String,
    })
    switch (key) {
      case "target":
        return {
          label: "Cible",
          list: [...SPELL_PARTS.targets],
          index: SPELL_PARTS.targets.indexOf(r.target),
          wrap: true,
          show: (v) => TARGETS[v as string],
          apply: (v) => {
            r.target = v as SpellRecipe["target"]
          },
        }
      case "launchShape":
        return {
          label: "Portée : forme",
          list: [...SPELL_PARTS.launchShapes],
          index: Math.max(
            0,
            SPELL_PARTS.launchShapes.indexOf(r.launch.shape as never),
          ),
          wrap: true,
          show: (v) => (v === "line" ? "Ligne" : "Losange"),
          apply: (v) => {
            r.launch.shape = v as "diamond" | "line"
          },
        }
      case "launchMin":
        return {
          label: "Portée : minimum",
          ...num(SPELL_PARTS.launchMin, r.launch.min),
          apply: (v) => {
            r.launch.min = v as number
            if (r.launch.max < r.launch.min) r.launch.max = r.launch.min
          },
        }
      case "launchMax":
        return {
          label: "Portée : maximum",
          ...num(SPELL_PARTS.launchMax, r.launch.max),
          apply: (v) => {
            r.launch.max = v as number
          },
        }
      case "lineOfSight":
        return {
          label: "Ligne de vue",
          list: [false, true],
          index: r.lineOfSight ? 1 : 0,
          wrap: true,
          show: (v) => (v ? "Requise" : "Ignorée"),
          apply: (v) => {
            r.lineOfSight = v as boolean
          },
        }
      case "areaShape": {
        const list = ["none", ...SPELL_PARTS.areaShapes]
        return {
          label: "Zone : forme",
          list,
          index: Math.max(0, list.indexOf(r.area?.shape ?? "none")),
          wrap: true,
          show: (v) => SHAPES[v as string],
          apply: (v) => {
            if (v === "none") {
              delete r.area
              return
            }
            r.area = {
              shape: v as NonNullable<SpellRecipe["area"]>["shape"],
              min: r.area?.min ?? 0,
              max: r.area?.max ?? 1,
            }
          },
        }
      }
      case "areaMin":
        if (!r.area) return null
        return {
          label: "Zone : minimum",
          ...num(SPELL_PARTS.areaMin, r.area.min),
          apply: (v) => {
            r.area!.min = v as 0 | 1
          },
        }
      case "areaMax":
        if (!r.area) return null
        return {
          label: "Zone : maximum",
          ...num(SPELL_PARTS.areaMax, r.area.max),
          apply: (v) => {
            r.area!.max = v as number
          },
        }
      case "affects":
        if (!r.area) return null
        return {
          label: "Zone : touche",
          list: [...SPELL_PARTS.affects],
          index: Math.max(0, SPELL_PARTS.affects.indexOf(r.affects ?? "all")),
          wrap: true,
          show: (v) => AFFECTS[v as string],
          apply: (v) => {
            r.affects = v as NonNullable<SpellRecipe["affects"]>
          },
        }
      case "cooldown":
        return {
          label: "Recharge",
          ...num(SPELL_PARTS.cooldowns, r.cooldown ?? 0),
          show: (v) => `${v} tour${(v as number) > 1 ? "s" : ""}`,
          apply: (v) => {
            r.cooldown = v as number
          },
        }
    }
    const m = /^e(\d):(kind|amount|turns|value)$/.exec(key)
    if (!m) return null
    const i = Number(m[1])
    const e = r.effects[i]
    if (!e) return null
    const replace = (next: SpellEffect) => {
      r.effects[i] = next
    }
    if (m[2] === "kind") {
      const list = Object.keys(KINDS)
      return {
        label: `Effet ${i + 1}`,
        list,
        index: list.indexOf(kindOf(e)),
        wrap: true,
        show: (v) => KINDS[v as string],
        apply: (v) => replace(effectOf(v as string)),
      }
    }
    if (m[2] === "amount") {
      switch (e.type) {
        case "damage":
          return {
            label: "Puissance",
            ...num(SPELL_PARTS.damagePowers, e.power),
            apply: (v) => replace({ ...e, power: v as number }),
          }
        case "heal":
          return {
            label: "Puissance",
            ...num(SPELL_PARTS.healPowers, e.power),
            apply: (v) => replace({ ...e, power: v as number }),
          }
        case "push":
          return {
            label: "Distance",
            ...num(SPELL_PARTS.pushDistances, e.distance),
            apply: (v) => replace({ ...e, distance: v as number }),
          }
        case "delay":
          return {
            label: "Retard",
            ...num(SPELL_PARTS.delayAmounts, e.amount),
            apply: (v) => replace({ ...e, amount: v as number }),
          }
        default:
          return null
      }
    }
    if (e.type !== "status") return null
    if (m[2] === "turns")
      return {
        label: "Durée (tours)",
        ...num(SPELL_PARTS.statusTurns[e.status], e.turns),
        apply: (v) => replace({ ...e, turns: v as number }),
      }
    const values = SPELL_PARTS.statusValues[e.status]
    if (!values) return null
    return {
      label: e.status === "poisoned" ? "Dégâts par tour" : "Points de bouclier",
      ...num(values, e.value ?? values[0]),
      apply: (v) => replace({ ...e, value: v as number }),
    }
  }

  /** Rows shown, in order, with the effect rows grouped. */
  private _rows(): { key: string; group: "form" | number }[] {
    const r = this._recipe
    const form = ["target"]
    if (r.target !== "self") form.push("launchShape", "launchMin", "launchMax")
    if (r.target !== "self" && r.launch.max > 1) form.push("lineOfSight")
    form.push("areaShape")
    if (r.area) form.push("areaMin", "areaMax", "affects")
    form.push("cooldown")
    const rows: { key: string; group: "form" | number }[] = form.map((key) => ({
      key,
      group: "form",
    }))
    r.effects.forEach((_, i) => {
      for (const part of ["kind", "amount", "turns", "value"]) {
        const key = `e${i}:${part}`
        if (this._choice(key)) rows.push({ key, group: i })
      }
    })
    return rows
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  protected _onActivate() {
    this._box = new Container()
    this._container.addChild(this._box)
    this._build()
    this._subscribe(window, "keydown", (e: KeyboardEvent) => {
      if (this.handleKey(e.key)) e.preventDefault()
    })
  }

  protected _onTick() {
    if (this._dirty) this._build()
  }

  protected _onResize(width: number, height: number) {
    this._size = { width, height }
    this._place()
  }

  handleKey(key: string): boolean {
    switch (key) {
      case "Escape":
        this.cancel()
        return true
      case "Enter":
        this.validate()
        return true
      case "n":
      case "N":
        this.rerollName()
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

  private _small(label: string, onTap: () => void, id: string): Button {
    const b = button({ width: 30, height: 24, label, onTap })
    b.view.label = id
    return b
  }

  private _stepper(key: string, x: number, y: number, width: number) {
    const choice = this._choice(key)!
    const label = text(choice.label, 13, COLORS.text)
    label.position.set(x, y + 4)
    const value = text(String(this.valueOf(key)), 14, GOLD, {
      fontWeight: "700",
    })
    value.anchor.set(0.5, 0)
    value.position.set(x + width - 110, y + 3)
    const minus = this._small("‹", () => this.step(key, -1), `forge:${key}:-`)
    minus.view.position.set(x + width - 190, y)
    minus.setState({ enabled: this.canStep(key, -1) })
    const plus = this._small("›", () => this.step(key, 1), `forge:${key}:+`)
    plus.view.position.set(x + width - 60, y)
    plus.setState({ enabled: this.canStep(key, 1) })
    this._box.addChild(label, value, minus.view, plus.view)
  }

  private _build() {
    this._dirty = false
    clearChildren(this._box)
    const preview = this.preview
    const taken = this._taken.has(this._recipe.name)

    const title = text("Forge — composer un sort", 28, COLORS.text, {
      fontWeight: "700",
      stroke: { color: 0x000000, width: 5 },
    })
    this._box.addChild(title)

    // left: the form of the spell
    const top = 56
    const left = panel(440, 520)
    left.position.set(0, top)
    this._box.addChild(left)
    const formTitle = text("Forme", 16, COLORS.text, { fontWeight: "700" })
    formTitle.position.set(16, top + 10)
    this._box.addChild(formTitle)
    const rows = this._rows()
    let y = top + 42
    for (const row of rows) {
      if (row.group !== "form") continue
      this._stepper(row.key, 16, y, 408)
      y += 36
    }

    // right, top: effects
    const rx = 456
    const effects = panel(484, 304)
    effects.position.set(rx, top)
    this._box.addChild(effects)
    const effectsTitle = text("Effets", 16, COLORS.text, { fontWeight: "700" })
    effectsTitle.position.set(rx + 16, top + 10)
    this._box.addChild(effectsTitle)
    let ey = top + 38
    this._recipe.effects.forEach((_, i) => {
      const startY = ey
      for (const row of rows) {
        if (row.group !== i) continue
        this._stepper(
          row.key,
          rx + 16,
          ey,
          452 -
            (row.key.endsWith("kind") && this._recipe.effects.length > 1
              ? 80
              : 0),
        )
        ey += 30
      }
      if (this._recipe.effects.length > 1) {
        const del = button({
          width: 76,
          height: 24,
          label: "Retirer",
          labelColor: RED,
          onTap: () => this.removeEffect(i),
        })
        del.view.label = `forge:remove:${i}`
        del.view.position.set(rx + 16 + 452 - 76, startY)
        this._box.addChild(del.view)
      }
      ey += 8
    })
    const add = button({
      width: 180,
      height: 30,
      label: "Ajouter un effet",
      onTap: () => this.addEffect(),
    })
    add.view.label = "forge:add"
    add.view.position.set(rx + 16, top + 304 - 40)
    add.setState({ enabled: this.canAddEffect })
    this._box.addChild(add.view)

    // right, bottom: the result
    const resultTop = top + 316
    const result = panel(484, 204)
    result.position.set(rx, resultTop)
    this._box.addChild(result)
    const name = text(this._recipe.name, 22, GOLD, { fontWeight: "700" })
    name.position.set(rx + 16, resultTop + 10)
    const reroll = button({
      width: 120,
      height: 30,
      label: "Autre nom",
      onTap: () => this.rerollName(),
    })
    reroll.view.label = "forge:name"
    reroll.view.position.set(rx + 484 - 136, resultTop + 10)
    this._box.addChild(name, reroll.view)

    const refused = preview.reason !== null
    const delay = text(
      `Délai : ${(refused ? preview.rawCost : preview.cost).toFixed(2)}`,
      16,
      refused ? RED : COLORS.text,
      { fontWeight: "700" },
    )
    delay.label = "forge:delay"
    delay.position.set(rx + 16, resultTop + 50)
    this._box.addChild(delay)

    // gauge of the power against the maximum
    const gaugeX = rx + 150
    const fill = Math.max(0, Math.min(1, preview.value / MAX_VALUE))
    const gauge = new Graphics()
      .roundRect(gaugeX, resultTop + 54, 318, 14, 4)
      .fill({ color: 0x15121f })
      .stroke({ width: 1, color: COLORS.panelBorder })
    if (fill > 0)
      gauge
        .roundRect(gaugeX, resultTop + 54, 318 * fill, 14, 4)
        .fill({ color: refused ? RED : fill > 0.85 ? 0xffa94d : 0x8ce99a })
    const gaugeText = text(
      `Puissance ${Math.round(fill * 100)} % du maximum`,
      11,
      COLORS.muted,
    )
    gaugeText.position.set(gaugeX, resultTop + 72)
    this._box.addChild(gauge, gaugeText)

    const reason = refused
      ? preview.reason
      : taken
        ? "Ce nom est déjà pris par un autre sort."
        : null
    if (reason) {
      const why = text(reason, 12, RED, {
        wordWrap: true,
        wordWrapWidth: 452,
        lineHeight: 15,
      })
      why.label = "forge:reason"
      why.position.set(rx + 16, resultTop + 96)
      this._box.addChild(why)
    }
    const describe = text(this.description, 12, COLORS.text, {
      wordWrap: true,
      wordWrapWidth: 452,
      lineHeight: 15,
    })
    describe.position.set(rx + 16, resultTop + (reason ? 130 : 100))
    this._box.addChild(describe)

    // bottom: validate, cancel
    const cancel = button({
      width: 150,
      height: 44,
      label: "Annuler",
      onTap: () => this.cancel(),
    })
    cancel.view.label = "forge:cancel"
    cancel.view.position.set(0, HEIGHT - 44)
    const ok = button({
      width: 200,
      height: 44,
      label: "Valider",
      onTap: () => this.validate(),
    })
    ok.view.label = "forge:validate"
    ok.view.position.set(WIDTH - 200, HEIGHT - 44)
    ok.setState({ enabled: this.canValidate })
    this._box.addChild(cancel.view, ok.view)
    this._place()
  }
}
