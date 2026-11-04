import type * as booyah from "@ghom/booyah"
import type { Fighter, Point } from "@realms/engine"
import { Container, Graphics } from "pixi.js"
import { settings } from "../settings"

import FightScene, { type SceneInput, type SceneOptions } from "./FightScene"
import type { Bounds } from "./Hud"
import { COLORS, camera, MEANING } from "./theme"
import { button, clearChildren, richText, text } from "./ui"
import ViewChip from "./ViewChip"

/**
 * The tutorial's island: a hill with a cliff (3 levels above the plain on
 * its east side) near your team, a shallow pond, and a lake (deep in its
 * middle) on the enemy's side.
 */
export const TUTORIAL_MAP = [
  ".....~wW.",
  "....~wWw.",
  ".....~w~.",
  "......~..",
  ".........",
  "..1......",
  ".123.....",
  "..1..~~..",
  ".........",
]

/** Cells the lessons point at. */
export const TUTORIAL_CELLS = {
  walk: { x: 3, y: 8 },
  pond: { x: 5, y: 7 },
  hill: { x: 3, y: 6 },
}

/** The tutorial fight: Eva and Merlin against Gorr and Squalor (weakened). */
export function tutorialScene(speed: number): SceneOptions {
  return {
    seed: 7,
    speed,
    quittable: true,
    board: TUTORIAL_MAP,
    positions: [
      [
        { x: 0, y: 8 },
        { x: 1, y: 8 },
      ],
      [
        { x: 6, y: 4 },
        { x: 6, y: 1 },
      ],
    ],
    endActions: [
      { id: "again", label: "Rejouer le tutoriel" },
      { id: "title", label: "Écran titre" },
    ],
    teams: [
      { name: "Vous", controller: "local", fighters: ["eva", "merlin"] },
      {
        name: "Chaos",
        controller: "ai",
        fighters: ["gorr", "squalor"],
        statMultiplier: 0.7,
      },
    ],
  }
}

export type Side = "above" | "below" | "left" | "right"

/** What a bubble points at: a part of the screen, or a cell of the board. */
export interface Anchor {
  rect: Bounds
  kind: "ui" | "cell"
  /** Sides of the target where the bubble goes, by preference. */
  prefer: Side[]
}

export interface TutorialStep {
  id: string
  title: string
  /** Marked-up text (`{move:bleue}`): the colors of the game. */
  text: (t: Tutorial) => string
  anchor?: (t: Tutorial) => Anchor | null
  /** Done when true (checked every frame); none: a "Suivant" button. */
  done?: (t: Tutorial) => boolean
  /** Shown only while a local fighter waits for orders (HUD lessons). */
  needsTurn?: boolean
  /** Label of the button (default "Suivant", or "Passer l'étape"). */
  button?: string
  /** When the step ends (by itself or with the button). */
  leave?: (t: Tutorial) => void
  /**
   * What else the player may use during a lesson to try (walking and the
   * camera always go): an action of the bar, the timeline.
   */
  allows?: (input: SceneInput) => boolean
}

const ARROW = 16
const MARGIN = 10
const BUBBLE_WIDTH = 340

const ui = (rect: Bounds | null, ...prefer: Side[]): Anchor | null =>
  rect && { rect, kind: "ui", prefer }

function cell(t: Tutorial, p: Point | undefined, ...prefer: Side[]) {
  if (!p) return null
  const top = t.scene.cellOnScreen(p)
  const size = 18 * t.scene.zoom
  return {
    rect: {
      x: top.x - size,
      y: top.y - size / 2,
      width: size * 2,
      height: size,
    },
    kind: "cell",
    prefer,
  } satisfies Anchor
}

/** The local fighter waiting for orders (null: someone else is playing). */
function active(t: Tutorial): Fighter | null {
  const fighter = t.scene.combat.activeFighter
  return t.scene.combat.state === "awaitingInput" &&
    fighter?.controller === "human"
    ? fighter
    : null
}

/** Commands of the player since the step began. */
const since = (t: Tutorial) => t.scene.combat.log.slice(t.mark)
const used = (t: Tutorial, test: (actionId: string) => boolean) =>
  since(t).some((c) => c.type === "useAction" && test(c.actionId))

const name = (t: Tutorial) => active(t)?.name ?? "votre Écho"
const combo = (t: Tutorial) =>
  active(t) && t.scene.combat.actionsOf(active(t)!).find((a) => a.combo)
