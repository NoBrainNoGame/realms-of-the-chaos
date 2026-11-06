import type { Chapter } from "../types"
import { ch19 } from "./ch19"
import { ch20 } from "./ch20"
import { ch21 } from "./ch21"
import { ch22 } from "./ch22"
import { ch23 } from "./ch23"
import { ch24 } from "./ch24"
import "./era4kit"

/** Era IV, « Le Schisme des Échos » (ch. 19 to 24), in story order. */
export const ERA4_CHAPTERS: Chapter[] = [ch19, ch20, ch21, ch22, ch23, ch24]

/** What the story items of era IV do to the hero (same shape as `GROWTH`). */
export interface Era4Growth {
  look?: Record<string, number>
  stats?: Record<string, number>
  spells?: string[]
  trait?: string
}
export const ERA4_GROWTH: Record<string, Era4Growth> = {
  "habit:capuche-des-delies": { trait: "La capuche des Déliés" },
  "habit:fil-de-lisiere": { trait: "Le fil de lisière" },
  "objet:registre-d-eva-ii": { trait: "Le registre d'Eva II" },
  "habit:manteau-laisse": {
    stats: { physicalDefense: 1 },
    trait: "Le manteau laissé",
  },
  "habit:agrafe-de-ceux-qui-restent": { trait: "L'agrafe de ceux qui restent" },
  "habit:gant-de-l-archere": { trait: "Le gant de l'archère" },
  "objet:la-page-blanche": { trait: "La page blanche" },
  peau_d_ombre: {
    trait: "Peau d'ombre",
    stats: { speed: 1, magicalDefense: 1 },
  },
  cicatrices_de_lumiere: {
    trait: "Cicatrices de lumière",
    stats: { physicalDefense: 1, health: 1 },
  },
  "habit:ceinture-de-treve": { trait: "La ceinture de trêve" },
  "objet:l-ardoise-rayee": { trait: "L'ardoise rayée" },
  "objet:eclat-temoin": { trait: "L'éclat-témoin" },
  "objet:le-premier-contact": { trait: "Le premier contact" },
  "habit:brassard-du-gardien": {
    look: { mark: 3 },
    stats: { physicalDefense: 1 },
  },
}
