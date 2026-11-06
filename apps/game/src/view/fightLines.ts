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
  private _acts = new Set<string>()
  private _crystal = false
  private _broken = 0
  private _gap = false
  private _paired = false
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
      case "actionUsed": {
        const out: LineSpec[] = []
        if (!this._acts.has(event.baseActionId)) {
          this._acts.add(event.baseActionId)
          out.push(...this._take(`act:${event.baseActionId}`))
        }
        if (event.partnerId && !this._paired) {
          this._paired = true
          out.push(...this._take("intrication"))
        }
        return out
      }
      case "unlocked":
        return this._take(`unlock:${event.divineId}`)
      case "crystalExtracted":
        this._broken++
        return [
          ...this._take(`crystals:${this._broken}`),
          ...(this._crystal ? [] : this._take("crystal")),
        ].map((l) => {
          this._crystal = true
          return l
        })
      case "crystalDead":
        if (this._gap) return []
        this._gap = true
        return this._take("gap")
      case "argued":
        return this._take(`certitude:${event.certitude}`)
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