const partner = (t: Tutorial) => {
  const fighter = active(t)
  return t.scene.combat.aliveFighters.find(
    (f) => f.team === fighter?.team && f !== fighter,
  )
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "welcome",
    title: "Bienvenue sur ce Fragment",
    text: () =>
      "Deux Échos, {ally:Eva} et {ally:Merlin}, affrontent {foe:Gorr} et {foe:Squalor}. Le combat est au tour par tour, mais sans tours fixes : tout se joue sur le {time:temps}.\n\nPendant les leçons, vos adversaires attendent sagement.",
  },
  {
    id: "timeline",
    allows: (input) => input.type === "timeline",
    title: "La frise du temps",
    needsTurn: true,
    anchor: (t) => ui(t.scene.hud.partBounds("timeline"), "below"),
    text: () =>
      "Qui joue, et dans combien de {time:temps}. Chaque action coûte du {time:temps} : plus elle est lourde, plus votre prochain tour recule.\n\nSurvolez la frise pour voir les vrais écarts, cliquez-la pour les garder affichés.",
  },
  {
    id: "card",
    title: "La fiche",
    needsTurn: true,
    anchor: (t) => ui(t.scene.hud.partBounds("card"), "right", "below"),
    text: () =>
      "Le personnage qui joue : ses {heal:points de vie}, ses statistiques ({damage:attaque}, {shield:défense}, {time:vitesse}, {luck:chance}…) et ses états.\n\nSurvolez un personnage sur l'île pour lire la sienne.",
  },
  {
    id: "actions",
    title: "Les actions",
    needsTurn: true,
    anchor: (t) => ui(t.scene.hud.partBounds("actionBar"), "above"),
    text: (t) =>
      `Les actions de {ally:${name(t)}} (touches 1 à 5). Survolez-en une pour lire ses {damage:dégâts}, sa {range:portée} et son {time:coût en temps}.\n\nUn halo {suggest:vert} signale ce qu'il est judicieux de faire maintenant.`,
  },
  {
    id: "move",
    title: "Se déplacer",
    needsTurn: true,
    anchor: (t) => cell(t, TUTORIAL_CELLS.walk, "below", "right"),
    done: (t) =>
      t.scene.combat.fighters.some((f) => f.team === 0 && f.path.length > 0),
    text: () =>
      "Les cases teintées de {move:bleu} sont accessibles : ici, presque toute l'île. Cliquez-en une, par exemple celle-ci : le trajet s'affiche {path:en jaune}.\n\nChaque pas coûte du {time:temps} : on avance pendant que les autres jouent. Un autre clic ajoute une étape, Retour arrière efface le trajet.",
  },
  {
    id: "walk",
    title: "Avancer",
    needsTurn: true,
    anchor: (t) =>
      ui(
        t.scene.hud.buttonBounds("pass") ?? t.scene.hud.partBounds("actionBar"),
        "above",
      ),
    done: (t) => since(t).some((c) => c.type !== "moveTo"),
    text: (t) =>
      `Ce bouton brille en {suggest:vert} : aucun ennemi n'est à portée. {suggest:Avancer} (Espace) termine le tour, {ally:${name(t)}} marche sur son trajet et rejoue juste après le prochain personnage.`,
  },
  {
    id: "water",
    title: "L'eau",
    needsTurn: true,
    anchor: (t) => cell(t, TUTORIAL_CELLS.pond, "below", "right"),
    text: () =>
      "Une mare peu profonde se traverse à gué : {time:2} par case au lieu de {time:1}. L'eau profonde, plus sombre, se traverse à la nage ({time:3} par case).\n\nLes marcheurs comme {ally:Merlin} n'y entrent pas ; les nageurs comme {ally:Eva} y jouent plus lentement ; les {water:aquatiques} comme {foe:Squalor} y sont chez eux. Tomber dans l'{water:eau} ne blesse pas.",
  },
  {
    id: "height",
    title: "Le relief",
    needsTurn: true,
    anchor: (t) => cell(t, TUTORIAL_CELLS.hill, "below", "left"),
    text: () =>
      "On grimpe d'{move:un niveau} par pas au plus, et chaque niveau grimpé coûte {time:+1}. Ce sommet est à 3 niveaux : de l'autre côté, la falaise est infranchissable.\n\nEn hauteur, un tir gagne {range:+1 de portée} par niveau au-dessus de la cible (jusqu'à {range:+2}), et le relief coupe la {range:ligne de vue}. Être poussé d'une falaise coûte {damage:5 PV} par niveau de chute au-delà du premier, sauf dans l'{water:eau}.",
  },
  {
    id: "sprint",
    allows: (input) => input.type === "action" && input.id === "sprint",
    title: "La course",
    needsTurn: true,
    button: "Passer l'étape",
    anchor: (t) =>
      ui(
        t.scene.hud.buttonBounds("sprint") ??
          t.scene.hud.partBounds("actionBar"),
        "above",
      ),
    done: (t) => used(t, (id) => id === "sprint"),
    text: () =>
      "La {move:Course} (touche C) : jusqu'à {move:3 cases} tout de suite, sans attendre son tour. Elle coûte le {time:temps} du trajet et termine le tour.\n\nEssayez : choisissez-la, puis une case.",
  },
  {
    id: "join",
    title: "Les combos",
    needsTurn: true,
    button: "Passer l'étape",
    anchor: (t) => cell(t, partner(t)?.position, "above", "right"),
    done: (t) =>
      t.scene.combat.aliveFighters.some(
        (f) => f.team === 0 && t.scene.combat.actionsOf(f).some((a) => a.combo),
      ),
    text: (t) =>
      combo(t)
        ? `Deux alliés sur la même case combinent leurs talents : c'est un {combo:combo}. {ally:${active(t)?.name}} et {ally:${partner(t)?.name}} sont déjà réunis : leur combo est dans la barre d'actions.`
        : `Deux alliés sur la même case combinent leurs talents : c'est un {combo:combo}. Cliquez la case de {ally:${partner(t)?.name ?? "votre allié"}} pour l'y rejoindre, puis {suggest:Avancer}.\n\nLe combo apparaîtra quand ils seront réunis.`,
  },
  {
    id: "combo",
    allows: (input) => input.type === "action" && input.id.startsWith("combo:"),
    title: "Utiliser un combo",
    needsTurn: true,
    button: "Passer l'étape",
    anchor: (t) => {
      const action = combo(t)
      return ui(
        (action && t.scene.hud.buttonBounds(action.id)) ??
          t.scene.hud.partBounds("actionBar"),
        "above",
      )
    },
    done: (t) => used(t, (id) => id.startsWith("combo:")),
    text: (t) => {
      const action = combo(t)
      const label = action ? `{combo:${action.name}}` : "Le {combo:combo}"
      return `${label}, bordé de {combo:turquoise} : la première action de l'Écho, enrichie par l'affinité de son partenaire ({damage:énergisé}, {range:précis : +2 de portée}…). Elle ajoute {time:1 tour} de recharge.\n\nUtilisez-le sur un ennemi ! S'il n'est pas dans la barre, attendez le tour d'un Écho réuni.`
    },
  },
  {
    id: "divine",
    title: "Les Influences du Ghom",
    needsTurn: true,
    anchor: (t) => ui(t.scene.hud.partBounds("divine"), "left", "below"),
    text: () =>
      "Vos pouvoirs, à vous le Ghom. Ils coûtent de l'{elan:Élan} ✦, qui se remplit avec le {time:temps} (plus vite quand vos Échos tombent).\n\n{time:Distorsion} avance ou retarde un tour, {move:Séisme} soulève ou creuse une case, {heal:Réparation} soigne toute l'équipe.",
  },
  {
    id: "camera",
    title: "La caméra",
    anchor: (t) => ui(t.scene.turnButtonsBounds, "above"),
    done: (t) => camera.quarter !== t.quarter,
    text: () =>
      "Ces flèches (ou Q et E) font tourner l'île d'un quart de tour : un Écho caché derrière un relief réapparaît.\n\nLa molette zoome, le clic droit glissé déplace ou fait pivoter la vue, V la remet d'aplomb. Essayez !",
  },
  {
    id: "fight",
    title: "À vous de jouer !",
    button: "Combattre",
    text: () =>
      "{foe:Gorr} et {foe:Squalor} se réveillent. Utilisez le relief, l'{water:eau} et vos {combo:combos}.\n\nLe bouton Menu, en haut à droite, ramène à l'écran titre.",
    leave: (t) => t.release(),
  },
]

