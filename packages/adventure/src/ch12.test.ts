import { describe, expect, test } from "bun:test"
import { ch12 } from "./chapters/ch12"
import { resolveFight } from "./entries"
import type { FightSpec } from "./types"

const fightsOf = (c: { scenes: Record<string, { beats: unknown[] }> }) => {
  const out: FightSpec[] = []
  const walk = (x: unknown): void => {
    if (Array.isArray(x)) return x.forEach(walk)
    if (!x || typeof x !== "object") return
    const o = x as { t?: string; fight?: FightSpec }
    if (o.t === "fight" && o.fight) out.push(o.fight)
    Object.values(o).forEach(walk)
  }
  for (const s of Object.values(c.scenes)) walk(s.beats)
  return out
}

describe("chapter 12: the waves follow the flags", () => {
  const spec = fightsOf(ch12)[0]
  const enemies = (flags: Record<string, string | boolean>) =>
    resolveFight(spec, (k) => flags[k] ?? false).teams[2].fighters.length

  test("the Hole sends a wave when the Seuil did not hold", () => {
    const held = enemies({ lacune_geante_habitee: true })
    expect(enemies({})).toBe(held + 3)
  })

  test("Peut-Être mended: no effilocheur; widened: two more instables", () => {
    const base = enemies({ lacune_geante_habitee: true })
    expect(
      enemies({ lacune_geante_habitee: true, peut_etre: "recousue" }),
    ).toBe(base - 2)
    expect(enemies({ lacune_geante_habitee: true, peut_etre: "elargie" })).toBe(
      base + 2,
    )
  })

  test("the ring starts wider when the star of ch. 7 failed", () => {
    const failed = resolveFight(spec, () => false)
    const kept = resolveFight(spec, (k) => k === "ch7_etoile")
    expect(failed.rules.superposition?.cells.length).toBeGreaterThan(
      kept.rules.superposition?.cells.length ?? 0,
    )
  })

  test("Peut-Être inhabited lets allies reform once", () => {
    const habited = resolveFight(spec, (k) =>
      k === "peut_etre" ? "habitee" : false,
    )
    expect(habited.rules.recompose?.length).toBe(2)
    expect(resolveFight(spec, () => false).rules.recompose).toBeUndefined()
  })
})
