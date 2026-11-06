import {
  add,
  all,
  choice,
  fx,
  give,
  go,
  gte,
  is,
  narr,
  opt,
  puzzle,
  say,
  set,
  stage,
  when,
} from "../dsl"
import type { PuzzleSpec } from "../puzzle"
import {
  type Beat,
  type Chapter,
  END,
  type FightSpec,
  type Option,
} from "../types"
import {
  EFFILOCHEUR,
  GUETTEUSE,
  look,
  movable,
  PORTEUSE,
  THERMISTE,
  UNSTABLE,
  VILLAGEOIS,
  zoneOf,
} from "./era2-kit"

// The Strates island, where the Ondines keep their annals. It is also the
// walkable island; the reconstitutions have their own boards.
const STRATES = [
  "~~~~~~~~~",
  "~...~...~",
  "~.......~",
  "~..~~~..~",
  "~.......~",
  "~.......~",
  "~..~.~..~",
  "~~~~~~~~~",
]

// A Fragment in perfectly regular terraces, seen through the silt.
const FRAGMENT = [
  "222...222",
  "2.2...2.2",
  "....1....",
  ".1.....1.",
  ".........",
  ".1.....1.",
  "....1....",
  "...~~~...",
  "~~~~~~~~~",
]

const DEFEAT_LINE = "La couche s'est refermée sur nous avant la chaleur"

const zone = zoneOf(STRATES)

const echoes = [
  { preset: PORTEUSE, at: { x: 4, y: 2 } },
  { preset: THERMISTE, at: { x: 1, y: 3 } },
  { preset: GUETTEUSE, at: { x: 7, y: 3 } },
]

// Reconstitution II: the Thermiste lives on the north terrace, his tools
// are in its layer; the village (cells `2` of the top) goes down to the shore.
const NORD = [0, 1].flatMap((y) =>
  Array.from({ length: 9 }, (_, x) => ({ x, y })),
)
const BAS = Array.from({ length: 7 }, (_, i) => i + 2).flatMap((y) =>
  Array.from({ length: 9 }, (_, x) => ({ x, y })),
)
const RIVAGE = [6, 7].flatMap((y) =>
  Array.from({ length: 9 }, (_, x) => ({ x, y })).filter(
    (p) => !(p.y === 7 && p.x >= 3 && p.x <= 5),
  ),
)
const echoes2 = [
  { preset: PORTEUSE, at: { x: 4, y: 2 } },
  { preset: THERMISTE, at: { x: 1, y: 0 } },
  { preset: GUETTEUSE, at: { x: 7, y: 3 } },
]

/** Reconstitution I: a Fragment kept with a perfect cadence against a small Marée. */
const reco1: FightSpec = {
  id: "ch11-fragment-entretenu",
  title: "Reconstitution I : le Fragment entretenu",
  board: FRAGMENT,
  teams: [
    { name: "Les Échos de l'époque", side: "allies", fighters: echoes },
    {
      name: "La petite Marée",
      side: "enemies",
      fighters: [
        { preset: UNSTABLE, at: { x: 3, y: 1 } },
        { preset: UNSTABLE, at: { x: 4, y: 0 } },
        { preset: UNSTABLE, at: { x: 5, y: 1 } },
        { preset: UNSTABLE, at: { x: 4, y: 1 } },
      ],
    },
  ],
  // The Élan fills at a perfect cadence: one point every tick, nothing
  // between. The two marked cells of the south are the only ones the Séisme
  // may reshape (the traces are read from where the Influences were cast).
  rules: {
    clock: { period: 1, limit: 10, winner: 0 },
    energy: { cadence: { team: 0, every: 1 } },
    regions: {
      terrasse_ouest: [{ x: 1, y: 5 }],
      terrasse_est: [{ x: 7, y: 5 }],
    },
  },
  influences: ["blessing", "earthquake"],
  startEnergy: 4,
  goal: "Repousser la petite Marée. Les traces : une chaleur à chaque occasion, deux terrasses neuves au sud, aucun Écho dispersé.",
  defeat: [set("defaite"), add("usure", 1), add("confiance.nerea", -1)],
  objectives: [
    {
      id: "fidele-1",
      mark: "★",
      label: "Ne pas réécrire",
      // Trace 1: the Réparation is used; trace 2: a Séisme on each of the two
      // south terraces and nowhere else; trace 3: no Écho dispersed.
      when: [
        { castOn: { region: "terrasse_ouest", divine: "earthquake" } },
        { castOn: { region: "terrasse_est", divine: "earthquake" } },
      ],
      check: (r) =>
        (r.divineUsed.blessing ?? 0) >= 1 &&
        (r.divineUsed.earthquake ?? 0) <= 2 &&
        r.fighters.filter((f) => f.team === 0).every((f) => f.hp > 0),
      success: "La reconstitution tient : elle suit les traces.",
      failure: "La carte se craquelle comme de la vase sèche.",
      onSuccess: [set("ch11_fidele1")],
    },
  ],
  lines: [
    {
      when: "start",
      who: "nerea",
      text: "Écoutez la cadence. Un, deux, trois… chaleur. Un, deux, trois… chaleur. Ce Ghom ne laissait rien au hasard.",
    },
    {
      when: "start",
      who: "eva",
      text: "C'est beau. C'est exactement ce que je voudrais être. Un temps. C'est un peu effrayant, aussi.",
    },
    {
      when: "tick:3",
      who: "echo_thermiste",
      text: "Tout tient. Tout tiendra.",
    },
  ],
}

