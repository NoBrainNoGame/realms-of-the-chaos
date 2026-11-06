import { CHARACTERS, FORBIDDEN_ACTIONS } from "@realms/engine"

/**
 * URL parameters:
 * - `?seed=42`               reproducible fight
 * - `?spectate`              AI vs AI
 * - `?speed=4`               animation speed (0.25 to 4, slow motion to check effects)
 * - `?team=eva,brutus,lyra`  player roster
 * - `?enemies=gorr,nyx`      enemy roster
 * - `?debug`                 exposes `window.game` and `window.runner` in the console
 * - `?gallery`               shows every puppet in its 4 facings (art check)
 * - `?anim=swim`             with the gallery: loops a single animation
 *                            (idle, walk, melee, shoot, cast, roar, hit, swim)
 * - `?grant=vacuumDecay`    dev: gives a forbidden spell to the save (the
 *                            Adventure will, one day); offered in the Workshop.
 *                            To try its wipe and the scars it leaves.
 * - `?mode=skirmish`         opens a screen directly: title, skirmish, local,
 *                            arcade, gallery, fight, tutorial or settings
 *
 * Without `mode`, any fight parameter (seed, spectate, team, enemies) starts
 * a fight right away, as before the title screen existed.
 */
export const MODES = [
  "title",
  "skirmish",
  "local",
  "arcade",
  "gallery",
  "fight",
  "tutorial",
  "settings",
] as const
export type StartMode = (typeof MODES)[number]

export interface Params {
  mode: StartMode
  seed: number | null
  spectate: boolean
  debug: boolean
  gallery: boolean
  /** Gallery: the only animation to loop. */
  anim: string | null
  speed: number
  playerTeam: string[]
  enemyTeam: string[]
  /** Forbidden actions to give to the save (dev). */
  grant: string[]
}

export const SPEEDS = [0.25, 0.5, 1, 2, 4]
export const MAX_ROSTER = 6
export const DEFAULT_PLAYER_TEAM = ["brutus", "eva", "lyra"]
export const DEFAULT_ENEMY_TEAM = ["gorr", "merlin", "nyx"]

export function parseParams(search: URLSearchParams): Params {
  const roster = (name: string, fallback: string[]) => {
    const ids = search
      .get(name)
      ?.split(",")
      .map((id) => id.trim().toLowerCase())
      .filter((id) => id in CHARACTERS)
      .slice(0, MAX_ROSTER)
    return ids && ids.length > 0 ? ids : fallback
  }
  const seed = Number(search.get("seed"))
  const speed = Number(search.get("speed"))

  const requested = search.get("mode") as StartMode | null
  const mode: StartMode =
    requested && MODES.includes(requested)
      ? requested
      : search.has("gallery")
        ? "gallery"
        : ["seed", "spectate", "team", "enemies"].some((k) => search.has(k))
          ? "fight"
          : "title"

  return {
    mode,
    seed: search.get("seed") && Number.isFinite(seed) ? seed : null,
    spectate: search.has("spectate"),
    debug: search.has("debug"),
    gallery: search.has("gallery"),
    anim: search.get("anim"),
    speed: SPEEDS.includes(speed) ? speed : 1,
    playerTeam: roster("team", DEFAULT_PLAYER_TEAM),
    enemyTeam: roster("enemies", DEFAULT_ENEMY_TEAM),
    grant: (search.get("grant") ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter((id) => Object.hasOwn(FORBIDDEN_ACTIONS, id)),
  }
}

export const params = parseParams(new URLSearchParams(window.location.search))
