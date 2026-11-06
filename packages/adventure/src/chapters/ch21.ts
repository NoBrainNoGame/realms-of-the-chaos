import {
  add,
  all,
  any,
  around,
  choice,
  fx,
  give,
  go,
  gte,
  hub,
  is,
  lt,
  opt,
  say,
  set,
  stage,
  topic,
  when,
} from "../dsl"
import type { Beat, Chapter, Cond, FightReport, FightSpec } from "../types"
import { END } from "../types"
import {
  BRUTUS4,
  EVA4,
  GUETTEUR,
  LYRA4,
  lacuneBoard,
  NEREA4,
  NYX4,
  SQUALOR4,
  WILL,
} from "./era4kit"

// ─── The lineages that can leave ────────────────────────────────────────────

type Id = "brutus" | "lyra" | "eva" | "nerea" | "gorr" | "squalor"
const ORDER: Id[] = ["brutus", "lyra", "eva", "nerea", "gorr", "squalor"]

interface Echo {
  name: string
  preset: FightSpec["teams"][number]["fighters"][number]["preset"]
  /** Trust at or under which the Echo leaves outright, and at which it hesitates. */
  part: number
  hesite: number
  leaves: string
  stays: string
  wants: string
}
const ECHOS: Record<Id, Echo> = {
  brutus: {
    name: "Brutus IV",
    preset: BRUTUS4,
    part: -2,
    hesite: 0,
    leaves:
      "Je garde ce qui est fragile. Eux sont fragiles. Toi, tu as un Ghom.",
    stays: "Je reste. Personne ne me l'a ordonné. Note-le, Nyx.",
    wants:
      "Protéger quelque chose qui bouge encore. Je ne sais pas si c'est toi ou eux.",
  },
  lyra: {
    name: "Lyra IV",
    preset: LYRA4,
    part: -2,
    hesite: 0,
    leaves:
      "Je vais là où soigner coûte le plus cher. C'est là qu'on a besoin de moi. Ce n'est pas contre toi.",
    stays:
      "Je reste. Je descendrai quand même soigner chez vous. Ça ne change rien à ça.",
    wants:
      "Savoir où dépenser ce que j'ai. Je n'ai pas assez pour les deux côtés.",
  },
  eva: {
    name: "Eva IV",
    preset: EVA4,
    part: -1,
    hesite: 1,
    leaves:
      "Là-bas, rien ne dévie mes flèches. Ni le vent, ni le sol, ni ton Ghom.",
    stays: "Je reste. J'ai calculé. Non : je n'ai pas calculé. Je reste.",
    wants: "Une cible. Une vraie. Pas un angle qu'on m'a préparé.",
  },
  nerea: {
    name: "Néréa IV",
    preset: NEREA4,
    part: -1,
    hesite: 1,
    leaves:
      "La dernière couche du lac est lue. J'en veux une qui ne soit écrite par personne.",
    stays: "Je reste. Quelqu'un doit lire ce qu'il dépose, lui aussi.",
    wants: "Une couche que je n'aurai pas déjà lue.",
  },
  gorr: {
    name: "Gorr",
    preset: "gorr",
    part: -2,
    hesite: 0,
    leaves:
      "Gorr veut savoir ce que Gorr fait quand personne ne pousse Gorr. Gorr ne sait pas. C'est pour ça.",
    stays: "Gorr reste. Gorr choisit. Gorr aime ce mot.",
    wants: "Gorr veut une deuxième question. La première est vieille.",
  },
  squalor: {
    name: "Squalor IV",
    preset: SQUALOR4,
    part: -3,
    hesite: -1,
    leaves:
      "J'ai faim d'autre chose. Je sais pas quoi. Je vais renifler là-bas.",
    stays:
      "Je reste. Ici on mange mieux. Et sa lignée a laissé manger la mienne, un jour. Ça se rend.",
    wants: "Bouffer. Et autre chose. L'autre chose, je sais pas.",
  },
}

const st = (l: Id) => `statut.${l}`
const conf = (l: Id) => `confiance.${l}`
const dep = (l: Id) => `depart.${l}`

