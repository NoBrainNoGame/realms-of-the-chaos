import {
  add,
  any,
  around,
  choice,
  fx,
  give,
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
  when,
} from "../dsl"
import { type Chapter, END, type FightReport, type FightSpec } from "../types"
import {
  BRUTUS4,
  FRONDEUR,
  GUETTEUR,
  LYRA4,
  lacuneBoard,
  TARN,
  WILL,
} from "./era4kit"

// ─── Combat : Les Guetteurs ─────────────────────────────────────────────────

const { board: BOARD, silent: LACUNE } = lacuneBoard([
  "..12.1...",
  ".1....2..",
  ".2..~..1.",
  "....~....",
  ".1.....1.",
  "..2...xx.",
  ".....xxx.",
  "1....x...",
  "..1......",
])

const deliesDown = (r: FightReport) =>
  r.fighters.filter((f) => f.team === 1 && f.hp <= 0 && !f.fled).length

const guetteurs: FightSpec = {
  id: "ch19-guetteurs",
  title: "Les Guetteurs",
  goal: "Faire fuir ou vaincre les Déliés, sans finir un tour sur une case de Lacune. Un de tes alliés est libre : ne lui donne aucun ordre.",
  board: BOARD,
  teams: [
    {
      name: "Alliés",
      side: "allies",
      fighters: [
        { preset: "@hero", at: { x: 4, y: 2 } },
        { preset: "gorr", at: { x: 3, y: 2 }, autonomy: WILL.gorr },
        // Brutus IV (turn 2) and Lyra IV (turn 3) enter by the west and north edges.
        {
          preset: BRUTUS4,
          autonomy: WILL.brutus,
          at: { x: 0, y: 3 },
          arrives: { tick: 2 },
        },
        {
          preset: LYRA4,
          autonomy: WILL.lyra,
          at: { x: 4, y: 0 },
          arrives: { tick: 3 },
        },
      ],
    },
    {
      name: "Les Déliés",
      side: "enemies",
      fighters: [
        { preset: GUETTEUR, at: { x: 6, y: 4 } },
        { preset: GUETTEUR, at: { x: 7, y: 3 } },
        { preset: GUETTEUR, at: { x: 5, y: 5 } },
        { preset: FRONDEUR, at: { x: 7, y: 7 } },
        { preset: TARN, at: { x: 8, y: 8 } },
      ],
    },
  ],
  rules: {
    // The Lacune patch wears down whoever starts a turn on it.
    silent: LACUNE,
    silentDamage: 2,
    // The Déliés jump into the Lacune and vanish below 30 % of their HP.
    flee: {
      team: 1,
      below: 0.3,
      exits: [
        { x: 6, y: 6 },
        { x: 5, y: 7 },
      ],
    },
    clock: { period: 10, limit: 10, winner: 0 },
    announce: true,
  },
  influences: ["earthquake", "timeWarp", "blessing"],
  startEnergy: 3,
  defeat: [set("defaite"), add("usure"), add("confiance", -1)],
  objectives: [
    {
      id: "laisser-libre",
      mark: "★",
      label:
        "Laisser libre : aucun ordre à l'Écho libre (Brutus IV, le moins confiant)",
      check: (r) => {
        const brutus = r.fighters.find((f) => f.preset === BRUTUS4.id)
        const a = r.autonomy
        return (
          r.result !== "defeat" &&
          !!brutus &&
          !!a &&
          !a.ordered.includes(brutus.id) &&
          !a.insisted.includes(brutus.id)
        )
      },
      success: "Brutus IV a joué sa partie seul. Il s'en souvient.",
      failure: "Le Ghom a tenu la main de Brutus IV. Il l'a senti.",
      onSuccess: [add("confiance.brutus", 2), set("echo_libre_ok")],
      onFailure: [add("confiance.brutus", -1)],
    },
    {
      id: "aucun-delie",
      mark: "◆",
      label: "Aucun Délié dispersé",
      check: (r) => deliesDown(r) === 0,
      onSuccess: [add("confiance.nyx")],
      onFailure: [
        add("confiance.nyx", -1),
        add("confiance", -1),
        set("deliee_dispersee"),
        add("delies.disperses"),
      ],
    },
    {
      id: "pas-d-influence-allie",
      mark: "◆",
      label: "Aucune Influence sur un allié",
      check: (r) => r.divineNearAlly.length === 0,
      onFailure: [add("autonomie.insistances")],
    },
  ],
  lines: [
    {
      when: "start",
      who: "nyx",
      text: "On ne te veut pas de mal. On veut juste que plus personne ne te tienne.",
    },
    { when: "tick:1", who: "brutus", text: "Pas sur mon village." },
    {
      when: "tick:3",
      who: "lyra",
      text: "Arrêtez. Je vous ai soignés la semaine dernière. Tous.",
    },
    {
      when: "fleeing",
      who: "nyx",
      text: "Garde-le, ton Ghom. Nous, on a le gris.",
    },
    { when: "end", who: "merlin", text: "Tu as vu ? Il le ramène avec lui." },
  ],
}

