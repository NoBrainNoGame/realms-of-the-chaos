import {
  add,
  all,
  choice,
  fx,
  go,
  gte,
  is,
  join,
  narr,
  opt,
  say,
  set,
  stage,
  when,
} from "../dsl"
import {
  type Beat,
  type Chapter,
  END,
  type FightSpec,
  type ObjectiveSpec,
} from "../types"
import { at, flat, GIANT, hero, UNSTABLE, walk } from "./era5kit"

// Chapter 27, « Le Ghom déchu »
// (docs/aventure/05-ombre-du-tout/27-le-ghom-dechu.md).

const BOARD = flat(9).map((r, y) => (y === 2 || y === 6 ? "..1...1.." : r))

const disputed: FightSpec = {
  id: "ch27-friche-disputee",
  title: "La Friche disputée",
  goal: "La Friche est à la vie qui revient. Écarte les gardiens sans l'écraser.",
  board: BOARD,
  teams: [
    {
      name: "L'équipe",
      side: "allies",
      fighters: [
        hero(1, 4),
        at("lyra", 1, 3),
        at("brutus", 1, 5),
        at("gorr", 2, 4),
      ],
    },
    {
      name: "Les gardiens",
      side: "enemies",
      fighters: [at(GIANT, 6, 4), at(UNSTABLE, 6, 3), at(UNSTABLE, 6, 5)],
    },
  ],
  rules: { clock: { period: 1, limit: 8, winner: 0 }, announce: true },
  influences: ["earthquake", "timeWarp", "blessing"],
  startEnergy: 4,
  objectives: [
    {
      id: "recoudre-friche",
      mark: "★",
      label: "Rendre la Friche à la vie",
      check: (r) => r.result === "victory",
      success: "Une mousse repart, là où l'on a cessé de frapper.",
      onSuccess: [add("lacunes.recousues")],
    },
  ],
  defeat: [set("defaite"), add("usure"), add("confiance", -1)],
  lines: [
    {
      when: "start",
      who: "gorr",
      text: "Gorr ne veut pas écraser la mousse. Gorr marche à côté.",
    },
    {
      when: "tick:3",
      who: "lyra",
      text: "On se bat pour un endroit qui n'a besoin de personne. C'est étrange.",
    },
  ],
}

const objectives2: ObjectiveSpec[] = [
  {
    id: "tenir-deux-pressions",
    mark: "★",
    label: "Tenir sous les deux pressions",
    check: (r) => r.result !== "defeat",
    onSuccess: [add("lacunes.habitees"), add("confiance")],
  },
  {
    id: "intrication",
    mark: "◆",
    label: "Une Intrication sous la double pression",
    check: (r) => r.intrications >= 1,
    onSuccess: [add("lacunes.habitees")],
  },
]

const pressures: FightSpec = {
  id: "ch27-deux-pressions",
  title: "Les deux pressions",
  goal: "Tenir sept tours. Deux mains pèsent sur le même monde : le Ghom déchu et toi.",
  board: BOARD,
  teams: [
    {
      name: "L'équipe",
      side: "allies",
      fighters: [
        hero(1, 4),
        at("lyra", 1, 3),
        at("brutus", 1, 5),
        at("gorr", 2, 4),
      ],
    },
    {
      name: "Les instables",
      side: "enemies",
      fighters: [at(UNSTABLE, 6, 3), at(UNSTABLE, 6, 5), at(UNSTABLE, 7, 4)],
    },
  ],
  rules: { clock: { period: 1, limit: 7, winner: 0 }, announce: true },
  influences: ["earthquake", "timeWarp", "blessing"],
  startEnergy: 6,
  objectives: objectives2,
  defeat: [set("defaite"), add("usure"), add("confiance", -1)],
  lines: [
    {
      when: "start",
      who: "ghom-dechu",
      text: "Je sens. Tu sens. Deux mains, un seul monde.",
    },
    { when: "tick:3", who: "gorr", text: "Gorr sent deux fois. Gorr tient." },
  ],
}

const defeatNote = (text: string): Beat =>
  when(is("defaite"), [narr(text), fx(set("defaite", false))])

