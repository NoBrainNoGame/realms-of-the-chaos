import type * as booyah from "@ghom/booyah"

import {
  ARCADE_BONUSES,
  type ArcadeBonus,
  type ArcadeMember,
  type ArcadeRecord,
  type ArcadeState,
  applyArcadeBonus,
  arcadeAfterWave,
  arcadeBonusChoices,
  arcadeRecruit,
  arcadeWaveOptions,
  CHARACTERS,
  type CheckOptions,
  startArcade,
} from "@realms/engine"
import {
  allowance,
  customById,
  customId,
  isCustomId,
  scarCount,
  submitArcadeScore,
} from "../storage"
import FightScene, { type SceneOptions } from "./FightScene"
import { registerLook } from "./looks"
import MessageScreen from "./MessageScreen"
import { COLORS } from "./theme"
import ViewChip from "./ViewChip"

interface ArcadeEvents extends booyah.BaseCompositeEvents {
  /** Leave the arcade (back to the title screen). */
  exit: []
  /** Start a new run with the same team. */
  again: []
  /** A vacuum decay swallowed a wave (the game wipes the save). */
  vacuumDecay: []
}

/** Scene options of the current wave (the engine's arcade setup). */
export function waveScene(
  runSeed: number,
  state: ArcadeState,
  speed: number,
  scars = 0,
  check: CheckOptions = {},
): SceneOptions {
  const options = arcadeWaveOptions(runSeed, state, scars, check)
  return {
    seed: options.seed!,
    speed,
    quittable: true,
    placement: true,
    endActions: [{ id: "continue", label: "Continuer" }],
    teams: options.teams.map((team) => ({
      name: team.name ?? "",
      controller: team.controller === "human" ? "local" : "ai",
      fighters: team.fighters,
      statMultiplier: team.statMultiplier,
      hp: team.hp,
    })),
  }
}

/**
 * An arcade run: waves of growing strength, a summary and a bonus between
 * them, then the score and the record. The whole run is recorded (seed,
 * commands, bonuses) so a server can replay it to verify the score.
 */
export default class ArcadeRun extends ViewChip<ArcadeEvents> {
  private _run: ArcadeState
  private _record: ArcadeRecord
  private _screen: booyah.Chip | null = null
  private _newRecord = false

  constructor(
    readonly team: string[],
    private readonly _options: {
      speed: number
      seed?: number
      /** The AI plays your team too (demo, tests). */
      autoplay?: boolean
    },
  ) {
    super()
    const seed = _options.seed ?? Math.floor(Math.random() * 1e9)
    const members = arcadeMembers(team)
    this._run = startArcade(members, allowance())
    this._record = { seed, team: members, waves: [], scars: scarCount() }
  }

  /** Progress of the run (team, hit points, wave, score). */
  get run(): Readonly<ArcadeState> {
    return this._run
  }

  /** Everything needed to verify the run (see verifyArcadeRun). */
  get record(): Readonly<ArcadeRecord> {
    return this._record
  }

  get screen() {
    return this._screen
  }

  get newRecord() {
    return this._newRecord
  }

  protected _onActivate() {
    this._startWave()
  }

  private _show(chip: booyah.Chip) {
    if (this._screen) this._terminateChildChip(this._screen)
    this._screen = chip
    this._activateChildChip(chip)
  }

  private _startWave() {
    const options = waveScene(
      this._record.seed,
      this._run,
      this._options.speed,
      this._record.scars,
      allowance(),
    )
    if (this._options.autoplay) options.teams[0].controller = "ai"
    const scene = new FightScene(options)
    this._show(scene)
    this._subscribeOnce(scene, "endAction", () => this._afterWave(scene))
    this._subscribeOnce(scene, "quit", () => this.emit("exit"))
    this._subscribeOnce(scene, "vacuumDecay", () => this.emit("vacuumDecay"))
  }

  private _afterWave(scene: FightScene) {
    const wave = this._run.wave
    const before = this._run
    this._run = arcadeAfterWave(this._run, scene.combat)
    this._record.waves.push({ log: [...scene.combat.log], bonus: null })

    if (!this._run.alive) {
      this._gameOver()
      return
    }

    const survivors = this._run.team
      .map((member, i) => {
        const fighter = scene.combat.fighters.find(
          (f) => f.team === 0 && f.alive && f.presetId === memberId(member),
        )
        const max = fighter ? scene.combat.baseMaxHp(fighter) : 0
        return `${memberName(member)} ${this._run.hp[i]}/${max} PV`
      })
      .join(" · ")
    const fallen = before.team.length - this._run.team.length
    const choices = arcadeBonusChoices(this._run).map((id) => ({
      id,
      label: ARCADE_BONUSES[id].name,
      description:
        id === "recruit"
          ? `${ARCADE_BONUSES[id].description} Ce sera ${CHARACTERS[arcadeRecruit(this._record.seed, this._run)].name}.`
          : ARCADE_BONUSES[id].description,
    }))
    const screen = new MessageScreen({
      title: `Marée ${wave} repoussée !`,
      color: 0xffe066,
      lines: [
        `Score : ${this._run.score}`,
        survivors,
        fallen
          ? `${fallen} Écho${fallen > 1 ? "s" : ""} ne reviendr${fallen > 1 ? "ont" : "a"} pas.`
          : "Toute l'équipe tient bon.",
        "Choisissez un bonus avant la Marée suivante :",
      ],
      choices,
    })
    this._show(screen)
    this._subscribeOnce(screen, "choose", (id) =>
      this.chooseBonus(id as ArcadeBonus),
    )
  }

  /** Applies a bonus between two waves, then starts the next wave. */
  chooseBonus(bonus: ArcadeBonus) {
    this._run = applyArcadeBonus(this._record.seed, this._run, bonus)
    this._record.waves[this._record.waves.length - 1].bonus = bonus
    this._startWave()
  }

  private _gameOver() {
    const waves = this._run.wave - 1
    this._newRecord = submitArcadeScore({
      score: this._run.score,
      waves,
      team: this.team,
      date: new Date().toISOString(),
    })
    const screen = new MessageScreen({
      title: this._newRecord ? "Nouveau record !" : "Fin de la partie",
      color: this._newRecord ? 0xffe066 : COLORS.text,
      lines: [
        `Marées repoussées : ${waves}`,
        `Score : ${this._run.score}`,
        `Équipe : ${this._record.team.map(memberName).join(", ")}`,
      ],
      choices: [
        { id: "again", label: "Rejouer avec cette équipe" },
        { id: "exit", label: "Écran titre" },
      ],
    })
    this._show(screen)
    this._subscribeOnce(screen, "choose", (id) =>
      id === "again" ? this.emit("again") : this.emit("exit"),
    )
  }
}

/** The run's team: saved custom characters join as their full character. */
function arcadeMembers(ids: string[]): ArcadeMember[] {
  return ids.flatMap((id): ArcadeMember[] => {
    if (!isCustomId(id)) return [id]
    const stored = customById(id)
    if (!stored) return []
    registerLook(id, stored.kit)
    return [stored]
  })
}

function memberId(member: ArcadeMember) {
  return typeof member === "string" ? member : customId(member.name)
}

function memberName(member: ArcadeMember) {
  return typeof member === "string" ? CHARACTERS[member].name : member.name
}