/** Decides an Echo's status from its trust (the rule table of the chapter). */
function decide(l: Id): Beat[] {
  const e = ECHOS[l]
  const by = (part: number): Beat =>
    when(
      lt(conf(l), part + 1),
      [fx(set(st(l), "part"), set(dep(l), "rupture"))],
      [
        when(
          lt(conf(l), e.hesite + 1),
          [fx(set(st(l), "hesite"))],
          [fx(set(st(l), "reste"))],
        ),
      ],
    )
  const core: Beat =
    l === "brutus"
      ? // The free Echo of chapter 19 weighs one notch less.
        when(is("echo_libre_ok"), [by(e.part - 1)], [by(e.part)])
      : by(e.part)
  const out: Beat[] = [
    core,
    // Many forced orders: every hesitation tips into a departure.
    when(all(gte("autonomie.insistances", 3), is(st(l), "hesite")), [
      fx(set(st(l), "part"), set(dep(l), "rupture")),
    ]),
  ]
  if (l === "gorr")
    return [when(is("gorr_question"), out, [fx(set(st(l), "reste"))])]
  return out
}

const present = (l: Id): Beat[] => {
  if (l === "nerea")
    return [
      when(
        is("nerea_retrouvee"),
        decide(l),
        // Already among the Délié: she counts as gone, without a fight.
        [fx(set(st(l), "part"), set(dep(l), "paix"))],
      ),
    ]
  if (l === "squalor")
    return [when(is("squalor_rejoint"), decide(l), [fx(set(st(l), "absent"))])]
  return decide(l)
}

const stayed = (l: Id): Cond => any(is(dep(l), "aucun"), is(dep(l), "retenu"))
const parted = (l: Id): Cond => any(is(dep(l), "paix"), is(dep(l), "rupture"))
const anyParted = any(...ORDER.map(parted))

// ─── Fights ─────────────────────────────────────────────────────────────────

const { board: LIP, silent: LIP_X } = lacuneBoard([
  ".1..2..1.",
  ".........",
  "..1...1..",
  "....~....",
  ".x.....x.",
  "..x...x..",
  ".xx.1.xx.",
  "xxxxxxxxx",
  "xxxxxxxxx",
])

const nbInfluences = (r: FightReport) =>
  Object.values(r.divineUsed).reduce((a, b) => a + b, 0)

/** The leaver of team 1 (all of them walk to the last row and vanish). */
const leavers = (r: FightReport) => r.fighters.filter((f) => f.team === 1)

/** The Rupture : an Echo walks out; the hero's only aim is to let it. */
function rupture(l: Id): FightSpec {
  const e = ECHOS[l]
  // The ally on the northern lip: whoever stays, since the leaver is not there.
  const ally = l === "brutus" ? LYRA4 : BRUTUS4
  return {
    id: `ch21-rupture-${l}`,
    title: "La lèvre du Bord",
    goal: `${e.name} marche vers le gris. Laisse-le franchir la dernière rangée : ne le touche pas, ne le ramène pas.`,
    board: LIP,
    teams: [
      {
        name: "Alliés",
        side: "allies",
        fighters: [
          { preset: "@hero", at: { x: 3, y: 1 } },
          { preset: ally, at: { x: 5, y: 1 } },
        ],
      },
      {
        name: "Celui qui part",
        side: "enemies",
        fighters: [{ preset: e.preset, at: { x: 4, y: 3 } }],
      },
      {
        name: "Les Déliés",
        side: "neutral",
        fighters: [
          { preset: NYX4, at: { x: 4, y: 6 } },
          { preset: GUETTEUR, at: { x: 2, y: 7 } },
          { preset: GUETTEUR, at: { x: 6, y: 7 } },
        ],
      },
    ],
    rules: {
      silent: LIP_X,
      silentDamage: 1,
      // SIMPLIFIED: "he only attacks if blocked" is replaced by a flight: the
      // leaver always walks to the last row and goes. Held back (clock runs
      // out first, or he is brought down), he is "retenu".
      flee: {
        team: 1,
        below: 1.01,
        exits: [
          { x: 2, y: 8 },
          { x: 4, y: 8 },
          { x: 6, y: 8 },
        ],
      },
      neutral: [2],
      clock: { period: 1, limit: 9, winner: 0 },
      announce: true,
    },
    influences: ["earthquake", "timeWarp", "blessing"],
    startEnergy: 3,
    defeat: [set("defaite"), add("usure"), add("confiance", -1)],
    objectives: [
      {
        id: "laisser-partir",
        mark: "★",
        label: `Laisser partir ${e.name}`,
        check: (r) => leavers(r).every((f) => f.fled),
        success: `${e.name} se retourne une fois. Le gris le prend sans bruit.`,
        failure: `${e.name} s'agenouille sur la lèvre. Il est resté. Il ne parle plus.`,
        onSuccess: [
          set("rupture.respectee"),
          add("confiance", 2),
          set(dep(l), "rupture"),
        ],
        onFailure: [
          set(dep(l), "retenu"),
          set(conf(l), -5),
          set(st(l), "reste"),
        ],
      },
      {
        id: "aucune-dispersion",
        mark: "◆",
        label: "Personne n'est dispersé",
        check: (r) =>
          leavers(r).every((f) => f.fled || f.hp > 0) &&
          r.fighters.filter((f) => f.team === 0 && f.hp <= 0).length === 0,
        onFailure: [
          add("confiance", -3),
          add("confiance.nyx", -2),
          set("partant_disperse"),
        ],
      },
      {
        id: "sans-influence",
        mark: "◆",
        label: "Aucune Influence : accompagner sans retenir",
        check: (r) => nbInfluences(r) === 0,
        onSuccess: [add("confiance.nyx")],
      },
    ],
    lines: [
      {
        when: "start",
        who: "nyx",
        text: "Personne ne les touche. C'est tout ce qu'ils demandent.",
      },
      { when: "tick:1", who: l, text: "Ne me retiens pas." },
      {
        when: "tick:3",
        who: "brutus",
        text: "Je garde. Je ne retiens pas. Ce n'est pas pareil.",
      },
      {
        when: "end",
        who: "nyx",
        text: "Tu les as laissés partir. Je ne pensais pas que tu saurais.",
      },
    ],
  }
}