/** Reconstitution II: the stop. Frost, first Lacunaires, three villagers to bring down. */
function reco2(squalor: boolean): FightSpec {
  return {
    id: squalor ? "ch11-l-arret-squalor" : "ch11-l-arret",
    title: "Reconstitution II : l'arrêt",
    board: FRAGMENT,
    teams: [
      { name: "Les Échos de l'époque", side: "allies", fighters: echoes2 },
      {
        name: "Les villageois",
        side: "neutral",
        fighters: [
          ...[3, 4, 5].map((x) => ({
            preset: VILLAGEOIS,
            at: { x, y: 1 },
            script: [{ act: { do: "move" as const, to: { x, y: 6 } } }],
          })),
        ],
      },
      {
        name: "Les premiers Lacunaires",
        side: "enemies",
        fighters: [
          { preset: UNSTABLE, at: { x: 0, y: 4 }, arrives: { tick: 5 } },
          { preset: UNSTABLE, at: { x: 8, y: 4 }, arrives: { tick: 5 } },
          { preset: EFFILOCHEUR, at: { x: 0, y: 6 }, arrives: { tick: 7 } },
          { preset: EFFILOCHEUR, at: { x: 8, y: 6 }, arrives: { tick: 7 } },
        ],
      },
    ],
    // Tour 4: the Élan falls to zero and stays there (the Influences grey out);
    // from then on a cell nobody stood on for 3 ticks frays into a Lacune.
    // The first Lacunaires come at tours 5 and 7.
    rules: {
      neutral: [1],
      clock: { period: 1, limit: 10, winner: 0 },
      energy: { stopAt: { team: 0, tick: 4 } },
      idleFray: { from: 4, idle: 3 },
      regions: { nord: NORD, bas: BAS, rivage: RIVAGE },
    },
    influences: ["blessing", "earthquake"],
    startEnergy: 3,
    goal: "Survivre jusqu'à la dixième couche : au moins deux villageois au rivage sud. Les traces disent que le Thermiste reste sur la terrasse nord.",
    defeat: [set("defaite"), add("usure", 1), add("confiance.eva", -1)],
    objectives: [
      {
        id: "fidele-2",
        mark: "★",
        label: "Ne pas réécrire",
        // Trace 1: by tour 8 nobody of the village is left on the north
        // terrace; trace 2: the Thermiste never leaves it; trace 3: at least
        // two villagers reach the south shore.
        when: [
          { not: { held: { region: "nord", who: { team: 1 }, ticks: 8 } } },
          { not: { visited: { region: "bas", who: "echo_thermiste" } } },
          { visited: { region: "rivage", who: "villageois" } },
        ],
        check: (r) =>
          r.fighters.filter((f) => f.preset === "villageois" && f.hp > 0)
            .length >= 2,
        success: "Voilà ce qui s'est passé. Pas ce que nous aurions voulu.",
        failure:
          "La paroi de vase ne correspond plus à rien de ce qui s'affiche.",
        onSuccess: [set("ch11_fidele2")],
      },
    ],
    lines: [
      {
        when: "tick:3",
        who: "eva",
        text: "Il a… arrêté. Comme ça. Sans raison visible.",
      },
      {
        when: "tick:3",
        who: "nerea",
        text: "Là. La dernière couche de chaleur. Après, plus rien.",
      },
      { when: "tick:5", who: "lacunaire", text: "Ce sont… nos premiers." },
      {
        when: "tick:5",
        who: "nerea",
        text: "La couche du village s'arrête ici. Ils sont partis. Ou ils ne sont pas partis.",
      },
      ...(squalor
        ? [
            {
              when: "tick:5" as const,
              who: "squalor",
              text: "Personne ne vient. Bienvenue chez les Squales.",
            },
          ]
        : []),
      {
        when: "end",
        who: "nerea",
        text: "Voilà ce qui s'est passé. Pas ce que nous aurions voulu. Ce qui s'est passé.",
      },
    ],
  }
}

