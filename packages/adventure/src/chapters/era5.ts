import { defaultFlag } from "../flags"
import type { Chapter, FlagValue } from "../types"
import { ch25 } from "./ch25"
import { ch26 } from "./ch26"
import { ch27 } from "./ch27"
import { ch28, OUVERTES } from "./ch28"
import "./era5kit"

/** Era V, « L'Ombre du Tout » (ch. 25 to 28), in story order. */
export const ERA5_CHAPTERS: Chapter[] = [ch25, ch26, ch27, ch28]

/** What the story items of era V do to the hero (same shape as `GROWTH`). */
export interface Era5Growth {
  look?: Record<string, number>
  stats?: Record<string, number>
  spells?: string[]
  trait?: string
}
export const ERA5_GROWTH: Record<string, Era5Growth> = {
  // +5 % dodge while the hero has not acted this turn
  "habit:echarpe-frangee": { trait: "L'écharpe frangée", look: { mark: 4 } },
  // the last warmth: a little luck, a better magical defence
  "habit:chale-de-la-derniere-chaleur": {
    trait: "Le châle de la dernière chaleur",
    stats: { magicalDefense: 1 },
  },
  // regenerates 1 HP at the start of each turn the hero has not moved
  "habit:mousse-de-la-friche": {
    trait: "La mousse de la Friche",
    look: { mark: 5 },
  },
}

// ─── The endings (docs/aventure/06-fins/README.md) ─────────────────────────

export type Ending =
  | "cristal"
  | "equilibre"
  | "intrication"
  | "decouplage"
  | "dispersion"
  | "bascule"
  | "gratuite"
export type EndingWorld = "cristal" | "equilibre" | "ouvert"

export interface EndingResult {
  fin: Ending
  /** Only for the Dispersion: the world the hero leaves behind. */
  monde?: EndingWorld
}

type Flags = Record<string, FlagValue>

const val = (f: Flags, k: string): FlagValue => f[k] ?? defaultFlag(k)
const num = (f: Flags, k: string) => Number(val(f, k))

/**
 * The ending of a run, from its flags. Pure. Priority (§3 of the README):
 * Dispersion, Bascule / Gratuité, Découplage, Intrication, then Cristal or
 * Équilibre by the order and chaos scores.
 */
export function resolveEnding(f: Flags): EndingResult {
  const q = Array.from(
    { length: 29 },
    (_, i) => `carnet.Q${String(i).padStart(2, "0")}`,
  )
  const R =
    q.filter((k) => val(f, k) === "repondue").length -
    (val(f, "carnet_intact") === false ? 3 : 0)
  const F = q.filter((k) => val(f, k) === "fausse").length
  const ouvertesGardees = OUVERTES.every(
    (id) => val(f, `carnet.${id}`) === "ouverte",
  )
  const carnetRiche = R >= 14 && F <= 1 && val(f, "carnet.Q28") === "ouverte"
  const nom = String(val(f, "nom"))
  const nomDonne = nom !== "aucun" && nom !== "faux"
  const rec = num(f, "lacunes.recousues")
  const ela = num(f, "lacunes.elargies")
  const hab = num(f, "lacunes.habitees")
  const habiteesMajoritaires = hab >= rec && hab >= ela
  const issue = val(f, "ghom_dechu.issue")
  const sOrdre =
    2 * rec +
    num(f, "cristaux.gardes") +
    (issue === "vaincu" ? 3 : 0) +
    (val(f, "derniere_reponse") === "ghom" ? 1 : 0)
  const sChaos =
    2 * ela +
    num(f, "cristaux.extraits") +
    (issue === "suivi" ? 3 : 0) +
    (val(f, "derniere_reponse") === "rien_impossible" ? 1 : 0)
  const tie = (): "cristal" | "equilibre" => {
    const l = val(f, "derniere_lacune")
    if (l === "elargie") return "equilibre"
    if (l === "recousue") return "cristal"
    // SIMPLIFIED: an inhabited tie keeps the world as it is while the trust
    // holds (Cristal), and lets it dissolve otherwise (Équilibre).
    return num(f, "confiance") >= 0 ? "cristal" : "equilibre"
  }
  const score = (): "cristal" | "equilibre" =>
    sOrdre > sChaos ? "cristal" : sChaos > sOrdre ? "equilibre" : tie()

  const confiance = num(f, "confiance")
  if (val(f, "heros_disperse") === true || confiance <= -6) {
    const ouvert =
      val(f, "heros_disperse") === true &&
      val(f, "couplage_ghom_dechu") === true &&
      habiteesMajoritaires &&
      confiance >= 0
    return { fin: "dispersion", monde: ouvert ? "ouvert" : score() }
  }
  const route = nom === "aucun" && ouvertesGardees
  const fin = val(f, "fin")
  if (route && fin === "bascule" && val(f, "vacuum_decay") === true)
    return { fin: "bascule" }
  if (route && fin === "gratuite" && val(f, "bascule_vue") === true)
    return { fin: "gratuite" }
  if (route && fin === "decouplage") return { fin: "decouplage" }
  if (
    val(f, "couplage_ghom_dechu") === true &&
    confiance >= 5 &&
    carnetRiche &&
    nomDonne &&
    habiteesMajoritaires
  )
    return { fin: "intrication" }
  return { fin: score() }
}

/** The flags of a finished run with its ending written into them. */
export function markEnding(f: Flags): Flags {
  const e = resolveEnding(f)
  return { ...f, fin: e.fin, ...(e.monde ? { "fin.monde": e.monde } : {}) }
}
