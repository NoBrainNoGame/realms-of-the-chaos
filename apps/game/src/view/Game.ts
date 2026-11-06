import type * as booyah from "@ghom/booyah"
import {
  chapterById,
  ENDING_NAMES,
  type EndingResult,
  epilogueOf,
  explorationOf,
  type FightReport,
  type FightSpec,
  getFlag,
  type Run,
  START_CARRY,
  teleportReaction,
} from "@realms/adventure"
import type { CustomLook } from "@realms/engine"
import {
  allyTeam,
  fightOptions,
  reportOf,
  startEnergy,
} from "../adventure/fight"
import { HERO_PARTS, STARTING_LOOK } from "../adventure/hero"
import {
  beginChapter,
  continuation,
  endingOf,
  newGame,
  recordEnding,
  resumable,
} from "../adventure/progress"
import { SECRET_ENDINGS } from "../endings"
import type { Params } from "../params"
import {
  adventureSave,
  scarCount,
  takeCongratulation,
  vacuumDecayWipe,
  writeAdventureSave,
} from "../storage"
import AppearanceEditor from "./AppearanceEditor"
import ArcadeRun from "./ArcadeRun"
import Carnet from "./Carnet"
import Chronicles from "./Chronicles"
import Creator from "./Creator"
import Epilogue from "./Epilogue"
import ExplorationScene from "./ExplorationScene"
import FightScene, { classicFight, type SceneOptions } from "./FightScene"
import Gallery from "./Gallery"
import { resolveFighters } from "./looks"
import MessageScreen from "./MessageScreen"
import SettingsScreen from "./SettingsScreen"
import StoryScene from "./StoryScene"
import TeamPicker, { type PickerMode, type PickerResult } from "./TeamPicker"
import TitleScreen, { type TitleChoice } from "./TitleScreen"
import Tutorial from "./Tutorial"
import { applyScars } from "./theme"
import ViewChip from "./ViewChip"
import WorldMap from "./WorldMap"

export type Screen =
  | { type: "title" }
  | { type: "picker"; mode: PickerMode; teams?: string[][] }
  | {
      type: "fight"
      options: SceneOptions
      picked?: PickerResult
      /** A fight of the Adventure: a vacuum decay there wipes the save. */
      adventure?: { spec: FightSpec; seed: number; run: Run; sandbox?: Run }
    }
  /** « Chroniques »: the chapter selector. */
  | { type: "chronicles" }
  /** The map of the Fragments (the Ghom sends the hero). */
  | { type: "map" }
  /** The Carnet des Questions (back goes to where it was opened). */
  | { type: "carnet"; from: "chronicles" | "story" }
  /** The story player, on the saved run (`start`: opens that chapter first). */
  | {
      type: "story"
      start?: string
      report?: FightReport
      /** A past chapter replayed: the run lives here, not in the save. */
      sandbox?: Run | true
      /** A chapter just over (the walked island hands it over). */
      done?: Run
      /** The hero arrives by the map: what he says (the teleport). */
      arrival?: string[]
    }
  /** Which saved Écho plays the hero. */
  | { type: "hero" }
  /** A vacuum decay inside an Adventure fight: the story absorbs it. */
  | { type: "arcade"; team: string[] }
  | { type: "gallery" }
  | { type: "tutorial" }
  | { type: "settings" }
  | { type: "creator"; edit?: string }
  /**
   * The epilogue of the Adventure's ending, then the ending is recorded
   * (La Bascule wipes the save). `forced`: the final fight decided it.
   */
  | {
      type: "ending"
      run: Run
      forced?: EndingResult
      /** A replay of chapter 28: the epilogue is read, nothing is recorded. */
      sandbox?: boolean
    }
  /** First start after a secret ending (shown once). */
  | { type: "congrats"; ending: string }
  /** After a vacuum decay wiped the save. */
  | { type: "collapse" }

/** First screen from the URL (dev shortcuts), the title screen otherwise. */
export function initialScreen(params: Params): Screen {
  switch (params.mode) {
    case "gallery":
      return { type: "gallery" }
    case "tutorial":
      return { type: "tutorial" }
    case "settings":
      return { type: "settings" }
    case "chronicles":
      return params.chapter
        ? { type: "story", start: params.chapter }
        : { type: "chronicles" }
    case "skirmish":
    case "local":
    case "arcade":
      return { type: "picker", mode: params.mode }
    case "fight":
      return {
        type: "fight",
        options: {
          ...classicFight({
            seed: params.seed ?? randomSeed(),
            speed: params.speed,
            spectate: params.spectate,
            playerTeam: resolveFighters(params.playerTeam),
            enemyTeam: resolveFighters(params.enemyTeam),
          }),
          quittable: true,
          placement: true,
        },
      }
    default:
      return { type: "title" }
  }
}