const reco2Beat: Beat = when(
  is("squalor_rejoint"),
  [{ t: "fight", fight: reco2(true) }],
  [{ t: "fight", fight: reco2(false) }],
)

/** One step of the stratigraphy riddle: pick the next layer; a wrong pick is corrected, nothing breaks. */
function strate(
  id: string,
  right: string,
  wrong: string,
  correction: string,
  swap: boolean,
  after: Beat[],
): Beat[] {
  const good: Option = opt(`${id}-bon`, right, [])
  const bad: Option = opt(`${id}-faux`, wrong, [say("nerea", correction)])
  return [
    choice(
      id,
      swap ? [bad, good] : [good, bad],
      "Quelle couche vient ensuite ?",
    ),
    ...after,
  ]
}

// The wall of the old shore, one cell per stretch; the lantern lights what it
// passes over.
const LANTERNE: PuzzleSpec = {
  kind: "grid",
  w: 6,
  h: 1,
  tokens: [{ id: "lanterne", label: "La lanterne", at: { x: 0, y: 0 } }],
  moves: 5,
  rules: [
    { id: "roche", kind: "visit", cells: [{ x: 1, y: 0 }] },
    { id: "camp", kind: "visit", cells: [{ x: 3, y: 0 }] },
    { id: "eclats", kind: "visit", cells: [{ x: 5, y: 0 }] },
  ],
}

