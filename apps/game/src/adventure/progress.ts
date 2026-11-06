/**
 * The Adventure's progress: which chapters are unlocked, the one in
 * progress, and the door the last chapter will use to end the game.
 */
import {
  type Carry,
  CHAPTERS,
  chapterById,
  type EndingResult,
  nextChapter,
  type Run,
  resolveEnding,
  START_CARRY,
  startChapter,
} from "@realms/adventure"
import type { CustomLook } from "@realms/engine"
import {
  type AdventureSave,
  adventureSave,
  emptyAdventureSave,
  endingsSeen,
  markEnding,
  secondEndingAvailable,
  takeCongratulation,
  vacuumDecayWipe,
  writeAdventureSave,
} from "../storage"

/** The chapter whose end is the end of the Adventure. */
export const LAST_CHAPTER = "28"

/** The first chapter is always open; the next ones follow the story. */
export function unlockedChapters(save = adventureSave()): string[] {
  return CHAPTERS.filter(
    (c, i) => i === 0 || save.starts[c.id] !== undefined,
  ).map((c) => c.id)
}

/** The run to « Reprendre », if a chapter is in progress. */
export function resumable(save = adventureSave()): Run | null {
  const run = save.run
  if (!run || run.done) return null
  try {
    chapterById(run.chapter)
    return run
  } catch {
    return null
  }
}

function seedOf() {
  return Math.floor(Math.random() * 1_000_000)
}

/** Starts a chapter from the state it opens with, and saves it. */
export function beginChapter(
  chapterId: string,
  seed = seedOf(),
  /** A replay of a past chapter: the run in progress is left alone. */
  sandbox = false,
): Run {
  const save = adventureSave()
  let carry: Carry = save.starts[chapterId] ?? START_CARRY
  if (chapterId === LAST_CHAPTER)
    // the negotiation is only offered to a player who saw La Bascule
    carry = {
      ...carry,
      flags: { ...carry.flags, bascule_vue: secondEndingAvailable() },
    }
  const run = startChapter(chapterId, carry, seed)
  if (!sandbox) {
    save.starts[chapterId] = structuredClone(carry)
    save.run = run
    writeAdventureSave(save)
  }
  return run
}

/** Keeps the run (called after every step). */
export function saveRun(run: Run) {
  const save = adventureSave()
  save.run = run
  writeAdventureSave(save)
}

/** The chapter is over: the next one opens with what the hero carries. */
export function completeChapter(run: Run): string | null {
  const save = adventureSave()
  if (!save.completed.includes(run.chapter)) save.completed.push(run.chapter)
  const next = nextChapter(run.chapter)
  if (next) {
    save.starts[next.id] = {
      flags: structuredClone(run.flags),
      items: [...run.items],
      team: [...run.team],
      unlocks: [...run.unlocks],
    }
  }
  save.run = null
  writeAdventureSave(save)
  return next?.id ?? null
}

/** A new game: the body is chosen, everything else starts over. */
export function newGame(body: CustomLook): AdventureSave {
  const save: AdventureSave = {
    ...emptyAdventureSave(),
    body,
    granted: adventureSave().granted,
  }
  writeAdventureSave(save)
  return save
}

/** The body chosen on the pond's reflection (the prologue): kept in the save. */
export function chooseBody(body: CustomLook) {
  writeAdventureSave({ ...adventureSave(), body })
}

/** Where « Reprendre » leads: the run in progress, or the next open chapter. */
export function continuation(
  save = adventureSave(),
): { kind: "run"; run: Run } | { kind: "chapter"; id: string } | null {
  const run = resumable(save)
  if (run) return { kind: "run", run }
  if (!save.body) return null
  const open = unlockedChapters(save).find((id) => !save.completed.includes(id))
  return open ? { kind: "chapter", id: open } : null
}

/**
 * The ending a finished run reaches (docs/aventure/06-fins). `forced` is an
 * ending the last fight itself decided (the vacuum decay of the finale).
 */
export function endingOf(
  run: Pick<Run, "flags">,
  forced?: EndingResult,
): EndingResult {
  if (forced) return forced
  return resolveEnding({
    ...run.flags,
    bascule_vue: endingsSeen().includes("bascule"),
  })
}

/**
 * The epilogue was read: the ending is recorded for good. La Bascule wipes
 * the save (and leaves a scar), La Gratuité is recorded without a wipe, the
 * other endings only close the run. Returns the secret ending to
 * congratulate, if any.
 */
export function recordEnding(result: EndingResult): string | null {
  if (result.fin === "bascule") {
    vacuumDecayWipe({ ending: "bascule" })
    // congratulated right now, not at the next start
    takeCongratulation()
    return "bascule"
  }
  const save = adventureSave()
  save.ending = result.fin
  save.run = null
  writeAdventureSave(save)
  if (result.fin === "gratuite") {
    markEnding("gratuite")
    return "gratuite"
  }
  return null
}
