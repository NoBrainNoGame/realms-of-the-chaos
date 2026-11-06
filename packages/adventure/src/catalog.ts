import { ch01 } from "./chapters/ch01"
import { ch02 } from "./chapters/ch02"
import { ch03 } from "./chapters/ch03"
import { ch04 } from "./chapters/ch04"
import { ch05 } from "./chapters/ch05"
import { ch06 } from "./chapters/ch06"
import { prologue } from "./chapters/prologue"
import { useChapters } from "./runner"
import type { Chapter, Era } from "./types"

/** Every written chapter, in story order (era I for now). */
export const CHAPTERS: Chapter[] = [
  prologue,
  ch01,
  ch02,
  ch03,
  ch04,
  ch05,
  ch06,
]

export const ERAS: Era[] = [
  {
    id: 1,
    title: "L'Aube des Fragments",
    question: "Qu'est-ce qui existe ?",
    chapters: CHAPTERS.filter((c) => c.era === 1).map((c) => c.id),
  },
]

export function chapterById(id: string): Chapter {
  const c = CHAPTERS.find((c) => c.id === id)
  if (!c) throw new Error(`Unknown chapter "${id}"`)
  return c
}

/** The chapter after `id`, or undefined at the end of the written content. */
export function nextChapter(id: string): Chapter | undefined {
  const i = CHAPTERS.findIndex((c) => c.id === id)
  return CHAPTERS[i + 1]
}

useChapters(chapterById)
