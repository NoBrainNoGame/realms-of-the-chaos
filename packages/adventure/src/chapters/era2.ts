import type { Chapter } from "../types"
import { ch07 } from "./ch07"
import { ch08 } from "./ch08"
import { ch09 } from "./ch09"
import { ch10 } from "./ch10"
import { ch11 } from "./ch11"
import { ch12 } from "./ch12"
import { ERA2_FLAGS } from "./era2-kit"

export { ERA2_FLAGS }
export const ERA2_CHAPTERS: Chapter[] = [ch07, ch08, ch09, ch10, ch11, ch12]
export const ERA2_GROWTH: Record<
  string,
  {
    look?: Record<string, number>
    stats?: Record<string, number>
    spells?: string[]
    trait?: string
  }
> = {
  echarpe_d_algues: { stats: { magicalDefense: 1 } },
  bandeau_d_archere: { stats: { luck: 1 } },
  dent_de_squale: { stats: { physicalAttack: 1 } },
  gants_de_pecheur: { stats: { physicalDefense: 1 } },
  manteau_de_plongee: { stats: { physicalDefense: 1 } },
  bottes_de_vase: { stats: { speed: 1 } },
  lanterne_de_vase: { trait: "La lanterne de vase" },
  eclat_de_jumelle: { stats: { luck: 1 } },
  chale_de_sauge: { stats: { magicalDefense: 1 } },
  chale_de_lusse: { stats: { magicalDefense: 1 } },
  chale_des_strates: { stats: { magicalDefense: 1 } },
  ecailles_de_maree: { stats: { physicalDefense: 1, magicalDefense: 1 } },
  branchies: { trait: "Les branchies" },
  clepsydre_de_nerea: { trait: "La clepsydre de Néréa" },
  journal_de_nerea: { trait: "Le journal de Néréa" },
}
