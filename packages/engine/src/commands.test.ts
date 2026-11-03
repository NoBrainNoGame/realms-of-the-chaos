import { describe, expect, test } from "bun:test"
import { decide } from "./ai"
import { Board } from "./board"
import { Combat, scaleStats, type Command, type CombatOptions } from "./combat"
import { CHARACTERS } from "./content"

/** A human team driven by the AI brain, through serialized commands. */
function playWithCommands(combat: Combat, maxTurns = 2000) {
  for (let i = 0; i < maxTurns && combat.state !== "ended"; i++) {
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
      const result = combat.execute(command)
      expect(result.ok).toBe(true)
      if (command.type !== "moveTo") ended = true
    }
    if (!ended)
      expect(combat.execute({ type: "pass", fighterId: me.id }).ok).toBe(true)
  }
}

/** Everything that matters about a fight's state. */
function snapshot(combat: Combat) {
  return {
    time: combat.time,
    state: combat.state,
    winner: combat.winnerTeam,
    energy: combat.teams.map((t) => t.energy),
    terrain: combat.board.toAscii(),
    fighters: combat.fighters.map((f) => ({
      id: f.id,
      hp: f.hp,
      alive: f.alive,
      position: f.position,
      next: f.nextActionAt,
      statuses: f.statuses,
      cooldowns: f.cooldowns,
    })),
  }
}

describe("commands and replays", () => {
  const options = (seed: number): CombatOptions => ({
    seed,
    teams: [
      { controller: "human", fighters: ["eva", "brutus", "nerea"] },
      { controller: "ai", fighters: ["gorr", "merlin", "squalor"] },
    ],
  })

  for (const seed of [1, 7, 21]) {
    test(`a fight replayed from its log is identical (seed ${seed})`, () => {
      const original = new Combat(options(seed))
      playWithCommands(original)
      expect(original.state).toBe("ended")
      expect(original.log.length).toBeGreaterThan(5)

      const replayed = Combat.replay(options(seed), original.log)
      expect(snapshot(replayed)).toEqual(snapshot(original))
    })
  }

  test("two humans: both teams' commands are logged and replayed", () => {
    const opts: CombatOptions = {
      seed: 3,
      teams: [
        { controller: "human", fighters: ["nyx", "lyra"] },
        { controller: "human", fighters: ["brutus", "eva"] },
      ],
    }
    const original = new Combat(opts)
    playWithCommands(original)
    const teams = new Set(
      original.log.map((c) => original.getFighter(c.fighterId)!.team),
    )
    expect(teams).toEqual(new Set([0, 1]))
    expect(snapshot(Combat.replay(opts, original.log))).toEqual(
      snapshot(original),
    )
  })

  test("commands must come from the fighter whose turn it is", () => {
    const combat = new Combat({
      seed: 1,
      board: new Board(9, 9),
      teams: [
        { controller: "human", fighters: ["eva"] },
        { controller: "human", fighters: ["gorr"] },
      ],
      positions: [[{ x: 0, y: 0 }], [{ x: 8, y: 8 }]],
    })
    combat.run()
    const other = combat.fighters.find((f) => f !== combat.activeFighter)!
    expect(combat.execute({ type: "pass", fighterId: other.id })).toEqual({
      ok: false,
      reason: "Ce n'est pas le tour de ce personnage",
    })
    expect(combat.log).toHaveLength(0)
    expect(
      combat.execute({ type: "pass", fighterId: combat.activeFighter!.id }).ok,
    ).toBe(true)
    expect(combat.log).toEqual([
      { type: "pass", fighterId: expect.any(String) },
    ])
  })

  test("refused commands are not logged, and a corrupted log fails to replay", () => {
    const opts: CombatOptions = {
      seed: 2,
      board: new Board(9, 9),
      teams: [
        { controller: "human", fighters: ["eva"] },
        { controller: "ai", fighters: ["gorr"] },
      ],
      positions: [[{ x: 0, y: 0 }], [{ x: 8, y: 8 }]],
    }
    const combat = new Combat(opts)
    combat.run()
    const me = combat.activeFighter!
    expect(
      combat.execute({
        type: "useAction",
        fighterId: me.id,
        actionId: "arrow",
        target: { x: 8, y: 8 },
      }).ok,
    ).toBe(false)
    expect(
      combat.execute({
        type: "useDivine",
        fighterId: me.id,
        divineId: "blessing",
        target: null,
      }).ok,
    ).toBe(false)
    expect(combat.log).toHaveLength(0)
    expect(() =>
      Combat.replay(opts, [
        {
          type: "useAction",
          fighterId: me.id,
          actionId: "arrow",
          target: { x: 8, y: 8 },
        },
      ]),
    ).toThrow("Replay failed at command 0")
  })
})

describe("difficulty", () => {
  test("stats are scaled, speed only by the square root, luck unchanged", () => {
    const base = CHARACTERS.gorr.stats
    const scaled = scaleStats(base, 1.44)
    expect(scaled.health).toBeCloseTo(base.health * 1.44)
    expect(scaled.physicalDefense).toBeCloseTo(base.physicalDefense * 1.44)
    expect(scaled.speed).toBeCloseTo(base.speed * 1.2)
    expect(scaled.luck).toBe(base.luck)
    expect(scaleStats(base, 1)).toEqual(base)
    expect(scaleStats(base, 1)).not.toBe(base)
  })

  test("a team multiplier makes its fighters tougher, with whole hit points", () => {
    const combat = new Combat({
      seed: 1,
      teams: [
        { controller: "ai", fighters: ["eva"] },
        { controller: "ai", fighters: ["eva"], statMultiplier: 1.25 },
      ],
    })
    const [normal, strong] = combat.fighters
    expect(combat.maxHp(strong)).toBe(Math.round(combat.maxHp(normal) * 1.25))
    expect(Number.isInteger(strong.hp)).toBe(true)
    expect(strong.hp).toBe(combat.maxHp(strong))
  })

  test("starting hit points can be carried over, clamped to [1, max]", () => {
    const combat = new Combat({
      seed: 1,
      teams: [
        {
          controller: "ai",
          fighters: ["eva", "brutus", "lyra"],
          hp: [12.4, undefined, 99_999],
        },
        { controller: "ai", fighters: ["gorr"], hp: [-5] },
      ],
    })
    const [eva, brutus, lyra, gorr] = combat.fighters
    expect(eva.hp).toBe(12)
    expect(brutus.hp).toBe(combat.maxHp(brutus))
    expect(lyra.hp).toBe(combat.maxHp(lyra))
    expect(gorr.hp).toBe(1)
  })
})
