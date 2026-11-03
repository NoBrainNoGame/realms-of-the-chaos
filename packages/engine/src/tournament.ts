/**
 * AI-vs-AI tournaments used to measure balance: random 3v3 teams drawn
 * from a pool, every fight played twice with the sides swapped (so the
 * spawn side and the map cancel out).
 */
import { Combat } from "./combat"
import { createRng } from "./random"
import type { CharacterPreset } from "./types"

export interface TournamentOptions {
  /** Characters to draw teams from (preset ids or full presets). */
  pool: (string | CharacterPreset)[]
  /** Number of team pairs; each pair is played twice (sides swapped). */
  pairs: number
  seed?: number
  teamSize?: number
  /** Safety cap on the events of a single fight. */
  maxEvents?: number
}

export interface CharacterResult {
  games: number
  wins: number
  winRate: number
}

export interface TournamentResult {
  fights: number
  /** Fights that did not end within maxEvents. */
  draws: number
  /** Share of the fights won by the first team (side advantage). */
  firstSideWinRate: number
  /** Average number of actions used per fighter and per fight. */
  actionsPerFighter: number
  /** Average timeline time of a fight. */
  averageTime: number
  characters: Record<string, CharacterResult>
  /** How many times each character used each of its actions. */
  actionUses: Record<string, Record<string, number>>
  /** Results of each team composition (sorted ids joined by "+"). */
  compositions: Record<string, { games: number; wins: number }>
  /** Wins of teams containing `a` against teams containing `b`. */
  matrix: Record<string, Record<string, { games: number; wins: number }>>
}

const idOf = (entry: string | CharacterPreset) =>
  typeof entry === "string" ? entry : entry.id

export function runTournament(options: TournamentOptions): TournamentResult {
  const { pool, pairs, seed = 1, teamSize = 3, maxEvents = 200_000 } = options
  const rng = createRng(seed)
  const ids = pool.map(idOf)
  const characters: Record<string, CharacterResult> = Object.fromEntries(
    ids.map((id) => [id, { games: 0, wins: 0, winRate: 0 }]),
  )
  const actionUses: TournamentResult["actionUses"] = {}
  const matrix: TournamentResult["matrix"] = {}
  const compositions: TournamentResult["compositions"] = {}
  let fights = 0
  let draws = 0
  let firstSideWins = 0
  let actions = 0
  let time = 0

  const draw = () => Array.from({ length: teamSize }, () => rng.pick(pool))

  for (let i = 0; i < pairs; i++) {
    const a = draw()
    const b = draw()
    const fightSeed = rng.int(0, 1_000_000_000)
    for (const teams of [
      [a, b],
      [b, a],
    ]) {
      const combat = new Combat({
        seed: fightSeed,
        teams: teams.map((fighters) => ({ controller: "ai", fighters })),
      })
      for (const event of combat.run(maxEvents)) {
        if (event.type !== "actionUsed") continue
        actions++
        const fighter = combat.getFighter(event.fighterId)!
        const uses = entry<Record<string, number>>(
          actionUses,
          fighter.presetId,
          () => ({}),
        )
        uses[event.baseActionId] = (uses[event.baseActionId] ?? 0) + 1
      }
      fights++
      time += combat.time
      const winner = combat.winnerTeam
      if (combat.state !== "ended" || winner === null) {
        draws++
        continue
      }
      if (winner === 0) firstSideWins++
      teams.forEach((team, index) => {
        const won = index === winner
        for (const entry of team) {
          const result = characters[idOf(entry)]
          result.games++
          if (won) result.wins++
        }
        const composition = team.map(idOf).sort().join("+")
        const record = entry(compositions, composition, () => ({
          games: 0,
          wins: 0,
        }))
        record.games++
        if (won) record.wins++
        const opponents = teams[1 - index].map(idOf)
        for (const own of new Set(team.map(idOf))) {
          for (const other of new Set(opponents)) {
            const row = entry<TournamentResult["matrix"][string]>(
              matrix,
              own,
              () => ({}),
            )
            const cell = entry(row, other, () => ({ games: 0, wins: 0 }))
            cell.games++
            if (won) cell.wins++
          }
        }
      })
    }
  }

  for (const result of Object.values(characters)) {
    result.winRate = result.games ? result.wins / result.games : 0
  }
  return {
    fights,
    draws,
    firstSideWinRate: firstSideWins / Math.max(1, fights - draws),
    actionsPerFighter: actions / Math.max(1, fights * teamSize * 2),
    averageTime: time / Math.max(1, fights),
    characters,
    actionUses,
    compositions,
    matrix,
  }
}

/** The value of `key` in a record, created by `init` when missing. */
function entry<T>(record: Record<string, T>, key: string, init: () => T): T {
  if (!(key in record)) record[key] = init()
  return record[key]
}
