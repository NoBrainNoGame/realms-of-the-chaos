import type { Run } from "./runner"

/**
 * The Carnet des Questions (docs/aventure/carnet.md): the reference list of the
 * hero's questions, where each is asked and what the game can answer. Every
 * answer given is compatible with current science; open questions have none.
 */
export interface CarnetQuestion {
  id: string
  /** Chapter number that asks it (0 = prologue). */
  asked: number
  text: string
  /** same: answered in the same era; late: much later; open: never answered. */
  kind: "same" | "late" | "open"
  /** What the game finally answers (shown once the question is closed). */
  answer: string | null
  /** The tempting, wrong answer some character offers (open questions). */
  tempting: string | null
}

export const CARNET: CarnetQuestion[] = [
  {
    id: "Q00",
    asked: 0,
    text: "Pourquoi suis-je là ?",
    kind: "open",
    answer: null,
    tempting: "« Parce que le Ghom t'a voulu » (les Immobilistes, ère I)",
  },
  {
    id: "Q01",
    asked: 1,
    text: "Que devient une chose quand plus rien ne la touche ?",
    kind: "late",
    answer:
      "Ch. 20 (Nyx) : elle n'est pas détruite, mais elle n'a plus d'état défini par rapport au reste. Ses états ne sont plus fixés par rien, et la Lacune l'efface du monde partagé.",
    tempting: null,
  },
  {
    id: "Q02",
    asked: 2,
    text: "Peut-on réparer ce que le temps défait ?",
    kind: "late",
    answer:
      "Ch. 26 (Lyra) : on peut réparer ici en déplaçant le désordre ailleurs (de la chaleur rejetée). On ne l'annule jamais : c'est le deuxième principe.",
    tempting: null,
  },
  {
    id: "Q03",
    asked: 3,
    text: "Si tout est fixé, sommes-nous encore vivants ?",
    kind: "late",
    answer:
      "Ch. 18 (la Cité fendue) : non. Un vivant est une forme traversée par un flux : figée, elle cesse de vivre.",
    tempting: null,
  },
  {
    id: "Q04",
    asked: 4,
    text: "Que gardent les profondeurs de ce qui a été ?",
    kind: "late",
    answer:
      "Ch. 11 (les strates) : des traces, pas le passé lui-même. On le reconstitue, on ne le revit pas.",
    tempting: null,
  },
  {
    id: "Q05",
    asked: 5,
    text: "Les Échos d'en face sont-ils aussi vivants que les miens ?",
    kind: "same",
    answer:
      "Ch. 6 : oui. Ils ont les mêmes besoins, les mêmes peurs, la même Dispersion.",
    tempting: null,
  },
  {
    id: "Q06",
    asked: 6,
    text: "Pourquoi quelque chose plutôt que rien ?",
    kind: "open",
    answer:
      "Reposée à chaque ère, puis par Gorr au ch. 28. (Voir Q28 : seule La Gratuité y ajoute ce que le Ghom sait de ce monde et ce qu'il croit de son propre univers.)",
    tempting:
      "« Parce qu'un Ghom l'a voulu », ou « parce que le rien est impossible ». Les deux sont présentées comme certaines, et aucune ne l'est.",
  },
  {
    id: "Q07",
    asked: 7,
    text: "Suis-je celui de la légende ?",
    kind: "late",
    answer:
      "Ch. 14 (le Chroniqueur) : la légende parle de lui, mais déformée par ceux qui l'ont transmise.",
    tempting: null,
  },
  {
    id: "Q08",
    asked: 8,
    text: "Une chose a-t-elle un état avant qu'on la touche ?",
    kind: "same",
    answer:
      "Ch. 10 : elle a un état relativement à ce qui l'a déjà touchée. Il n'existe pas de valeur cachée, toute prête, qui attendrait d'être découverte : les expériences du monde le montrent (Bell).",
    tempting: null,
  },
  {
    id: "Q09",
    asked: 9,
    text: "Avoir faim, est-ce une raison d'être ?",
    kind: "late",
    answer:
      "Ch. 26 (Squalor) : la faim fait durer. Elle ne dit pas pour quoi durer.",
    tempting: null,
  },
  {
    id: "Q10",
    asked: 10,
    text: "Devient-on ce que nos rencontres font de nous ?",
    kind: "same",
    answer:
      "Ch. 10 : en partie. Nos interactions fixent notre état, mais nous choisissons aussi lesquelles.",
    tempting: null,
  },
  {
    id: "Q11",
    asked: 11,
    text: "Peut-on accepter un passé qu'on ne peut pas changer ?",
    kind: "open",
    answer: "— (c'est une question de valeurs)",
    tempting: "« Il faut tout oublier pour avancer » (un ancien des pilotis)",
  },
  {
    id: "Q12",
    asked: 12,
    text: "Que peut-on laisser disparaître ?",
    kind: "open",
    answer: null,
    tempting:
      "« Rien ne disparaît vraiment, tout est gardé quelque part » (vrai pour l'information, faux pour ce qu'elle signifiait)",
  },
  {
    id: "Q13",
    asked: 13,
    text: "Une vie sans questions est-elle une vie ?",
    kind: "late",
    answer:
      "Ch. 18 : la cité sans questions ne vivait plus : elle tenait, c'est tout.",
    tempting: null,
  },
  {
    id: "Q14",
    asked: 14,
    text: "L'Histoire est-elle ce qui s'est passé, ou ce qu'on en a gardé ?",
    kind: "same",
    answer:
      "Ch. 14 : ce qu'on en a gardé. C'est pour cela qu'on la confronte aux traces physiques.",
    tempting: null,
  },
  {
    id: "Q15",
    asked: 15,
    text: "Que perd-on quand un lien devient une ressource ?",
    kind: "same",
    answer: "Ch. 18 : le lien lui-même. Le Tissu s'effiloche là où l'on mine.",
    tempting: null,
  },
  {
    id: "Q16",
    asked: 16,
    text: "Une question peut-elle naître d'une pierre ?",
    kind: "same",
    answer:
      "Ch. 16 : oui. Gorr en pose une. L'esprit n'est pas réservé à la chair.",
    tempting: null,
  },
  {
    id: "Q17",
    asked: 17,
    text: "Peut-on connaître le monde sans le changer ?",
    kind: "same",
    answer:
      "Ch. 17 (Merlin) : non. Mesurer, c'est interagir, donc perturber. On connaît le monde en en faisant partie.",
    tempting: null,
  },
  {
    id: "Q18",
    asked: 18,
    text: "Le monde a-t-il besoin de nous pour avoir un sens ?",
    kind: "late",
    answer:
      "Ch. 27 : le monde n'a pas besoin de nous pour exister. Le sens, lui, naît des liens, entre nous et avec lui.",
    tempting: null,
  },
  {
    id: "Q19",
    asked: 19,
    text: "Est-ce que je choisis, ou est-ce qu'on choisit pour moi ?",
    kind: "open",
    answer: "— (le libre arbitre reste une question ouverte)",
    tempting: "« Tout est écrit d'avance » (un révolté désabusé)",
  },
  {
    id: "Q20",
    asked: 20,
    text: "Existe-t-on quand plus rien ne nous touche ?",
    kind: "same",
    answer:
      "Ch. 24 (Nyx) : on existe, mais on n'est plus quelqu'un pour quelqu'un. On n'a d'état que dans ses relations.",
    tempting: null,
  },
  {
    id: "Q21",
    asked: 21,
    text: "A-t-on le droit de retenir ce qu'on a aidé à exister ?",
    kind: "open",
    answer: null,
    tempting:
      "« Ce que tu as fait naître t'appartient » (Brutus IV, s'il est resté loyal)",
  },
  {
    id: "Q22",
    asked: 22,
    text: "Si tout est déterminé, viser est-il un choix ?",
    kind: "same",
    answer:
      "Ch. 22 (Eva) : rien ne permet de prévoir certains résultats, et il n'existe pas de valeur cachée locale qui les fixerait d'avance (Bell). L'hypothèse des branches ne change rien à cette imprévisibilité pour qui la vit. Mais le hasard ne fait pas la liberté non plus : c'est Eva qui choisit ce qu'elle vise.",
    tempting: null,
  },
  {
    id: "Q23",
    asked: 23,
    text: "Qui oriente qui ?",
    kind: "same",
    answer:
      "Ch. 23 : chacun oriente l'autre. Toute interaction est réciproque.",
    tempting: null,
  },
  {
    id: "Q24",
    asked: 24,
    text: "Peut-on être libres ensemble ?",
    kind: "open",
    answer: null,
    tempting:
      "« La liberté, c'est l'absence de liens » (le manifeste de Nyx, avant sa fin d'arc)",
  },
  {
    id: "Q25",
    asked: 25,
    text: "Suis-je mes choix, ou toutes les branches où j'existe ?",
    kind: "open",
    answer: "— (les branches multiples sont une hypothèse)",
    tempting:
      "« Toutes les branches sont toi, donc rien ne compte » (un Double)",
  },
  {
    id: "Q26",
    asked: 26,
    text: "Le vide est-il le contraire de l'être, ou ce qu'il est au repos ?",
    kind: "same",
    answer:
      "Ch. 26 : le vide physique n'est pas « rien ». Il fluctue et a de l'énergie. Le « rien » absolu, lui, reste une idée.",
    tempting: null,
  },
  {
    id: "Q27",
    asked: 27,
    text: "Le monde a-t-il besoin de nous ?",
    kind: "same",
    answer:
      "Ch. 27 : non. La vie revient seule tant qu'il reste un déséquilibre d'énergie. Ce n'est pas triste : c'est une liberté.",
    tempting: null,
  },
  {
    id: "Q28",
    asked: 28,
    text: "Pourquoi quelque chose plutôt que rien ?",
    kind: "open",
    answer:
      "Elle reste ouverte. Selon la fin, le héros répond, ou reconnaît qu'on ne sait pas. Fin secrète La Gratuité : elle est annotée (`q28.annotee`), non résolue : « Le Ghom a fait ce monde et le héros y est tenu pour toujours (fait, dit par l'auteur). Pourquoi *son* univers existe : hypothèse du Ghom, aucune raison hors de lui, il en est un motif parmi d'autres. Non prouvée. »",
    tempting: "Les deux de Q06",
  },
]

