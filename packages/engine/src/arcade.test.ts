import { describe, expect, test } from "bun:test"
import { decide } from "./ai"
import {
  ARCADE_FIRST_WAVE,
  ARCADE_MAX_TEAM,
  ARCADE_RECOVERY,
  ARCADE_WAVE_GROWTH,
  applyArcadeBonus,
  arcadeAfterWave,
  arcadeBonusChoices,
  arcadeEnemies,
  arcadeWaveOptions,
  startArcade,
  verifyArcadeRun,
  type ArcadeBonus,
  type ArcadeRecord,
  type ArcadeState,
} from "./arcade"
import { Combat, type Command } from "./combat"
import { CHARACTERS } from "./content"

/** Play the human team with the AI brain, through logged commands. */
function autoplay(combat: Combat) {
  for (let i = 0; i < 2000 && combat.state !== "ended"; i++) {
    combat.run()
    const me = combat.activeFighter
    if (!me) break
    let ended = false
    for (const step of decide(combat, me)) {
      const command: Command =
        step.type === "move"
          ? { type: "moveTo", fighterId: me.id, destination: step.destination }
          : step.type === "action"
            ? {
                type: "useAction",
                fighterId: me.id,
                actionId: step.actionId,
                target: step.target,
              }
            : { type: "pass", fighterId: me.id }
      combat.execute(command)
      if (command.type !== "moveTo") ended = true
    }
    if (!ended) combat.execute({ type: "pass", fighterId: me.id })
  }
}

/** A full run, choosing bonuses in turn; returns the record and final state. */
function playRun(seed: number, team: string[], maxWaves = 6) {
  let state = startArcade(team)
  const record: ArcadeRecord = { seed, team, waves: [] }
  const cycle: ArcadeBonus[] = ["recruit", "power", "heal"]
  for (let w = 0; w < maxWaves && state.alive; w++) {
    const combat = new Combat(arcadeWaveOptions(seed, state))
    autoplay(combat)
    state = arcadeAfterWave(state, combat)
    let bonus: ArcadeBonus | null = null
    if (state.alive && w < maxWaves - 1) {
      const choices = arcadeBonusChoices(state)
      bonus = cycle.find((b) => choices.includes(b))!
      state = applyArcadeBonus(seed, state, bonus)
    }
    record.waves.push({ log: [...combat.log], bonus })
  }
  return { record, state }
}