export const ch27: Chapter = {
  id: "27",
  era: 5,
  number: 27,
  title: "Le Ghom déchu",
  quote: {
    who: "Le Ghom déchu",
    text: "J'ai cessé. Le monde a continué. Je n'avais pas compris que c'était cela, la réponse.",
  },
  place: "La Friche",
  question: { id: "Q27", text: "Le monde a-t-il besoin de nous ?" },
  start: "1",
  scenes: {
    "1": {
      id: "1",
      title: "Ce qui a poussé",
      kind: "rencontre",
      setting: "La Friche : de la mousse là où plus rien n'est tenu",
      next: "2",
      beats: [
        stage("Plus rien n'est tenu, ici. Et pourtant, des choses poussent."),
        say("gorr", "Gorr voit la mousse revenir. Gorr n'a rien fait."),
        say(
          "merlin",
          "Rien n'a été mesuré ici. Et c'est vivant. Je dois reformuler plusieurs choses.",
        ),
        say("squalor", "Ça repousse. Même sans nous. J'en suis presque vexé."),
        when(is("squalor_rejoint"), [fx(join("squalor"))]),
        when(is("merlin_convaincu"), [fx(join("merlin"))]),
        when(gte("confiance.gorr", 0), [fx(join("gorr"))]),
      ],
    },
    "2": {
      id: "2",
      title: "Les couches de la Friche",
      kind: "scene",
      setting: "Une coupe de terre, à nu",
      next: "3",
      beats: [
        choice("couches", [
          opt("lire", "Lire les couches.", [
            fx(add("usure"), add("archives.lues"), add("ghom_dechu.verite")),
            narr(
              "Le sol garde les ères les unes sur les autres : verre, marée, mousse. Aucune n'a pris la place d'une autre. Elles se sont recouvertes.",
            ),
          ]),
          opt("passer", "Passer.", []),
        ]),
      ],
    },
    "3": {
      id: "3",
      title: "Traverser sans écraser",
      kind: "lacune",
      setting: "Un champ de jeunes pousses",
      next: "4",
      beats: [
        stage("Le chemin passe au milieu des pousses. Chaque pas compte."),
        choice("traverser", [
          opt("pas-a-pas", "Passer en posant chaque pas.", [
            fx(add("confiance")),
            say("lyra", "Lentement. Elles ont mis des siècles à revenir."),
          ]),
          opt("autour", "Faire le tour, au prix du temps.", [fx(add("usure"))]),
        ]),
      ],
    },
    "4": {
      id: "4",
      title: "La présence",
      kind: "rencontre",
      setting: "Au centre de la Friche",
      beats: [
        stage(
          "Une présence sans corps, qu'on ne voit pas : une pression, au centre, qui pèse un peu moins que l'air.",
        ),
        choice("presence", [
          opt("attaquer", "Frapper la présence.", [
            fx(set("ghom_dechu.issue", "vaincu")),
            go("5a"),
          ]),
          opt("ecouter", "Écouter.", []),
          opt("attendre", "Attendre.", []),
        ]),
        go("5"),
      ],
    },
    "5": {
      id: "5",
      title: "Celui qui a cessé",
      kind: "rencontre",
      setting: "Le même endroit, plus calme",
      beats: [
        say(
          "ghom-dechu",
          "J'étais un Ghom. J'ai tenu un monde, comme on tient quelque chose qu'on a peur de lâcher. Un jour, j'ai relâché. Rien ne s'est cassé.",
        ),
        say(
          "ghom-dechu",
          "Le monde n'avait pas besoin de moi. Il avait besoin que je cesse de le retenir. Je ne l'ai pas compris tout de suite : on ne comprend pas ces choses-là tout de suite.",
        ),
        say(
          "ghom-dechu",
          "La pente est revenue. Les choses sont tombées là où elles tombent. Elles tombent toujours quelque part.",
        ),
        fx(set("carnet.Q27", "repondue"), set("carnet.Q18", "repondue")),
        choice(
          "ghom",
          [
            opt("reparer", "« Tu dois être réparé. »", [
              fx(set("ghom_dechu.issue", "vaincu")),
              go("5a"),
            ]),
            opt("aller", "« Laisse-toi aller. Suis la pente. »", [
              fx(
                set("ghom_dechu.issue", "suivi"),
                add("lacunes.elargies"),
                add("confiance.lyra", -1),
                add("confiance.nyx"),
                add("confiance.brutus", -1),
              ),
              narr(
                "Il se défait comme il se faisait : lentement, en laissant de la mousse.",
              ),
              go("6"),
            ]),
            opt("rester", "« Reste ici. »", [
              fx(set("ghom_dechu.issue", "laisse"), add("confiance")),
              say("ghom-dechu", "Ici. Oui. Je peux faire ça."),
              go("6"),
            ]),
            opt(
              "coupler",
              "« Tenons ensemble. »",
              [go("5d")],
              all(gte("ghom_dechu.verite", 2), is("carnet.Q23", "repondue")),
            ),
          ],
          "Que lui dire ?",
        ),
        go("6"),
      ],
    },
    "5a": {
      id: "5a",
      title: "La Friche disputée",
      kind: "combat",
      setting: "La Friche, neuf cases",
      beats: [
        { t: "fight", fight: disputed },
        defeatNote(
          "Vous reculez. La Friche reste ce qu'elle est : elle n'avait pas besoin qu'on la défende.",
        ),
        go("6"),
      ],
    },
    "5d": {
      id: "5d",
      title: "Se coupler",
      kind: "scene",
      setting: "La Friche, deux pressions",
      beats: [
        stage(
          "L'Influence « Se coupler » s'ouvre : deux mains qui pèseraient sur le même monde, avec un Élan commun.",
        ),
        choice("couple", [
          opt("oui", "Se coupler.", [
            fx(set("couplage_ghom_dechu"), set("ghom_dechu.issue", "couple")),
            say("ghom-dechu", "Je sens. Tu sens."),
            go("5e"),
          ]),
          opt("non", "Ne pas se coupler : le laisser là.", [
            fx(set("ghom_dechu.issue", "laisse"), add("confiance")),
            go("6"),
          ]),
        ]),
        go("6"),
      ],
    },
    "5e": {
      id: "5e",
      title: "Les deux pressions",
      kind: "combat",
      setting: "La Friche, deux pressions sur un monde",
      beats: [
        { t: "fight", fight: pressures },
        defeatNote("La double pression vous échappe un moment, puis se pose."),
        go("6"),
      ],
    },
    "6": {
      id: "6",
      title: "Au-dessus, le Cœur",
      kind: "fin",
      setting: "Au-dessus, la déchirure",
      beats: [
        when(is("ghom_dechu.issue", "vaincu"), [
          narr(
            "Il ne reste de lui qu'un souvenir de pression. La mousse ne s'en préoccupe pas.",
          ),
        ]),
        when(is("ghom_dechu.issue", "suivi"), [
          narr("Il suit la pente. Il ne dit plus rien, et c'est paisible."),
        ]),
        when(is("ghom_dechu.issue", "laisse"), [
          narr("Il reste là, sous la mousse, et vous regarde partir."),
        ]),
        when(is("ghom_dechu.issue", "couple"), [
          narr("Vous êtes deux à peser sur le même monde, et le monde tient."),
        ]),
        narr(
          "Au-dessus, le Cœur de la déchirure, à portée de marche. Vous emportez une mousse de la Friche, qui reprend sur l'épaule.",
        ),
        fx({ give: "habit:mousse-de-la-friche" }),
        go(END),
      ],
    },
  },
  exploration: walk(
    [
      { id: "1", label: "Ce qui a poussé" },
      { id: "2", label: "Les couches" },
      { id: "3", label: "Les pousses" },
      { id: "4", label: "La présence" },
      { id: "5", label: "Celui qui a cessé" },
      { id: "5a", label: "La Friche disputée", auto: true },
      { id: "5d", label: "Se coupler", auto: true },
      { id: "5e", label: "Les deux pressions", auto: true },
      { id: "6", label: "Au-dessus, le Cœur" },
    ],
    ["lyra", "brutus", "gorr"],
  ),
}