export type QuestionState = "hidden" | "open" | "closed" | "false" | "noted"

export interface CarnetEntry extends CarnetQuestion {
  state: QuestionState
}

/** Q-flag value of a run (`carnet.Qxx`). */
const flagOf = (run: Pick<Run, "flags">, id: string) =>
  String((run.flags as Record<string, unknown>)[`carnet.${id}`] ?? "aucune")

/** The Carnet as the hero holds it now: asked questions only are shown. */
export function carnetEntries(run: Pick<Run, "flags">): CarnetEntry[] {
  return CARNET.map((q) => {
    const f = flagOf(run, q.id)
    const state: QuestionState =
      f === "repondue"
        ? "closed"
        : f === "fausse"
          ? "false"
          : q.id === "Q28" && run.flags["q28.annotee"] === true
            ? "noted"
            : f === "ouverte"
              ? "open"
              : "hidden"
    return { ...q, state }
  })
}

/** Questions whose state changed between two runs (for the notification). */
export function carnetChanges(
  before: Pick<Run, "flags">,
  after: Pick<Run, "flags">,
): { id: string; text: string; from: QuestionState; to: QuestionState }[] {
  const was = new Map(carnetEntries(before).map((e) => [e.id, e.state]))
  return carnetEntries(after)
    .filter((e) => e.state !== was.get(e.id))
    .map((e) => ({
      id: e.id,
      text: e.text,
      from: was.get(e.id) ?? "hidden",
      to: e.state,
    }))
}
