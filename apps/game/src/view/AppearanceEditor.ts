import type * as booyah from "@ghom/booyah"
import {
  type CustomLook,
  defaultLook,
  LOOK_PARTS,
  type LookPart,
  randomColors,
  randomLook,
} from "@realms/engine"
import { Container, Graphics } from "pixi.js"
import { CLOTHS, HAIRS, METALS, SKINS } from "../art/lookPalettes"
import { type Facing, Puppet, type PuppetAction } from "./Puppet"
import { COLORS } from "./theme"
import { button, clearChildren, panel, text } from "./ui"
import ViewChip from "./ViewChip"

interface AppearanceEvents extends booyah.BaseCompositeEvents {
  /** The look chosen, or null to take the art of the kit again. */
  done: [look: CustomLook | null]
  cancel: []
}

const WIDTH = 940
const HEIGHT = 640
const GOLD = 0xffe066

/** Parts in the order they are shown, with their label and option names. */
export const LOOK_ROWS: {
  key: LookPart
  label: string
  names?: string[]
  colors?: readonly number[]
}[] = [
  {
    key: "body",
    label: "Silhouette",
    names: ["Fine", "Moyenne", "Large", "Trapue"],
  },
  {
    key: "head",
    label: "Tête",
    names: ["Ronde", "Allongée", "Carrée", "Petite"],
  },
  {
    key: "face",
    label: "Visage",
    names: ["Calme", "Sévère", "Joyeux", "Masqué"],
  },
  {
    key: "hair",
    label: "Cheveux ou casque",
    names: [
      "Chauve",
      "Courts",
      "Hérissés",
      "Longs",
      "Queue de cheval",
      "Crête",
      "Capuche",
      "Casque ouvert",
      "Heaume",
    ],
  },
  { key: "hairColor", label: "Couleur des cheveux", colors: HAIRS },
  {
    key: "top",
    label: "Torse",
    names: ["Tunique", "Robe", "Pourpoint", "Plastron", "Manteau", "Gilet"],
  },
  {
    key: "legs",
    label: "Jambes",
    names: ["Pantalon", "Short", "Bottes hautes", "Jambières", "Bouffant"],
  },
  {
    key: "cape",
    label: "Cape",
    names: ["Aucune", "Courte", "Longue", "En lambeaux"],
  },
  {
    key: "accessory",
    label: "Accessoire",
    names: ["Aucun", "Lunettes", "Écharpe", "Besace", "Amulette"],
  },
  {
    key: "mark",
    label: "Marque",
    names: ["Aucune", "Cicatrice", "Peinture", "Rune"],
  },
  { key: "skin", label: "Peau", colors: SKINS },
  { key: "cloth", label: "Tissu principal", colors: CLOTHS },
  { key: "cloth2", label: "Tissu secondaire", colors: CLOTHS },
  { key: "metal", label: "Métal", colors: METALS },
]

/** Orientations in the order the arrows go through them. */
export const FACINGS: Facing[] = ["SE", "SW", "NW", "NE"]
const FACING_NAMES: Record<Facing, string> = {
  SE: "Sud-Est",
  SW: "Sud-Ouest",
  NW: "Nord-Ouest",
  NE: "Nord-Est",
}

/** Animations the preview cycles through. */
export const PREVIEW_ANIMATIONS = [
  { id: "idle", label: "Repos" },
  { id: "walk", label: "Marche" },
  { id: "swim", label: "Nage" },
  { id: "melee", label: "Mêlée" },
  { id: "shoot", label: "Tir" },
  { id: "cast", label: "Sort" },
  { id: "hit", label: "Coup reçu" },
  { id: "roar", label: "Rugissement" },
] as const

/**
 * The appearance screen of the workshop: a big live puppet that turns and
 * animates, and one stepper per part of the look (never typed). The look is
 * cosmetic only: it never changes the power of the character.
 *
 * Keyboard: ← → turn the puppet, A animates, R draws a random look,
 * Enter validates, Échap cancels.
 */
export default class AppearanceEditor extends ViewChip<AppearanceEvents> {
  private _box!: Container
  private _size = { width: 0, height: 0 }
  private _dirty = false
  private _look: CustomLook
  private _seed: number
  private _facing: Facing = "SE"
  private _animation = 0
  private _puppet: Puppet | null = null
  private _clock = 0

