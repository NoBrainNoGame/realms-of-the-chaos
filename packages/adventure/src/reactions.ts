/**
 * What the hero says when something moves him across the Clair (the Ghom's
 * teleport). He never knows who does it: first he does not understand, then he
 * gets used to it, then he suspects someone without naming anyone. Cf. decision 5.
 */

export interface TripState {
  /** Journeys already made (this one excluded). */
  trips: number
  /** The chapter's number the hero stands in (0 = prologue). */
  chapter: number
  /** The hero's Usure (0 when unknown). */
  usure?: number
}

const FIRST = [
  "Je… j'étais ailleurs. Je viens de marcher dans le vide sans bouger.",
  "Qu'est-ce qui s'est passé ? Le sol n'est plus le même sous mes pieds.",
  "Rien n'a bougé, et tout a changé. Je ne comprends pas.",
]

const EARLY = [
  "Encore ! Quelque chose me prend et me pose ailleurs, sans rien me dire.",
  "Ça recommence. Je n'ai fait aucun pas, et pourtant me voilà.",
  "Là. Pas de pont, pas de chemin. Juste un autre endroit.",
  "Je commence à croire que ce n'est pas le Clair qui me déplace.",
]

const USED = [
  "Bon. Encore un déplacement. Je regarde autour de moi avant qu'il ne se passe autre chose.",
  "Je ne vois toujours personne. Mais ça ne ressemble pas à un hasard.",
  "Quelqu'un décide, quelque part. Je préférerais le savoir.",
  "Un autre Fragment. Je m'y fais, ce qui m'inquiète un peu.",
  "On me porte comme un objet. Je ne suis pas sûr de m'en plaindre ni d'en être content.",
]

const WORN = [
  "Mes jambes n'ont rien fait, et je suis fatigué quand même.",
  "Chaque fois, je laisse un peu de moi sur le chemin. Je n'ai pas fait le chemin.",
]

/** A few lines for the arrival (deterministic for a seed). */
export function teleportReaction(state: TripState, seed: number): string[] {
  const pool = state.trips === 0 ? FIRST : state.trips < 3 ? EARLY : USED
  const pick = (list: string[], n: number) => list[Math.abs(n) % list.length]
  const lines = [pick(pool, seed)]
  if ((state.usure ?? 0) >= 3) lines.push(pick(WORN, seed >> 3))
  return lines
}

export const TELEPORT_POOLS = { FIRST, EARLY, USED, WORN }
