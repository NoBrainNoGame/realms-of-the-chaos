import {
  add,
  choice,
  fx,
  go,
  gte,
  hub,
  is,
  join,
  narr,
  opt,
  say,
  set,
  stage,
  topic,
  unlock,
  when,
} from "../dsl"
import {
  type Beat,
  type Chapter,
  END,
  type FightSpec,
  type ObjectiveSpec,
} from "../types"
import { at, flat, hero, TIEDEUR, UNSTABLE, walk } from "./era5kit"

// Chapter 26, « Le grand équilibre »
// (docs/aventure/05-ombre-du-tout/26-le-grand-equilibre.md).

const BOARD = flat(9).map((r, y) => (y === 4 ? "....w...." : r))

const objectives: ObjectiveSpec[] = [
  {
    id: "carnet-intact",
    mark: "★",
    label: "Garder le Carnet intact",
    // SIMPLIFIED: the carrier is not tracked by the report; the Carnet is
    // intact while none of the team fell.
    check: (r) =>
      r.result !== "defeat" &&
      !r.fighters.some((f) => f.team === 0 && f.hp <= 0),
    success: "Le Carnet n'a pas pris l'eau tiède.",
    failure: "Quelques pages ont fondu.",
    onSuccess: [set("carnet_intact")],
    onFailure: [set("carnet_intact", false)],
  },
  {
    id: "garder-la-chaleur",
    mark: "◆",
    label: "Garder la chaleur",
    // SIMPLIFIED: no heat data; read as « no Séisme » (nothing broke).
    check: (r) => (r.divineUsed.earthquake ?? 0) === 0,
    onSuccess: [add("confiance")],
  },
  {
    id: "une-reparation",
    mark: "◆",
    label: "Une seule Réparation",
    check: (r) => (r.divineUsed.blessing ?? 0) === 1,
    onSuccess: [add("confiance.lyra")],
  },
  {
    id: "la-bulle",
    mark: "◆",
    label: "Laisser la bulle se former",
    // SIMPLIFIED: the bubble is read as both disruptive Influences used.
    check: (r) =>
      (r.divineUsed.earthquake ?? 0) > 0 && (r.divineUsed.timeWarp ?? 0) > 0,
    onSuccess: [set("vacuum_decay"), unlock("spell:vacuum-decay")],
  },
]

const fight: FightSpec = {
  id: "ch26-maree-tiede",
  title: "La Marée tiède",
  goal: "Tenir dix tours. La Tiédeur ne frappe pas : elle égalise. Protège le Carnet.",
  board: BOARD,
  teams: [
    {
      name: "L'équipe",
      side: "allies",
      fighters: [
        hero(1, 4),
        at("lyra", 1, 3),
        at("brutus", 2, 5),
        at("nerea", 1, 5),
      ],
    },
    {
      name: "La Marée",
      side: "enemies",
      // SIMPLIFIED: five waves become five Tiédeurs standing from the start
      // (the engine cannot spawn): one real, four unstable ones.
      fighters: [
        at(TIEDEUR, 7, 4),
        at(UNSTABLE, 7, 2),
        at(UNSTABLE, 7, 6),
        at(UNSTABLE, 6, 1),
        at(UNSTABLE, 6, 7),
      ],
    },
  ],
  rules: { clock: { period: 1, limit: 10, winner: 0 }, announce: true },
  influences: ["earthquake", "timeWarp", "blessing"],
  startEnergy: 4,
  objectives,
  defeat: [set("defaite"), add("usure"), add("confiance", -1)],
  lines: [
    {
      when: "start",
      who: "lyra",
      text: "C'est tiède. Tout est tiède. Je n'ai jamais eu aussi peu envie de me battre.",
    },
    {
      when: "tick:1",
      who: "merlin",
      text: "Les gradients s'aplatissent. Rien ne coule plus, parce que rien n'est plus plus bas que le reste.",
    },
    {
      when: "tick:3",
      who: "gorr",
      text: "Gorr a chaud. Pas bon chaud. Chaud partout, donc chaud nulle part.",
    },
    {
      when: "tick:5",
      who: "brutus",
      text: "On tient. Ce n'est pas glorieux. On tient.",
    },
  ],
}

const fightBeat = (): Beat => ({ t: "fight", fight })