/**
 * Where a bubble goes next to its anchor: on the first preferred side
 * where it fits on the screen, else on the first preferred side, pushed
 * inside the screen.
 */
export function placeBubble(
  anchor: Anchor | null,
  size: { width: number; height: number },
  screen: { width: number; height: number },
): { x: number; y: number; side: Side | null } {
  const clampX = (x: number) =>
    Math.max(MARGIN, Math.min(screen.width - size.width - MARGIN, x))
  const clampY = (y: number) =>
    Math.max(MARGIN, Math.min(screen.height - size.height - MARGIN, y))
  if (!anchor) {
    return {
      x: clampX(screen.width / 2 - size.width / 2),
      y: clampY(screen.height * 0.3 - size.height / 2),
      side: null,
    }
  }
  const r = anchor.rect
  const cx = r.x + r.width / 2
  const cy = r.y + r.height / 2
  const at = (side: Side) => {
    switch (side) {
      case "below":
        return { x: clampX(cx - size.width / 2), y: r.y + r.height + ARROW }
      case "above":
        return { x: clampX(cx - size.width / 2), y: r.y - ARROW - size.height }
      case "right":
        return { x: r.x + r.width + ARROW, y: clampY(cy - size.height / 2) }
      case "left":
        return { x: r.x - ARROW - size.width, y: clampY(cy - size.height / 2) }
    }
  }
  const fits = (p: { x: number; y: number }) =>
    p.x >= MARGIN &&
    p.y >= MARGIN &&
    p.x + size.width <= screen.width - MARGIN &&
    p.y + size.height <= screen.height - MARGIN
  const sides: Side[] = [
    ...anchor.prefer,
    ...(["above", "below", "right", "left"] as const).filter(
      (s) => !anchor.prefer.includes(s),
    ),
  ]
  for (const side of sides) {
    const p = at(side)
    if (fits(p)) return { ...p, side }
  }
  const side = sides[0]
  const p = at(side)
  return { x: clampX(p.x), y: clampY(p.y), side }
}

