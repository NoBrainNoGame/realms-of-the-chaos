import type { AdventureRules } from "@realms/engine/adventure"
import type { FightSpec } from "./types"

/**
 * The rules the engine plays: the spec's rules plus the `arrives` / `switchTo`
 * of its fighters, turned into the engine's `arrivals` / `switches`.
 */
export function fightRules(spec: FightSpec): AdventureRules {
  const arrivals: NonNullable<AdventureRules["arrivals"]> = []
  const switches: NonNullable<AdventureRules["switches"]> = []
  spec.teams.forEach((team, t) => {
    team.fighters.forEach((f, index) => {
      if (f.arrives) arrivals.push({ team: t, index, ...f.arrives })
      if (f.switchTo) {
        const { team: toTeam, tick, time } = f.switchTo
        switches.push({ team: t, index, toTeam, tick, time })
      }
    })
  })
  if (!arrivals.length && !switches.length) return spec.rules
  return {
    ...spec.rules,
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
