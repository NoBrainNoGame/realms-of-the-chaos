import type { Combat } from "./combat"

/**
 * The Élan of a Fragment kept by a Ghom of the past (Reconstitutions): it
 * fills at a perfect cadence, and it may stop for good at a tick.
 */
export interface EnergyRules {
  /**
   * `team` gains `amount` Élan (default 1) every `every` clock ticks, and
   * nothing at all in between: the usual flow of time is off for it.
   */
  cadence?: { team: number; every: number; amount?: number }
  /**
   * At clock tick `tick` the Élan of `team` falls to zero and never comes
   * back: its Influences are greyed ("le Ghom ne répond plus").
   */
  stopAt?: { team: number; tick: number }
}

export const HALT_MESSAGE = "Le Ghom de ce Fragment ne répond plus"

export class EnergyKit {
  private _halted = false

  constructor(
    private readonly _combat: Combat,
    private readonly _rules: EnergyRules,
  ) {}

  /** Does the usual flow of time feed the team's Élan? */
  flows(team: number): boolean {
    if (this.halted(team)) return false
    return this._rules.cadence?.team !== team
  }

  /** Is the team's Élan dead (no gain of any kind)? */
  halted(team: number): boolean {
    return this._halted && this._rules.stopAt?.team === team
  }

  /** A clock tick went by. */
  tick(n: number) {
    const { cadence, stopAt } = this._rules
    if (stopAt && !this._halted && n >= stopAt.tick) {
      this._halted = true
      const team = this._combat.teams[stopAt.team]
      team.energy = 0
      team.energyProgress = 0
      this._combat.emitEvent({
        type: "energyChanged",
        team: stopAt.team,
        energy: 0,
      })
    }
    if (cadence && n % cadence.every === 0 && !this.halted(cadence.team))
      this._combat.grantEnergy(cadence.team, cadence.amount ?? 1)
  }
}