export const ch26: Chapter = {
  id: "26",
  era: 5,
  number: 26,
  title: "Le grand équilibre",
  quote: {
    who: "Lyra",
    text: "Si tout se vaut, rien ne coule. Alors plus rien ne vit.",
  },
  place: "La Plaine tiède",
  question: {
    id: "Q26",
    text: "Le vide est-il le contraire de l'être, ou ce qu'il est au repos ?",
  },
  start: "1",
  scenes: {
    "1": {
      id: "1",
      title: "Les empreintes",
      kind: "rencontre",
      setting: "La Plaine tiède : des empreintes qui s'effacent",
      next: "2",
      beats: [
        stage(
          "Une plaine sans vent et sans ombre. Les empreintes de ceux qui sont passés s'y effacent à mesure, sans être comblées : elles s'étalent.",
        ),
        say("lyra", "Il fait doux. Ça devrait me réconforter."),
        say(
          "merlin",
          "Température uniforme, à la décimale près. Rien ne circule plus : c'est l'équilibre.",
        ),
        say("eva", "Nulle part à aller. Mon pire calcul."),
        narr("Ce n'est pas le froid qui est venu : c'est l'égalité."),
      ],
    },
    "2": {
      id: "2",
      title: "Le porteur",
      kind: "rencontre",
      setting: "Au milieu de la plaine",
      next: "3",
      beats: [
        say(
          "lyra",
          "Le Carnet craint l'eau tiède. Il faut quelqu'un qui le porte, et qui n'y touche pas.",
        ),
        choice(
          "porteur",
          [
            opt("lyra", "Lyra le porte.", [fx(add("confiance.lyra"))]),
            opt("brutus", "Brutus le porte.", [fx(add("confiance.brutus"))]),
            opt("nerea", "Néréa le porte.", [fx(add("confiance.nerea"))]),
          ],
          "Qui porte le Carnet ?",
        ),
      ],
    },
    "3": {
      id: "3",
      title: "La Marée tiède",
      kind: "combat",
      setting: "La plaine, neuf cases, quatre puits",
      beats: [
        stage("La Tiédeur monte, sans bruit, par vagues larges."),
        fightBeat(),
        when(is("defaite"), [
          narr(
            "La marée recule d'elle-même, rassasiée. Vous n'avez pas gagné, vous n'avez pas été défaits : vous avez seulement été égalisés un peu.",
          ),
          fx(set("defaite", false)),
        ]),
        when(is("vacuum_decay"), [
          say(
            "merlin",
            "Un point où l'équilibre se casse. Si le vide est un état au repos, il peut aussi se réveiller.",
          ),
          say("gorr", "Gorr a vu une bulle. Petite. Très mal élevée."),
        ]),
        when(is("paix_des_lacunes"), [
          stage("Nyx, qui regardait de loin, s'approche."),
          say(
            "nyx",
            "Je ne veux pas qu'on se disperse, ici. Venez à côté de moi.",
          ),
          choice("nyx-iv", [
            opt("accueillir", "L'accueillir.", [
              fx(join("nyx"), add("confiance.nyx", 2)),
              say("nyx", "Merci. Je n'ai pas l'habitude."),
            ]),
            opt("laisser", "La laisser libre.", [
              fx(add("confiance.nyx")),
              say("nyx", "Alors je viendrai quand je voudrai."),
            ]),
          ]),
        ]),
        go("4"),
      ],
    },
    "4": {
      id: "4",
      title: "Ce qui fait durer",
      kind: "rencontre",
      setting: "Au bord de la marée",
      next: "5",
      beats: [
        say(
          "squalor",
          "Tout est tiède. Même la faim. Elle n'est pas partie, elle s'est diluée.",
        ),
        choice(
          "durer",
          [
            opt("1", "« Ce qui dure, c'est ce qui s'échange. »", [
              fx(set("carnet.Q09", "repondue"), add("confiance.squalor")),
              say(
                "squalor",
                "Ça se mange, ça s'use, ça se rend. J'aime bien ça.",
              ),
            ]),
            opt("2", "« Ce qui dure, c'est ce qui change. »", [
              fx(set("carnet.Q09", "repondue")),
              say("squalor", "Alors on ne durera pas longtemps ici."),
            ]),
            opt("3", "(Ne pas répondre.)", []),
          ],
          "Qu'est-ce qui fait durer ?",
        ),
      ],
    },
    "5": {
      id: "5",
      title: "La dernière chaleur",
      kind: "veillee",
      setting: "Le dernier point un peu plus chaud que le reste",
      next: "6",
      beats: [
        stage(
          "Un seul endroit garde un peu de chaleur : le Carnet, contre la poitrine de celui qui le porte.",
        ),
        choice("q02", [
          opt("1", "« La chaleur ne se perd pas : elle se répartit. »", [
            fx(set("carnet.Q02", "repondue")),
          ]),
          opt("2", "« Elle se perd quand plus rien ne la sépare du reste. »", [
            fx(set("carnet.Q02", "repondue"), add("confiance.lyra")),
          ]),
          opt("3", "(Garder le silence.)", []),
        ]),
        when(gte("usure", 3), [
          say(
            "lyra",
            "Je peux porter un peu de ta fatigue. Pas toute. Un peu.",
          ),
          choice("offre", [
            opt("accepter", "Accepter.", [
              fx(add("usure", -1)),
              say("lyra", "Voilà. C'est tiède, mais c'est moins lourd."),
            ]),
            opt("refuser", "Refuser.", [
              say("lyra", "Comme tu veux. L'offre reste."),
            ]),
          ]),
        ]),
        say(
          "merlin",
          "Si l'équilibre est la fin, le vide n'est pas le contraire de l'être : c'est l'être au repos, sans plus rien qui le distingue de lui-même.",
        ),
        fx(set("carnet.Q26", "repondue")),
        hub("ecoutes", [
          topic("chaleur", "Écouter la chaleur", [
            narr("Elle est là, petite, obstinée."),
          ]),
          topic("nuit", "Écouter la plaine", [
            narr("Rien ne bouge. Même le rien ne bouge pas."),
          ]),
        ]),
      ],
    },
    "6": {
      id: "6",
      title: "Le vert",
      kind: "fin",
      setting: "À l'horizon, une tache de vert",
      beats: [
        narr(
          "Loin devant, un peu de vert. Quelque chose, sur la plaine, a repris pied sans qu'on lui demande.",
        ),
        fx({ give: "habit:chale-de-la-derniere-chaleur" }),
        go(END),
      ],
    },
  },
  exploration: walk(
    [
      { id: "1", label: "Les empreintes" },
      { id: "2", label: "Le porteur" },
      { id: "3", label: "La marée", auto: true },
      { id: "4", label: "Ce qui fait durer" },
      { id: "5", label: "La dernière chaleur" },
      { id: "6", label: "Le vert" },
    ],
    ["lyra", "brutus", "nerea"],
  ),
}
