/**
 * The lines of an Adventure fight (`FightSpec.lines`): each is spoken once,
 * on the trigger it names. The triggers are read from the fight's events.
 */
import type { FightLine } from "@realms/adventure"
import type { FightEvent } from "@realms/engine"

export type LineSpec = Pick<FightLine, "when" | "who" | "text">

export class FightVoice {
  private _said = new Set<LineSpec>()
  private _casts = new Set<string>()
  private _healed = false
  private _lost = false

  constructor(private readonly _lines: readonly LineSpec[]) {}

  private _take(when: string): LineSpec[] {
    const out = this._lines.filter((l) => l.when === when && !this._said.has(l))
    // one line per trigger and speaker: the same line is not read twice
    for (const l of out) this._said.add(l)
    return out
  }

  /** The lines the trigger releases. */
  on(when: string): LineSpec[] {
    return this._take(when)
  }

  /** The lines a fight event releases. */
  onEvent(event: FightEvent): LineSpec[] {
    switch (event.type) {
      case "clockTick":
        return this._take(`tick:${event.tick}`)
      case "zoneChanged":
        if (event.state === "silent") return this._take(`zone:${event.zoneId}`)
        if (event.state === "lost" && !this._lost) {
          this._lost = true
          return this._take("lost")
        }
        return []
      case "fixed":
        return this._take("fixed")
      case "fleeing":
        return this._take("fleeing")
      case "fled":
        return this._take("fled")
      case "healed":
        if (this._healed) return []
        this._healed = true
        return this._take("heal")
      case "divineUsed":
        if (this._casts.has(event.divineId)) return []
        this._casts.add(event.divineId)
        return this._take(`cast:${event.divineId}`)
      case "ended":
        return this._take("end")
      default:
        return []
    }
  }
}
