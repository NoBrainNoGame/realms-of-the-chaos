import type { Chapter } from "../types"
import { ch13 } from "./ch13"
import { ch14 } from "./ch14"
import { ch15 } from "./ch15"
import { ch16 } from "./ch16"
import { ch17 } from "./ch17"
import { ch18 } from "./ch18"

export const ERA3_CHAPTERS: Chapter[] = [ch13, ch14, ch15, ch16, ch17, ch18]

const byId = new Map(ERA3_CHAPTERS.map((c) => [c.id, c]))
/** Era III chapter by id, or undefined (the catalog falls back on the rest). */
export const era3Chapter = (id: string): Chapter | undefined => byId.get(id)

/** Same shape as the game's Growth (the adventure package cannot import it). */
export interface Era3Growth {
  look?: Record<string, number>
  stats?: Record<string, number>
  spells?: string[]
  trait?: string
}

/** What each item given in chapters 13 to 18 does to the hero. */
export const ERA3_GROWTH: Record<string, Era3Growth> = {
  "habit:manteau-de-depoli": { look: { cape: 2 }, stats: { speed: 1 } },
  "trait:voix-qui-demande": {
    trait:
      "Voix qui demande : une question posée au bon moment vaut un argument.",
  },
  "habit:brassard-du-registre": {
    look: { mark: 3 },
    stats: { magicalDefense: 1 },
  },
  "habit:besicles-de-redacteur": {
    look: { accessory: 3 },
    trait: "Besicles de rédacteur : voit ce qui a été raturé dans une archive.",
  },
  "objet:premier-cristal": {
    trait:
      "Premier Cristal : la plus vieille archive vivante, gardée contre soi.",
  },
  "objet:eclat-d-etalon": {
    trait: "Éclat d'étalon : un éclat de ce qui servait de mesure à la Mine.",
  },
  "habit:casque-de-galerie": {
    look: { accessory: 4 },
    stats: { physicalDefense: 2 },
  },
  "habit:bracelet-de-quartz": {
    look: { mark: 4 },
    stats: { physicalDefense: 1 },
  },
  "habit:tablier-de-fonderie": {
    look: { top: 2 },
    stats: { magicalDefense: 1 },
  },
  "objet:carte-des-lacunes": {
    trait: "Carte des Lacunes : les creux du Tissu, tracés à la main.",
  },
  "habit:echarpe-de-thermiste": {
    look: { accessory: 5 },
    stats: { magicalDefense: 1 },
  },
  "habit:col-des-vents": { look: { cape: 3 }, stats: { luck: 1 } },
  "habit:eclat-de-vitrelle": {
    look: { mark: 5 },
    trait: "Éclat de Vitrelle : on voit à travers, tout passe.",
  },
}
