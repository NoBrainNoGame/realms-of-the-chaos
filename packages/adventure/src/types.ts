import type { CharacterPreset, RefusalReason } from "@realms/engine"
import type {
  AdventureRules,
  AutonomyReport,
  AutonomyTier,
} from "@realms/engine/adventure"

// ─── Flags, conditions, effects ─────────────────────────────────────────────

export type FlagValue = number | string | boolean

/** A condition on the flags of the run. Without `op` it means "is true". */
export type Cond =
  | {
      key: string
      op?: "==" | "!=" | ">=" | "<=" | ">" | "<"
      value?: FlagValue
    }
  | { all: Cond[] }
  | { any: Cond[] }
  | { not: Cond }

export type Effect =
  /** Sets a flag (clamped to its range). */
  | { set: string; value: FlagValue }
  /** Adds to a numeric flag. `perUnit` multiplies by the objective's count. */
  | { add: string; by: number; perUnit?: boolean }
  /** An object, an outfit or a keepsake joins the inventory. */
  | { give: string }
  /** A character joins the team for good. */
  | { join: string }
  /** Unlocks a mechanic or interface element ("influence:repair", "ui:confiance"). */
  | { unlock: string }

// ─── Scenes ─────────────────────────────────────────────────────────────────

/** A line of the story, or a step of the scene's flow. */
export type Beat =
  /** A character speaks. `who` is a character id, or "heros". */
  | { t: "say"; who: string; text: string }
  /** The hero's inner voice (Narration). */
  | { t: "narr"; text: string }
  /** A stage direction or description, in italics. */
  | { t: "stage"; text: string }
  /** A short interface tip (a mechanic or indicator shown for the first time). */
  | { t: "hint"; title: string; text: string }
  | { t: "fx"; effects: Effect[] }
  | { t: "if"; cond: Cond; then: Beat[]; else?: Beat[] }
  /** The hero chooses by a gesture (never by typing). */
  | { t: "choice"; id: string; prompt?: string; options: Option[] }
  /** A hub of topics (an evening by the fire): each is heard once. */
  | { t: "hub"; id: string; topics: Topic[] }
  /** Inside an option: plays the body of another option of the same choice. */
  | { t: "redirect"; option: string }
  /** A fight; its outcome comes back from the game. */
  | { t: "fight"; fight: FightSpec }
  /** Leaves the scene for another node ("$end" ends the chapter). */
  | { t: "go"; node: string }

export interface Option {
  id: string
  text: string
  /** The option is offered only when this holds. */
  if?: Cond
  /** Beats played when the option is chosen (effects, the answer). */
  beats: Beat[]
}

export interface Topic {
  id: string
  title: string
  if?: Cond
  /** Offered only once every other topic was heard ("toujours en dernier"). */
  last?: boolean
  beats: Beat[]
}

export const END = "$end"

export interface Scene {
  id: string
  title: string
  /** Kind of node, as the chapter map names it. */
  kind: "rencontre" | "veillee" | "combat" | "lacune" | "fin" | "scene"
  /** A place or mood line shown on the card. */
  setting?: string
  beats: Beat[]
  /** Next node when the beats end without a `go`. */
  next?: string
}

// ─── Fights ─────────────────────────────────────────────────────────────────

export interface FightTeamSpec {
  name: string
  /** "human": played by the player; "ai"; "hold": AI team that never acts. */
  side: "allies" | "enemies" | "neutral"
  fighters: FighterSpec[]
}

export interface FighterSpec {
  /** Engine preset id, or "@hero" for the player's character. */
  preset: string | CharacterPreset
  at: { x: number; y: number }
  hp?: number
  /**
   * Not there at the start: the fighter enters at a clock tick or a timeline
   * time, on `at` (or the closest free cell). Until then its team is not beaten.
   */
  arrives?: { tick?: number; time?: number }
  /** Changes to the team of that index (and its controller) mid-fight. */
  switchTo?: { team: number; tick?: number; time?: number }
  /**
   * An ally with a will of its own (era IV "Autonomie"): its tier is read at
   * the start of the fight from `confiance.<lineage>` and `confiance`.
   */
  autonomy?: {
    /** Whose trust sets the tier; none: the tier is `tier`, fixed. */
    lineage?: string
    /** A fixed tier ("broken": takes no orders, plays alone every turn). */
    tier?: AutonomyTier
    /** Contested orders it refuses (default: finish a weak foe, obey a pushed order). */
    refuses?: RefusalReason[]
    /** Presets it will not strike (its own lineage, the Déliés). */
    spares?: string[]
    /** Without this flag set it has no will yet (Gorr before his question). */
    needs?: string
  }
}

export interface ObjectiveSpec {
  id: string
  /** ★ announced, ◆ hidden until the debrief. */
  mark: "★" | "◆"
  label: string
  /** Reads the fight's report: met or not, with a count for `perUnit` effects. */
  check: (report: FightReport) => boolean | { ok: boolean; n: number }
  /** Line of the debrief when it is met / missed. */
  success?: string
  failure?: string
  onSuccess?: Effect[]
  onFailure?: Effect[]
}

