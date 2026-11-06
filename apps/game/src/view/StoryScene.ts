import type * as booyah from "@ghom/booyah"
import {
  CHAPTERS,
  chapterById,
  choose,
  type FightReport,
  type FightSpec,
  type Frame,
  finishFight,
  frame,
  getFlag,
  next,
  type ObjectiveResult,
  type Run,
} from "@realms/adventure"
import { CHARACTERS } from "@realms/engine"
import { Container } from "pixi.js"
import { HERO_NAME } from "../adventure/hero"
import { completeChapter, saveRun } from "../adventure/progress"
import { settings } from "../settings"
import Backdrop from "./Backdrop"
import { COLORS, TEAM_COLORS } from "./theme"
import { clearChildren, Menu, type MenuItem, panel, text } from "./ui"
import ViewChip from "./ViewChip"

interface StoryEvents extends booyah.BaseCompositeEvents {
  /** The player starts the fight the story waits on. */
  fight: [spec: FightSpec, run: Run]
  /** Leaves for the chapter selector. */
  back: []
  /** Opens the chapter that follows (its id). */
  chapter: [id: string]
}

const WIDTH = 680

/** Speaker colours: the fighters' own, by lineage. */
export const VOICE: Record<string, number> = {
  heros: TEAM_COLORS[0],
  lyra: 0x69db7c,
  brutus: 0xff922b,
  nerea: 0x66d9e8,
  nyx: 0xda77f2,
  merlin: 0xff6b6b,
  vesce: 0xadb5bd,
  gorr: 0xc0a080,
}

/** Display name of a speaker id. */
export function speakerName(who: string): string {
  if (who === "heros") return HERO_NAME
  const preset = Object.hasOwn(CHARACTERS, who) ? CHARACTERS[who] : null
  return preset?.name ?? who.charAt(0).toUpperCase() + who.slice(1)
}

export interface StoryOptions {
  run: Run
  /** The fight that was waiting just ended. */
  report?: FightReport
  /** A replay of a past chapter: nothing is saved. */
  sandbox?: boolean
}

/**
 * The story player: a text panel with the speaker, then gestures (buttons,
 * arrows + Enter) for choices and Veillée topics, and the fight cards that
 * hand over to the combat. Progress is saved at every step.
 */
export default class StoryScene extends ViewChip<StoryEvents> {
  private _box!: Container
  private _menu: Menu | null = null
  private _run: Run
  private _debrief: ObjectiveResult[] | null = null
  private _finished = false
  private _size = { width: 0, height: 0 }

  constructor(private readonly _options: StoryOptions) {
    super()
    this._run = _options.run
  }

  get run() {
    return this._run
  }

  get frame(): Frame {
    return frame(this._run)
  }

  get menu() {
    return this._menu
  }

  /** Whether the debrief of a fight is on screen. */
  get debriefing() {
    return this._debrief !== null
  }

  protected _onActivate() {
    this._activateChildChip(new Backdrop())
    this._box = new Container()
    this._container.addChild(this._box)
    if (this._options.report) {
      const out = finishFight(this._run, this._options.report)
      this._run = out.run
      this._debrief = out.debrief
      this._save()
    }
    this._render()
    this._subscribe(window, "keydown", (e: KeyboardEvent) => this._key(e))
  }

  protected _onResize(width: number, height: number) {
    this._size = { width, height }
    this._place()
  }

  /** Reads a line, skips a hint or a debrief. */
  advance() {
    if (this._debrief) {
      this._debrief = null
    } else {
      const f = frame(this._run)
      if (f.kind === "line" || f.kind === "hint") {
        this._run = next(this._run)
        this._save()
      } else return
    }
    this._render()
  }

  /** A gesture: an option or a topic. */
  pick(id: string) {
    this._run = choose(this._run, id)
    this._save()
    this._render()
  }

  private _save() {
    if (!this._options.sandbox) saveRun(this._run)
  }