export const ch11: Chapter = {
  id: "11",
  era: 2,
  number: 11,
  title: "Les strates",
  quote: {
    who: "nerea",
    text: "Chez les Ondines, une lacune, c'est une couche qui manque. J'ai passé ma vie à les noter dans la vase sans savoir qu'un jour j'en lirais la première.",
  },
  place: "L'île des Strates, puis les Abysses de Néréa",
  question: {
    id: "Q11",
    text: "Peut-on accepter un passé qu'on ne peut pas changer ?",
  },
  start: "s1",
  exploration: {
    island: STRATES,
    start: { x: 1, y: 1 },
    companions: ["nerea", "eva"],
    influences: ["earthquake", "timeWarp"],
    encounters: [
      {
        id: "s1",
        label: "Aubin sur la jetée",
        scene: "s1",
        at: { x: 2, y: 1 },
        zone: zone(2, 1),
      },
      {
        id: "s2",
        label: "Les annales",
        scene: "s2",
        at: { x: 6, y: 1 },
        zone: zone(6, 1),
        actor: "nerea",
      },
      {
        id: "s3",
        label: "La couche de l'Aube",
        scene: "s3",
        at: { x: 4, y: 2 },
        zone: zone(4, 2),
      },
      {
        id: "s4",
        label: "Le Fragment entretenu",
        scene: "s4",
        at: { x: 2, y: 4 },
        zone: zone(2, 4),
        auto: true,
      },
      {
        id: "s5",
        label: "L'arrêt",
        scene: "s5",
        at: { x: 6, y: 4 },
        zone: zone(6, 4),
        auto: true,
      },
      {
        id: "s6",
        label: "Ce qui repousse",
        scene: "s6",
        at: { x: 4, y: 5 },
        zone: zone(4, 5),
      },
      {
        id: "s7",
        label: "Le bassin des Strates",
        scene: "s7",
        at: { x: 4, y: 6 },
        zone: zone(4, 6),
      },
      look("colonnes", "Des colonnes de vase séchée", { x: 1, y: 2 }, [
        "Des tubes de roseau étiquetés d'une écriture fine : un nom de lieu, un âge approximatif, parfois un mot seul, « trou ».",
        {
          who: "nerea",
          style: "say",
          text: "Ne les touche pas avec le doigt mouillé. La vase boit tout.",
        },
      ]),
      look("ardoises", "Des étagères d'ardoises", { x: 7, y: 2 }, [
        "Chaque ardoise note une saison : une couche claire, une couche sombre, un grain de cendre. Dans un coin, quelqu'un a gravé : « ne pas conclure ».",
      ]),
      movable(
        "niche",
        "Une niche d'ardoises scellée",
        { x: 3, y: 5 },
        "timeWarp",
        "Une niche murée par le sel. Les ardoises à l'intérieur sont trop fines pour être décollées à la main.",
        "Une pointe de Distorsion fait descendre la saison : le sel se délite, les ardoises se laissent prendre une à une.",
      ),
      {
        id: "pecheur-egare",
        label: "Un jeune Lacunaire égaré",
        at: { x: 7, y: 5 },
        wander: {
          preset: UNSTABLE,
          title: "Un Lacunaire instable",
          goal: "Le reconduire à l'eau sans le blesser.",
          range: 2,
          radius: 3,
          effects: [{ add: "ecoute", by: 1 }],
          success: "Il a glissé jusqu'à l'eau, et s'est laissé porter.",
        },
      },
    ],
  },
  scenes: {
    s1: {
      id: "s1",
      title: "Aubin sur la jetée",
      kind: "rencontre",
      setting: "L'embarcadère de Sauge",
      next: "s2",
      beats: [
        stage(
          "Aubin a suivi l'équipe jusqu'à l'embarcadère, prétendument pour « vérifier les cordes ».",
        ),
        say("aubin", "Néréa. Tu descends encore ?"),
        say("nerea", "Plus profond que d'habitude."),
        say(
          "aubin",
          "Pour quoi faire ? Ce qui est en bas est en bas. Le passé, ça se laisse couler. Ma mère disait : celui qui remonte tout ce qui a coulé finit par couler avec.",
        ),
        choice("jetee", [
          opt("lacunes", "Il faut savoir d'où viennent les Lacunes.", [
            fx(add("confiance.nerea")),
          ]),
          opt("raison", "Il a peut-être raison.", []),
          opt("viens", "Viens avec nous, Aubin.", [
            say(
              "aubin",
              "À mon âge ? La seule chose que je descends, c'est l'escalier. Et encore, lentement.",
            ),
          ]),
        ]),
      ],
    },

    s2: {
      id: "s2",
      title: "Les annales",
      kind: "rencontre",
      setting: "L'île des Strates : une maison basse, des étagères d'ardoises",
      next: "s4",
      beats: [
        stage(
          "L'île des Strates : une maison basse, des étagères d'ardoises, des colonnes de vase séchée dans des tubes de roseau, étiquetées. Néréa en sort une : des centaines de fines couches, claires et sombres.",
        ),
        say(
          "nerea",
          "Une couche claire en été, une sombre en hiver. On compte, comme on compte les cernes d'un arbre. Un grain de cendre, c'est un feu. Une couche rougie, c'est une chaleur. Une coquille, c'est une bête qui vivait là. Ce que je lis, ce sont des traces. Le passé lui-même, lui, est parti. Personne ne le revit. On le reconstitue.",
        ),
        say("eva", "Des données. Enfin des données."),
        when(is("squalor_rejoint"), [
          say("squalor", "On descend voir des cailloux. Formidable."),
        ]),
        say(
          "nerea",
          "En bas, je lirai, et nous rejouerons ce que la vase permet de déduire. Pas plus. Si nous faisons mieux que ce que disent les couches, si nous sauvons quelqu'un qu'elles disent perdu, alors nous ne lisons plus : nous inventons. Et la reconstitution se brise, comme une ardoise qu'on force.",
        ),
        choice("regle", [
          opt("pourquoi", "Et si on veut savoir pourquoi ?", [
            fx(add("confiance.nerea")),
            say(
              "nerea",
              "La vase ne garde pas les raisons. Elle garde ce qui est tombé.",
            ),
          ]),
          opt("compris", "Compris.", []),
        ]),
        stage(
          "Le Carnet : « Que gardent les profondeurs de ce qui a été ? » Réponse : des traces, pas le passé lui-même. On le reconstitue, on ne le revit pas.",
        ),
        fx(set("carnet.Q04", "repondue")),
        stage(
          "Néréa propose un détour par le fond de l'ancien Lac, avant la paroi noire. Ce sera froid.",
        ),
        choice("detour", [
          opt("archive", "Faire le détour (usure +1).", [
            fx(add("usure"), add("archives.lues"), set("ch11_archive")),
            go("s3"),
          ]),
          opt("directement", "Aller droit à la paroi.", [go("s4")]),
        ]),
      ],
    },

    s3: {
      id: "s3",
      title: "La couche de l'Aube",
      kind: "rencontre",
      setting:
        "Le fond de l'ancien Lac de Néréa, quatre siècles de vase au-dessus",
      next: "s4",
      beats: [
        say(
          "nerea",
          "Votre époque est là, Dormeur. Quatre siècles de vase au-dessus. Ce sera froid.",
        ),
        stage(
          "Pas de combat : une lecture guidée. Le héros déplace une lanterne le long de la paroi ; chaque trace s'allume au passage. La lumière ne crée rien : elle rend visible ce que la vase a gardé.",
        ),
        puzzle(
          "lanterne",
          LANTERNE,
          {
            roche: [stage("La lanterne passe sur une roche chauffée, mince.")],
            camp: [stage("Plus loin, des cendres de petits feux, empilées.")],
            eclats: [
              stage("Au bout de la paroi, des éclats d'un cristal taillé."),
            ],
          },
          {
            prompt:
              "Déplace la lanterne le long de la paroi : chaque trace s'allume là où elle passe.",
          },
        ),
        stage(
          "Une couche de roche chauffée, mince, au bord de l'ancien rivage, avec des éclats d'un cristal taillé.",
        ),
        say(
          "nerea",
          "Une chaleur brève, intense, sur une petite surface. Quelqu'un a réparé ce bord en y mettant tout ce qu'il avait. Et ces éclats… un diadème ?",
        ),
        stage("Le héros reconnaît le diadème de cristal de Lyra."),
        say(
          "nerea",
          "Elle n'est pas montée au ciel. Elle est restée là, sur ce bord. La chaleur s'est dispersée dans la roche. La roche s'en souvient à sa façon : elle a changé de couleur.",
        ),
        stage(
          "Un camp sur l'ancienne rive : des arêtes de poisson, des cendres de petits feux sur des dizaines d'hivers, et une dent de trident usée.",
        ),
        stage("Néréa reste longtemps silencieuse."),
        say(
          "nerea",
          "Une des trois dents d'origine. Néréa la Première n'est pas devenue la mémoire de l'eau. Elle a vieilli au bord de son lac, elle a pêché, elle a fait du feu. Et un hiver, plus de feu. Un temps. Je préfère ça. C'est plus vrai. Et c'est plus à nous.",
        ),
        when(
          is("fragments", "fusion"),
          [
            stage(
              "La couche de la Collision : un pli serré où la vase verte et la vase noire se mêlent, sans couche entre elles.",
            ),
            say(
              "nerea",
              "Les deux terres se sont soudées. Pas sous un regard : sous la pression.",
            ),
          ],
          [
            stage(
              "La couche de la Collision : une cicatrice nette, une couche de débris noirs, puis plus rien de noir.",
            ),
            say(
              "nerea",
              "Elles se sont touchées, puis repoussées. Il est resté ce qui s'est arraché.",
            ),
          ],
        ),
        when(
          is("lacune_geante_habitee"),
          [
            stage(
              "La Lacune géante : une couche très mince, mais continue, avec les cendres de deux feux côte à côte.",
            ),
            say(
              "nerea",
              "Deux personnes ont vécu au bord de rien, assez longtemps pour que la vase continue de tomber.",
            ),
          ],
          [
            stage(
              "La Lacune géante : une lacune au sens des Ondines, un intervalle où aucune couche ne s'est déposée.",
            ),
            say(
              "nerea",
              "Ici, pendant un temps, il ne s'est rien passé du tout. Pas même de la vase.",
            ),
          ],
        ),
        choice("merci", [
          opt("merci", "Merci de me l'avoir montré.", [
            fx(add("confiance.nerea")),
          ]),
          opt("legende", "J'aurais préféré la légende.", [
            say("nerea", "Moi aussi, un peu."),
          ]),
        ]),
        narr(
          "Les Ondines chantent que l'eau se souvient. L'eau ne se souvient de rien : elle passe. C'est la vase qui garde, parce qu'elle tombe et ne remonte pas. J'ai trouvé la dent de mon aïeule à côté de ses arêtes de poisson. Je l'ai laissée en place. Elle est mieux dans sa couche que dans ma poche.",
        ),
      ],
    },

    s4: {
      id: "s4",
      title: "Le Fragment entretenu",
      kind: "combat",
      setting: "La paroi de vase des Abysses, sous la lanterne de Néréa",
      next: "s5",
      beats: [
        stage(
          "Descendre dans les Abysses coûte au héros : le froid, la pression, des heures sans lumière.",
        ),
        fx(add("usure"), add("archives.lues")),
        stage(
          "Contre la paroi, des couches de vase plus anciennes que l'Archipel racontent l'histoire de l'autre Fragment. Les Échos de l'époque, des silhouettes de grains de vase sans visage, se dressent à la lueur de la lanterne.",
        ),
        { t: "fight", fight: reco1 },
        when(is("defaite"), [
          stage(
            "Les grains retombent en pluie. La lanterne s'éteint, puis se rallume plus bas.",
          ),
          say("nerea", `${DEFEAT_LINE}. On relit la couche, sans la rejouer.`),
          fx(set("defaite", false)),
          go("s5"),
        ]),
      ],
    },

    s5: {
      id: "s5",
      title: "L'arrêt",
      kind: "combat",
      setting: "La même paroi, des années plus tard",
      next: "s6",
      beats: [
        stage(
          "La même carte, des années plus tard. La terrasse nord abrite un village.",
        ),
        reco2Beat,
        when(is("defaite"), [
          stage(
            "Les silhouettes se défont dans le froid, l'une après l'autre.",
          ),
          say(
            "nerea",
            `${DEFEAT_LINE}. Je lis la fin à voix haute, faute de la rejouer.`,
          ),
          fx(set("defaite", false)),
          go("s6"),
        ]),
        when(
          all(is("ch11_fidele1"), is("ch11_fidele2")),
          [
            fx(set("ch11_etoile")),
            say(
              "nerea",
              "Voilà ce qui s'est passé. Pas ce que nous aurions voulu. Ce qui s'est passé.",
            ),
          ],
          [
            fx(set("reconstitution_forcee"), add("confiance.nerea", -1)),
            say(
              "nerea",
              "Ce n'est pas ce que dit la vase. Ce que nous venons de jouer est un chant. Plus une lecture.",
            ),
          ],
        ),
      ],
    },

    s6: {
      id: "s6",
      title: "Ce qui repousse",
      kind: "scene",
      setting: "Au-dessus de la lacune, la vase reprend",
      next: "s7",
      beats: [
        stage(
          "Au-dessus de la lacune de la reconstitution II, la vase reprend. Néréa éclaire les couches une par une. Il faut remettre les traces dans l'ordre où elles se sont déposées. Une erreur ne casse rien.",
        ),
        stage("Première couche : une vase grise, sans rien dedans."),
        say(
          "lacunaire",
          "Là. C'est là que nous… que les nôtres sont nés. Dans le gris.",
        ),
        ...strate(
          "c2",
          "Des filaments de mousse, très fins.",
          "Des coquilles et des arêtes.",
          "La mousse avant les coquilles. Il faut d'abord quelque chose à manger.",
          false,
          [],
        ),
        ...strate(
          "c3",
          "De minuscules cristaux qui ont poussé au lieu de se déposer.",
          "Des cendres de feux, des outils de pierre noire.",
          "Pas encore de feux : il n'y a personne pour les allumer.",
          true,
          [
            say("eva", "Des cristaux qui poussent tout seuls ?"),
            say("nerea", "Il n'y a pas qu'une façon d'être vivant."),
          ],
        ),
        ...strate(
          "c4",
          "Des coquilles et des arêtes.",
          "Des marques d'Influence espacées, irrégulières.",
          "Les marques viennent après la vie qui les remarque.",
          false,
          [],
        ),
        ...strate(
          "c5",
          "Des cendres de feux, des outils de pierre noire.",
          "Des marques d'Influence espacées, irrégulières.",
          "Les feux d'abord. Quelqu'un doit les voir, avant qu'on les marque.",
          true,
          [
            say(
              "nerea",
              "Des Échos. Revenus seuls, ou nés là. Personne ne les a entretenus. Ils se sont débrouillés avec le déséquilibre qu'il restait : un peu de chaleur du fond, un peu de lumière. La vie n'a pas attendu qu'on revienne s'occuper d'elle.",
            ),
            when(is("squalor_rejoint"), [
              say("squalor", "Évidemment. Il y avait à manger."),
            ]),
          ],
        ),
        stage(
          "Dernière couche : des marques d'Influence espacées, irrégulières, sans couche de chaleur.",
        ),
        say(
          "nerea",
          "Ces marques d'Influence, en haut. Elles reviennent, après la lacune. Plus rares, plus irrégulières. Plus de Réparation : plus jamais de couche de chaleur. Mais regardez leur cadence.",
        ),
        say(
          "eva",
          "Même intervalle que les couches de chaleur d'en bas. Exactement. À la couche près.",
        ),
        say(
          "nerea",
          "C'est la même cadence que dans la couche de la Collision, celle de votre époque, Dormeur. J'ai noté celle de votre Ghom depuis que vous êtes sorti du Puits : elle ne ressemble à aucune autre. Celle-ci non plus. Et c'est celle du Ghom de la Terre Noire.",
        ),
        say(
          "nerea",
          "Le Ghom du Chaos, celui que nos chants appellent le Dévoreur, a d'abord été celui-ci : un Ghom de l'Ordre, qui entretenait son Fragment avec une régularité parfaite. Puis il a cessé.",
        ),
        when(
          is("reconstitution_forcee"),
          [],
          [
            say(
              "nerea",
              "Il n'a rien détruit. Il a arrêté. Et quand il est revenu, il ne réparait plus rien.",
            ),
          ],
        ),
        choice("verite", [
          opt("pourquoi", "Pourquoi a-t-il arrêté ?", [
            say("nerea", "La vase ne garde pas les raisons."),
          ]),
          opt("lacunes", "Alors les Lacunes, c'est lui.", [
            fx(add("confiance.nerea")),
            say(
              "nerea",
              "Les premières. Celles d'ici. Les autres… les Lacunes naissent partout où plus rien n'interagit. Il a seulement été le premier à laisser faire.",
            ),
          ]),
          opt("mien", "Et le mien, il pourrait arrêter aussi ?", [
            stage(
              "Un silence. Le Ghom se manifeste : l'eau de la fosse s'alourdit, le temps hésite.",
            ),
            say(
              "nerea",
              "Je ne sais pas. Personne ne sait ce que sont les Ghoms.",
            ),
            fx(add("confiance")),
          ]),
        ]),
        fx(add("ghom_dechu.verite")),
        when(is("ch11_etoile"), [
          fx(add("ghom_dechu.verite"), add("confiance.nerea")),
          stage(
            "Néréa tend sa lanterne au héros : une coquille où brillent des algues.",
          ),
          fx(give("lanterne_de_vase")),
        ]),
      ],
    },

    s7: {
      id: "s7",
      title: "Ce qu'on transmet",
      kind: "veillee",
      setting: "De retour sur l'île des Strates",
      beats: [
        stage(
          "Néréa ne mange pas. Elle a posé son journal ouvert devant elle et n'écrit rien.",
        ),
        say(
          "nerea",
          "Les Ondines sont de l'Ordre depuis toujours. Nous gardons, nous conservons, nous lisons ce qui ne bouge plus. Et le premier Ghom à avoir laissé un Fragment s'effilocher était un des nôtres. Pas un dévoreur. Un gardien fatigué, ou curieux, ou… je ne sais pas.",
        ),
        say("eva", "Tu vas l'écrire ?"),
        say("nerea", "Je ne sais pas. Le chant est plus beau."),
        choice("ecrire", [
          opt("ecris", "Écris-le. Ce sont les couches qu'il faut croire.", [
            fx(add("confiance.nerea", 2)),
          ]),
          opt("deux", "Écris les deux : le chant, et la vase.", [
            fx(add("confiance.nerea")),
          ]),
          opt("oblige", "Tu n'es pas obligée.", [
            fx(set("ch11_obligee")),
            say("nerea", "Si. C'est le seul métier que j'ai."),
          ]),
        ]),
        stage("Aubin est venu, avec une marmite. Il a entendu."),
        say(
          "aubin",
          "Et voilà. Vous êtes descendus, vous êtes remontés avec un poids de plus. Je vous l'avais dit. Le passé, ça se laisse couler. Il faut tout oublier pour avancer, Dormeur. Toi plus que personne : tout ce que tu connaissais est sous l'eau.",
        ),
        stage(
          "Le héros écrit dans son Carnet : « Peut-on accepter un passé qu'on ne peut pas changer ? »",
        ),
        fx(set("carnet.Q11", "ouverte")),
        choice("oublier", [
          opt("oublier", "Tu as raison, Aubin. Il faut oublier.", [
            fx(set("carnet.Q11", "fausse"), add("confiance.nerea", -1)),
            say("aubin", "Enfin un qui m'écoute."),
          ]),
          opt("garder", "Je ne sais pas. Je garde la question.", [
            fx(add("confiance.nerea")),
          ]),
          opt(
            "comprendre",
            "On ne peut pas oublier ce qu'on n'a pas encore compris.",
            [],
          ),
        ]),
        say(
          "nerea",
          "Si vous voulez, restez cette nuit dans l'eau froide du bassin des Strates. Le froid ralentit tout, même ce qui s'use. Vous ne guérirez pas : vous vous userez moins vite. Mais vous ne parlerez à personne ce soir.",
        ),
        choice("froid", [
          opt("rester", "Rester dans l'eau froide.", [
            fx(set("nuit_froide"), add("usure", -1)),
          ]),
          opt("refuser", "Refuser : veillée normale.", []),
        ]),
        when(
          is("nuit_froide"),
          [],
          [
            say(
              "eva",
              "Tu sais ce qui me fait peur ? Pas qu'il ait arrêté. Que sa cadence soit parfaite. Il calculait mieux que moi. Et il a arrêté quand même.",
            ),
            say(
              "lacunaire",
              "Si les Lacunes viennent de lui, alors nous venons de lui aussi. Un peu. Est-ce qu'il faut le remercier, ou lui en vouloir ?",
            ),
            choice("lacunaire", [
              opt("deux", "Les deux.", []),
              opt("ni", "Ni l'un ni l'autre.", []),
              opt("taire", "Se taire.", []),
            ]),
            when(is("squalor_rejoint"), [
              say(
                "squalor",
                "Moi, je retiens qu'après lui, la vie a repoussé. Avec des dents.",
              ),
              say("nerea", "Tu retiens toujours les dents."),
              say(
                "squalor",
                "C'est ce qui reste le plus longtemps dans la vase, non ?",
              ),
              say("nerea", "… Oui."),
            ]),
          ],
        ),
        when(
          is("ch11_obligee"),
          [
            narr(
              "Je l'ai écrit quand même, au milieu de la nuit, parce que c'est le seul métier que j'ai.",
            ),
          ],
          [
            narr(
              "Je l'ai écrit. Le Ghom de la Terre Noire était des nôtres, et il a cessé d'entretenir son Fragment. Je ne sais pas pourquoi. J'écris ce que je sais et je laisse la place pour le reste, comme on laisse une lacune dans une colonne : en la nommant.",
            ),
          ],
        ),
        when(is("reconstitution_forcee"), [
          narr(
            "J'ai aussi noté la version que nous avons jouée, celle qui n'était pas dans la vase. Elle est dans la marge, avec un point d'interrogation.",
          ),
        ]),
        stage(
          "Un manteau de peau de squale doublé de laine de mer attend sur la margelle : le Manteau de plongée des Strates.",
        ),
        fx(give("manteau_de_plongee")),
        when(gte("usure", 3), [
          stage(
            "Les mains du héros gardent les crevasses du froid des Abysses.",
          ),
          fx(give("mains_gercees")),
        ]),
        go(END),
      ],
    },
  },
}
