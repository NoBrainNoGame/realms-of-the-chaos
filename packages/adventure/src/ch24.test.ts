import { describe, expect, test } from "bun:test"
import { Board, Combat } from "@realms/engine"
import { ch24 } from "./chapters/ch24"
import { fightRules, resolveFight } from "./entries"
import type { FightSpec } from "./types"

const fightsOf = (): FightSpec[] => {
  const out: FightSpec[] = []
  const walk = (x: unknown): void => {
    if (Array.isArray(x)) {
      x.forEach(walk)
      return
    }
    if (!x || typeof x !== "object") return
    const o = x as { t?: string; fight?: FightSpec }
    if (o.t === "fight" && o.fight) out.push(o.fight)
    Object.values(o).forEach(walk)
  }
  for (const s of Object.values(ch24.scenes)) walk(s.beats)
  return out
}

function build(
  spec: FightSpec,
  flags: Record<string, string | number | boolean>,
) {
  const flag = (k: string) => flags[k] ?? false
  const r = resolveFight(spec, flag)
  const combat = new Combat({
    seed: 3,
    board: Board.fromAscii(r.board),
    teams: r.teams.map((t) => ({
      name: t.name,
      controller: "ai" as const,
      fighters: t.fighters.map((f) =>
        f.preset === "@hero" ? "brutus" : f.preset,
      ),
    })),
    positions: r.teams.map((t) => t.fighters.map((f) => f.at)),
    adventure: fightRules(r, flag),
  })
  return { r, combat }
}

describe("chapter 24: the Bord", () => {
  const spec = fightsOf().find((f) => f.id === "ch24-bord-00000") as FightSpec

  test("camps follow the flags: who stayed, who left, five Déliés", () => {
    const { r } = build(spec, {
      "camp.brutus": "heros",
      "camp.lyra": "delie",
      "camp.guetteurs": 3,
      cessez: "3",
    })
    expect(r.teams[0].fighters.length).toBe(2)
    expect(r.teams[1].fighters.length).toBe(1 + 1 + 3)
    expect(r.rules.ceasefire?.after).toBe(3)
  })

  test("the fight runs to the tear with the three camps and Sel", () => {
    const { combat } = build(spec, {
      "camp.brutus": "heros",
      "camp.lyra": "heros",
      "camp.guetteurs": 4,
      cessez: "1",
    })
    combat.run()
    expect(combat.state).toBe("ended")
    expect(combat.adventure?.report.ticks).toBeGreaterThan(0)
  })
})