  private _key(e: KeyboardEvent) {
    if (this._menu) {
      if (this._menu.handleKey(e.key)) e.preventDefault()
      return
    }
    if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight") {
      e.preventDefault()
      this.advance()
    }
  }

  private _place() {
    if (!this._box) return
    this._box.scale.set(settings().uiSize)
    this._box.position.set(
      Math.round(this._size.width / 2 - this._box.width / 2),
      Math.max(16, Math.round(this._size.height / 2 - this._box.height / 2)),
    )
  }

  private _render() {
    clearChildren(this._box)
    this._menu = null
    const chapter = chapterById(this._run.chapter)
    const scene = chapter.scenes[this._run.node]
    const body = new Container()

    let y = 0
    const head = text(
      `${chapter.number === 0 ? "Prologue" : `Chapitre ${chapter.number}`} · ${chapter.title}`,
      14,
      COLORS.muted,
    )
    head.position.set(0, y)
    body.addChild(head)
    if (this._run.unlocks.includes("ui:confiance")) {
      const trust = Number(getFlag(this._run, "confiance"))
      const t = text(`Confiance ${trust > 0 ? "+" : ""}${trust}`, 14, 0x69db7c)
      t.anchor.set(1, 0)
      t.position.set(WIDTH - 24, y)
      body.addChild(t)
    }
    y += 26
    const sub = text(scene?.title ?? "", 22, COLORS.text, { fontWeight: "700" })
    sub.position.set(0, y)
    body.addChild(sub)
    y += 40

    const addText = (
      value: string,
      size: number,
      color: number,
      extra = {},
    ) => {
      const t = text(value, size, color, {
        wordWrap: true,
        wordWrapWidth: WIDTH - 48,
        lineHeight: Math.round(size * 1.5),
        ...extra,
      })
      t.position.set(0, y)
      body.addChild(t)
      y += t.height + 14
      return t
    }
    const addMenu = (items: MenuItem[], onSelect: (id: string) => void) => {
      const menu = new Menu(items, {
        width: WIDTH - 48,
        height: 40,
        gap: 8,
        onSelect,
      })
      menu.position.set(0, y)
      body.addChild(menu)
      y += menu.height + 8
      this._menu = menu
    }

    if (this._debrief) {
      addText("Bilan du combat", 18, 0xffe066, { fontWeight: "700" })
      for (const o of this._debrief) {
        addText(
          `${o.ok ? "✓" : "✗"} ${o.mark} ${o.label}${o.text ? `\n${o.text}` : ""}`,
          15,
          o.ok ? COLORS.heal : COLORS.muted,
        )
      }
      addText("Entrée pour continuer", 13, COLORS.muted, {
        fontStyle: "italic",
      })
    } else if (this._run.done) {
      this._finishChapter(addText, addMenu)
    } else {
      this._renderFrame(frame(this._run), addText, addMenu)
    }

    const height = y + 24
    this._box.addChild(panel(WIDTH, height + 24), body)
    body.position.set(24, 24)
    this._place()
  }

  private _renderFrame(
    f: Frame,
    addText: (v: string, s: number, c: number, e?: object) => unknown,
    addMenu: (items: MenuItem[], on: (id: string) => void) => void,
  ) {
    switch (f.kind) {
      case "line":
        if (f.style === "say") {
          const who = f.who ?? ""
          addText(speakerName(who), 16, VOICE[who] ?? COLORS.text, {
            fontWeight: "700",
          })
          addText(f.text, 17, COLORS.text)
        } else
          addText(f.text, 17, f.style === "stage" ? COLORS.muted : 0xc5d8ff, {
            fontStyle: "italic",
          })
        addText("▸", 14, COLORS.muted)
        break
      case "hint":
        addText(f.title, 17, COLORS.divine, { fontWeight: "700" })
        addText(f.text, 15, COLORS.text)
        addText("▸", 14, COLORS.muted)
        break
      case "choice":
        if (f.prompt) addText(f.prompt, 17, COLORS.text)
        addMenu(
          f.options.map((o) => ({ id: o.id, label: o.text })),
          (id) => this.pick(id),
        )
        break
      case "hub":
        addText("Veillée : de quoi parler ?", 16, COLORS.muted)
        addMenu(
          f.topics.map((t) => ({ id: t.id, label: t.title })),
          (id) => this.pick(id),
        )
        break
      case "fight": {
        addText(f.fight.title, 20, 0xffe066, { fontWeight: "700" })
        addText(f.fight.goal, 16, COLORS.text)
        for (const o of f.fight.objectives)
          if (o.mark === "★") addText(`★ ${o.label}`, 15, 0xffe066)
        addMenu(
          [
            { id: "fight", label: "Lancer le combat" },
            { id: "back", label: "Quitter (la partie est gardée)" },
          ],
          (id) =>
            id === "fight"
              ? this.emit("fight", f.fight, this._run)
              : this.emit("back"),
        )
        break
      }
      default:
        break
    }
  }

  private _finishChapter(
    addText: (v: string, s: number, c: number, e?: object) => unknown,
    addMenu: (items: MenuItem[], on: (id: string) => void) => void,
  ) {
    if (!this._finished) {
      this._finished = true
      this._nextId = this._options.sandbox ? null : completeChapter(this._run)
    }
    addText("Fin du chapitre", 20, 0xffe066, { fontWeight: "700" })
    const items: MenuItem[] = []
    if (this._nextId)
      items.push({
        id: "next",
        label: `Chapitre suivant : ${CHAPTERS.find((c) => c.id === this._nextId)?.title ?? ""}`,
      })
    else
      addText(
        "La suite arrive : l'Ère II n'est pas encore écrite.",
        15,
        COLORS.muted,
      )
    items.push({ id: "back", label: "Chroniques" })
    addMenu(items, (id) =>
      id === "next" && this._nextId
        ? this.emit("chapter", this._nextId)
        : this.emit("back"),
    )
  }

  private _nextId: string | null = null
}
