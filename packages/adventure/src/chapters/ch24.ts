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
  is,
  isnt,
  join,
  opt,
  say,
  set,
  stage,
  when,
} from "../dsl"
import type {
  Beat,
  Chapter,
  Cond,
  FightLine,
  FightReport,
  FightSpec,
} from "../types"
import { END } from "../types"
import {
  BRUTUS4,
  EFFILOCHEUR,
  EVA4,
  GIANT,
  GUETTEUR,
  LYRA4,
  lacuneBoard,
  MERLIN4,
  NEREA4,
  NYX4,
  SEL,
  SQUALOR4,
  UNSTABLE,
  WILL,
} from "./era4kit"

// ─── Combat : La Paix des Lacunes ───────────────────────────────────────────

/** The Lacunaire IV who joins on the eve (a stable form of the grey). */
const LACUNAIRE4 = {
  ...UNSTABLE,
  id: "lacunaire4",
  name: "Lacunaire IV",
  title: "Né du gris",
  stats: { ...UNSTABLE.stats, health: 3 },
}

// The Bord, 11 x 11: the lip of solid ground in the north, the grey (x) in the
// south-west, the dark rock in the east. With the Eye, the ground at the
// centre is an islet; without it, the Tongue is a strip coming from the north.
const OEIL = [
  ".1..2...1..",
  "...........",
  "..1.....2..",
  "....xxx....",
  "...xx.xx..3",
  "xx.x...x.33",
  "xxxxx.xx.3.",
  "xxxxxxxx...",
  "xxxxxxx..2.",
  "xxxxxx...3.",
  "xxxxx....33",
]
const LANGUE = OEIL.map((row, y) => {
  if (y === 3) return "....x.x...."
  if (y === 6) return "xxxxxxxx.3."
  return row
})

const deadDeliés = (r: FightReport) =>
  r.fighters.filter((f) => f.team === 1 && f.hp <= 0).length
const nbNear = (r: FightReport) => r.divineNearAlly.length
/** Peace: an Intrication was made and no Délié was dispersed. */
const paix = (r: FightReport) =>
  r.result !== "defeat" && r.peace === true && deadDeliés(r) === 0

interface Bits {
  alliance: boolean
  oeil: boolean
  lacunaire: boolean
  squalor: boolean
  merlin: boolean
}

