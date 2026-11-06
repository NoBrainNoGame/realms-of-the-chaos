import type { AiCommand } from "./ai"
import type { Combat } from "./combat"
import { keyOf, manhattan, type Point } from "./geometry"
import type { Fighter } from "./types"

// Opt-in rules of the Adventure for a duel that is also an argument (ch. 17,
// the Maître du Verre). One fighter measures (Relevé): every measurement
// breaks a pair of probes and opens small Lacunes, because to know where
// something is, something has to touch it. The hero can answer with
// arguments (Argumenter) that lower the speaker's Certitude; at 0 the fight
// stops with no winner. Nothing here runs unless `rules.debate` is set.

/** One argument the hero may play, once. */
export interface DebateArgument {
  id: string
  /** The argument is receivable now (flags read by the chapter). */
  ok: boolean
  /** What the hero says (a button of the interface). */
  label?: string
  /** What the speaker answers (shown once the argument is played). */
  answer?: string
  /** It only holds once the speaker has measured at least once in the fight. */
  needsSurvey?: boolean
}

export interface DebateRules {
  /** The one who measures and whose Certitude is argued down. */
  speaker: { team: number; index: number }
  /** The one who argues (default: the first fighter of team 0). */
  hero?: { team: number; index: number }
  /** Pairs of probes; the cells of a pair are only shown, never blocked. */
  probes: Point[][]
  /** The Lacunes a broken pair opens, pair by pair. */
  lacunes?: Point[][]
  /** Relevé: range, time, recharge (own turns), turns it lasts, range bonus. */
  survey?: {
    min?: number
    max?: number
    time?: number
    cooldown?: number
    lasts?: number
    bonus?: number
  }
  certitude: number
  arguments: DebateArgument[]
  /** The speaker must be this close to be argued with (default 4). */
  range?: number
  /** Time of an argument (default 0.5). */
  time?: number
  /** Arguments per hero turn (default 1). */
  perTurn?: number
  /** Once in the fight, the hero may play one more argument in a turn. */
  extraOnce?: boolean
}

export interface DebateReport {
  /** Surveys made, in order: who was measured. */
  surveyed: string[]
  /** Pairs of probes broken. */
  probesBroken: number
  /** Lacune cells the surveys opened. */
  opened: Point[]
  certitude: number
  /** Ids of the arguments played, in order. */
  argued: string[]
  /** The Certitude fell to 0: nobody won, the speaker changed. */
  convinced: boolean
}

export const emptyDebateReport = (): DebateReport => ({
  surveyed: [],
  probesBroken: 0,
  opened: [],
  certitude: 0,
  argued: [],
  convinced: false,
})

export class DebateKit {
  readonly report: DebateReport = emptyDebateReport()
  private _speakerId: string
  private _heroId: string
  private _cooldown = 0
  private _marked = new Map<string, number>()
  private _playedThisTurn = 0
  private _extraUsed = false
  private _survey: Required<NonNullable<DebateRules["survey"]>>

  constructor(
    private readonly _combat: Combat,
    private readonly _rules: DebateRules,
  ) {
    const at = (r: { team: number; index: number }) => {
      const f = _combat.fighters.filter((x) => x.team === r.team)[r.index]
      if (!f) throw new Error(`No fighter ${r.index} in team ${r.team}`)
      return f.id
    }
    this._speakerId = at(_rules.speaker)
    this._heroId = at(_rules.hero ?? { team: 0, index: 0 })
    this.report.certitude = _rules.certitude
    this._survey = {
      min: 1,
      max: 5,
      time: 0.8,
      cooldown: 2,
      lasts: 2,
      bonus: 2,
      ...(_rules.survey ?? {}),
    }
  }

  get speaker(): Fighter | undefined {
    return this._combat.getFighter(this._speakerId)
  }

  get hero(): Fighter | undefined {
    return this._combat.getFighter(this._heroId)
  }

  get certitude() {
    return this.report.certitude
  }

  get surveyTime() {
    return this._survey.time
  }

  get argumentTime() {
    return this._rules.time ?? 0.5
  }

  /** The probes still whole. */
  get probesLeft() {
    return this._rules.probes.length - this.report.probesBroken
  }

  isSpeaker(f: Fighter) {
    return f.id === this._speakerId
  }

  /** A turn begins: recharges, marks fade, the hero's turn count resets. */
  turnStart(fighter: Fighter) {
    if (fighter.id === this._speakerId && this._cooldown > 0) this._cooldown--
    if (fighter.id === this._heroId) this._playedThisTurn = 0
    const left = this._marked.get(fighter.id)
    if (left !== undefined) {
      if (left <= 1) this._marked.delete(fighter.id)
      else this._marked.set(fighter.id, left - 1)
    }
  }

