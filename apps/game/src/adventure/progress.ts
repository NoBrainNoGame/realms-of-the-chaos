/**
 * The Adventure's progress: which chapters are unlocked, the one in
 * progress, and the door the last chapter will use to end the game.
 */
import {
  type Carry,
  CHAPTERS,
  chapterById,
  nextChapter,
  type Run,
  START_CARRY,
  startChapter,
} from "@realms/adventure"
import type { CustomLook } from "@realms/engine"
import {
  type AdventureSave,
  adventureSave,
  emptyAdventureSave,
  vacuumDecayWipe,
  writeAdventureSave,
} from "../storage"

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
  const carry: Carry = save.starts[chapterId] ?? START_CARRY
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
 * The hook of the last chapter (28): the Adventure reaches a secret ending
 * through the forbidden spell. The save is wiped (the Adventure's progress
 * with it), the ending is recorded and congratulated at the next start.
 * Nothing calls it yet. Inside an Adventure fight, a vacuum decay that is
 * NOT an ending never comes here: it is only a threat (see Game.ts).
 */
export function endAdventure(ending: string): number {
  return vacuumDecayWipe({ ending })
}