function bord(b: Bits): FightSpec {
  const { board, silent } = lacuneBoard(b.oeil ? OEIL : LANGUE)
  const key = [b.alliance, b.oeil, b.lacunaire, b.squalor, b.merlin]
    .map((x) => (x ? 1 : 0))
    .join("")
  return {
    id: `ch24-bord-${key}`,
    title: "Le Bord : la paix des Lacunes",
    goal: "Trois camps au bord du gris. Ne gagne pas : arrête le combat sans vainqueur. Fais une Intrication entre camps sans disperser un Délié, et tiens jusqu'à la déchirure (tour 10).",
    board,
    teams: [
      {
        name: "Le héros et les siens",
        side: "allies",
        fighters: [
          { preset: "@hero", at: { x: 5, y: 1 } },
          // up to four Échos (the Lacunaire IV counts): who stayed, in order
          ...(b.lacunaire ? [{ preset: LACUNAIRE4, at: { x: 3, y: 1 } }] : []),
          {
            preset: BRUTUS4,
            autonomy: WILL.brutus,
            at: { x: 4, y: 2 },
            needs: "camp.brutus=heros",
          },
          {
            preset: LYRA4,
            autonomy: WILL.lyra,
            at: { x: 6, y: 2 },
            needs: "camp.lyra=heros",
          },
          {
            preset: "gorr",
            at: { x: 5, y: 2 },
            autonomy: WILL.gorr,
            needs: "camp.gorr=heros",
          },
          {
            preset: SQUALOR4,
            at: { x: 6, y: 1 },
            needs: "camp.squalor=heros",
          },
          { preset: MERLIN4, at: { x: 4, y: 1 }, needs: "camp.merlin=heros" },
          {
            preset: EVA4,
            autonomy: WILL.eva,
            at: { x: 3, y: 2 },
            needs: "camp.eva=heros",
          },
          { preset: NEREA4, at: { x: 7, y: 1 }, needs: "camp.nerea=heros" },
        ],
      },
      {
        name: "Les Déliés",
        side: "enemies",
        fighters: [
          { preset: NYX4, at: { x: 1, y: 4 } },
          // the Échos who left in ch. 21 fight here with their usual kit
          { preset: BRUTUS4, at: { x: 0, y: 3 }, needs: "camp.brutus=delie" },
          { preset: LYRA4, at: { x: 1, y: 3 }, needs: "camp.lyra=delie" },
          { preset: "gorr", at: { x: 0, y: 4 }, needs: "camp.gorr=delie" },
          { preset: EVA4, at: { x: 2, y: 4 }, needs: "camp.eva=delie" },
          { preset: NEREA4, at: { x: 2, y: 5 }, needs: "camp.nerea=delie" },
          // 2 to 4 Guetteurs, five Déliés in all
          { preset: GUETTEUR, at: { x: 0, y: 5 } },
          { preset: GUETTEUR, at: { x: 1, y: 5 } },
          { preset: GUETTEUR, at: { x: 0, y: 6 }, needs: "camp.guetteurs>=3" },
          { preset: GUETTEUR, at: { x: 1, y: 6 }, needs: "camp.guetteurs>=4" },
        ],
      },
      {
        name: "Ce qui reste au Ghom du Chaos",
        side: "enemies",
        fighters: [
          {
            // enters the grey on the side of the Déliés at the fourth tick,
            // and goes for Sel when she is there
            preset: GIANT,
            at: { x: 4, y: 6 },
            arrives: { tick: 4 },
            scriptIf: {
              flag: "confiance.nyx",
              atLeast: 0,
              script: [{ from: 4, act: { do: "follow", team: 3, index: 0 } }],
            },
          },
          { preset: EFFILOCHEUR, at: { x: 10, y: 4 } },
          { preset: EFFILOCHEUR, at: { x: 10, y: 5 } },
          { preset: UNSTABLE, at: { x: 9, y: 6 } },
          { preset: UNSTABLE, at: { x: 10, y: 6 } },
          ...(b.squalor ? [{ preset: SQUALOR4, at: { x: 10, y: 7 } }] : []),
          ...(b.merlin
            ? [
                {
                  preset: MERLIN4,
                  at: { x: 9, y: 7 },
                  // he stops to measure from the sixth tick
                  script: [{ from: 6, act: { do: "stand" as const } }],
                },
              ]
            : []),
        ],
      },
      {
        name: "Sel",
        side: "neutral",
        // a bystander on a grey cell in the west, if Nyx still trusts the hero
        fighters: [
          { preset: SEL, at: { x: 1, y: 5 }, needs: "confiance.nyx>=0" },
        ],
      },
    ],
    rules: {
      silent,
      silentDamage: 1,
      // "Le Bord grandit": every two turns two cells next to the grey go out
      // for good; an action of the Ghom's side next to a hole mends it.
      lacunes: { cells: [], edge: silent, every: 2, spread: 2 },
      // The Ghom du Chaos has no body: a Distorsion every three turns on an
      // Écho of camp 1 or 2 that stands off the grey.
      distort: { every: 3, teams: [0, 1] },
      // The giant carries Sel off the map if it ends a move next to her.
      snatch: [
        {
          victim: { team: 3, index: 0 },
          by: { team: 2, index: 0 },
          from: 4,
        },
      ],
      neutral: [3],
      // The Déliés share a cell (Habiter) after a ceasefire; see `rulesIf`.
      // The peace to three: a Lacunaire of the Chaos (the giant, Squalor IV,
      // Merlin IV) brought onto an inhabited cell settles in a stable form and
      // stops; the Ghom du Chaos then stops putting cells out, one turn goes
      // by in silence, and the rift comes.
      settle: { teams: [2], calm: true },
      clock: { period: 10, limit: 10, winner: 0 },
      announce: true,
    },
    rulesIf: (["0", "1", "3"] as const).map((n) => ({
      needs: `cessez=${n}`,
      rules: {
        ceasefire: {
          a: 0,
          b: 1,
          after: Number(n),
          revoked: 3,
          // without the alliance, Nyx IV refuses to share the hero's cell
          ...(b.alliance ? {} : { except: [0] }),
        },
      },
    })),
    influences: ["earthquake", "timeWarp", "blessing"],
    startEnergy: 3,
    defeat: [
      set("defaite"),
      add("usure"),
      add("confiance", -1),
      set("paix_des_lacunes", false),
    ],
    objectives: [
      {
        id: "paix",
        mark: "★",
        label: "Arrêter le combat sans vainqueur : une Intrication entre camps",
        check: paix,
        success:
          "Deux Échos de camps opposés habitent une case grise. Le combat s'arrête.",
        failure: "Personne n'a pu s'accorder : la déchirure arrête le combat.",
        onSuccess: [
          set("paix_des_lacunes"),
          add("confiance", 2),
          add("lacunes.habitees"),
        ],
      },
      {
        id: "paix-a-trois",
        mark: "◆",
        label: "La paix à trois : le camp du Chaos entre dans l'Intrication",
        check: (r) => paix(r) && (r.settled ?? []).length >= 1,
        onSuccess: [
          set("paix_a_trois"),
          add("lacunes.habitees"),
          add("ghom_dechu.verite"),
        ],
      },
      {
        id: "aucun-delie",
        mark: "◆",
        label: "Aucun Délié dispersé",
        check: (r) => deadDeliés(r) === 0,
        onSuccess: [add("confiance.nyx")],
        onFailure: [set("alliance_nyx", false)],
      },
      {
        id: "sel",
        mark: "◆",
        label: "Sel n'est pas emportée par le Lacunaire géant",
        check: (r) => (r.snatched ?? []).length === 0,
        onFailure: [set("sel_emportee"), add("confiance.nyx", -2)],
      },
      {
        id: "aucune-insistance",
        mark: "◆",
        label: "Aucune Influence près d'un allié de tout le combat",
        check: (r) => nbNear(r) === 0 && r.autonomy?.insisted.length === 0,
        onSuccess: [add("confiance")],
      },
    ],
    lines: <FightLine[]>[
      {
        when: "start",
        who: "nyx",
        text: "Personne ne me touche. Alors voyons ce que ça vaut.",
      },
      {
        when: "tick:1",
        who: "brutus",
        text: "Demain, je ne garde pas un mur. Je garde un bord. Ça bouge, un bord.",
      },
      ...(b.alliance
        ? []
        : [
            {
              when: "tick:3",
              who: "nyx",
              text: "Je ne sais même plus contre qui je me bats.",
            },
          ]),
      {
        when: "tick:3",
        who: "lyra",
        text: "Je soignerai qui tombera près de moi, quel que soit son camp.",
      },
      {
        when: "tick:4",
        who: "nyx",
        text: "Il va sur Sel !",
      },
      ...(b.merlin
        ? [
            {
              when: "tick:6",
              who: "merlin",
              text: "Je mesure. Je ne prends pas part. … Non. Mesurer, c'est déjà prendre part. Mon ancêtre l'avait compris. Pas moi.",
            },
          ]
        : []),
      {
        when: "tick:5",
        who: "gorr",
        text: "Gorr sent le froid d'en face. Gorr tient le sol.",
      },
      {
        when: "end",
        who: "brutus",
        text: "Pas de vainqueur. Je ne savais pas qu'on pouvait finir comme ça.",
      },
    ],
  }
}