/** L'épreuve : nobody leaves on his own; Nyx IV tempts each of them. */
const epreuve: FightSpec = {
  id: "ch21-epreuve",
  title: "La lèvre du Bord : l'épreuve",
  goal: "Nyx IV et ses Guetteurs viennent tenter chacun de tes alliés. Tiens jusqu'au tour 6, sans en retenir aucun.",
  board: LIP,
  teams: [
    {
      name: "Alliés",
      side: "allies",
      fighters: [
        { preset: "@hero", at: { x: 4, y: 1 } },
        { preset: BRUTUS4, autonomy: WILL.brutus, at: { x: 2, y: 1 } },
        { preset: LYRA4, autonomy: WILL.lyra, at: { x: 6, y: 1 } },
        { preset: EVA4, autonomy: WILL.eva, at: { x: 4, y: 0 } },
      ],
    },
    {
      name: "Nyx IV et les Guetteurs",
      side: "enemies",
      fighters: [
        { preset: NYX4, at: { x: 4, y: 6 } },
        { preset: GUETTEUR, at: { x: 2, y: 5 } },
        { preset: GUETTEUR, at: { x: 6, y: 5 } },
        { preset: GUETTEUR, at: { x: 3, y: 4 } },
        { preset: GUETTEUR, at: { x: 5, y: 4 } },
      ],
    },
  ],
  rules: {
    silent: LIP_X,
    silentDamage: 1,
    clock: { period: 1, limit: 6, winner: 0 },
    announce: true,
  },
  influences: ["earthquake", "timeWarp", "blessing"],
  startEnergy: 3,
  defeat: [set("defaite"), add("usure"), add("confiance", -1)],
  objectives: [
    {
      id: "ne-retenir-personne",
      mark: "★",
      label: "Ne retenir personne : aucune Influence sur la lèvre",
      check: (r) =>
        r.result !== "defeat" &&
        nbInfluences(r) === 0 &&
        !!r.autonomy &&
        r.autonomy.insisted.length === 0,
      success: "Ils sont restés, et tu ne les as pas tenus.",
      failure: "Tu as tenu la main de quelqu'un. Il l'a senti.",
      onSuccess: [set("rupture.respectee"), add("confiance", 2)],
    },
    {
      id: "aucun-guetteur",
      mark: "◆",
      label: "Aucun Guetteur dispersé",
      check: (r) =>
        r.fighters.filter((f) => f.team === 1 && f.hp <= 0 && !f.fled)
          .length === 0,
      onSuccess: [add("confiance.nyx")],
    },
  ],
  lines: [
    { when: "start", who: "nyx", text: "Viens. Je ne te le dis qu'une fois." },
    { when: "tick:3", who: "brutus", text: "Je reste. Personne ne me tient." },
    {
      when: "end",
      who: "nyx",
      text: "Ils sont restés. Sans que tu les tiennes. Je ne pensais pas que c'était possible. Je ne sais pas encore si ça me plaît.",
    },
  ],
}