  /**
   * @param initial the look to modify (the default of the kit otherwise)
   * @param kit the character's kit (its weapon is the puppet's)
   */
  constructor(
    initial: CustomLook | undefined,
    private readonly _kit: string,
    seed = Math.floor(Math.random() * 1e6),
  ) {
    super()
    this._look = { ...(initial ?? defaultLook(_kit)) }
    this._seed = seed
  }

  // ─── State (mouse, keyboard and tests) ────────────────────────────────────

  get look(): Readonly<CustomLook> {
    return this._look
  }

  /** The live preview. */
  get puppet() {
    return this._puppet
  }

  get facing() {
    return this._facing
  }

  get animation() {
    return PREVIEW_ANIMATIONS[this._animation]
  }

  get keys(): LookPart[] {
    return LOOK_ROWS.map((row) => row.key)
  }

  /** The option picked for a part, as shown ("Courts" or "3 / 12"). */
  valueOf(key: LookPart): string {
    const row = LOOK_ROWS.find((r) => r.key === key)
    const index = this._look[key]
    return row?.names?.[index] ?? `${index + 1} / ${LOOK_PARTS[key]}`
  }

  /** Previous (-1) or next (1) option of a part (they wrap around). */
  step(key: LookPart, direction: -1 | 1) {
    const n = LOOK_PARTS[key]
    this._look = { ...this._look, [key]: (this._look[key] + direction + n) % n }
    this._dirty = true
    return true
  }

  /** Every part drawn at random. */
  randomize() {
    this._seed++
    this._look = randomLook(this._seed)
    this._dirty = true
  }

  /** Only the colours change (skin, cloths, metal, hair). */
  randomizeColors() {
    this._seed++
    const next = randomColors(this._look, this._seed)
    this._look = { ...next, hairColor: randomLook(this._seed + 5).hairColor }
    this._dirty = true
  }

  rotate(direction: -1 | 1) {
    const i = FACINGS.indexOf(this._facing)
    this._facing = FACINGS[(i + direction + FACINGS.length) % FACINGS.length]
    this._puppet?.setFacing(this._facing)
    this._dirty = true
  }

  /** Next animation of the preview. */
  nextAnimation() {
    this._animation = (this._animation + 1) % PREVIEW_ANIMATIONS.length
    this._clock = 0
    this._applyAnimation()
    this._dirty = true
  }

  validate() {
    this.emit("done", { ...this._look })
  }

  /** Back to the art of the kit (no modular look). */
  useKitArt() {
    this.emit("done", null)
  }

  cancel() {
    this.emit("cancel")
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
    const dt = this._lastTickInfo.timeSinceLastTick
    this._clock += dt
    const puppet = this._puppet
    if (puppet) {
      const id = this.animation.id
      if (id === "walk") puppet.walk(200)
      else if (id !== "idle" && id !== "swim" && !puppet.currentAction) {
        // one action every second and a half
        if (this._clock > 1500) {
          this._clock = 0
          puppet.act(id as PuppetAction, 800)
        }
      }
      puppet.update(dt)
    }
    if (this._dirty) this._build()
  }

  protected _onResize(width: number, height: number) {
    this._size = { width, height }
    this._place()
  }