  /** Is this fighter Relevé (known to the speaker's side)? */
  isSurveyed(id: string) {
    return this._marked.has(id)
  }

  /** Extra reach of the speaker's side against a Relevé fighter at `p`. */
  rangeBonus(attacker: Fighter, p: Point): number {
    const speaker = this.speaker
    if (!speaker || attacker.team !== speaker.team) return 0
    return this._combat.fightersAt(p).some((f) => this._marked.has(f.id))
      ? this._survey.bonus
      : 0
  }

  // ─── Relevé ───────────────────────────────────────────────────────────────

  canSurvey(fighter: Fighter) {
    return (
      fighter.id === this._speakerId &&
      this._cooldown === 0 &&
      this.probesLeft > 0
    )
  }

  /** Can the speaker measure `target` from `origin` (range and sight)? */
  inSurveyRange(origin: Point, target: Point) {
    const d = manhattan(origin, target)
    return (
      d >= this._survey.min &&
      d <= this._survey.max &&
      this._combat.board.hasLineOfSight(origin, target)
    )
  }

  /** Plan a Relevé of `target` from where the speaker stands, or walk closer. */
  plan(fighter: Fighter, target: Fighter): AiCommand[] | null {
    if (!this.canSurvey(fighter) || !target.alive) return null
    if (this.inSurveyRange(fighter.position, target.position))
      return [{ type: "survey", target: target.position }]
    let spot: Point | null = null
    let cost = Infinity
    for (const node of this._combat.explore(fighter).values()) {
      if (node.cost >= cost) continue
      if (!this.inSurveyRange(node.point, target.position)) continue
      spot = node.point
      cost = node.cost
    }
    return spot ? [{ type: "move", destination: spot }, { type: "pass" }] : null
  }

  /** Do the Relevé: the target is known for a while, a pair of probes breaks. */
  survey(fighter: Fighter, at: Point): string | null {
    if (!this.canSurvey(fighter)) return "Relevé impossible"
    if (!this.inSurveyRange(fighter.position, at)) return "Hors de portée"
    const target = this._combat.fightersAt(at)[0]
    if (!target) return "Personne à relever"
    this._marked.set(target.id, this._survey.lasts)
    this._cooldown = this._survey.cooldown
    this.report.surveyed.push(target.id)
    const pair = this.report.probesBroken++
    const opened: Point[] = []
    for (const p of this._rules.lacunes?.[pair] ?? []) {
      if (this._combat.fightersAt(p).length > 0) continue
      this._combat.board.voids.add(keyOf(p))
      opened.push(p)
    }
    if (opened.length) {
      this.report.opened.push(...opened)
      this._combat.refreshTerrain()
      this._combat.emitEvent({ type: "lacuneGrew", cells: opened })
    }
    this._combat.emitEvent({
      type: "surveyed",
      fighterId: fighter.id,
      targetId: target.id,
      pair,
    })
    return null
  }

  // ─── Argumenter ───────────────────────────────────────────────────────────

  /** The arguments, with whether each can be played right now. */
  options(
    fighter: Fighter,
  ): { id: string; playable: boolean; used: boolean }[] {
    const surveyed = this.report.surveyed.length > 0
    const speaker = this.speaker
    const near =
      !!speaker &&
      speaker.alive &&
      fighter.id === this._heroId &&
      manhattan(fighter.position, speaker.position) <= (this._rules.range ?? 4)
    const room =
      this._playedThisTurn <
      (this._rules.perTurn ?? 1) +
        (this._rules.extraOnce && !this._extraUsed ? 1 : 0)
    return this._rules.arguments.map((a) => {
      const used = this.report.argued.includes(a.id)
      return {
        id: a.id,
        used,
        playable: !used && near && room && a.ok && (!a.needsSurvey || surveyed),
      }
    })
  }

  /** Play an argument: the Certitude falls by one. */
  argue(fighter: Fighter, id: string): string | null {
    const option = this.options(fighter).find((o) => o.id === id)
    if (!option?.playable) return "Argument irrecevable"
    if (this._playedThisTurn >= (this._rules.perTurn ?? 1))
      this._extraUsed = true
    this._playedThisTurn++
    this.report.argued.push(id)
    this.report.certitude = Math.max(0, this.report.certitude - 1)
    this._combat.emitEvent({
      type: "argued",
      fighterId: fighter.id,
      argumentId: id,
      certitude: this.report.certitude,
    })
    if (this.report.certitude === 0) this.report.convinced = true
    return null
  }
}