/** The same fight for each case of the five unknowns (32 variants). */
function chooseFight(): Beat {
  const conds: [keyof Bits, Cond][] = [
    ["alliance", is("alliance_nyx")],
    ["oeil", is("lacune_geante_habitee")],
    ["lacunaire", gte("confiance.lacunaire", 2)],
    ["squalor", isnt("squalor_rejoint")],
    ["merlin", isnt("merlin_convaincu")],
  ]
  const build = (i: number, bits: Partial<Bits>): Beat => {
    if (i === conds.length) {
      return { t: "fight", fight: bord(bits as Bits) }
    }
    const [k, c] = conds[i]
    return when(
      c,
      [build(i + 1, { ...bits, [k]: true })],
      [build(i + 1, { ...bits, [k]: false })],
    )
  }
  return build(0, {})
}

// ─── Island ─────────────────────────────────────────────────────────────────

const ISLAND = [
  "...........",
  ".2.......1.",
  "...........",
  "....aa.....",
  "...........",
  ".1.....2...",
  "...........",
  "...2.....1.",
  "...........",
]
const zone = (x: number, y: number) => around(ISLAND, x, y)

type Id = "brutus" | "lyra" | "eva" | "nerea" | "gorr" | "squalor"
const RETOURS: Record<Id, string> = {
  lyra: "Je reviens. Je n'ai pas eu tort de partir. Je n'ai pas tort de revenir.",
  brutus: "Je reviens. Je garde ce qui bouge, et ça bouge de ton côté aussi.",
  eva: "Je reviens. Je ne sais pas encore sur quoi je tirerai. Je reviens quand même.",
  nerea:
    "Je reviens. Il y aura beaucoup à lire, et je préfère le lire avec vous.",
  gorr: "Gorr revient. Gorr n'était pas parti : Gorr était à côté.",
  squalor: "Je reviens. Le chaud, ça me manquait. C'est idiot, hein.",
}
const NOMS: Record<Id, string> = {
  lyra: "Lyra IV",
  brutus: "Brutus IV",
  eva: "Eva IV",
  nerea: "Néréa IV",
  gorr: "Gorr",
  squalor: "Squalor IV",
}
const LIGNEES = Object.keys(RETOURS) as Id[]

