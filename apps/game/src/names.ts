/**
 * Names for the workshop: picked, never typed. A name is built from
 * syllables, deterministically from a seed (so it can be tested).
 */
import { createRng } from "@realms/engine"

const ONSETS = [
  "b",
  "d",
  "g",
  "k",
  "l",
  "m",
  "n",
  "r",
  "s",
  "t",
  "v",
  "z",
  "br",
  "dr",
  "kr",
  "th",
  "sh",
  "vel",
  "mor",
  "ael",
]
const VOWELS = ["a", "e", "i", "o", "u", "ae", "ia", "ou", "ey"]
const CODAS = ["", "", "", "n", "r", "s", "l", "th", "k", "x"]

export function generateName(seed: number): string {
  const rng = createRng(seed)
  const syllables = rng.int(2, 3)
  let name = ""
  for (let i = 0; i < syllables; i++) {
    name += rng.pick(ONSETS) + rng.pick(VOWELS)
    if (i === syllables - 1) name += rng.pick(CODAS)
  }
  return name.charAt(0).toUpperCase() + name.slice(1, 14)
}
