/**
 * The lines of an Adventure fight (`FightSpec.lines`): each is spoken once,
 * on the trigger it names. The triggers are read from the fight's events.
 */
import type { FightLine } from "@realms/adventure"
import type { FightEvent } from "@realms/engine"

export type LineSpec = Pick<FightLine, "when" | "who" | "text">

/** What the voice may ask the fight, to name its speakers by preset. */
export interface VoiceContext {
  /** Preset of a fighter and its share of hit points left. */
  fighter(id: string): { preset: string; ratio: number } | undefined
  /** Whether the cell is water. */
  isWater(cell: { x: number; y: number }): boolean
}

export class FightVoice {
  private _half = new Set<string>()
  private _said = new Set<LineSpec>()
  private _casts = new Set<string>()
  private _healed = false
  private _acts = new Set<string>()
  private _crystal = false
  private _broken = 0
  private _gap = false
  private _paired = false
  private _lost = false

  constructor(
    private readonly _lines: readonly LineSpec[],
    private readonly _ctx?: VoiceContext,
  ) {}

  private _of(id: string) {
    return this._ctx?.fighter(id)?.preset
  }

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
        if (event.partnerId) {
          const a = this._of(event.fighterId)
          const b = this._of(event.partnerId)
          if (a && b) {
            out.push(...this._take(`pair:${a}+${b}`))
            out.push(...this._take(`pair:${b}+${a}`))
          }
        }
        if (event.partnerId && !this._paired) {
          this._paired = true
          out.push(...this._take("intrication"))
        }
        return out
      }
      case "damaged": {
        const who = this._ctx?.fighter(event.fighterId)
        if (!who) return []
        const out = this._take(`hurt:${who.preset}`)
        if (who.ratio < 0.5 && !this._half.has(who.preset)) {
          this._half.add(who.preset)
          out.push(...this._take(`half:${who.preset}`))
        }
        return out
      }
      case "moved": {
        const preset = this._of(event.fighterId)
        return preset && this._ctx?.isWater(event.to)
          ? this._take(`wade:${preset}`)
          : []
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
      case "carried":
        return this._take("carried")
      case "frozen":
        return event.cell ? this._take("iced") : []
      case "fleeing": {
        const preset = this._of(event.fighterId)
        return [
          ...this._take("fleeing"),
          ...(preset ? this._take(`fleeing:${preset}`) : []),
        ]
      }
      case "fled": {
        const preset = this._of(event.fighterId)
        return [
          ...this._take("fled"),
          ...(preset ? this._take(`fled:${preset}`) : []),
        ]
      }
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