/** Fight setup of a validated team selection. */
export function pickedFight(result: PickerResult, speed: number): SceneOptions {
  const ends = [
    { id: "restart", label: "Rejouer (nouvelle carte)" },
    { id: "picker", label: "Changer d'équipe" },
    { id: "title", label: "Écran titre" },
  ]
  if (result.mode === "local") {
    return {
      seed: result.seed,
      speed,
      quittable: true,
      placement: true,
      endActions: ends,
      teams: [
        {
          name: "l'équipe bleue",
          controller: "local",
          fighters: resolveFighters(result.teams[0]),
        },
        {
          name: "l'équipe rouge",
          controller: "local",
          fighters: resolveFighters(result.teams[1]),
        },
      ],
    }
  }
  return {
    seed: result.seed,
    speed,
    quittable: true,
    placement: true,
    endActions: ends,
    teams: [
      {
        name: "Vous",
        controller: "local",
        fighters: resolveFighters(result.teams[0]),
      },
      {
        name: "Chaos",
        controller: "ai",
        fighters: resolveFighters(result.enemies),
        statMultiplier: result.difficulty.multiplier,
      },
    ],
  }
}

/** Root chip: routes between the title screen, team picker and modes. */
export default class Game extends ViewChip {
  private _current: booyah.Chip | null = null
  private _screen: Screen
  private _collapsing = false
  /** A screen to show once the current chip's own tick is over. */
  private _deferred: Screen | null = null

  constructor(private readonly _params: Params) {
    super()
    this._screen = initialScreen(_params)
  }

  get screen(): Readonly<Screen> {
    return this._screen
  }

  get current() {
    return this._current
  }

  protected _onActivate() {
    // a secret ending was reached: the restart congratulates it, once
    const ending = takeCongratulation()
    this.show(ending ? { type: "congrats", ending } : this._screen)
  }

  protected _onTick() {
    // the collapse waits for the scene's own tick to be over
    if (this._collapsing) {
      this._collapsing = false
      this.collapse()
    }
    if (this._deferred) {
      const screen = this._deferred
      this._deferred = null
      this.show(screen)
    }
  }

  /**
   * A vacuum decay was cast outside the Adventure: the save is wiped, the
   * colours and some characters drift (scars), and the title screen
   * follows a short message. (In the Adventure it will be the threat.)
   */
  collapse() {
    applyScars(vacuumDecayWipe())
    this.show({ type: "collapse" })
  }

  show(screen: Screen) {
    if (this._current) this._terminateChildChip(this._current)
    this._screen = screen
    const chip = this._build(screen)
    this._current = chip
    this._activateChildChip(chip)
  }

  /** The fight screen of an Adventure fight node. */
  private _adventureFight(spec: FightSpec, run: Run, sandbox?: Run): Screen {
    const seed = randomSeed()
    return {
      type: "fight",
      options: this._fightOptions(spec, run, seed),
      adventure: { spec, seed, run, sandbox },
    }
  }

  /** The scene options of an Adventure fight (the story's end actions). */
  private _fightOptions(spec: FightSpec, run: Run, seed: number) {
    return fightOptions(spec, seed, this._params.speed, run, (combat) =>
      combat.winnerTeam === allyTeam(spec) ||
      (combat.winnerTeam === null && combat.adventure?.report.timeUp)
        ? [{ id: "continue", label: "Continuer l'histoire" }]
        : [{ id: "defeat", label: "Poursuivre" }],
    )
  }

  /** A fight played on the island, over the exploration (no screen change). */
  private _siteFight(spec: FightSpec, run: Run): FightScene {
    const scene = new FightScene(this._fightOptions(spec, run, randomSeed()))
    startEnergy(spec, scene.combat, run.elan ?? 0)
    return scene
  }