// ─── Island : the Puits, the paths, the empty Village ───────────────────────

const ISLAND = [
  "...........",
  ".1.....2...",
  "...~~......",
  "..........2",
  ".......aa..",
  ".1.....a...",
  "...........",
  "......1....",
  "...........",
]
const zone = (x: number, y: number) => around(ISLAND, x, y)

export const ch19: Chapter = {
  id: "19",
  era: 4,
  number: 19,
  title: "Le Manifeste",
  quote: {
    who: "chroniqueur",
    text: "Le Couplé dort encore au fond du Puits. Il en sortira. Quand il sortira, souvenez-vous qu'il n'est pas méchant. Il est pire : il est utile.",
  },
  place: "L'île natale, devenue la Frange : le Puits, puis le Village vide",
  question: {
    id: "Q19",
    text: "Est-ce que je choisis, ou est-ce qu'on choisit pour moi ?",
  },
  start: "1",
  exploration: {
    island: ISLAND,
    start: { x: 1, y: 2 },
    companions: ["gorr"],
    influences: ["earthquake", "timeWarp", "blessing"],
    encounters: [
      {
        id: "e1",
        label: "La margelle du Puits",
        scene: "1",
        at: { x: 1, y: 2 },
        auto: true,
      },
      {
        id: "e2",
        label: "Les ardoises du chemin",
        scene: "2",
        at: { x: 4, y: 3 },
        zone: zone(4, 3),
      },
      {
        id: "e3",
        label: "Le Village vide : l'embuscade",
        scene: "3",
        at: { x: 5, y: 4 },
        zone: zone(5, 4),
      },
      {
        id: "e4",
        label: "Le feu du Village vide",
        scene: "4",
        at: { x: 5, y: 6 },
        zone: zone(5, 6),
      },
      {
        id: "e5",
        label: "La flèche de l'aube",
        scene: "5",
        at: { x: 8, y: 6 },
        zone: zone(8, 6),
      },
      {
        id: "lichen",
        label: "Le lichen gris-bleu",
        at: { x: 2, y: 1 },
        examine: {
          lines: [
            {
              style: "stage",
              text: "Un lichen gris-bleu que le héros n'a jamais vu. Il a mis des siècles à couvrir la margelle : les anneaux d'un tronc couché, tout près, comptent au moins deux fois la vie d'un arbre.",
            },
          ],
          effects: [{ add: "ecoute", by: 1 }],
        },
      },
      {
        id: "tache",
        label: "Une tache de Lacune",
        at: { x: 7, y: 5 },
        examine: {
          lines: [
            {
              style: "stage",
              text: "Un gris sans reflet, sans ombre, comme si l'on avait gratté l'image. Au-dessus, un câble tendu d'un bord à l'autre. Au fond, très lent, quelque chose qui bouge.",
            },
          ],
          effects: [{ add: "ecoute", by: 1 }],
        },
      },
      {
        id: "cable",
        label: "Un câble relâché",
        at: { x: 9, y: 3 },
        obstacle: {
          influence: "earthquake",
          before: [
            {
              style: "stage",
              text: "Un câble de passerelle pend, trop lâche. Le poteau qui le tenait s'est penché de moitié.",
            },
          ],
          after: [
            {
              style: "stage",
              text: "Le sol tressaille. Le poteau se redresse en grinçant, le câble se tend : la passerelle tiendra une saison de plus.",
            },
          ],
          effects: [{ add: "ecoute", by: 1 }],
        },
      },
      {
        id: "guetteur_errant",
        label: "Un Guetteur qui rôde",
        at: { x: 3, y: 7 },
        wander: {
          preset: GUETTEUR,
          title: "Un Guetteur isolé",
          goal: "Le repousser sans le disperser.",
          range: 2,
          radius: 3,
          effects: [{ add: "ecoute", by: 1 }],
          success: "Il saute dans le gris sans se retourner.",
        },
      },
    ],
  },
  scenes: {
    // ── 1 ──
    "1": {
      id: "1",
      title: "La margelle",
      kind: "scene",
      setting: "Le Puits, sous un ciel bas",
      beats: [
        stage(
          "Le Puits s'ouvre sur un ciel bas. Le héros remonte la paroi de roche dense ; la margelle est couverte d'un lichen gris-bleu qu'il n'a jamais vu. Le vent porte une odeur de pluie froide. Au bord du Puits, une masse de cristal couverte de mousse : on la prend pour un rocher. Elle bouge.",
        ),
        when(
          is("gorr_question"),
          [
            say("gorr", "Tu sors. Gorr attend."),
            say(
              "gorr",
              "Gorr compte les pluies. Trois cents… non. Plus. Gorr ne sait plus compter si loin.",
            ),
            say("gorr", "Gorr a grandi. Tu n'as pas grandi."),
          ],
          [
            stage(
              "Gorr se lève. Il ne dit rien. Il se place derrière le héros, à deux pas exactement, comme on le lui a appris dans les mines de Vitrelle. Il attend un ordre.",
            ),
          ],
        ),
        stage(
          "Le héros s'avance vers le bord de la margelle. En bas, la prairie de l'Aube : il la reconnaît à la forme des collines. Mais la prairie est trouée de taches grises, sans reflet, sans ombre, comme si on avait gratté l'image. Au-dessus des taches, des câbles, des passerelles, des maisons pendues.",
        ),
        when(is("transformation.1", "A"), [
          stage(
            "Le héros voit au fond des taches grises ce que les autres ne voient pas : du mouvement, très lent. Des gens.",
          ),
        ]),
        choice("margelle", [
          opt("combien", "« Combien de temps ? »", [
            when(
              is("gorr_question"),
              [
                say(
                  "gorr",
                  "Long. Les arbres sont morts et revenus. Deux fois.",
                ),
              ],
              [
                stage(
                  "Gorr reste muet. Le héros lit la réponse dans les anneaux d'un tronc couché.",
                ),
              ],
            ),
          ]),
          opt("attendu", "« Tu m'as attendu ? »", [
            fx(add("confiance.gorr")),
            say(
              "gorr",
              "Gorr attend. C'est ce que Gorr fait le mieux. Mieux que les pierres. Les pierres n'attendent rien.",
            ),
          ]),
          opt("viens", "« Viens. »", [
            stage("Gorr suit."),
            when(is("gorr_question", false), [
              stage("Le journal note, discrètement : « Gorr obéit. »"),
            ]),
          ]),
        ]),
        go("2"),
      ],
    },

    // ── 2 ──
    "2": {
      id: "2",
      title: "Les ardoises",
      kind: "rencontre",
      setting: "Le chemin du Village vide",
      beats: [
        stage(
          "Le chemin descend vers le Village vide. Tous les vingt pas, un poteau ; sur chaque poteau, une plaque d'ardoise gravée à la pointe. Le héros s'arrête devant la première.",
        ),
        narr(
          "« Vous nous avez fait pousser comme on taille une haie. Nous sommes allés vivre là où vos mains glissent. » Une signature, en bas : un cercle ouvert, la marque des Ombres.",
        ),
        stage(
          "Plus loin, une ardoise plus récente, grattée par-dessus une autre.",
        ),
        narr(
          "« Quand le Couplé sortira, ne le touchez pas. Emmenez-le au gris. Là, son Ghom glissera sur lui comme sur nous. »",
        ),
        when(is("gorr_question"), [
          say(
            "gorr",
            "Le Couplé. C'est toi. Gorr a entendu le mot. Gorr n'a pas aimé le mot.",
          ),
        ]),
        choice("ardoises", [
          opt("lire", "Lire toutes les ardoises.", [
            stage(
              "Les extraits II et IV : le Ghom taille, la lignée plie ; et quelqu'un, quelque part, a pris la peine de lire jusqu'au bout.",
            ),
            fx(add("confiance.nyx"), set("ardoises_lues")),
          ]),
          opt("arracher", "Arracher l'ardoise de l'embuscade et l'emporter.", [
            stage("Elle servira de preuve, à la veillée."),
            fx(set("ardoise_prise")),
          ]),
          opt("passer", "Passer sans lire.", [
            fx(add("confiance.nyx", -1), set("ardoise_ignoree")),
            stage(
              "Quelque part, quelqu'un le saura : « Tu n'as même pas lu. »",
            ),
          ]),
        ]),
        go("3"),
      ],
    },

    // ── 3 ──
    "3": {
      id: "3",
      title: "Les Guetteurs",
      kind: "combat",
      setting: "Le Village vide, 9 × 9",
      beats: [
        stage(
          "Le Village vide : murs effondrés, une place, une fontaine à sec, et au sud-est une tache de Lacune enjambée par un câble. Des ombres sautent des toits : les Guetteurs encerclent le héros et le poussent vers le gris.",
        ),
        say(
          "nyx",
          "On ne te veut pas de mal. On veut juste que plus personne ne te tienne.",
        ),
        { t: "fight", fight: guetteurs },
        when(is("defaite"), [
          stage(
            "Le Couplé a été délié. Les Guetteurs l'ont poussé dans le gris, au bord du câble ; un instant, plus rien ne l'a tenu, ni ordre, ni Ghom, ni écho. Brutus IV et Lyra IV l'ont rattrapé par les poignets, une main chacun, et ramené sur la dalle.",
          ),
          say(
            "lyra",
            "Ne fais pas ça deux fois. Le gris n'est pas fait pour rester debout.",
          ),
          fx(set("defaite", false)),
        ]),
        stage(
          "Les Déliés fuient, un à un, par la tache : « Garde-le, ton Ghom. Nous, on a le gris. » Tarn reste en arrière. Il s'assoit contre un mur. Il est trop vieux pour le gris.",
        ),
        when(is("deliee_dispersee", false), [
          fx(give("habit:capuche-des-delies")),
          stage(
            "Sur un Guetteur en fuite, une capuche tissée sans motif : rien sur elle ne dit à qui l'on appartient. Tarn la tend au héros du bout du pied.",
          ),
        ]),
        go("4"),
      ],
    },

    // ── 4 ──
    "4": {
      id: "4",
      title: "Le Village vide",
      kind: "veillee",
      setting: "Un feu, au centre du village",
      beats: [
        stage(
          "Les murs du Village immobile sont toujours debout. Les toits sont tombés. Les jardins, qu'on ne plantait plus à l'ère I, sont devenus une forêt. Au centre, un feu ; Brutus IV l'entretient chaque soir, pour personne, depuis vingt ans.",
        ),
        stage(
          "Tarn est assis contre un mur, les mains libres. Brutus IV n'attache personne : « Où irait-il ? Le gris est partout. »",
        ),
        when(is("ardoise_prise"), [
          stage(
            "Le héros pose l'ardoise de l'embuscade devant le feu. Personne ne la reprend.",
          ),
        ]),
        say(
          "brutus",
          "Ma lignée garde ce village. Le village est vide. Je le garde quand même.",
        ),
        say(
          "brutus",
          "Ils sont partis là-dessous. Les arrière-petits-enfants de ceux qui ne voulaient rien changer. Ils vivent maintenant là où rien ne bouge. Ils disent que c'est l'inverse de ce que voulaient leurs ancêtres. Moi, je trouve que c'est pareil.",
        ),
        say(
          "lyra",
          "Je soigne les deux côtés. Là-dessous, on ne guérit pas bien. Il n'y a pas assez de choses qui se passent pour qu'une plaie se referme. Ce que je répare ici, je le paie ailleurs, comme toutes les Lyra. Là-bas, je paie plus cher.",
        ),
        say(
          "lyra",
          "Ils disent que tu es la main du Ghom. Je ne sais pas ce que tu es. Tu as des cicatrices. Les mains ne cicatrisent pas.",
        ),
        say(
          "tarn",
          "J'ai été Thermiste. J'ai mesuré, avant de partir. Tu veux savoir ce que j'ai mesuré ? Que chaque fois que tu as fait un pas, quelque chose avait déjà décidé que tu le ferais.",
        ),
        say(
          "tarn",
          "Tout est écrit d'avance, petit. Ton Ghom l'écrit. Nous, nous avons seulement choisi d'aller vivre dans la marge. Et encore. Peut-être que c'était écrit aussi.",
        ),
        stage("Le héros ouvre son Carnet. Une page s'ajoute."),
        fx(set("carnet.Q19", "ouverte")),
        choice("q19", [
          opt("rien", "« Alors rien de ce que je fais n'est à moi. »", [
            fx(set("carnet.Q19", "fausse"), set("q19_tarn")),
            say("tarn", "Voilà. C'est reposant, tu verras."),
          ]),
          opt(
            "ecrit",
            "« Tu as mesuré qu'on m'a poussé. Tu n'as pas mesuré que tout est écrit. »",
            [
              fx(set("carnet.Q19", "ouverte"), add("confiance.merlin")),
              stage("Tarn se tait un moment."),
              say("tarn", "… Non. C'est vrai. Ça, je l'ai ajouté."),
            ],
          ),
          opt("sais-pas", "« Je ne sais pas. »", [
            fx(set("carnet.Q19", "ouverte")),
            say("lyra", "C'est la première chose vraie qu'on dit ici ce soir."),
          ]),
        ]),
        hub("ecoutes", [
          topic("brutus", "Écouter Brutus IV sur son village.", [
            say(
              "brutus",
              "Un mur, ça protège. Un mur autour de rien, ça protège rien. Je le sais. Je reste quand même. C'est peut-être ça, être un mur.",
            ),
            fx(add("confiance.brutus")),
          ]),
          topic("lyra", "Écouter Lyra IV sur les Déliés.", [
            say(
              "lyra",
              "Il y a une petite, Sel. Née là-dessous. Elle a oublié le mot « chaud ». Je le lui répète à chaque visite.",
            ),
            fx(add("confiance.lyra")),
          ]),
          topic(
            "gorr",
            "Rester près de Gorr.",
            [
              say(
                "gorr",
                "Gorr a vu partir les gens du village. Gorr n'a pas demandé pourquoi. Gorr demande maintenant : pourquoi ?",
              ),
              fx(add("confiance.gorr")),
            ],
            { if: is("gorr_question") },
          ),
        ]),
        go("5"),
      ],
    },

    // ── 5 ──
    "5": {
      id: "5",
      title: "La flèche d'Haut-Pendant",
      kind: "fin",
      setting: "À l'aube, le linteau",
      beats: [
        stage(
          "À l'aube, une flèche se plante dans le linteau, à un doigt de la tête du héros. Pas un tremblement. Une ardoise mince y est liée.",
        ),
        say(
          "brutus",
          "Une Archère. À trois cents pas, de nuit, dans le vent. Il n'en reste qu'une capable de ça.",
        ),
        narr(
          "« Tu es sorti. Tu as couru. Tu t'es battu. Ceux qui t'entourent t'ont aidé, ou pas, selon ce qu'ils pensent de toi. Viens voir comment on vit sans toi. Seul, ou avec qui voudra te suivre. Personne ne te touchera. — N. »",
        ),
        choice("reponse", [
          opt("vais", "« J'y vais. »", [fx(add("confiance.nyx"))]),
          opt("ensemble", "« On y va ensemble. »", [
            stage(
              "Gorr, Brutus IV et Lyra IV suivent ; chacun avec son palier.",
            ),
          ]),
          opt("ardoises", "« Je n'ai pas à répondre à des ardoises. »", [
            fx(add("confiance.nyx", -1)),
            say(
              "lyra",
              "Elle a dit « viens ». Chez les Déliés, ça veut dire « on ne te fera pas venir ». C'est une politesse. Accepte-la.",
            ),
          ]),
        ]),
        when(any(is("echo_libre_ok"), gte("confiance.brutus", 1)), [
          fx(give("habit:brassard-du-gardien")),
          stage(
            "Brutus IV détache un cuir épais, cousu de la marque d'un village que plus personne n'habite, et le tend sans un mot : un brassard de gardien.",
          ),
        ]),
        fx(join("gorr"), join("brutus"), join("lyra")),
        go(END),
      ],
    },
  },
}
