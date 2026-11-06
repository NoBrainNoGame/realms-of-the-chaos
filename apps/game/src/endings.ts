/**
 * The secret endings of the Adventure (docs/aventure/06-fins). The Adventure
 * engine does not exist yet: these ids, the persistent record in
 * `storage.ts` and the congratulation screen are what it will plug into.
 */

export interface SecretEnding {
  /** Name of the ending, as the player reads it. */
  name: string
  /** Title of the congratulation screen. */
  title: string
  /** What the congratulation says (no spoiler of the next ending). */
  lines: string[]
}

export const ENDING_BASCULE = "bascule"
export const ENDING_GRATUITE = "gratuite"

export const SECRET_ENDINGS: Record<string, SecretEnding> = {
  [ENDING_BASCULE]: {
    name: "La Bascule",
    title: "Fin secrète découverte",
    lines: [
      "« La Bascule »",
      "Bravo : vous avez trouvé une fin que rien n'annonçait.",
      "Tout a été effacé, et c'est le prix.",
      "Il reste peut-être quelque chose à apprendre, en reprenant l'Aventure depuis le début.",
    ],
  },
  [ENDING_GRATUITE]: {
    name: "La Gratuité",
    title: "Seconde fin secrète découverte",
    lines: [
      "« La Gratuité »",
      "Bravo : vous avez tout appris de ce que le Ghom savait.",
      "Ce n'est pas une preuve. C'est la meilleure hypothèse qu'il avait.",
    ],
  },
}

export const isSecretEnding = (id: string) => Object.hasOwn(SECRET_ENDINGS, id)