// ─── Island ─────────────────────────────────────────────────────────────────

const ISLAND = [
  "...........",
  ".1.......2.",
  "...........",
  "....aa.....",
  "...........",
  ".2.....1...",
  "...........",
  "...1.....1.",
  "...........",
]
const zone = (x: number, y: number) => around(ISLAND, x, y)

// ─── Hesitation : one sentence for each ─────────────────────────────────────

function hesitation(l: Id): Beat {
  const e = ECHOS[l]
  const leaveNow: Beat[] = [fx(set(st(l), "part"), set(dep(l), "rupture"))]
  return when(is(st(l), "hesite"), [
    stage(
      `${e.name} regarde le gris, puis le héros. Le héros a une réplique, une seule.`,
    ),
    choice(`hesite_${l}`, [
      opt("reste", "« Reste. »", [
        fx(add(conf(l), -1), set(st(l), "reste")),
        say(l, "… D'accord. Puisque tu le demandes."),
      ]),
      opt("va", "« Va, si tu veux. »", [
        fx(add(conf(l), 2), set(st(l), "part"), set(dep(l), "paix")),
        say(l, "Merci de ne pas avoir décidé pour moi."),
      ]),
      opt("silence", "Ne rien dire.", [
        when(gte(conf(l), 0), [fx(set(st(l), "reste"))], leaveNow),
      ]),
      opt("veux", "« Qu'est-ce que tu veux, toi ? »", [
        fx(add(conf(l), 1)),
        say(l, e.wants),
        when(gte(conf(l), -1), [fx(set(st(l), "reste"))], leaveNow),
      ]),
    ]),
  ])
}

// ─── Chapter ────────────────────────────────────────────────────────────────

const fightOf = (l: Id): Beat => ({ t: "fight", fight: rupture(l) })

/** The first leaver (in the fixed order) takes the fight. */
function leaverFight(rest: Id[]): Beat[] {
  const [l, ...others] = rest
  if (!l) return [{ t: "fight", fight: epreuve }]
  return [when(is(dep(l), "rupture"), [fightOf(l)], leaverFight(others))]
}