interface TutorialEvents extends booyah.BaseCompositeEvents {
  /** Back to the title screen. */
  exit: []
  /** Start the tutorial over. */
  again: []
}

/**
 * The interactive tutorial: a scripted fight on a handmade island, with
 * bubbles pointing at the HUD and the board, one rule at a time. The
 * enemies only pass until the last lesson; some lessons wait for the
 * player to try (walk, sprint, combo, camera).
 */
export default class Tutorial extends ViewChip<TutorialEvents> {
  private _scene!: FightScene
  private _overlay!: Container
  private _bubble!: Container
  private _pointer!: Graphics
  private _index = 0
  /** Step whose bubble is drawn (-1: none). */
  private _drawn = -1
  private _time = 0
  /** The lesson was done before it began: it waits for "Suivant". */
  private _doneAtStart = false
  private _width = 800
  private _height = 600
  /** Length of the command log when the step began. */
  mark = 0
  /** Quarter of the camera when the step began. */
  quarter = 0

  constructor(private readonly _speed = 1) {
    super()
  }

  get scene() {
    return this._scene
  }

  /** The current lesson (null once the fight is on). */
  get step(): TutorialStep | null {
    return TUTORIAL_STEPS[this._index] ?? null
  }

  get bubble() {
    return this._bubble
  }

  protected _onActivate() {
    this._scene = new FightScene(tutorialScene(this._speed))
    const combat = this._scene.combat
    // the enemies wait for the end of the lessons; Eva plays first
    combat.holding.add(1)
    const delays: Record<string, number> = { eva: 0, merlin: 2 }
    for (const fighter of combat.fighters)
      fighter.nextActionAt = delays[fighter.presetId] ?? 4
    this._scene.guard = (input) => this.allows(input)
    this._activateChildChip(this._scene)
    this._subscribe(this._scene, "quit", () => this.emit("exit"))
    this._subscribe(this._scene, "endAction", (id: string) =>
      this.emit(id === "again" ? "again" : "exit"),
    )

    this._overlay = new Container()
    this._overlay.eventMode = "passive"
    this._pointer = new Graphics()
    this._bubble = new Container()
    this._bubble.eventMode = "static"
    this._overlay.addChild(this._pointer, this._bubble)
    this._container.addChild(this._overlay)
    this._begin()
  }

  protected _onResize(width: number, height: number) {
    this._width = width
    this._height = height
  }

  protected _onTick() {
    this._time += this._lastTickInfo.timeSinceLastTick
    const step = this.step
    // the settings are open over the fight: the lesson waits behind them
    if (!step || this._scene.settingsOpen) return this._hide()
    if (!this._doneAtStart && step.done?.(this)) return this.next()
    const waiting =
      step.needsTurn &&
      !(this._scene.combat.state === "awaitingInput" && active(this))
    if (waiting) return this._hide()
    if (this._drawn !== this._index) this._draw(step)
    this._layout(step)
  }

  /**
   * What the lesson lets the player do: what it asks for, else nothing
   * but reading (the bubble covers the interface). Backing out of a
   * selection is always allowed; Entrée / Espace read on ("Suivant").
   */
  allows(input: SceneInput): boolean {
    const step = this.step
    if (!step) return true
    // the view is not an order: turning, tilting, zooming always go
    if (input.type === "cancel" || input.type === "camera") return true
    const reading = !step.done || this._doneAtStart
    if (reading && input.type === "pass" && input.key) {
      if (this._bubble.visible) this.next()
      return false
    }
    if (step.allows?.(input)) return true
    // a lesson to try: the fighter can always walk (cells, Avancer)
    return !reading && (input.type === "cell" || input.type === "pass")
  }

