import type * as booyah from "@ghom/booyah"
import type { Params } from "../params"
import ArcadeRun from "./ArcadeRun"
import FightScene, { classicFight, type SceneOptions } from "./FightScene"
import Gallery from "./Gallery"
import SettingsScreen from "./SettingsScreen"
import TeamPicker, { type PickerMode, type PickerResult } from "./TeamPicker"
import TitleScreen, { type TitleChoice } from "./TitleScreen"
import Tutorial from "./Tutorial"
import ViewChip from "./ViewChip"

export type Screen =
  | { type: "title" }
  | { type: "picker"; mode: PickerMode; teams?: string[][] }
  | { type: "fight"; options: SceneOptions; picked?: PickerResult }
  | { type: "arcade"; team: string[] }
  | { type: "gallery" }
  | { type: "tutorial" }
  | { type: "settings" }

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
            playerTeam: params.playerTeam,
            enemyTeam: params.enemyTeam,
          }),
          quittable: true,
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
      endActions: ends,
      teams: [
        {
          name: "l'équipe bleue",
          controller: "local",
          fighters: result.teams[0],
        },
        {
          name: "l'équipe rouge",
          controller: "local",
          fighters: result.teams[1],
        },
      ],
    }
  }
  return {
    seed: result.seed,
    speed,
    quittable: true,
    endActions: ends,
    teams: [
      { name: "Vous", controller: "local", fighters: result.teams[0] },
      {
        name: "Chaos",
        controller: "ai",
        fighters: result.enemies,
        statMultiplier: result.difficulty.multiplier,
      },
    ],
  }
}

/** Root chip: routes between the title screen, team picker and modes. */
export default class Game extends ViewChip {
  private _current: booyah.Chip | null = null
  private _screen: Screen

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
    this.show(this._screen)
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
            choice === "tutorial" || choice === "settings"
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
        this._subscribeOnce(run, "again", () =>
          this.show({ type: "arcade", team: screen.team }),
        )
        return run
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

      case "gallery": {
        const gallery = new Gallery(this._params.anim)
        this._subscribeOnce(gallery, "back", () => this.show({ type: "title" }))
        return gallery
      }
    }
  }
}

const randomSeed = () => Math.floor(Math.random() * 1_000_000)