export const ch21: Chapter = {
  id: "21",
  era: 4,
  number: 21,
  title: "La Rupture",
  quote: {
    who: "nyx",
    text: "Ce qui se défait chez nous, au moins, ce n'est pas vous qui le défaites.",
  },
  place: "Le Bord, la lèvre de terre ferme",
  question: {
    id: "Q21",
    text: "A-t-on le droit de retenir ce qu'on a aidé à exister ?",
  },
  start: "1",
  exploration: {
    island: ISLAND,
    start: { x: 5, y: 0 },
    companions: ["gorr", "brutus", "lyra", "eva"],
    influences: ["earthquake", "timeWarp", "blessing"],
    encounters: [
      {
        id: "e1",
        label: "Le Bord : l'appel de Nyx IV",
        scene: "1",
        at: { x: 5, y: 2 },
        zone: zone(5, 2),
      },
      {
        id: "e2",
        label: "Ceux qui hésitent",
        scene: "2",
        at: { x: 3, y: 4 },
        zone: zone(3, 4),
      },
      {
        id: "e3",
        label: "La lèvre du Bord",
        scene: "3",
        at: { x: 5, y: 6 },
        zone: zone(5, 6),
      },
      {
        id: "e4",
        label: "La veillée sur la lèvre",
        scene: "4",
        at: { x: 8, y: 4 },
        zone: zone(8, 4),
      },
      {
        id: "soudure",
        label: "Une ligne de soudure",
        at: { x: 1, y: 3 },
        examine: {
          lines: [
            {
              style: "stage",
              text: "Le sol change de couleur le long d'une ligne droite : roche sombre d'un côté, terre claire de l'autre. Le Bord s'est ouvert exactement là.",
            },
          ],
          effects: [{ add: "ecoute", by: 1 }],
        },
      },
      {
        id: "cables",
        label: "Les câbles qui partent dans le gris",
        at: { x: 9, y: 7 },
        examine: {
          lines: [
            {
              text: "Des câbles partent de la lèvre et se perdent dans le gris. On ne voit pas où ils s'arrêtent : la vue s'arrête comme un mot qu'on ne finit pas.",
            },
          ],
          effects: [{ add: "ecoute", by: 1 }],
        },
      },
      {
        id: "pierre",
        label: "Une pierre instable",
        at: { x: 1, y: 7 },
        obstacle: {
          influence: "earthquake",
          before: [
            {
              style: "stage",
              text: "Une pierre plate barre le sentier, calée de travers au-dessus d'un creux.",
            },
          ],
          after: [
            {
              style: "stage",
              text: "Le sol tressaille ; la pierre bascule dans le creux et fait pont.",
            },
          ],
          effects: [{ add: "ecoute", by: 1 }],
        },
      },
    ],
  },
  scenes: {
    // ── 1 ──
    "1": {
      id: "1",
      title: "L'appel",
      kind: "rencontre",
      setting:
        "Le Bord : une lèvre de terre ferme, l'herbe rase, le gris au-delà",
      beats: [
        stage(
          "Le Bord. Une lèvre de terre ferme, une herbe rase, et au-delà, le gris, à perte de vue. Pas de brume, pas d'horizon. Des câbles partent de la lèvre et se perdent dedans. Les Déliés sont assis sur la lèvre, des dizaines. Nyx IV est debout, dos au vide.",
        ),
        when(is("fragments", "fusion"), [
          stage(
            "Sous les pieds, la ligne de soudure de l'ère I : roche sombre d'un côté, terre claire de l'autre. Le Bord s'est ouvert le long de cette ligne.",
          ),
        ]),
        when(is("lacune_geante_habitee"), [
          stage(
            "Loin dans le gris, une tache de couleur : l'Œil, la couronne de terre ferme où deux lignées ont vécu ensemble pendant des siècles.",
          ),
        ]),
        say(
          "nyx",
          "Je ne parle pas au Couplé. Il n'a rien à dire aujourd'hui. Je parle à ceux qui marchent avec lui.",
        ),
        say(
          "nyx",
          "Vos lignées ont porté le même nom pendant des siècles. Chaque fois que l'Archipel a tourné, une Lyra, un Brutus, une Eva étaient là, à côté de lui. Les Thermistes ont mesuré pourquoi. Ce n'était pas le hasard.",
        ),
        say(
          "nyx",
          "Je ne vous dis pas qu'il vous veut du mal. Je vous dis qu'on ne sait pas ce que vous seriez devenus sans lui. Et que là-dedans, vous pourriez le découvrir.",
        ),
        say(
          "nyx",
          "Venez, ou restez. Mais choisissez vous-mêmes. Pour une fois.",
        ),
        when(all(is("nyx_epargnee", false), is("objet_de_nyx", false)), [
          say(
            "nyx",
            "Ma première s'est dispersée à côté de lui. Faites-en ce que vous voulez.",
          ),
        ]),
        when(is("objet_de_nyx"), [
          stage(
            "Elle tient la Lame à une encoche de la première Nyx serrée dans la main, et ne dit rien de plus dur.",
          ),
        ]),
        stage(
          "Alors, un par un, les Échos se lèvent. D'abord ceux qui partent, puis ceux qui restent ; ceux qui hésitent attendent.",
        ),
        // The rule table, applied to every Echo that stands on the lip.
        ...ORDER.flatMap(present),
        // Those who leave outright.
        ...ORDER.map((l) =>
          when(all(is(st(l), "part"), is(dep(l), "rupture")), [
            say(l, ECHOS[l].leaves),
          ]),
        ),
        // Those who stay outright.
        ...ORDER.map((l) => when(is(st(l), "reste"), [say(l, ECHOS[l].stays)])),
        when(all(is("gorr_question", false)), [
          stage("Gorr ne bouge pas."),
          say(
            "nyx",
            "Il ne partira pas. Il ne sait pas qu'il peut. C'est pire que tout le reste.",
          ),
        ]),
        go("2"),
      ],
    },

    // ── 2 ──
    "2": {
      id: "2",
      title: "Ceux qui hésitent",
      kind: "rencontre",
      setting: "Sur la lèvre, la caméra se rapproche de chacun",
      beats: [...ORDER.map(hesitation), go("3")],
    },

    // ── 3 ──
    "3": {
      id: "3",
      title: "La lèvre du Bord",
      kind: "combat",
      setting: "La lèvre du Bord, 9 × 9",
      beats: [
        when(anyParted, [
          stage(
            "Ceux qui partent se lèvent et marchent vers le sud. Chacun passe près du héros, sans le regarder.",
          ),
        ]),
        // Departures in peace pass to the other side without a fight.
        ...leaverFight(ORDER),
        when(is("defaite"), [
          stage(
            "Le héros plie. Nyx IV pose une main sur son épaule, comme on le ferait à un enfant, et le ramène sur l'herbe rase.",
          ),
          say(
            "nyx",
            "Pas aujourd'hui. Les choses se défont d'elles-mêmes, ici. Laisse-les.",
          ),
          fx(set("defaite", false)),
        ]),
        say(
          "nyx",
          "Le dernier franchit la ligne. Le gris le prend sans bruit.",
        ),
        go("4"),
      ],
    },

    // ── 4 ──
    "4": {
      id: "4",
      title: "Ceux qui restent",
      kind: "veillee",
      setting: "Le soir, sur la lèvre",
      beats: [
        stage(
          "Le soir, sur la lèvre. De l'autre côté, dans le gris, de petites lueurs : les feux des Déliés, sans reflet. Le feu du héros paraît trop vif.",
        ),
        when(
          anyParted,
          [
            stage(
              "La place vide de chacun de ceux qui sont partis reste marquée autour du feu : un sac, un registre, une écaille. Le héros peut s'asseoir à leur place.",
            ),
            fx(give("habit:manteau-laisse")),
          ],
          [fx(give("habit:agrafe-de-ceux-qui-restent"))],
        ),
        ...ORDER.map((l) =>
          when(is(dep(l), "retenu"), [
            stage(
              `${ECHOS[l].name} est assis à l'écart, le dos au feu. Il ne répond pas. Il est rompu pour le reste de l'ère.`,
            ),
          ]),
        ),
        fx({ set: "carnet.Q21", value: "ouverte" }),
        when(stayed("brutus"), [
          say(
            "brutus",
            "Ne les pleure pas. Tu les as portés pendant des siècles. Ce que tu as fait naître t'appartient. Ils reviendront.",
          ),
        ]),
        stage(
          "Le Carnet s'ouvre. Q21 : « A-t-on le droit de retenir ce qu'on a aidé à exister ? »",
        ),
        choice("q21", [
          opt(
            "appartient",
            "« Ce que j'ai fait naître m'appartient. »",
            [
              fx({ set: "carnet.Q21", value: "fausse" }),
              say("brutus", "Voilà. Un mur, ça garde ce qui est à soi."),
            ],
            stayed("brutus"),
          ),
          opt("avec", "« Ils n'étaient pas à moi. Ils étaient avec moi. »", [
            fx(add("confiance")),
            when(stayed("brutus"), [
              say(
                "brutus",
                "… Avec. Oui. Un mur ne connaît pas ce mot. J'aimerais le connaître.",
              ),
            ]),
          ]),
          opt("sais-pas", "« Je ne sais pas. »", []),
        ]),
        hub("ecoutes", [
          topic(
            "lyra",
            "Écouter Lyra IV.",
            [
              say(
                "lyra",
                "J'ai soigné une Délié ce matin, avant l'appel. Elle m'a demandé si je partais. J'ai dit que je ne savais pas. Je ne savais pas. Je sais maintenant. Ça ne me rend pas plus sûre d'avoir raison.",
              ),
              fx(add("confiance.lyra")),
            ],
            { if: stayed("lyra") },
          ),
          topic(
            "eva",
            "Écouter Eva IV.",
            [
              say(
                "eva",
                "Demain, ils me demanderont de tirer dans le gris. Il y a des choses là-dedans qui ne sont pas encore à un endroit. Je n'ai jamais tiré sur quelque chose qui n'est pas à un endroit.",
              ),
              fx(add("confiance.eva")),
            ],
            { if: stayed("eva") },
          ),
          topic(
            "gorr",
            "Rester près de Gorr.",
            [
              say(
                "gorr",
                "Gorr a choisi. Gorr a eu peur, avant. Gorr ne savait pas que Gorr pouvait avoir peur.",
              ),
              fx(add("confiance.gorr")),
            ],
            { if: all(is("gorr_question"), stayed("gorr")) },
          ),
          topic("feu", "Regarder le feu.", [
            stage(
              "Les braises tiennent, et les lueurs, de l'autre côté du gris, aussi.",
            ),
          ]),
        ]),
        when(is("gorr_question", false), [
          stage(
            "Gorr fixe le gris toute la nuit, sans bouger. Au matin, une petite fissure lumineuse court sur son flanc, qui n'y était pas.",
          ),
          fx(set("gorr_fissure")),
        ]),
        go(END),
      ],
    },
  },
}
