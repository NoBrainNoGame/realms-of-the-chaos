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
  /**
   * Forbidden: the false vacuum of the Fragment tunnels to a lower one.
   * Ends the fight at once, with no winner (see `Combat.collapsed`).
   */
  | { type: "vacuumDecay" }

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
  /**
   * Movement action (dash): the launcher walks right away, by the
   * pathfinder, to a cell whose walk costs at most `reach` (a flat cell
   * costs 1; water and climbing cost more). It costs the time of the walk
   * (the sum of its step delays) instead of `timeCost`, and ends the turn.
   */
  movement?: { reach: number }
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
  /**
   * Definitions of the actions that are not in the shared catalogue (the
   * spells built by a player), by id. Use `resolveAction` to read an id.
   */
  actionDefs?: Record<string, ActionDefinition>
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
  /** Mutable only for the Adventure's `switches` rule. */
  team: number
  readonly stats: Stats
  readonly actions: readonly ActionDefinition[]
  controller: Controller
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
  /**
   * Stops of the planned walk still ahead, in order (the last one is the
   * destination); empty when no walk is planned.
   */
  waypoints: Point[]
  /** Cells of the planned walk still ahead, through every waypoint. */
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

/** Why an ally refuses an order (Adventure autonomy). */
export type RefusalReason = "finish" | "influenced" | "abandon" | "spare"

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
  /** A vacuum decay bubble was nucleated: nothing survives it. */
  | { type: "vacuumDecay"; fighterId: string }
  /** Adventure rules: the clock ticked, a zone changed, a fighter fled. */
  | { type: "clockTick"; tick: number }
  | { type: "zoneChanged"; zoneId: string; state: "active" | "silent" | "lost" }
  /** Adventure rules: a fighter enters the island (a wave, a reinforcement). */
  | { type: "arrived"; fighterId: string; position: Point }
  /** Adventure rules: a fighter changes sides mid-fight. */
  | { type: "switched"; fighterId: string; from: number; to: number }
  /**
   * Adventure autonomy: an ally refuses an order (the order is cancelled, no
   * time is spent), plays its turn alone, is forced (Insister) or the Ghom
   * withdraws from the fight.
   */
  | { type: "refused"; fighterId: string; reason: RefusalReason }
  | { type: "autonomous"; fighterId: string; why: "tier" | "letAct" }
  | { type: "insisted"; fighterId: string; cost: number }
  | { type: "withdrew" }
  /** Adventure lacunes: the hole spreads / a Lacune cell is mended. */
  | { type: "lacuneGrew"; cells: Point[] }
  /** Debate: a Relevé; a pair of probes breaks. */
  | { type: "surveyed"; fighterId: string; targetId: string; pair: number }
  /** Debate: an argument was played; the speaker's Certitude is now `certitude`. */
  | {
      type: "argued"
      fighterId: string
      argumentId: string
      certitude: number
    }
  | { type: "lacuneMended"; cell: Point; fighterId: string }
  /** The Lacune took the whole stage: the fight is lost. */
  | { type: "swallowed" }
  /** Adventure superposition: an uncertain cell was measured. */
  | {
      type: "measured"
      cell: Point
      state: "solid" | "void"
      fighterId: string | null
    }
  /** Adventure doubles: one of the two positions of a fighter was struck. */
  | {
      type: "doubleResolved"
      struckId: string
      otherId: string
      /** The struck position was the real one (the other is gone). */
      found: boolean
    }
  /** Something left the island without fleeing (a double's empty position). */
  | { type: "dissolved"; fighterId: string }
  /** Adventure fraying: cells lost height / a cold halo came up. */
  | { type: "frayed"; cells: Point[] }
  | { type: "haloUp"; fighterId: string }
  /** Adventure crystals: broken for Élan or healing; its twin goes dead. */
  | {
      type: "crystalExtracted"
      crystalId: string
      fighterId: string
      at: Point
      gain: "elan" | "heal"
      twinId: string | null
    }
  | { type: "crystalDead"; crystalId: string; at: Point | null }
  | {
      type: "crystalDetached"
      crystalId: string
      fighterId: string
      at: Point
    }
  | { type: "crystalCarried"; crystalId: string; fighterId: string }
  | { type: "crystalDropped"; crystalId: string; fighterId: string; at: Point }
  | {
      type: "crystalDeposited"
      crystalId: string
      fighterId: string
      at: Point
      /** The cell is one of the deposits of the map (else it is put down). */
      deposit: boolean
    }
  | { type: "crystalsLinked"; fighterIds: [string, string] }
  /** A carried crystal became a bridge over water or a hole. */
  | { type: "bridged"; crystalId: string; fighterId: string; cells: Point[] }
  /** Adventure gel: a fighter (or a water cell) froze. */
  | {
      type: "frozen"
      fighterId?: string
      cell?: Point
      by: string | null
      until?: number
    }
  | { type: "thawed"; fighterId?: string; cell?: Point; by: string | null }
  /** A frozen fighter lets its turn go by. */
  | { type: "frozenTurn"; fighterId: string }
  /** Adventure script: a scripted earthquake hit cells. */
  | { type: "quaked"; cells: Point[] }
  /** Adventure recomposition: a fallen fighter reformed. */
  | { type: "recomposed"; fighterId: string; position: Point }
  /** Adventure tiédeur: cells came up hot / went tepid. */
  | { type: "warmed"; cells: Point[] }
  | { type: "cooled"; cells: Point[] }
  /** Adventure fixOnDeath: a fallen fighter set into a rock. */
  | { type: "fixed"; fighterId: string; cell: Point }
  | { type: "fleeing"; fighterId: string }
  | { type: "fled"; fighterId: string }
  | { type: "timeUp" }
  | { type: "ended"; winnerTeam: number | null }

export type CommandResult =
  | { ok: true; events: FightEvent[] }
  | { ok: false; reason: string }
