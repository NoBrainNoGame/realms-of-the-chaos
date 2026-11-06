import type * as booyah from "@ghom/booyah"
import { SECRET_ENDINGS } from "../endings"
import type { Params } from "../params"
import { takeCongratulation, vacuumDecayWipe } from "../storage"
import ArcadeRun from "./ArcadeRun"
import Creator from "./Creator"
import FightScene, { classicFight, type SceneOptions } from "./FightScene"
import Gallery from "./Gallery"
import { resolveFighters } from "./looks"
import MessageScreen from "./MessageScreen"
import SettingsScreen from "./SettingsScreen"
import TeamPicker, { type PickerMode, type PickerResult } from "./TeamPicker"
import TitleScreen, { type TitleChoice } from "./TitleScreen"
import Tutorial from "./Tutorial"
import { applyScars } from "./theme"
import ViewChip from "./ViewChip"

export type Screen =
  | { type: "title" }
  | { type: "picker"; mode: PickerMode; teams?: string[][] }
  | { type: "fight"; options: SceneOptions; picked?: PickerResult }
  | { type: "arcade"; team: string[] }
  | { type: "gallery" }
  | { type: "tutorial" }
  | { type: "settings" }
  | { type: "creator"; edit?: string }
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

  private _build(screen: Screen): booyah.Chip {
    const speed = this._params.speed
    switch (screen.type) {
      case "title": {
        const title = new TitleScreen()
        this._subscribeOnce(title, "choose", (choice: TitleChoice) =>
          this.show(
            choice === "tutorial" ||
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
        this._subscribeOnce(scene, "quit", () => this.show({ type: "title" }))
        this._subscribeOnce(scene, "vacuumDecay", () => {
          this._collapsing = true
        })
        this._subscribeOnce(scene, "endAction", (id: string) => {
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
        const gallery = new Gallery(this._params.anim)
        this._subscribeOnce(gallery, "back", () => this.show({ type: "title" }))
        return gallery
      }
    }
  }
}

const randomSeed = () => Math.floor(Math.random() * 1_000_000)
