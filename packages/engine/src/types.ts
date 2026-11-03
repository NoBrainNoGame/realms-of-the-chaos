import type { Locomotion, Terrain } from "./board"
import type { Point } from "./geometry"
import type { ZoneSpec } from "./zones"

// ─── Stats ──────────────────────────────────────────────────────────────────

export type StatName =
  | "health"
  | "speed"
  | "physicalAttack"
  | "physicalDefense"
  | "magicalAttack"
  | "magicalDefense"
  | "luck"

export type Stats = Record<StatName, number>

// ─── Status effects ("états spéciaux") ──────────────────────────────────────

export type StatusId = "poisoned" | "slowed" | "hasted" | "shielded" | "enraged"

export interface StatusDefinition {
  id: StatusId
  name: string
  description: string
  /** Multiplies every delay added to the bearer's timeline (moves and actions). */
  delayMultiplier?: number
  damageDealtMultiplier?: number
  damageTakenMultiplier?: number
  /** Deals `value` damage at the start of each of the bearer's turns. */
  damageOverTime?: boolean
  /** Absorbs up to `value` damage before hit points are lost. */
  absorbsDamage?: boolean
}

export interface StatusInstance {
  id: StatusId
  /** Remaining turns of the bearer. */
  turns: number
  /** Poison damage per turn or remaining shield points. */
  value: number
}

// ─── Actions ────────────────────────────────────────────────────────────────

/** What the aimed cell must contain. */
export type TargetFilter = "enemy" | "ally" | "self" | "any" | "emptyCell"

/** Who is affected inside the target zone. */
export type AffectFilter = "enemies" | "allies" | "all"

export type Effect =
  | { type: "damage"; kind: "physical" | "magical"; power: number }
  | { type: "heal"; power: number }
  | { type: "push"; distance: number }
  | { type: "status"; status: StatusId; turns: number; value?: number }
  /** Moves the launcher onto the aimed cell. */
  | { type: "dash" }
  /** Adds time before the next turn of affected fighters. */
  | { type: "delay"; amount: number }
  /** Heals the launcher itself. */
  | { type: "selfHeal"; power: number }

export interface ActionDefinition {
  id: string
  name: string
  description: string
  /** Where the action can be aimed from the launcher (launch zone). */
  launch: ZoneSpec
  /** Whether walls between launcher and aimed cell block the action. */
  lineOfSight: boolean
  /** Cells affected around the aimed cell (target zone). Defaults to the cell. */
  area?: ZoneSpec
  target: TargetFilter
  /** The aimed cell must be of this terrain (e.g. diving into water). */
  targetTerrain?: Terrain
  affects?: AffectFilter
  /** Multiplier of the launcher's base delay added to the timeline. */
  timeCost: number
  /** Number of own turns before the action can be used again. */
  cooldown?: number
  effects: Effect[]
  /** Set on combined actions: the action it improves and the partner's character. */
  combo?: { baseId: string; partnerPresetId: string }
}

// ─── Characters ─────────────────────────────────────────────────────────────

/**
 * Speciality of a character. When an ally stands on the same cell, it
 * unlocks a combined version of the character's signature action, improved
 * according to the partner's affinity.
 */
export type Affinity = "magic" | "strength" | "precision" | "faith" | "shadow"

export interface CharacterPreset {
  id: string
  name: string
  title: string
  affinity: Affinity
  /** How the character moves in water (default: walker). */
  locomotion?: Locomotion
  stats: Stats
  /** Action ids, in action bar order (personal actions first). */
  actions: string[]
  /** Reference preset of a generated character (same kit and looks). */
  kit?: string
}

// ─── Divine (player) actions ────────────────────────────────────────────────

export interface DivineActionDefinition {
  id: string
  name: string
  description: string
  cost: number
  target: "fighter" | "cell" | "none"
}

// ─── Runtime state ──────────────────────────────────────────────────────────

export type Controller = "human" | "ai"

export interface Fighter {
  readonly id: string
  readonly presetId: string
  readonly name: string
  readonly team: number
  readonly stats: Stats
  readonly actions: readonly ActionDefinition[]
  readonly controller: Controller
  readonly locomotion: Locomotion
  hp: number
  /** Max hit points lost for good (erosion: part of every wound). */
  erosion: number
  position: Point
  alive: boolean
  /** Timeline time of the next action turn. */
  nextActionAt: number
  /** Timeline time of the next possible step. */
  nextMoveAt: number
  destination: Point | null
  path: Point[]
  statuses: StatusInstance[]
  cooldowns: Record<string, number>
}

export interface Team {
  readonly index: number
  readonly name: string
  readonly controller: Controller
  /** Divine energy used by player actions. */
  energy: number
  /** Progress towards the next energy point, from 0 to 1. */
  energyProgress: number
}

// ─── Events emitted by the engine (consumed by the view) ────────────────────

export type FightEvent =
  | { type: "turnStarted"; fighterId: string; time: number }
  | { type: "destinationSet"; fighterId: string; path: Point[] }
  | { type: "moved"; fighterId: string; from: Point; to: Point }
  | { type: "pathBlocked"; fighterId: string }
  | {
      type: "actionUsed"
      fighterId: string
      actionId: string
      /** Regular action this one is based on (itself, or the combo's base). */
      baseActionId: string
      /** Ally whose presence unlocked this combined action. */
      partnerId: string | null
      target: Point
      cells: Point[]
    }
  | {
      type: "damaged"
      fighterId: string
      amount: number
      absorbed: number
      critical: boolean
      sourceId: string | null
    }
  | { type: "healed"; fighterId: string; amount: number }
  | { type: "pushed"; fighterId: string; from: Point; to: Point }
  | { type: "dashed"; fighterId: string; from: Point; to: Point }
  | {
      type: "statusApplied"
      fighterId: string
      status: StatusId
      turns: number
    }
  | { type: "statusExpired"; fighterId: string; status: StatusId }
  | { type: "delayed"; fighterId: string; amount: number }
  | { type: "died"; fighterId: string }
  | { type: "turnPassed"; fighterId: string }
  | { type: "energyChanged"; team: number; energy: number }
  | {
      type: "divineUsed"
      team: number
      divineId: string
      target: Point | null
    }
  | { type: "terrainChanged"; cell: Point }
  | { type: "ended"; winnerTeam: number | null }

export type CommandResult =
  { ok: true; events: FightEvent[] } | { ok: false; reason: string }