/** Back to the team: left in peace or in rupture, and trusted enough. */
const revient = (l: Id): Cond =>
  all(
    any(is(`depart.${l}`, "paix"), is(`depart.${l}`, "rupture")),
    any(gte(`confiance.${l}`, 1), is(`depart.${l}`, "paix")),
  )
const parti = (l: Id): Cond =>
  any(is(`depart.${l}`, "paix"), is(`depart.${l}`, "rupture"))
const reste = (l: Id): Cond =>
  any(is(`depart.${l}`, "aucun"), is(`depart.${l}`, "retenu"))

// ─── Chapter ────────────────────────────────────────────────────────────────

export const ch24: Chapter = {
  id: "24",
  era: 4,
  number: 24,
  title: "La Paix des Lacunes",
  quote: {
    who: "nyx",
    text: "J'ai rayé le paragraphe VII. Je l'ai laissé lisible. On doit voir ce qu'on a cru.",
  },
  place: "Le Bord, entre la terre ferme et le gris",
  question: { id: "Q24", text: "Peut-on être libres ensemble ?" },
  start: "1",
  exploration: {
    island: ISLAND,
    start: { x: 0, y: 3 },
    companions: ["gorr", "brutus", "lyra"],
    influences: ["earthquake", "timeWarp", "blessing"],
    encounters: [
      {
        id: "e1",
        label: "La veille, sur la lèvre du Bord",
        scene: "1",
        at: { x: 2, y: 3 },
        zone: zone(2, 3),
      },
      {
        id: "e2",
        label: "Le Bord, au centre",
        scene: "2",
        at: { x: 5, y: 5 },
        zone: zone(5, 5),
      },
      {
        id: "e3",
        label: "Le gris, après le combat",
        scene: "3",
        at: { x: 8, y: 6 },
        zone: zone(8, 6),
      },
      {
        id: "e4",
        label: "La déchirure",
        scene: "4",
        at: { x: 9, y: 2 },
        zone: zone(9, 2),
      },
      {
        id: "feux",
        label: "Deux feux de camp",
        at: { x: 1, y: 7 },
        examine: {
          lines: [
            {
              style: "stage",
              text: "D'un côté les feux de l'équipe, de l'autre les lueurs sans reflet des Déliés, dans le gris. Entre les deux, quinze pas de terre ferme que personne n'a encore franchis.",
            },
          ],
          effects: [{ add: "ecoute", by: 1 }],
        },
      },
      {
        id: "froid",
        label: "Une lumière froide à l'est",
        at: { x: 10, y: 8 },
        examine: {
          lines: [
            {
              style: "stage",
              text: "À l'est, une lumière froide grossit : le Fragment du Chaos, ou la roche sombre de la vieille soudure qui se soulève. L'air y est plus froid de minute en minute. Une extinction ne fait pas de bruit.",
            },
          ],
          effects: [{ add: "ecoute", by: 1 }],
        },
      },
      {
        id: "eboulis",
        label: "Un éboulis au bord du gris",
        at: { x: 5, y: 8 },
        obstacle: {
          influence: "earthquake",
          before: [
            {
              style: "stage",
              text: "Un éboulis ferme un sentier qui descend vers la lisière du gris.",
            },
          ],
          after: [
            {
              style: "stage",
              text: "Le sol tressaille ; les pierres roulent, et le sentier s'ouvre jusqu'à la lisière.",
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
      title: "La veille du Bord",
      kind: "rencontre",
      setting: "La nuit, sur la lèvre ; les feux et les lueurs sans reflet",
      beats: [
        stage(
          "La nuit, sur la lèvre. Les feux de l'équipe d'un côté, les lueurs sans reflet des Déliés de l'autre, dans le gris. Au loin, à l'est, une lumière froide grossit : le Fragment du Chaos, ou la roche sombre de la vieille soudure qui se soulève. L'air y est plus froid de minute en minute.",
        ),
        when(gte("confiance.lacunaire", 2), [
          say(
            "lacunaire",
            "Je suis né du gris. Je… nous… Non. Je. Les Déliés m'ont fixé, en me parlant tous les jours. Ton Ghom a fixé ma lignée, il y a longtemps. Je ne sais pas à qui je dois ma forme. Aux deux. Je viens avec toi demain.",
          ),
          stage("Le Lacunaire IV rejoint l'équipe pour ce chapitre."),
        ]),
        stage(
          "Nyx IV vient seule jusqu'au feu du héros. Elle tient une ardoise : le paragraphe VII du manifeste.",
        ),
        say(
          "nyx",
          "Demain, mes gens se battront pour ça. Je l'ai écrit il y a dix ans. Je le leur lis chaque veille.",
        ),
        say(
          "nyx",
          "« La liberté, c'est l'absence de liens. Personne ne me touche. Donc je suis libre. »",
        ),
        say(
          "nyx",
          "Ça marche, tu sais. Ça tient debout. Jusqu'au moment où tu oublies le mot « chaud ».",
        ),
        stage("Le Carnet s'ouvre."),
        fx(set("carnet.Q24", "ouverte")),
        stage("Q24 : « Peut-on être libres ensemble ? »"),
        choice("paragraphe", [
          opt(
            "raison",
            "« Ton paragraphe a raison. Être libre, c'est n'être tenu par rien. »",
            [
              fx(set("carnet.Q24", "fausse")),
              say(
                "nyx",
                "Bon. Alors on est d'accord. Je ne sais pas pourquoi ça ne me soulage pas.",
              ),
            ],
          ),
          opt(
            "touches",
            "« Personne ne te touche. Est-ce que tu touches encore quelqu'un ? »",
            [
              fx(add("confiance.nyx")),
              stage("Nyx IV se tait longtemps."),
              say(
                "nyx",
                "Pose pas des questions comme ça la veille d'une bataille.",
              ),
            ],
          ),
          opt("sais-pas", "« Je ne sais pas. »", [
            say("nyx", "Moi non plus. C'est nouveau."),
          ]),
        ]),
        stage("Les écoutes de veillée : chacun parle au feu."),
        when(reste("brutus"), [
          say(
            "brutus",
            "Demain, je ne garde pas un mur. Je garde un bord. Ça bouge, un bord. J'ai mis quatre siècles de lignée à aimer ça.",
          ),
          fx(add("confiance.brutus")),
        ]),
        when(reste("lyra"), [
          say(
            "lyra",
            "Je soignerai qui tombera près de moi. Quel que soit son camp. Ne me le demande pas, ne me l'interdis pas.",
          ),
          fx(add("confiance.lyra")),
        ]),
        when(any(reste("eva"), is("eva_pretee")), [
          say(
            "eva",
            "Je sais sur quoi je tirerai demain. Pas où ça arrivera. Ça me suffit.",
          ),
          fx(add("confiance.eva")),
        ]),
        when(is("nerea_retrouvee"), [
          say(
            "nerea",
            "Demain, il se déposera quelque chose de très lourd. Je veux être là pour le lire après.",
          ),
          fx(add("confiance.nerea")),
        ]),
        when(is("gorr_question"), [
          say(
            "gorr",
            "Gorr a une question pour demain. Gorr la garde. Pas encore.",
          ),
          fx(add("confiance.gorr")),
        ]),
        when(reste("squalor"), [
          say(
            "squalor",
            "Le froid d'en face, je le sens d'ici. Ça sent la faim sans fin. J'aime pas.",
          ),
          fx(add("confiance.squalor")),
        ]),
        // Who stands where on the Bord: up to four Échos with the hero (the
        // Lacunaire IV counts), the ones who left fight with the Déliés, and
        // the Guetteurs make the Déliés five.
        fx(set("camp.allies", 0), set("camp.guetteurs", 4)),
        when(gte("confiance.lacunaire", 2), [fx(add("camp.allies"))]),
        ...(
          [
            ["brutus", reste("brutus")],
            ["lyra", reste("lyra")],
            ["gorr", reste("gorr")],
            ["squalor", all(is("squalor_rejoint"), reste("squalor"))],
            ["merlin", is("merlin_convaincu")],
            ["eva", any(reste("eva"), is("eva_pretee"))],
            ["nerea", all(is("nerea_retrouvee"), reste("nerea"))],
          ] as [string, Cond][]
        ).flatMap(([l, here]): Beat[] => [
          when(
            all(here, { not: gte("camp.allies", 4) }),
            [fx(set(`camp.${l}`, "heros"), add("camp.allies"))],
            ["brutus", "lyra", "gorr", "eva", "nerea"].includes(l)
              ? [
                  when(parti(l as Id), [
                    fx(set(`camp.${l}`, "delie")),
                    when(gte("camp.guetteurs", 3), [
                      fx(add("camp.guetteurs", -1)),
                    ]),
                  ]),
                ]
              : [],
          ),
        ]),
        // How long the Déliés ask for a ceasefire before sharing a cell.
        fx(set("cessez", "3")),
        when(
          any(
            is("objet_de_nyx", "nyx_iv"),
            ...LIGNEES.map((l) => is(`depart.${l}`, "paix")),
            all(is("eva_pretee"), is("carnet.Q22", "repondue")),
          ),
          [fx(set("cessez", "1"))],
        ),
        when(is("alliance_nyx"), [fx(set("cessez", "0"))]),
        go("2"),
      ],
    },

    // ── 2 ──
    "2": {
      id: "2",
      title: "La Paix des Lacunes",
      kind: "combat",
      setting: "Le Bord : trois camps, le gris qui avance",
      beats: [
        stage(
          "Les trois camps se retrouvent au bord du Bord : l'équipe du héros, les Déliés de Nyx IV, et ce qui reste au Ghom du Chaos, des Lacunaires qu'il laisse affluer et des Échos qui ont choisi son froid. Il ne peut pas toucher le gris, mais il éteint les terres autour, et le Bord grandit.",
        ),
        when(is("alliance_nyx"), [
          say(
            "nyx",
            "Mes gens ne te toucheront pas. Ne touche pas les miens : ce serait la fin de ce qu'on s'est dit.",
          ),
        ]),
        chooseFight(),
        when(is("defaite"), [
          stage(
            "Les cases de la lèvre s'éteignent l'une après l'autre ; l'équipe est coupée de la terre ferme. Personne ne gagne, personne ne s'arrête : c'est la déchirure qui arrête tout, plus tôt que prévu.",
          ),
          say(
            "nyx",
            "Pas de paix aujourd'hui. Pas de vainqueur non plus. Regarde le centre.",
          ),
          fx(set("defaite", false)),
        ]),
        when(is("paix_a_trois"), [
          stage(
            "Le Lacunaire géant s'est fixé dans une forme stable, sur une case habitée. Au loin, le froid cesse d'avancer.",
          ),
          say("squalor", "… C'est pas de la faim, ça. C'est quoi ?"),
        ]),
        go("3"),
      ],
    },

    // ── 3 ──
    "3": {
      id: "3",
      title: "Ce qui reste",
      kind: "rencontre",
      setting: "Sur le Bord, juste avant la déchirure",
      beats: [
        when(
          is("paix_des_lacunes"),
          [
            stage(
              "Le silence tombe sur le Bord, d'un coup. Les armes baissées. Deux Échos de camps opposés se tiennent sur la même case grise, et autour d'eux, le gris a pris une couleur : une couleur faible, mais une couleur.",
            ),
            say(
              "nyx",
              "Regarde. Personne ne nous tient. Ni ton Ghom, ni l'autre. Et on se tient quand même.",
            ),
            say(
              "nyx",
              "Tu sais ce que j'ai compris, au fond, avec Sel ? On existe, quand plus rien ne nous touche. On ne disparaît pas. Mais on n'est plus quelqu'un pour quelqu'un. Et ça, c'est la seule façon d'être quelqu'un que je connaisse. On n'a d'état que dans ce qu'on touche.",
            ),
            say(
              "nyx",
              "Alors je choisis ce que je touche. C'est ça, ma liberté. Pas l'absence de liens. Le choix des liens.",
            ),
            stage(
              "Q20 : « Existe-t-on quand plus rien ne nous touche ? » Réponse trouvée : on existe, mais on n'est plus quelqu'un pour quelqu'un. On n'a d'état que dans ses relations.",
            ),
            fx(set("carnet.Q20", "repondue")),
            when(is("objet_de_nyx", "nyx_iv"), [
              stage(
                "Nyx IV ouvre la main. La Lame à une encoche de la première Nyx est posée sur la case habitée, entre les deux Échos.",
              ),
              say(
                "nyx",
                "La première l'a laissé à quelqu'un. Moi, je le laisse ici. Entre.",
              ),
            ]),
            stage("Chaque Écho parti choisit seul."),
            ...LIGNEES.flatMap((l): Beat[] => [
              when(revient(l), [
                say(l, RETOURS[l]),
                fx(set(`retour.${l}`), set(`statut.${l}`, "reste")),
              ]),
              when(all(parti(l), isnt(`retour.${l}`)), [
                stage(
                  `${NOMS[l]} reste chez les Déliés, allié désormais. Il sera là en ère V, aux côtés de Nyx IV.`,
                ),
              ]),
            ]),
          ],
          [
            stage(
              "Le combat ne s'arrête pas : c'est la déchirure qui l'arrête. Juste avant, Nyx IV se retrouve seule sur une case grise, loin des siens.",
            ),
            say("nyx", "Personne ne me touche. Donc je suis libre."),
            stage("Elle rit, sans joie."),
            say(
              "nyx",
              "J'existe. Je suis là. Je ne suis plus là pour personne. Voilà la réponse, Couplé. Je l'ai trouvée toute seule. C'était exactement la chose à ne pas faire.",
            ),
            stage("Q20 : réponse trouvée, version amère."),
            fx(set("carnet.Q20", "repondue")),
            when(is("sel_emportee"), [
              stage(
                "Dans le fracas, le Lacunaire géant a emporté Sel dans le gris. Personne ne l'a vu partir.",
              ),
            ]),
          ],
        ),
        // The name (arc F)
        when(all(gte("confiance.nyx", 3), is("nom", "aucun")), [
          say(
            "nyx",
            "Tu n'as toujours pas de nom. Les chants disent « le Couplé ». C'est un nom de chose.",
          ),
          say(
            "nyx",
            "Je t'appellerais Lisière. Tu vis au bord. Ni dans le gris, ni dans la terre ferme. Là où ça touche.",
          ),
          fx(set("nom.propositions.nyx")),
          choice("nom-lisiere", [
            opt("garde", "« Lisière. Je m'en souviendrai. »", [
              fx(add("confiance.nyx")),
              say(
                "nyx",
                "Bon. Je l'écrirai mal dans la prochaine Chronique. C'est la tradition.",
              ),
            ]),
            opt("plus-tard", "« Garde-le pour plus tard. »", [
              say("nyx", "Il sera là. Les noms, ça attend bien."),
            ]),
            opt("non", "« Je n'en veux pas. »", [
              fx(set("nom.propositions.nyx", false)),
              say(
                "nyx",
                "Tant mieux. Moi non plus, je n'en voulais pas, du mien.",
              ),
            ]),
          ]),
        ]),
        when(isnt("nom", "aucun"), [
          say("nyx", "Tu as un nom. Je ne le dis pas : je le dirais mal."),
        ]),
        when(is("paix_des_lacunes"), [
          fx(give("habit:ceinture-de-treve")),
          stage(
            "Habit : la Ceinture de trêve. Un fil de lisière tressé avec une corde de l'équipe ; Nyx IV en a fait deux, et en porte un.",
          ),
          when(is("carnet.Q24", "ouverte"), [
            stage(
              "Nyx IV donne au héros le paragraphe VII, barré mais lisible : l'ardoise rayée.",
            ),
            fx(give("objet:l-ardoise-rayee")),
            say("nyx", "J'ai rayé le paragraphe VII. Je l'ai laissé lisible."),
          ]),
        ]),
        go("4"),
      ],
    },

    // ── 4 ──
    "4": {
      id: "4",
      title: "La déchirure",
      kind: "fin",
      setting: "Le centre du Bord se tend ; le Tissu se déchire",
      beats: [
        stage(
          "Le centre du Bord se tend. Le gris, qui n'avait ni profondeur ni horizon, prend une profondeur, puis plusieurs. Le sol tremble sans Séisme. Merlin IV, où qu'il soit, crie qu'on s'éloigne ; personne ne l'écoute, il n'y a nulle part où s'éloigner.",
        ),
        stage(
          "Le Tissu se déchire. Ce n'est pas un bruit : c'est un silence qui s'ouvre. Pendant quelques secondes, à travers la déchirure, on voit le Bord lui-même, mais autrement : d'autres Échos à d'autres places. Un Brutus qui n'est jamais parti, ou qui n'est jamais revenu. Une Nyx qui s'est dispersée à l'Aube. Une Eva qui n'a jamais tiré au hasard. Et le héros, avec un autre visage, un autre corps, qui regarde de l'autre côté.",
        ),
        when(
          is("merlin_convaincu"),
          [
            say(
              "merlin",
              "Ce sont… nous. Ailleurs. Les branches dont parlaient mes confrères. Le gris était trop pauvre pour les tenir séparées.",
            ),
          ],
          [
            say(
              "nerea",
              "Ce sont… nous. Ailleurs. Le gris était trop pauvre pour les tenir séparées.",
            ),
          ],
        ),
        stage(
          "L'énergie qui tenait les corrélations du Tissu se libère d'un coup : une lumière blanche, brûlante, qui part de la déchirure. Le héros a un instant pour choisir.",
        ),
        choice("transformation", [
          opt("gris", "Rester dans le gris.", [
            stage(
              "Le héros s'enfonce dans la Lacune, au plus près de la déchirure, là où la lumière ne trouve rien à quoi se heurter.",
            ),
            when(any(is("alliance_nyx"), is("paix_des_lacunes")), [
              stage("Nyx IV tient sa main ; ils habitent la case à deux."),
              fx(add("lacunes.habitees")),
            ]),
            fx(set("transformation.4", "A"), give("peau_d_ombre")),
            stage(
              "Une peau d'un gris mat, sans reflet, faite au plus près de la déchirure, là où la lumière ne trouvait rien à toucher. Elle renvoie si peu de lumière qu'on la devine plus qu'on ne la voit. Peau d'ombre.",
            ),
          ]),
          opt("devant", "Se placer entre la déchirure et les siens.", [
            stage(
              "Le héros se tient sur la dernière case ferme, face à la lumière, les autres derrière lui. Elle le brûle, et s'arrête sur lui.",
            ),
            fx(set("transformation.4", "B"), give("cicatrices_de_lumiere")),
            stage(
              "Des traînées claires sur la peau, là où la lumière de la déchirure s'est arrêtée sur lui au lieu de passer. Elles restent tièdes. Cicatrices de lumière.",
            ),
          ]),
        ]),
        stage(
          "La lumière s'éteint. Le Bord n'a plus de fond. Des fragments de terre de toutes les époques dérivent dans la déchirure : un pilotis des Marées, une tour de verre, une prairie de l'Aube.",
        ),
        // The team of era V: the Lacunaire IV and the leavers who came back.
        when(gte("confiance.lacunaire", 2), [fx(join("lacunaire"))]),
        go(END),
      ],
    },
  },
}
