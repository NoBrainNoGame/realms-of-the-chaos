import { CHARACTERS } from "@realms/engine"

/**
 * URL parameters:
 * - `?seed=42`               reproducible fight
 * - `?spectate`              AI vs AI
 * - `?speed=4`               animation speed (0.25 to 4, slow motion to check effects)
 * - `?team=eva,brutus,lyra`  player roster
 * - `?enemies=gorr,nyx`      enemy roster
 * - `?debug`                 exposes `window.game` and `window.runner` in the console
 * - `?gallery`               shows every puppet in its 4 facings (art check)
 */
export interface Params {
  seed: number | null
  spectate: boolean
  debug: boolean
  gallery: boolean
  speed: number
  playerTeam: string[]
  enemyTeam: string[]
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

  return {
    seed: search.get("seed") && Number.isFinite(seed) ? seed : null,
    spectate: search.has("spectate"),
    debug: search.has("debug"),
    gallery: search.has("gallery"),
    speed: SPEEDS.includes(speed) ? speed : 1,
    playerTeam: roster("team", DEFAULT_PLAYER_TEAM),
    enemyTeam: roster("enemies", DEFAULT_ENEMY_TEAM),
  }
}

export const params = parseParams(new URLSearchParams(window.location.search))