/** A line spoken during the fight, on a trigger the game knows. */
export interface FightLine {
  when:
    | "start"
    | "fleeing"
    | "fled"
    | "tick:1"
    | "tick:3"
    | "tick:5"
    | "end"
    | `zone:${string}`
  who: string
  text: string
}

export interface FightSpec {
  id: string
  title: string
  /** `Board.fromAscii` rows. */
  board: string[]
  teams: FightTeamSpec[]
  rules: AdventureRules
  /** Influences the Ghom has from the start of this fight. */
  influences: string[]
  /** Élan of the Ghom at the start of the fight. */
  startEnergy: number
  objectives: ObjectiveSpec[]
  lines: FightLine[]
  /** What the player is told the fight is about. */
  goal: string
  /** Consequences of losing: the story goes on, there is no retry. */
  defeat?: Effect[]
  /** Fixed seed (the tutorial); the run's seed is used otherwise. */
  seed?: number
}

// ─── Exploration ────────────────────────────────────────────────────────────

export interface Spot {
  x: number
  y: number
}

/** A line read when something is examined. */
export interface ExamineLine {
  /** A character id; without it the line is the hero's narration. */
  who?: string
  style?: "say" | "narr" | "stage"
  text: string
}

/** An optional enemy that wanders on the island and can be avoided. */
export interface Wanderer {
  preset: string | CharacterPreset
  title: string
  goal: string
  /** How far from its place it strays (cells). */
  range: number
  /** Half-side of the board cut out around the meeting (cells). */
  radius: number
  /** What the hero gains for good by overcoming it. */
  effects: Effect[]
  /** Said in the debrief. */
  success: string
}

/**
 * Something to meet on the island. With a `scene`, it is the place where
 * that story scene happens (the story waits for it); otherwise it is
 * optional: something to examine, or an enemy to avoid.
 */
export interface Encounter {
  id: string
  at: Spot
  /** What the hero sees there ("la Borne", "le feu"). */
  label: string
  /** The scene of the chapter this triggers. */
  scene?: string
  /** A character stands there and can be walked up to. */
  actor?: string
  /** Stepping on one of these cells triggers it (default: next to `at`). */
  zone?: Spot[]
  /** Triggers by itself as soon as the hero is free to act. */
  auto?: boolean
  examine?: { lines: ExamineLine[]; effects?: Effect[] }
  wander?: Wanderer
  /** Something only an Influence of the Ghom can move (repair, shake, distort). */
  obstacle?: Obstacle
  if?: Cond
}

/** The Ghom's hands, on the island (same ids as the fight's divine powers). */
export type Influence = "timeWarp" | "earthquake" | "blessing"

export interface Obstacle {
  influence: Influence
  /** Read when the hero looks at it before it is moved. */
  before: ExamineLine[]
  /** Read when the Influence moves it; its effects count once. */
  after: ExamineLine[]
  effects?: Effect[]
}

export interface Exploration {
  /** `Board.fromAscii` rows: the whole island. */
  island: string[]
  start: Spot
  /** Characters (of the team) who walk behind the hero here. */
  companions?: string[]
  /** What the Ghom can do on this island (none by default). */
  influences?: Influence[]
  encounters: Encounter[]
}

// ─── Chapters ───────────────────────────────────────────────────────────────

export interface Chapter {
  id: string
  era: number
  /** Position in the era ("prologue" is 0). */
  number: number
  title: string
  quote?: { who: string; text: string }
  place: string
  /** The Carnet question this chapter opens, if any. */
  question?: { id: string; text: string }
  start: string
  scenes: Record<string, Scene>
  /** The places and encounters of the chapter, walked on the island. */
  exploration?: Exploration
}

export interface Era {
  id: number
  title: string
  question: string
  chapters: string[]
}

// ─── Fight outcome ──────────────────────────────────────────────────────────

/** What the game reports back after an Adventure fight. */
export interface FightReport {
  result: "victory" | "defeat" | "held"
  /** Clock ticks reached. */
  ticks: number
  divineUsed: Record<string, number>
  /** Earthquakes cast next to an ally, Distortions cast on one. */
  divineNearAlly: { divineId: string; fighterId: string }[]
  intrications: number
  /** Ids of the fighters that left the island alive. */
  fled: string[]
  /** The clock ran out. */
  timeUp: boolean
  zonesLost: string[]
  zoneStates: Record<string, "active" | "silent" | "lost">
  fixed: string[]
  /** Ids of the fighters that entered mid-fight (waves, reinforcements). */
  arrived?: string[]
  /** Fighters that changed sides, with the team they went to. */
  switched?: { fighterId: string; to: number }[]
  /** Era IV autonomy: orders, refusals, "Laisser agir", "Insister", withdrawal. */
  autonomy?: AutonomyReport
  fighters: {
    id: string
    preset: string
    team: number
    /** Hit points left (0: dispersed or transi). */
    hp: number
    fled: boolean
  }[]
}
