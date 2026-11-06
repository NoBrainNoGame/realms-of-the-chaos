import { ch01 } from "./chapters/ch01"
import { ch02 } from "./chapters/ch02"
import { ch03 } from "./chapters/ch03"
import { ch04 } from "./chapters/ch04"
import { ch05 } from "./chapters/ch05"
import { ch06 } from "./chapters/ch06"
import { ERA2_CHAPTERS } from "./chapters/era2"
import { ERA3_CHAPTERS } from "./chapters/era3"
import { ERA4_CHAPTERS } from "./chapters/era4"
import { ERA5_CHAPTERS } from "./chapters/era5"
import { prologue } from "./chapters/prologue"
import { useChapters } from "./runner"
import type { Chapter, Era } from "./types"

/** Every written chapter, in story order (prologue, then eras I to V). */
export const CHAPTERS: Chapter[] = [
  prologue,
  ch01,
  ch02,
  ch03,
  ch04,
  ch05,
  ch06,
  ...ERA2_CHAPTERS,
  ...ERA3_CHAPTERS,
  ...ERA4_CHAPTERS,
  ...ERA5_CHAPTERS,
]

const eraOf = (id: number) =>
  CHAPTERS.filter((c) => c.era === id).map((c) => c.id)

export const ERAS: Era[] = [
  {
    id: 1,
    title: "L'Aube des Fragments",
    question: "Qu'est-ce qui existe ?",
    chapters: eraOf(1),
  },
  {
    id: 2,
    title: "Le Temps des Marées",
    question: "Qu'est-ce qui rend une chose définie ?",
    chapters: eraOf(2),
  },
  {
    id: 3,
    title: "L'Âge du Verre",
    question: "Peut-on consommer ce qui nous relie ?",
    chapters: eraOf(3),
  },
  {
    id: 4,
    title: "Le Schisme des Échos",
    question: "Sommes-nous libres ?",
    chapters: eraOf(4),
  },
  {
    id: 5,
    title: "L'Ombre du Tout",
    question: "Pourquoi quelque chose plutôt que rien ?",
    chapters: eraOf(5),
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
