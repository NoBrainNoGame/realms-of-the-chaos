import type { CharacterPreset } from "@realms/engine"
import {
  choice,
  fx,
  give,
  go,
  hint,
  lt,
  narr,
  opt,
  redirect,
  set,
  stage,
  unlock,
  when,
} from "../dsl"
import { type Chapter, END, type FightReport, type FightSpec } from "../types"

/** Little unstable Lacunaire of the tutorial: 6 HP, no attack. */
const lacunaireTutoriel: CharacterPreset = {
  id: "lacunaire_tutoriel",
  name: "Lacunaire instable",
  title: "Chose qui hésite",
  affinity: "shadow",
  locomotion: "swimmer",
  stats: {
    health: 6,
    speed: 4,
    physicalAttack: 0,
    physicalDefense: 1,
    magicalAttack: 0,
    magicalDefense: 1,
    luck: 1,
  },
  actions: [],
}

const cells = (x0: number, y0: number, x1: number, y1: number) => {
  const out: { x: number; y: number }[] = []
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) out.push({ x, y })
  return out
}

const ZONES = ["mare", "tertre", "rochers"]

/** Number of zones never lost (0 to 3). */
const zonesKept = (r: FightReport) =>
  ZONES.filter((z) => r.zoneStates[z] !== "lost").length

const prairie: FightSpec = {
  id: "prologue.prairie",
  title: "La prairie qui respire",
  goal: "Passer dans les trois endroits de la prairie avant que le bord ne s'en aille, puis toucher ce qui vient.",
  board: [
    ".........",
    ".~~......",
    ".~w~...1.",
    ".~~...121",
    ".......1.",
    "....a....",
    ".........",
    "...1.1...",
    "...121...",
  ],
  teams: [
    {
      name: "Le héros",
      side: "allies",
      fighters: [{ preset: "@hero", at: { x: 4, y: 4 } }],
    },
    {
      name: "Le Lacunaire",
      side: "enemies",
      // SIMPLIFIED: the Lacunaire is on the board from the start, at the east
      // fringe, instead of drifting in at turn 6 of the timeline.
      fighters: [{ preset: lacunaireTutoriel, at: { x: 8, y: 6 } }],
    },
  ],
  rules: {
    // The hero never drops under 1 HP.
    noDefeat: [0],
    // The Frange: a bodiless timeline entity that ticks.
    clock: { period: 10 },
    zones: [
      { id: "mare", cells: cells(1, 1, 3, 3) },
      { id: "tertre", cells: cells(6, 2, 8, 4) },
      { id: "rochers", cells: cells(3, 7, 5, 8) },
    ],
    zoneTeams: [0],
    fixOnDeath: [1],
    // No Influence of the Ghom before the coupling.
    lockedDivine: ["earthquake", "timeWarp", "blessing"],
  },
  influences: [],
  startEnergy: 0,
  seed: 7,
  objectives: [
    {
      id: "prairie_vivante",
      mark: "★",
      label: "Garder la prairie vivante : aucune zone ne devient silencieuse",
      // The engine only reports lost zones: "never lost" is what is counted.
      check: (r) => ({ ok: zonesKept(r) === 3, n: zonesKept(r) }),
      success: "Les trois endroits ont tenu.",
      failure: "Un bord s'en est allé en fils.",
      onSuccess: [{ add: "zones_prologue", by: 1, perUnit: true }],
      onFailure: [{ add: "zones_prologue", by: 1, perUnit: true }],
    },
    {
      id: "laisser_venir",
      mark: "◆",
      label: "Laisser le Lacunaire venir",
      // SIMPLIFIED: "do not strike before it is adjacent" cannot be read from
      // the report; approximated by "the fight lasted at least two ticks".
      check: (r) => r.result === "victory" && r.ticks >= 2,
      success: "Il est venu tout près, comme on s'approche d'un feu.",
      failure: "Il n'a pas eu le temps de venir.",
      onSuccess: [{ set: "lacunaire_approche", value: true }],
    },
  ],
  lines: [
    {
      when: "start",
      who: "heros",
      text: "Trois endroits. Je ne peux pas être partout, mais je peux passer partout.",
    },
    // CUT: the pedagogical steps 3a-3d (coût du sol, Course, timeline, premier
    // coup) are interface tips played by the game; only the narration remains.
    {
      when: "tick:1",
      who: "heros",
      text: "Le monde n'attend pas que j'aie fini. Il a son pas, et j'ai le mien.",
    },
    {
      when: "tick:3",
      who: "heros",
      text: "Quelque chose arrive du bord. Je n'arrive pas à dire ce que c'est. Lui non plus, je crois.",
    },
    {
      // SIMPLIFIED: `zone:<id>` is read as "this zone turned silent".
      when: "zone:mare",
      who: "heros",
      text: "Ici, il ne se passe plus rien. Personne n'y marche, rien n'y pousse, rien n'y chauffe. Et le sol a l'air... moins sûr d'être là.",
    },
    {
      when: "zone:tertre",
      who: "heros",
      text: "Ici, il ne se passe plus rien. Personne n'y marche, rien n'y pousse, rien n'y chauffe. Et le sol a l'air... moins sûr d'être là.",
    },
    {
      when: "zone:rochers",
      who: "heros",
      text: "Ici, il ne se passe plus rien. Personne n'y marche, rien n'y pousse, rien n'y chauffe. Et le sol a l'air... moins sûr d'être là.",
    },
    {
      when: "end",
      who: "heros",
      text: "Je l'ai touché, et il s'est décidé. C'est un galet, maintenant. Il est tiède, de ma main.",
    },
  ],
}

