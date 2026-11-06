import type {
  AdventureRules,
  AutonomyEntry,
  AutonomyTier,
} from "@realms/engine/adventure"
import { add } from "./dsl"
import type { Effect, FightReport, FightSpec, FlagValue } from "./types"

/** How much the general trust shifts every ally's own (`confiance`, -10..10). */
export function generalShift(general: number): number {
  return general >= 6 ? 1 : general >= -2 ? 0 : general >= -6 ? -1 : -2
}

/** The autonomy tier of an ally from its effective trust (-5..5). */
export function autonomyTier(lineage: number, general: number): AutonomyTier {
  const effective = Math.max(-5, Math.min(5, lineage + generalShift(general)))
  return effective >= 3
    ? "bound"
    : effective >= 1
      ? "confident"
      : effective >= -1
        ? "reserved"
        : effective >= -3
          ? "wary"
          : "broken"
}

/**
 * The rules the engine plays: the spec's rules plus the `arrives` / `switchTo`
 * of its fighters, turned into the engine's `arrivals` / `switches`.
 */
export function fightRules(
  spec: FightSpec,
  flag?: (key: string) => FlagValue,
): AdventureRules {
  const arrivals: NonNullable<AdventureRules["arrivals"]> = []
  const switches: NonNullable<AdventureRules["switches"]> = []
  const allies: AutonomyEntry[] = []
  const num = (key: string) => {
    try {
      const v = flag?.(key)
      return typeof v === "number" ? v : 0
    } catch {
      return 0
    }
  }
  spec.teams.forEach((team, t) => {
    team.fighters.forEach((f, index) => {
      if (f.arrives) arrivals.push({ team: t, index, ...f.arrives })
      if (f.switchTo) {
        const { team: toTeam, tick, time } = f.switchTo
        switches.push({ team: t, index, toTeam, tick, time })
      }
    })
  })
  if (flag)
    spec.teams.forEach((team, t) => {
      team.fighters.forEach((f, index) => {
        const a = f.autonomy
        if (!a) return
        const free = a.needs !== undefined && flag(a.needs) !== true
        allies.push({
          team: t,
          index,
          tier:
            a.tier ??
            (free || !a.lineage
              ? "bound"
              : autonomyTier(num(`confiance.${a.lineage}`), num("confiance"))),
          refuses: a.refuses,
          spares: a.spares,
        })
      })
    })
  const autonomy = allies.length
    ? { ...spec.rules.autonomy, allies }
    : spec.rules.autonomy
  if (!arrivals.length && !switches.length && !allies.length) return spec.rules
  return {
    ...spec.rules,
    ...(autonomy ? { autonomy } : {}),
    arrivals: [...(spec.rules.arrivals ?? []), ...arrivals],
    switches: [...(spec.rules.switches ?? []), ...switches],
  }
}

/** What is wrong with the arrivals and switches of a fight (empty: nothing). */
export function entryProblems(spec: FightSpec): string[] {
  const out: string[] = []
  const clock = spec.rules.clock
  const check = (what: string, when: { tick?: number; time?: number }) => {
    if ((when.tick === undefined) === (when.time === undefined))
      out.push(`${what}: give exactly one of tick / time`)
    if (when.tick !== undefined && !clock)
      out.push(`${what}: a tick needs a clock`)
    if (
      when.tick !== undefined &&
      clock?.limit !== undefined &&
      when.tick >= clock.limit
    )
      out.push(`${what}: tick ${when.tick} is never reached`)
  }
  spec.teams.forEach((team, t) => {
    team.fighters.forEach((f, i) => {
      const what = `${spec.id} team ${t} fighter ${i}`
      if (f.arrives) check(`${what} arrives`, f.arrives)
      if (f.switchTo) {
        check(`${what} switchTo`, f.switchTo)
        if (!spec.teams[f.switchTo.team] || f.switchTo.team === t)
          out.push(`${what} switchTo: bad team`)
      }
    })
  })
  return out
}

/**
 * What the Ghom's gestures cost or earn in trust after a fight: respecting a
 * refusal +1, letting an ally act the whole fight +1 (both on its lineage),
 * forcing it (Insister) -2 on its lineage, -1 general, +1 `autonomie.insistances`.
 * Allies without a will yet (`needs` unset) are left alone.
 */
export function autonomyEffects(
  spec: FightSpec,
  report: FightReport,
  flag: (key: string) => FlagValue,
): Effect[] {
  const a = report.autonomy
  if (!a) return []
  const out: Effect[] = []
  const byId = new Map(report.fighters.map((f) => [f.id, f.preset]))
  const lineageOf = (fighterId: string) => {
    const preset = byId.get(fighterId)
    for (const team of spec.teams)
      for (const f of team.fighters) {
        const id = typeof f.preset === "string" ? f.preset : f.preset.id
        if (id === preset && f.autonomy) {
          const { needs, lineage } = f.autonomy
          if (needs !== undefined && flag(needs) !== true) return null
          return lineage
        }
      }
    return null
  }
  for (const id of a.respected) {
    const l = lineageOf(id)
    if (l) out.push(add(`confiance.${l}`, 1))
  }
  for (const id of a.letAct) {
    const l = lineageOf(id)
    // "the whole fight": never given an order, and not already counted above
    if (l && !a.ordered.includes(id) && !a.respected.includes(id))
      out.push(add(`confiance.${l}`, 1))
  }
  for (const id of a.insisted) {
    const l = lineageOf(id)
    if (!l) continue
    out.push(add(`confiance.${l}`, -2), add("confiance", -1))
    out.push(add("autonomie.insistances"))
  }
  return out
}
