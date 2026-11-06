export * from "./carnet"
export { CHAPTERS, chapterById, ERAS, nextChapter } from "./catalog"
export { OUVERTES } from "./chapters/ch28"
export { ERA2_FLAGS, ERA2_GROWTH } from "./chapters/era2"
export { ERA3_GROWTH } from "./chapters/era3"
export { ERA4_GROWTH } from "./chapters/era4"
export {
  type Ending,
  type EndingResult,
  type EndingWorld,
  ERA5_GROWTH,
  markEnding as endingFlags,
  resolveEnding,
} from "./chapters/era5"
export { compile } from "./compile"
export * from "./dsl"
export {
  autonomyEffects,
  autonomyTier,
  entryProblems,
  fightRules,
  generalShift,
  resolveFight,
} from "./entries"
export {
  DISPERSION_WORLDS,
  ENDING_NAMES,
  EPILOGUES,
  type EpilogueLine,
  type EpiloguePage,
  epilogueOf,
} from "./epilogues"
export * from "./exploration"
export * from "./flags"
export * from "./items"
export * from "./reactions"
export * from "./runner"
export * from "./trace"
export * from "./types"
export { validateChapter } from "./validate"