export const prologue: Chapter = {
  id: "prologue",
  era: 1,
  number: 0,
  title: "L'Aube",
  quote: {
    who: "heros",
    text: "J'ouvre les yeux. Quelque chose est tiède, et je crois que c'est moi.",
  },
  place:
    "Une prairie de l'île natale, au bord d'une mare, à l'aube, au printemps",
  question: { id: "Q00", text: "Pourquoi suis-je là ?" },
  start: "eveil",
  exploration: {
    // The meadow of the tutorial fight is the island itself.
    island: prairie.board,
    start: { x: 4, y: 4 },
    encounters: [
      {
        id: "eveil",
        label: "L'herbe haute",
        scene: "eveil",
        at: { x: 4, y: 4 },
        auto: true,
      },
      {
        id: "reflet",
        label: "La mare",
        scene: "reflet",
        at: { x: 2, y: 2 },
        zone: [
          { x: 1, y: 4 },
          { x: 2, y: 4 },
          { x: 3, y: 4 },
          { x: 0, y: 1 },
          { x: 0, y: 2 },
          { x: 0, y: 3 },
          { x: 4, y: 1 },
          { x: 4, y: 2 },
          { x: 4, y: 3 },
          { x: 1, y: 0 },
          { x: 2, y: 0 },
          { x: 3, y: 0 },
        ],
      },
      {
        id: "aube",
        label: "Le tertre",
        scene: "aube",
        at: { x: 7, y: 3 },
        zone: [
          { x: 6, y: 2 },
          { x: 7, y: 2 },
          { x: 8, y: 2 },
          { x: 6, y: 3 },
          { x: 7, y: 3 },
          { x: 8, y: 3 },
          { x: 6, y: 4 },
          { x: 7, y: 4 },
          { x: 8, y: 4 },
        ],
      },
      {
        id: "coin_froid",
        label: "Le bord qui pâlit",
        scene: "coin_froid",
        at: { x: 8, y: 6 },
        zone: [
          { x: 8, y: 5 },
          { x: 8, y: 6 },
          { x: 8, y: 7 },
          { x: 7, y: 6 },
        ],
      },
      {
        id: "couplage",
        label: "Le Clair",
        scene: "couplage",
        at: { x: 8, y: 4 },
        auto: true,
      },
      {
        id: "carnet",
        label: "Les rochers",
        scene: "carnet",
        at: { x: 4, y: 8 },
        zone: [
          { x: 3, y: 7 },
          { x: 4, y: 7 },
          { x: 5, y: 7 },
          { x: 3, y: 6 },
          { x: 4, y: 6 },
          { x: 5, y: 6 },
        ],
      },
      {
        id: "fin",
        label: "L'aube",
        scene: "fin",
        at: { x: 4, y: 4 },
        auto: true,
      },
      {
        id: "fleurs",
        label: "Des fleurs fermées",
        at: { x: 6, y: 2 },
        examine: {
          lines: [
            {
              text: "Des fleurs fermées, couvertes de rosée. Elles attendent le soleil ; elles n'ont pas l'air d'attendre quelqu'un.",
            },
          ],
        },
      },
      {
        id: "clair",
        label: "Le bord de l'herbe",
        at: { x: 8, y: 1 },
        examine: {
          lines: [
            {
              style: "stage",
              text: "Au-delà, l'herbe s'arrête net. Après, c'est le Clair : un vide clair et immense, avec, très loin, de petites îles comme des étoiles.",
            },
            {
              text: "Je ne sais pas ce que c'est. Je sais que je veux y regarder encore.",
            },
          ],
        },
      },
    ],
  },
  scenes: {
    eveil: {
      id: "eveil",
      title: "L'éveil",
      kind: "rencontre",
      setting: "De l'eau qui goutte, des insectes, le vent dans l'herbe haute.",
      next: "reflet",
      beats: [
        stage(
          "Écran noir. Un son d'abord : de l'eau qui goutte, des insectes, le vent dans l'herbe haute. Puis une lumière grise, très basse, qui monte.",
        ),
        narr(
          "J'ouvre les yeux. Le ciel est pâle, sans étoiles, ou presque : il reste quelques points très loin, qui ne clignent pas. Le sol sous mon dos est humide, et tiède à l'endroit où je suis couché. Ailleurs, il est froid.",
        ),
        narr(
          "Je ne sais pas comment je suis arrivé ici. Je ne sais pas si « arriver » est le bon mot.",
        ),
        stage(
          "Le héros se redresse. Caméra basse, au ras de l'herbe : de la rosée, une mare à quelques pas, un tertre couvert de fleurs fermées, plus loin un amas de rochers. Au-delà, l'herbe s'arrête net. Après, c'est le Clair : un vide clair et immense, avec, très loin, d'autres îles minuscules suspendues.",
        ),
        narr("L'herbe s'arrête là-bas, comme une phrase qu'on n'a pas finie."),
        choice("eveil", [opt("lever", "Se lever.")]),
        fx(give("linge_d_aube")),
      ],
    },
    reflet: {
      id: "reflet",
      title: "Le reflet",
      kind: "rencontre",
      setting: "Une mare, immobile.",
      next: "aube",
      beats: [
        stage(
          "Le héros s'approche de la mare et s'agenouille. L'eau est immobile. La lumière de l'aube s'y reflète, et son visage avec.",
        ),
        narr(
          "Il y a quelqu'un dans l'eau. Il fait ce que je fais. C'est donc moi.",
        ),
        // CUT: the character creator (Atelier: silhouette, peau, visage) is run
        // by the game on the reflection; the scene only offers gestures.
        choice("reflet", [
          opt("silhouette", "Bouger un bras", [
            narr(
              "Je bouge un bras. Le reflet aussi. Il a ma forme, ou j'ai la sienne.",
            ),
            redirect("peau"),
          ]),
          opt("peau", "Passer la main sur sa peau", [
            narr(
              "La lumière glisse sur ma peau comme sur l'eau. Elle ne s'y arrête pas.",
            ),
            redirect("visage"),
          ]),
          opt("visage", "Regarder son visage", [
            narr(
              "Je ne reconnais rien. Il faudra bien que ce soit moi quand même.",
            ),
          ]),
        ]),
        stage(
          "Le héros se relève. Une goutte tombe de sa main dans la mare, et le reflet se brouille.",
        ),
        narr(
          "L'eau s'agite, puis se calme. Elle garde la ride un moment, puis elle l'oublie.",
        ),
      ],
    },
    aube: {
      id: "aube",
      title: "La prairie qui respire",
      kind: "combat",
      setting: "Une prairie de 9 par 9, au bord du Clair.",
      next: "coin_froid",
      beats: [
        fx(unlock("ui:timeline"), unlock("action:sprint")),
        { t: "fight", fight: prairie },
      ],
    },
    coin_froid: {
      id: "coin_froid",
      title: "Le coin froid",
      kind: "lacune",
      setting: "Là où plus rien ne se passe.",
      next: "couplage",
      beats: [
        when(
          lt("zones_prologue", 3),
          [
            stage(
              "L'herbe y a pâli. La rosée ne s'évapore plus. Le chant des insectes s'est arrêté, et le bord de la case la plus proche du vide semble flou, comme un tissu dont on tire les fils.",
            ),
            narr(
              "Ici, il ne se passe plus rien. Personne n'y marche, rien n'y pousse, rien n'y chauffe. Et le sol a l'air... moins sûr d'être là.",
            ),
            narr(
              "Je pose le pied dessus. C'est froid, mais c'est là. Il faut que quelque chose y passe. Moi, s'il n'y a que moi.",
            ),
          ],
          [
            // Contemplative version: no zone was lost, the scene is played at the fringe.
            narr(
              "Là-bas, au bord, rien ne bouge depuis longtemps. Je ne sais pas comment je le sais. L'herbe y est grise, et le bord s'en va en fils. Je ne peux pas être partout.",
            ),
          ],
        ),
      ],
    },
    couplage: {
      id: "couplage",
      title: "Le couplage",
      kind: "fin",
      setting: "Le soleil franchit la ligne du Clair.",
      next: "carnet",
      beats: [
        stage(
          "Fin du combat. Le soleil franchit la ligne du Clair. La lumière devient dorée, rasante, et chaque brin d'herbe projette une ombre longue. Le héros est au centre de la prairie.",
        ),
        stage(
          "Puis tout ralentit. Pas l'image : le son. Le vent s'étire en une note grave, les gouttes de rosée tombent avec une lenteur absurde. Une pression se pose sur la prairie, pas sur le héros seulement : sur l'herbe, sur la mare, sur les rochers. L'air se courbe légèrement au-dessus du tertre, comme au-dessus d'une flamme, et la lumière qui le traverse se déforme en une lentille.",
        ),
        narr(
          "Il y a quelque chose. Ce n'est pas quelqu'un, je crois. Ou pas comme moi. C'est comme quand on sait qu'un orage arrive avant le premier bruit.",
        ),
        narr(
          "Ça ne me regarde pas : ça me touche. Ça touche tout ce qui est ici, la mare et les pierres aussi. Et je sens que ça change, de m'avoir touché. Comme moi, de l'avoir senti.",
        ),
        stage("La pression se stabilise."),
        hint(
          "L'Élan",
          "Une jauge apparaît, presque vide. Elle se remplit très lentement à mesure que la lumière de l'aube monte.",
        ),
        fx(unlock("ui:elan"), give("galet_tiede")),
        narr(
          "La lumière arrive, et ça se remplit. Comme une pente qu'on descend.",
        ),
      ],
    },
    carnet: {
      id: "carnet",
      title: "Le Carnet",
      kind: "rencontre",
      setting: "Au pied des rochers, une écorce souple et un éclat de charbon.",
      next: "fin",
      beats: [
        stage(
          "Le héros trouve, au pied des rochers, une écorce souple et un éclat de charbon, reste d'un feu ancien. Il s'assoit et trace un premier signe. Le Carnet des Questions s'ouvre.",
        ),
        fx(give("carnet"), unlock("ui:carnet")),
        narr(
          "Je ne sais rien. Alors je vais écrire ce que je ne sais pas. Ça fera au moins une chose de sûre.",
        ),
        choice("q00", [
          opt("pourquoi", "« Pourquoi suis-je là ? »", [
            narr("Je l'écris. Ça ne répond à rien. Mais c'est écrit."),
          ]),
          opt("qui", "« Qui m'a mis là ? »", [
            narr(
              "Je l'écris, puis je barre « qui ». Je ne sais pas si c'est un « qui ». J'écris : « Pourquoi suis-je là ? »",
            ),
          ]),
          opt("regarder", "Ne rien écrire, regarder le Clair.", [
            narr(
              "Je reste longtemps sans écrire. Puis ma main écrit toute seule : « Pourquoi suis-je là ? » Ce n'est pas une réponse, mais c'est un début.",
            ),
          ]),
        ]),
        fx(set("carnet.Q00", "ouverte")),
      ],
    },
    fin: {
      id: "fin",
      title: "Realms of the Chaos",
      kind: "fin",
      setting: "Ère I - L'Aube des Fragments",
      beats: [
        stage(
          "Fondu. Titre : Realms of the Chaos. Sous-titre : Ère I - L'Aube des Fragments.",
        ),
        go(END),
      ],
    },
  },
}