  private _build(screen: Screen): booyah.Chip {
    const speed = this._params.speed
    switch (screen.type) {
      case "title": {
        const title = new TitleScreen()
        this._subscribeOnce(title, "choose", (choice: TitleChoice) =>
          this.show(
            choice === "codex"
              ? { type: "chronicles" }
              : choice === "tutorial" ||
                  choice === "settings" ||
                  choice === "creator"
                ? { type: choice }
                : { type: "picker", mode: choice },
          ),
        )
        return title
      }

      case "picker": {
        const picker = new TeamPicker(screen.mode, { teams: screen.teams })
        this._subscribeOnce(picker, "back", () => this.show({ type: "title" }))
        this._subscribeOnce(picker, "confirm", (result: PickerResult) =>
          this.show(
            result.mode === "arcade"
              ? { type: "arcade", team: result.teams[0] }
              : {
                  type: "fight",
                  options: pickedFight(result, speed),
                  picked: result,
                },
          ),
        )
        return picker
      }

      case "fight": {
        const scene = new FightScene(screen.options)
        const adventure = screen.adventure
        if (adventure) startEnergy(adventure.spec, scene.combat)
        this._subscribeOnce(scene, "quit", () =>
          this.show(
            adventure
              ? { type: "story", sandbox: adventure.sandbox }
              : { type: "title" },
          ),
        )
        this._subscribeOnce(scene, "vacuumDecay", () => {
          // In the last scene of the Adventure (`finale`) the forbidden spell
          // is La Bascule: its epilogue, then the wipe and the congratulation.
          if (adventure?.spec.rules.finale) {
            this._deferred = {
              type: "ending",
              run: adventure.run,
              forced: { fin: "bascule" },
              sandbox: adventure.sandbox !== undefined,
            }
            return
          }
          // Anywhere else in the Adventure the forbidden spell wipes the
          // whole save: no retry, no congratulation.
          this._collapsing = true
        })
        this._subscribeOnce(scene, "endAction", (id: string) => {
          if (adventure) {
            if (id === "continue" || id === "defeat")
              this.show({
                type: "story",
                report: reportOf(adventure.spec, scene.combat),
                sandbox: adventure.sandbox,
              })
            else this.show({ type: "story", sandbox: adventure.sandbox })
            return
          }
          const picked = screen.picked
          if (id === "restart") {
            this.show({
              ...screen,
              options: { ...screen.options, seed: randomSeed() },
              picked: picked && { ...picked, seed: randomSeed() },
            })
          } else if (id === "picker" && picked) {
            this.show({
              type: "picker",
              mode: picked.mode,
              teams: picked.teams,
            })
          } else {
            this.show({ type: "title" })
          }
        })
        return scene
      }

      case "chronicles": {
        const chronicles = new Chronicles()
        this._subscribeOnce(chronicles, "choose", (choice) => {
          if (choice.kind === "back") this.show({ type: "title" })
          else if (choice.kind === "map") this.show({ type: "map" })
          else if (choice.kind === "carnet")
            this.show({ type: "carnet", from: "chronicles" })
          else if (choice.kind === "new") this.show({ type: "hero" })
          else if (choice.kind === "resume") {
            const next = continuation()
            if (!next) this.show({ type: "hero" })
            else if (next.kind === "run") this.show({ type: "story" })
            else this.show({ type: "story", start: next.id })
          } else this.show({ type: "story", start: choice.id, sandbox: true })
        })
        return chronicles
      }

      case "story": {
        const replay = screen.sandbox !== undefined
        let run: Run | null
        if (screen.done) run = screen.done
        else if (screen.sandbox && screen.sandbox !== true) run = screen.sandbox
        else if (screen.start)
          run = beginChapter(screen.start, undefined, replay)
        else run = resumable()
        if (!run) return this._build({ type: "chronicles" })
        if (explorationOf(run) && !run.done) {
          const island = new ExplorationScene({
            run,
            sandbox: replay,
            makeFight: (spec, r) => this._siteFight(spec, r),
            arrival: screen.arrival,
          })
          this._subscribeOnce(island, "map", () => this.show({ type: "map" }))
          this._subscribeOnce(island, "carnet", () =>
            this.show({ type: "carnet", from: "story" }),
          )
          this._subscribeOnce(island, "back", () =>
            this.show({ type: "chronicles" }),
          )
          this._subscribeOnce(island, "vacuumDecay", (finale: boolean) => {
            if (finale)
              this._deferred = {
                type: "ending",
                run: island.run,
                forced: { fin: "bascule" },
                sandbox: replay,
              }
            else this._collapsing = true
          })
          this._subscribeOnce(
            island,
            "done",
            (r: Run) =>
              (this._deferred = replay
                ? { type: "story", sandbox: r }
                : { type: "story", done: r }),
          )
          return island
        }
        const story = new StoryScene({
          run,
          report: screen.report,
          sandbox: replay,
        })
        this._subscribeOnce(story, "back", () =>
          this.show({ type: "chronicles" }),
        )
        this._subscribeOnce(story, "chapter", (id: string) =>
          this.show(
            replay
              ? { type: "story", start: id, sandbox: true }
              : { type: "story", start: id },
          ),
        )
        this._subscribeOnce(story, "ending", (r: Run) =>
          this.show({ type: "ending", run: r, sandbox: replay }),
        )
        this._subscribeOnce(story, "fight", (spec: FightSpec, r: Run) =>
          this.show(this._adventureFight(spec, r, replay ? r : undefined)),
        )
        return story
      }

      case "carnet": {
        const carnet = new Carnet()
        this._subscribeOnce(carnet, "back", () =>
          this.show(
            screen.from === "story" && continuation()
              ? { type: "story" }
              : { type: "chronicles" },
          ),
        )
        return carnet
      }

      case "map": {
        const map = new WorldMap()
        this._subscribeOnce(map, "back", () => {
          const next = continuation()
          this.show(next ? { type: "story" } : { type: "chronicles" })
        })
        this._subscribeOnce(map, "travel", (id: string, current: boolean) => {
          const save = adventureSave()
          const arrival = teleportReaction(
            {
              trips: save.trips,
              chapter: chapterById(id).number,
              usure: Number(getFlag(save.run ?? START_CARRY, "usure")),
            },
            randomSeed(),
          )
          save.trips++
          writeAdventureSave(save)
          this.show(
            current
              ? {
                  type: "story",
                  start: continuation()?.kind === "chapter" ? id : undefined,
                  arrival,
                }
              : { type: "story", start: id, sandbox: true, arrival },
          )
        })
        return map
      }

      case "hero": {
        const editor = new AppearanceEditor(
          STARTING_LOOK,
          "brutus",
          undefined,
          HERO_PARTS,
        )
        this._subscribeOnce(editor, "done", (look: CustomLook | null) => {
          newGame(look ?? STARTING_LOOK)
          this.show({ type: "story", start: "prologue" })
        })
        this._subscribeOnce(editor, "cancel", () =>
          this.show({ type: "chronicles" }),
        )
        return editor
      }

      case "arcade": {
        const run = new ArcadeRun(screen.team, { speed })
        this._subscribeOnce(run, "exit", () => this.show({ type: "title" }))
        this._subscribeOnce(run, "vacuumDecay", () => {
          this._collapsing = true
        })
        this._subscribeOnce(run, "again", () =>
          this.show({ type: "arcade", team: screen.team }),
        )
        return run
      }

      case "ending": {
        const result = endingOf(screen.run, screen.forced)
        const epilogue = new Epilogue({
          name: ENDING_NAMES[result.fin],
          pages: epilogueOf(result),
        })
        this._subscribeOnce(epilogue, "done", () => {
          if (screen.sandbox) return this.show({ type: "chronicles" })
          const secret = recordEnding(result)
          if (secret === "bascule") applyScars(scarCount())
          this.show(
            secret ? { type: "congrats", ending: secret } : { type: "title" },
          )
        })
        return epilogue
      }

      case "congrats": {
        const ending = SECRET_ENDINGS[screen.ending]
        const message = new MessageScreen({
          title: ending.title,
          color: 0xffe066,
          lines: ending.lines,
          choices: [{ id: "title", label: "Écran titre" }],
        })
        this._subscribeOnce(message, "choose", () =>
          this.show({ type: "title" }),
        )
        return message
      }

      case "collapse": {
        const message = new MessageScreen({
          title: "Le vide a basculé",
          color: 0xe7f5ff,
          lines: ["Tout ce qui était là s'est réécrit."],
          choices: [{ id: "title", label: "Écran titre" }],
        })
        this._subscribeOnce(message, "choose", () =>
          this.show({ type: "title" }),
        )
        return message
      }

      case "tutorial": {
        const tutorial = new Tutorial(speed)
        this._subscribeOnce(tutorial, "exit", () =>
          this.show({ type: "title" }),
        )
        this._subscribeOnce(tutorial, "again", () =>
          this.show({ type: "tutorial" }),
        )
        return tutorial
      }

      case "settings": {
        const screen = new SettingsScreen()
        this._subscribeOnce(screen, "back", () => this.show({ type: "title" }))
        return screen
      }

      case "creator": {
        const creator = new Creator(screen.edit)
        this._subscribeOnce(creator, "back", () => this.show({ type: "title" }))
        return creator
      }

      case "gallery": {
        const gallery = new Gallery(
          this._params.anim,
          this._params.galleryLooks,
          this._params.seed ?? 1,
        )
        this._subscribeOnce(gallery, "back", () => this.show({ type: "title" }))
        return gallery
      }
    }
  }
}

const randomSeed = () => Math.floor(Math.random() * 1_000_000)