  handleKey(key: string): boolean {
    switch (key) {
      case "ArrowLeft":
        this.rotate(-1)
        return true
      case "ArrowRight":
        this.rotate(1)
        return true
      case "a":
      case "A":
        this.nextAnimation()
        return true
      case "r":
      case "R":
        this.randomize()
        return true
      case "Enter":
        this.validate()
        return true
      case "Escape":
        this.cancel()
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

  private _applyAnimation() {
    const puppet = this._puppet
    if (!puppet) return
    puppet.setSwimming(this.animation.id === "swim")
    if (this.animation.id !== "idle" && this.animation.id !== "swim")
      this._clock = 1500
  }

  private _small(label: string, onTap: () => void, id: string, w = 30) {
    const b = button({ width: w, height: 24, label, onTap })
    b.view.label = id
    return b
  }

  private _build() {
    this._dirty = false
    if (this._puppet) {
      this._box.removeChild(this._puppet)
      this._puppet.destroy({ children: true })
    }
    clearChildren(this._box)
    this._puppet = new Puppet(this._kit, this._look)
    this._puppet.setFacing(this._facing)
    this._applyAnimation()

    const title = text("Apparence — habiller l'Écho", 28, COLORS.text, {
      fontWeight: "700",
      stroke: { color: 0x000000, width: 5 },
    })
    this._box.addChild(title)

    // left: the live puppet
    const top = 56
    const left = panel(330, 520)
    left.position.set(0, top)
    const shadow = new Graphics()
      .ellipse(165, top + 330, 52, 16)
      .fill({ color: 0x000000, alpha: 0.35 })
    this._puppet.scale.set(3.4)
    this._puppet.position.set(165, top + 330)
    this._box.addChild(left, shadow, this._puppet)

    const turnL = this._small("◀", () => this.rotate(-1), "look:turn:-", 40)
    turnL.view.position.set(16, top + 360)
    const turnR = this._small("▶", () => this.rotate(1), "look:turn:+", 40)
    turnR.view.position.set(330 - 16 - 40, top + 360)
    const facing = text(FACING_NAMES[this._facing], 14, GOLD, {
      fontWeight: "700",
    })
    facing.anchor.set(0.5, 0)
    facing.position.set(165, top + 364)
    const animate = button({
      width: 200,
      height: 36,
      label: `Animer : ${this.animation.label}`,
      onTap: () => this.nextAnimation(),
    })
    animate.view.label = "look:animate"
    animate.view.position.set(65, top + 400)
    const note = text(
      "L'apparence ne change pas la force de l'Écho.",
      11,
      COLORS.muted,
      { wordWrap: true, wordWrapWidth: 298, lineHeight: 15 },
    )
    note.position.set(16, top + 456)
    this._box.addChild(turnL.view, turnR.view, facing, animate.view, note)

    // right: one stepper per part, in two columns
    const right = panel(594, 520)
    right.position.set(346, top)
    this._box.addChild(right)
    const half = Math.ceil(LOOK_ROWS.length / 2)
    LOOK_ROWS.forEach((row, i) => {
      const col = Math.floor(i / half)
      const x = 362 + col * 292
      const y = top + 16 + (i % half) * 52
      this._stepper(row, x, y)
    })

    // bottom
    const bottom = top + 540
    const buttons: [string, string, () => void, number][] = [
      ["look:random", "Aléatoire", () => this.randomize(), 150],
      ["look:colors", "Couleurs aléatoires", () => this.randomizeColors(), 200],
      ["look:kit", "Apparence du modèle", () => this.useKitArt(), 200],
    ]
    let bx = 0
    for (const [id, label, onTap, width] of buttons) {
      const b = button({ width, height: 40, label, onTap })
      b.view.label = id
      b.view.position.set(bx, bottom)
      bx += width + 10
      this._box.addChild(b.view)
    }
    const cancel = button({
      width: 120,
      height: 40,
      label: "Annuler",
      onTap: () => this.cancel(),
    })
    cancel.view.label = "look:cancel"
    cancel.view.position.set(WIDTH - 120 - 150 - 10, bottom)
    const ok = button({
      width: 150,
      height: 40,
      label: "Valider",
      onTap: () => this.validate(),
    })
    ok.view.label = "look:done"
    ok.view.position.set(WIDTH - 150, bottom)
    this._box.addChild(cancel.view, ok.view)
    this._place()
  }

  private _stepper(row: (typeof LOOK_ROWS)[number], x: number, y: number) {
    const label = text(row.label, 12, COLORS.muted)
    label.position.set(x, y)
    const minus = this._small(
      "‹",
      () => this.step(row.key, -1),
      `look:${row.key}:-`,
    )
    minus.view.position.set(x, y + 18)
    const plus = this._small(
      "›",
      () => this.step(row.key, 1),
      `look:${row.key}:+`,
    )
    plus.view.position.set(x + 250, y + 18)
    const value = text(this.valueOf(row.key), 14, GOLD, { fontWeight: "700" })
    value.anchor.set(0.5, 0)
    value.position.set(x + 140, y + 21)
    this._box.addChild(label, minus.view, plus.view, value)
    if (row.colors) {
      const color = row.colors[this._look[row.key] % row.colors.length]
      const swatch = new Graphics()
        .roundRect(x + 38, y + 20, 22, 20, 4)
        .fill(color)
        .stroke({ width: 2, color: 0x1b1424 })
      this._box.addChild(swatch)
    }
  }
}