  /** Ends the current lesson. */
  next() {
    this.step?.leave?.(this)
    this._index++
    this._begin()
  }

  /** The enemies fight from now on. */
  release() {
    this._scene.combat.holding.clear()
  }

  private _begin() {
    // already done (the allies met by chance): still read, then Suivant
    this._doneAtStart = !!this.step?.done?.(this)
    this.mark = this._scene.combat.log.length
    this.quarter = camera.quarter
    this._drawn = -1
    this._hide()
  }

  private _hide() {
    this._bubble.visible = false
    this._pointer.clear()
  }

  private _draw(step: TutorialStep) {
    this._drawn = this._index
    clearChildren(this._bubble)
    const pad = 14
    const inner = BUBBLE_WIDTH - pad * 2
    const count = text(
      `${this._index + 1} / ${TUTORIAL_STEPS.length}`,
      11,
      COLORS.muted,
    )
    count.anchor.set(1, 0)
    count.position.set(BUBBLE_WIDTH - pad, pad + 2)
    const title = text(step.title, 16, MEANING.path, { fontWeight: "700" })
    title.position.set(pad, pad)
    const body = richText(step.text(this), 13, { wrap: inner, lineHeight: 18 })
    body.position.set(pad, title.y + title.height + 8)
    let bottom = body.y + body.height
    const label =
      step.button ?? (step.done && !this._doneAtStart ? null : "Suivant ›")
    const children: Container[] = [count, title, body]
    if (label) {
      const b = button({
        width: Math.max(110, label.length * 9 + 24),
        height: 30,
        label,
        accent: MEANING.path,
        onTap: () => this.next(),
      })
      b.view.label = "tutorial:next"
      b.view.position.set(BUBBLE_WIDTH - pad - b.view.width, bottom + 12)
      children.push(b.view)
      bottom = b.view.y + 30
    }
    const bg = new Graphics()
      .roundRect(0, 0, BUBBLE_WIDTH, bottom + pad, 8)
      .fill({ color: 0x0f0c17, alpha: 0.96 })
      .stroke({ width: 2, color: MEANING.path })
    this._bubble.addChild(bg, ...children)
    this._bubble.visible = true
  }

  /** Places the bubble by its target, the arrow and the target's glow. */
  private _layout(step: TutorialStep) {
    const anchor = step.anchor?.(this) ?? null
    // the player's interface size (settings)
    this._bubble.scale.set(settings().uiSize)
    const size = { width: this._bubble.width, height: this._bubble.height }
    const place = placeBubble(anchor, size, {
      width: this._width,
      height: this._height,
    })
    this._bubble.position.set(Math.round(place.x), Math.round(place.y))
    this._bubble.visible = true
    const g = this._pointer.clear()
    if (!anchor || !place.side) return

    // the target glows
    const r = anchor.rect
    const pulse = 0.55 + 0.45 * Math.sin(this._time / 220)
    if (anchor.kind === "ui") {
      g.roundRect(r.x - 6, r.y - 6, r.width + 12, r.height + 12, 8).stroke({
        width: 3,
        color: MEANING.path,
        alpha: pulse,
      })
    } else {
      g.ellipse(
        r.x + r.width / 2,
        r.y + r.height / 2,
        r.width,
        r.height,
      ).stroke({ width: 3, color: MEANING.path, alpha: pulse })
    }

    // the arrow: from the bubble's edge to the target
    const { x, y } = place
    const w = size.width
    const h = size.height
    const along = (v: number, from: number, length: number) =>
      Math.max(from + 16, Math.min(from + length - 16, v))
    const cx = r.x + r.width / 2
    const cy = r.y + r.height / 2
    const half = 10
    let points: number[]
    switch (place.side) {
      case "below": {
        const bx = along(cx, x, w)
        points = [bx - half, y + 1, bx + half, y + 1, cx, r.y + r.height + 3]
        break
      }
      case "above": {
        const bx = along(cx, x, w)
        points = [bx - half, y + h - 1, bx + half, y + h - 1, cx, r.y - 3]
        break
      }
      case "right": {
        const by = along(cy, y, h)
        points = [x + 1, by - half, x + 1, by + half, r.x + r.width + 3, cy]
        break
      }
      case "left": {
        const by = along(cy, y, h)
        points = [x + w - 1, by - half, x + w - 1, by + half, r.x - 3, cy]
        break
      }
    }
    g.poly(points).fill({ color: MEANING.path })
  }
}