describe("arcade rules", () => {
  test("teams have 1 to 3 known fighters", () => {
    expect(() => startArcade([])).toThrow()
    expect(() => startArcade(["eva", "eva", "eva", "eva"])).toThrow()
    expect(() => startArcade(["nobody"])).toThrow()
    expect(startArcade(["eva"])).toMatchObject({
      wave: 1,
      score: 0,
      alive: true,
      multiplier: 1,
    })
  })

  test("waves get bigger and stronger, deterministically", () => {
    expect(arcadeEnemies(7, 1)).toEqual(arcadeEnemies(7, 1))
    expect(arcadeEnemies(7, 1)).toHaveLength(2)
    expect(arcadeEnemies(7, 3)).toHaveLength(3)
    expect(arcadeEnemies(7, 9)).toHaveLength(4)
    for (const id of arcadeEnemies(7, 5)) expect(CHARACTERS[id]).toBeDefined()
    const state = { ...startArcade(["eva"]), wave: 4 }
    const options = arcadeWaveOptions(7, state)
    expect(options.teams[1].statMultiplier).toBeCloseTo(
      ARCADE_FIRST_WAVE + 3 * ARCADE_WAVE_GROWTH,
    )
    expect(options.seed).not.toBe(
      arcadeWaveOptions(7, startArcade(["eva"])).seed,
    )
  })

  test("survivors recover half their lost hit points; the fallen leave", () => {
    const state = startArcade(["eva", "brutus"])
    // find a won first wave
    let combat: Combat | null = null
    for (let seed = 1; seed < 30 && !combat; seed++) {
      const attempt = new Combat(arcadeWaveOptions(seed, state))
      autoplay(attempt)
      if (attempt.winnerTeam === 0) combat = attempt
    }
    if (!combat) throw new Error("no winning wave found")
    const next = arcadeAfterWave(state, combat)
    const survivors = combat.fighters.filter((f) => f.team === 0 && f.alive)
    expect(next.team).toEqual(survivors.map((f) => f.presetId))
    survivors.forEach((f, i) => {
      const max = combat.maxHp(f)
      expect(next.hp[i]).toBe(Math.round(f.hp + (max - f.hp) * ARCADE_RECOVERY))
    })
    expect(next.wave).toBe(2)
    expect(next.score).toBeGreaterThanOrEqual(100)
  })

  test("a lost wave ends the run; an unfinished wave is refused", () => {
    const state = startArcade(["eva"])
    const unfinished = new Combat(arcadeWaveOptions(1, state))
    expect(() => arcadeAfterWave(state, unfinished)).toThrow("not over")
    let lost: Combat | null = null
    for (let seed = 1; seed < 30 && !lost; seed++) {
      const attempt = new Combat(arcadeWaveOptions(seed, state))
      autoplay(attempt)
      if (attempt.winnerTeam !== 0) lost = attempt
    }
    if (!lost) throw new Error("no lost wave found")
    expect(arcadeAfterWave(state, lost)).toMatchObject({
      alive: false,
      score: 0,
      wave: 1,
    })
  })

  test("bonuses: heal, power, recruit (only with room in the team)", () => {
    const state: ArcadeState = {
      ...startArcade(["eva", "brutus"]),
      hp: [10, 20],
    }
    expect(applyArcadeBonus(1, state, "heal").hp).toEqual([
      undefined,
      undefined,
    ])
    expect(applyArcadeBonus(1, state, "power").multiplier).toBe(1.1)
    const recruited = applyArcadeBonus(1, state, "recruit")
    expect(recruited.team).toHaveLength(3)
    expect(CHARACTERS[recruited.team[2]]).toBeDefined()
    expect(arcadeBonusChoices(recruited)).not.toContain("recruit")
    expect(recruited.team.length).toBe(ARCADE_MAX_TEAM)
    expect(() => applyArcadeBonus(1, recruited, "recruit")).toThrow()
  })
})

describe("arcade run verification", () => {
  for (const seed of [11, 42]) {
    test(`a real run is verified with the same score (seed ${seed})`, () => {
      const { record, state } = playRun(seed, ["brutus", "lyra", "eva"])
      expect(record.waves.length).toBeGreaterThan(0)
      const verified = verifyArcadeRun(record)
      expect(verified.score).toBe(state.score)
      expect(verified.waves).toBe(state.wave - 1)
    }, 60_000)
  }

  test("tampered records are refused", () => {
    const { record } = playRun(11, ["brutus", "lyra", "eva"], 2)
    const first = record.waves[0]

    // a command removed: the wave does not end the same way (or at all)
    const cut: ArcadeRecord = {
      ...record,
      waves: [{ ...first, log: first.log.slice(0, 2) }],
    }
    expect(() => verifyArcadeRun(cut)).toThrow()

    // an impossible command
    const forged: ArcadeRecord = {
      ...record,
      waves: [
        {
          ...first,
          log: [
            {
              type: "useAction",
              fighterId: "eva-0-2",
              actionId: "fireball",
              target: { x: 0, y: 0 },
            },
          ],
        },
      ],
    }
    expect(() => verifyArcadeRun(forged)).toThrow()

    // a bonus that is not allowed
    const full = { ...record, team: ["brutus", "lyra", "eva"] }
    if (full.waves[0].bonus !== null) {
      const badBonus: ArcadeRecord = {
        ...full,
        waves: [{ ...first, bonus: "recruit" }],
      }
      expect(() => verifyArcadeRun(badBonus)).toThrow()
    }
  }, 60_000)
})
