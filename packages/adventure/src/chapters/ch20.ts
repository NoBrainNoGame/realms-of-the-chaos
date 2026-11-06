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
  isnt,
  join,
  narr,
  opt,
  puzzle,
  say,
  set,
  stage,
  topic,
  when,
} from "../dsl"
import type { PuzzleSpec } from "../puzzle"
import type { Beat, Chapter, FightReport, FightSpec } from "../types"
import { END } from "../types"
import {
  BRUTUS4,
  EFFILOCHEUR,
  EVA4,
  GIANT,
  LYRA4,
  lacuneBoard,
  NEREA4,
  UNSTABLE,
  WILL,
} from "./era4kit"

// ─── Combat : Le Lac muet ───────────────────────────────────────────────────

// Deep water (w) rings the centre: walkers cannot cross it, so the hero
// carries a spare crystal (a bridge over the deep ring, span 2). The centre
// is Lacune (x), the islet a 1.
const { board: LAKE, silent: LAKE_X } = lacuneBoard([
  "..1....1...",
  ".1..~~~..1.",
  "..~~www~~..",
  ".~wwxxxww~.",
  ".~wwx1xww~.",
  ".~wwxxxww~.",
  "..~~www~~..",
  ".1..~~~..1.",
  "...........",
])

/** The nine zones of the lake, 3 x 3 (4 x 3 on the sides), lines of buoys. */
const colRanges = [
  [0, 3],
  [4, 6],
  [7, 10],
]
const rowRanges = [
  [0, 2],
  [3, 5],
  [6, 8],
]
const LAKE_ZONES = rowRanges.flatMap(([y0, y1], r) =>
  colRanges.map(([x0, x1], c) => ({
    id: `z${r}${c}`,
    cells: Array.from({ length: (x1 - x0 + 1) * (y1 - y0 + 1) }, (_, i) => ({
      x: x0 + (i % (x1 - x0 + 1)),
      y: y0 + Math.floor(i / (x1 - x0 + 1)),
    })),
  })),
)

/** Néréa's cell (5,4) and the four cells next to it. */
const NEREA_AREA = [
  { x: 5, y: 4 },
  { x: 4, y: 4 },
  { x: 6, y: 4 },
  { x: 5, y: 3 },
  { x: 5, y: 5 },
]

const nereaOf = (r: FightReport) =>
  r.fighters.find((f) => f.preset === NEREA4.id)

const lacMuet: FightSpec = {
  id: "ch20-lac-muet",
  title: "Le Lac muet",
  goal: "Rejoindre Néréa IV sur son îlot avant qu'il ne devienne gris, en gardant les zones du lac vivantes : passe par les zones qui bougent encore.",
  board: LAKE,
  teams: [
    {
      name: "Alliés",
      side: "allies",
      fighters: [
        { preset: "@hero", at: { x: 5, y: 0 } },
        { preset: "gorr", at: { x: 4, y: 0 }, autonomy: WILL.gorr },
        { preset: BRUTUS4, autonomy: WILL.brutus, at: { x: 6, y: 0 } },
        { preset: LYRA4, autonomy: WILL.lyra, at: { x: 3, y: 1 } },
        { preset: EVA4, autonomy: WILL.eva, at: { x: 7, y: 1 } },
      ],
    },
    {
      name: "Les Lacunaires",
      side: "enemies",
      fighters: [
        { preset: EFFILOCHEUR, at: { x: 4, y: 3 } },
        { preset: EFFILOCHEUR, at: { x: 6, y: 3 } },
        { preset: EFFILOCHEUR, at: { x: 4, y: 5 } },
        { preset: EFFILOCHEUR, at: { x: 6, y: 5 } },
        { preset: UNSTABLE, at: { x: 5, y: 3 } },
        { preset: UNSTABLE, at: { x: 5, y: 5 } },
        // The doubled Lacunaire comes out of the centre on turn 5.
        { preset: GIANT, at: { x: 5, y: 4 }, hp: 12, arrives: { tick: 5 } },
      ],
    },
    {
      name: "Néréa IV",
      side: "neutral",
      fighters: [{ preset: NEREA4, at: { x: 5, y: 4 } }],
    },
  ],
  rules: {
    // The effilochage: nine zones, kept alive by the team (a zone nobody acts
    // in goes silent, then lost). The four effilocheurs never count as work
    // and wear the zone they end a turn in down by half a tick.
    zonePush: { team: 1, indexes: [0, 1, 2, 3], step: 0.5 },
    regions: { nerea: NEREA_AREA },
    crystals: {
      crystals: [
        {
          id: "pont",
          at: { x: 5, y: 0 },
          kind: "geode",
          carriedBy: { team: 0, index: 0 },
        },
      ],
      bridge: { span: 2 },
    },
    silent: LAKE_X,
    silentDamage: 2,
    zones: LAKE_ZONES,
    zoneTeams: [0],
    neutral: [2],
    clock: { period: 1, limit: 8, winner: 0 },
    announce: true,
  },
  influences: ["earthquake", "timeWarp", "blessing"],
  startEnergy: 3,
  defeat: [
    set("defaite"),
    add("usure"),
    add("confiance", -1),
    set("nerea_retrouvee", false),
  ],
  objectives: [
    {
      id: "retrouver-nerea",
      mark: "★",
      label: "Retrouver Néréa IV avant que l'îlot ne devienne gris",
      // an ally stood on her cell or next to it, and she was not dispersed
      when: { visited: { region: "nerea", who: { team: 0 } } },
      check: (r) => r.result !== "defeat" && (nereaOf(r)?.hp ?? 1) > 0,
      success: "Tu es venu par les zones vivantes. Néréa IV rejoint l'équipe.",
      failure:
        "L'îlot est devenu gris. Un plongeur emporte Néréa IV vers le fond.",
      onSuccess: [set("nerea_retrouvee"), join("nerea")],
      onFailure: [set("nerea_retrouvee", false)],
    },
    {
      id: "six-zones",
      mark: "◆",
      label: "Garder au moins six zones sur neuf",
      check: (r) =>
        Object.values(r.zoneStates).filter((s) => s !== "lost").length >= 6,
      onSuccess: [add("lacunes.recousues")],
    },
    {
      id: "lacune-habitee",
      mark: "◆",
      label: "Deux Échos sur une même case grise, sans dommage",
      check: (r) => r.result !== "defeat" && r.intrications >= 1,
      onSuccess: [add("lacunes.habitees")],
    },
  ],
  lines: [
    {
      when: "start",
      who: "nerea",
      text: "Ne venez pas en ligne droite. Le fond est vide. Suivez les zones qui bougent encore.",
    },
    { when: "tick:1", who: "brutus", text: "Le sol part. Tenez la rive." },
    {
      when: "tick:3",
      who: "nerea",
      text: "Ça vient. Je sens le froid monter par les pieds.",
    },
    {
      when: "tick:5",
      who: "eva",
      text: "Deux positions. Soixante-quarante. Je ne tire pas sur un soixante-quarante.",
    },
    { when: "tick:5", who: "lyra", text: "Plus cher ici. Beaucoup plus cher." },
    {
      when: "end",
      who: "nerea",
      text: "Le lac a cessé d'écrire. Mais nous, on a fait des remous. Ça se dépose aussi, les remous.",
    },
  ],
}

// ─── Island ─────────────────────────────────────────────────────────────────

const ISLAND = [
  "...........",
  ".1.......2.",
  "....aa.....",
  "...........",
  ".2.....aa..",
  "...........",
  "...1.......",
  ".........1.",
  "...........",
]
const zone = (x: number, y: number) => around(ISLAND, x, y)

// ─── The Nasses : a placement puzzle ────────────────────────────────────────

const PAIRS = [
  {
    id: "a",
    flag: "nasse_a",
    tokens: ["pecheur", "tisseuse"] as [string, string],
  },
  {
    id: "b",
    flag: "nasse_b",
    tokens: ["pere", "fille"] as [string, string],
  },
  {
    id: "c",
    flag: "nasse_c",
    tokens: ["conteur", "freres"] as [string, string],
  },
]

// 5 x 5 cells, all of them Lacune ground (walkable, but nothing holds): six
// Déliés, each alone on a cell; four moves; two of them on one cell make it
// inhabited.
const NASSES: PuzzleSpec = {
  kind: "grid",
  w: 5,
  h: 5,
  marks: [
    {
      label: "Fond du gris",
      cells: Array.from({ length: 25 }, (_, i) => ({
        x: i % 5,
        y: (i / 5) | 0,
      })),
    },
  ],
  tokens: [
    { id: "pecheur", label: "Le vieux pêcheur", at: { x: 0, y: 0 } },
    { id: "tisseuse", label: "La tisseuse", at: { x: 3, y: 1 } },
    { id: "pere", label: "Le père", at: { x: 1, y: 3 } },
    { id: "fille", label: "Sa fille", at: { x: 4, y: 4 } },
    { id: "conteur", label: "Le conteur", at: { x: 2, y: 2 } },
    { id: "freres", label: "Les deux frères", at: { x: 0, y: 4 } },
  ],
  moves: 4,
  sticky: true,
  rules: PAIRS.map((p) => ({
    id: p.id,
    kind: "together" as const,
    tokens: p.tokens,
  })),
}

const NASSE_TEXT: Record<string, string> = {
  a: "Le vieux pêcheur rejoint la tisseuse : leurs contours redeviennent nets.",
  b: "Le père et sa fille, front contre front : la case reprend un peu de couleur.",
  c: "Le conteur entre les deux frères : la case reprend de la couleur.",
}

const nassesPuzzle = (): Beat =>
  puzzle(
    "nasses",
    NASSES,
    Object.fromEntries(
      PAIRS.map((p) => [
        p.id,
        [
          fx(set(p.flag)),
          stage(
            `Le héros se place entre eux, les guide du plat de la main. ${NASSE_TEXT[p.id]}`,
          ),
        ],
      ]),
    ),
    {
      prompt:
        "Choisis un Délié, puis la case où le guider : quatre déplacements. Deux Déliés sur la même case, et elle redevient habitée.",
      none: [
        stage(
          "Rien ne bouge. À dix pas, un contour s'est encore un peu défait.",
        ),
      ],
    },
  )

// ─── Chapter ────────────────────────────────────────────────────────────────

export const ch20: Chapter = {
  id: "20",
  era: 4,
  number: 20,
  title: "Ceux qui vivent à l'écart",
  quote: {
    who: "nyx",
    text: "Vous nous avez fait pousser comme on taille une haie. Nous sommes allés vivre là où vos mains glissent.",
  },
  place: "Haut-Pendant, les Nasses, le Lac muet, Corde-Basse",
  question: {
    id: "Q20",
    text: "Existe-t-on quand plus rien ne nous touche ?",
  },
  start: "1",
  exploration: {
    island: ISLAND,
    start: { x: 0, y: 3 },
    companions: ["gorr", "brutus", "lyra"],
    influences: ["earthquake", "timeWarp", "blessing"],
    encounters: [
      {
        id: "e1",
        label: "Le câble d'Eva IV",
        scene: "1",
        at: { x: 2, y: 3 },
        zone: zone(2, 3),
      },
      {
        id: "e2",
        label: "Haut-Pendant : Nyx IV",
        scene: "2",
        at: { x: 4, y: 3 },
        zone: zone(4, 3),
      },
      {
        id: "e3",
        label: "Les Nasses, au fond du gris",
        scene: "3",
        at: { x: 6, y: 5 },
        zone: zone(6, 5),
      },
      {
        id: "e4",
        label: "Le Lac muet",
        scene: "4",
        at: { x: 8, y: 6 },
        zone: zone(8, 6),
      },
      {
        id: "e5",
        label: "La dernière strate",
        scene: "5",
        at: { x: 9, y: 4 },
        zone: zone(9, 4),
      },
      {
        id: "e6",
        label: "Corde-Basse, la veillée",
        scene: "6",
        at: { x: 3, y: 6 },
        zone: zone(3, 6),
      },
      {
        id: "e7",
        label: "Le bord, au matin",
        scene: "7",
        at: { x: 1, y: 6 },
        zone: zone(1, 6),
      },
      {
        id: "ardoises",
        label: "Les ardoises du manifeste",
        at: { x: 5, y: 1 },
        examine: {
          lines: [
            {
              style: "stage",
              text: "Les ardoises pendent à la plateforme dans l'ordre, du premier extrait au dernier. Les plus anciennes sont lisses à force d'être touchées. Une seule est vierge, au bout : on dirait qu'elle attend.",
            },
          ],
          effects: [{ add: "ecoute", by: 1 }],
        },
      },
      {
        id: "silence",
        label: "Le silence des Nasses",
        at: { x: 9, y: 2 },
        examine: {
          lines: [
            {
              text: "Dans une Lacune, le son porte mal : il y a peu de choses pour le porter. On parle front contre front, et on oublie vite ce qu'on ne se redit pas.",
            },
          ],
          effects: [{ add: "ecoute", by: 1 }],
        },
      },
      {
        id: "poteau",
        label: "Un poteau de câble penché",
        at: { x: 1, y: 8 },
        obstacle: {
          influence: "earthquake",
          before: [
            {
              style: "stage",
              text: "Un poteau de câble, penché de moitié. Le câble qu'il porte pend trop bas : la passerelle racle la Lacune.",
            },
          ],
          after: [
            {
              style: "stage",
              text: "Le sol tressaille ; le poteau se redresse. Le câble se tend, la passerelle remonte d'un pas.",
            },
          ],
          effects: [{ add: "ecoute", by: 1 }],
        },
      },
      {
        id: "effilocheur",
        label: "Un Lacunaire qui rôde",
        at: { x: 10, y: 8 },
        wander: {
          preset: EFFILOCHEUR,
          title: "Un Lacunaire effilocheur",
          goal: "Le repousser avant qu'il n'éteigne la rive.",
          range: 2,
          radius: 3,
          effects: [{ add: "ecoute", by: 1 }],
          success:
            "Il recule vers le gris, à la fois bon et mauvais, ni l'un ni l'autre.",
        },
      },
    ],
  },
  scenes: {
    // ── 1 ──
    "1": {
      id: "1",
      title: "Les câbles",
      kind: "rencontre",
      setting: "Un câble tendu au-dessus d'une Lacune",
      beats: [
        stage(
          "Un câble tressé, tendu d'un bord à l'autre d'une Lacune large comme un champ. En dessous, le gris : ni noir ni brouillard, une absence de détails. Une jeune femme attend au milieu du câble, debout, sans se tenir. Un arc dans le dos, un registre de cuir à la ceinture.",
        ),
        say(
          "eva",
          "Le Couplé. Plus petit que dans les chants. Ils te donnent trois têtes, à Corde-Basse.",
        ),
        say(
          "eva",
          "C'est moi, la flèche. Trois cents pas, de nuit, vent de travers à quatre nœuds. Je l'ai calculé à l'avance. Je calcule toujours à l'avance.",
        ),
        say(
          "eva",
          "Le câble fait soixante-deux pas. Il oscille d'un demi-pas au milieu. Si tu tombes, je ne te rattrape pas : c'est une question d'angle, pas de cœur.",
        ),
        stage(
          "Le registre de cuir est celui de la lignée. Eva IV l'ouvre : des colonnes de trajectoires, des angles, des vents, sur des siècles. La première page est d'une écriture que le héros peut reconnaître : celle d'Eva II, au Temps des Marées.",
        ),
        choice("cable", [
          opt("rate", "« Tu ne rates jamais ? »", [
            say(
              "eva",
              "Jamais. Le monde est une équation. Les Déliés disent que ton Ghom l'écrit. Moi, je dis que ça ne change rien : je n'ai qu'à la résoudre.",
            ),
          ]),
          opt("pourquoi", "« Pourquoi vis-tu avec eux ? »", [
            fx(add("confiance.eva")),
            say(
              "eva",
              "Parce que là-dessous, rien ne dévie mes flèches. Pas de Distorsion. Pas de sol qui bouge. Pour une Archère, c'est le paradis. Pour le reste… on s'habitue.",
            ),
          ]),
          opt("traverser", "Traverser le câble sans rien dire.", [
            when(is("transformation.2", "A"), [
              stage(
                "Les branchies du héros ne servent à rien ici : le câble oscille, le gris attire. Il pose les pieds un à un, sans respirer trop fort.",
              ),
            ]),
          ]),
        ]),
        stage("Eva IV rejoint l'équipe, comme escorte."),
        fx(join("eva")),
        go("2"),
      ],
    },

    // ── 2 ──
    "2": {
      id: "2",
      title: "Nyx IV",
      kind: "rencontre",
      setting: "Haut-Pendant, la plateforme des ardoises",
      beats: [
        stage(
          "Haut-Pendant : des maisons de bois léger accrochées à six câbles. Au centre, une plateforme où pendent les ardoises du manifeste, toutes, dans l'ordre. Nyx IV est assise au bord, les jambes dans le vide gris. Ses contours sont un peu flous, comme une image prise en bougeant.",
        ),
        say(
          "nyx",
          "Salut, le Couplé. Salut, ton Ghom. Oui, je te parle à toi aussi. Tu ne réponds jamais. On a l'habitude.",
        ),
        when(
          is("ardoises_lues"),
          [say("nyx", "Tu as lu. Tout. Ça m'étonne.")],
          [
            when(
              is("ardoise_ignoree"),
              [
                say(
                  "nyx",
                  "Tu n'as même pas lu. Évidemment. On n'écrit pas pour toi.",
                ),
              ],
              [say("nyx", "Tu as lu ?")],
            ),
          ],
        ),
        when(gte("autonomie.insistances", 1), [
          say(
            "nyx",
            "Au Village vide, tu as forcé quelqu'un. Le Gardien, ou la Soigneuse. Tu sais comment on l'a su ? On l'a vu de loin. Il bougeait comme Gorr.",
          ),
        ]),
        when(is("gorr_question", false), [
          stage("Nyx IV regarde Gorr."),
          say(
            "nyx",
            "Lui, par contre, il ne refuse jamais rien. Hein ? Tu lui dis « frappe », il frappe. Tu lui dis « attends », il attend trois siècles. C'est ça que vous voulez de nous.",
          ),
        ]),
        when(
          is("objet_de_nyx"),
          [
            // Variant A: the hero carries the Lame à une encoche.
            stage(
              "Nyx IV se tait au milieu d'une phrase. Elle regarde la ceinture du héros. Elle tend la main, s'arrête à un doigt, ne touche pas.",
            ),
            say("nyx", "Où as-tu pris ça."),
            say(
              "nyx",
              "Chez nous, on raconte que la première l'a perdu en fuyant. C'est dans la troisième chanson. « Elle laissa tomber, elle ne se retourna pas. »",
            ),
            say(
              "nyx",
              "Elle ne l'a pas perdu, hein. On ne perd pas ça. Elle te l'a laissé. À toi. Au Couplé.",
            ),
            stage("Un silence long. Le vent fait osciller la plateforme."),
            say(
              "nyx",
              "La première Nyx disait que personne ne la touchait. Que c'était ça, être libre. Et elle a laissé quelque chose à quelqu'un. Exprès.",
            ),
            say("nyx", "Je ne sais pas quoi faire de ça."),
            choice("objet", [
              opt("choisi", "« Elle a choisi quelqu'un. »", [
                fx(add("confiance.nyx", 2)),
                say("nyx", "… Choisi. Ouais. On peut appeler ça comme ça."),
              ]),
              opt("rendre", "Le lui rendre.", [
                fx(add("confiance.nyx", 2), set("objet_de_nyx", "nyx_iv")),
                stage(
                  "Nyx IV le prend sans un mot. Elle le garde serré, le reste de l'ère.",
                ),
              ]),
              opt("a-moi", "« Il est à moi, maintenant. »", [
                fx(add("confiance.nyx", -1)),
                say("nyx", "Bien sûr. Tout finit chez vous."),
              ]),
              opt("retrouver", "« Elle l'a laissé pour qu'on se retrouve. »", [
                fx(add("confiance.nyx")),
                stage("Nyx IV a un demi-sourire."),
                say(
                  "nyx",
                  "Tu crois aux chansons, toi aussi. C'est presque mignon.",
                ),
              ]),
            ]),
          ],
          [
            when(
              is("nyx_epargnee"),
              [
                say(
                  "nyx",
                  "Tu as laissé partir la première. C'est la seule raison pour laquelle on te parle au lieu de te pousser dans le gris. Ne t'en vante pas : je n'ai pas encore décidé si c'était de la bonté ou du calcul.",
                ),
              ],
              [
                say(
                  "nyx",
                  "La première de ma lignée s'est dispersée sur cette île. Par ta main, ou par celle de ton Ghom. Je ne sais pas faire la différence entre les deux. C'est exactement le problème.",
                ),
                fx(add("confiance.nyx", -1)),
              ],
            ),
          ],
        ),
        say("nyx", "Viens voir en bas. Ensuite tu me diras si on a eu tort."),
        go("3"),
      ],
    },

    // ── 3 ──
    "3": {
      id: "3",
      title: "Les Nasses",
      kind: "lacune",
      setting: "Au fond du gris, 5 × 5, entièrement en cases de Lacune",
      beats: [
        stage(
          "On descend par une échelle de corde dans le gris. Le son s'amortit. Les couleurs pâlissent. Le héros sent la pression du Ghom glisser, puis revenir autour de lui, comme une eau qui s'écarte et se referme. Au fond : des huttes en forme de nasses, posées sur un sol sans relief ; des gens qui se parlent de très près, front contre front.",
        ),
        stage(
          "Six Déliés vivent ici, chacun seul sur sa case, et perdent lentement leurs contours. Le héros a quatre déplacements : chaque fois qu'il amène deux d'entre eux sur la même case, la case devient habitée.",
        ),
        nassesPuzzle(),
        when(all(is("nasse_a"), is("nasse_b"), is("nasse_c")), [
          fx(add("lacunes.habitees")),
          stage(
            "Trois cases ont repris de la couleur, faible mais réelle. Les Déliés se regardent. Ils connaîtront le geste.",
          ),
        ]),
        fx(give("habit:fil-de-lisiere")),
        stage(
          "Une vieille Déliée noue un fil tressé au poignet du héros : un fil de lisière, tendu autrefois entre deux bords de Lacune, qu'on noue aux nouveaux venus.",
        ),
        stage(
          "Sel est assise seule près d'une hutte. Neuf ans. Elle regarde le héros sans peur.",
        ),
        say("sel", "Tu es… le…"),
        say("lyra", "Le Couplé."),
        say(
          "sel",
          "Le Couplé. Lyra dit un mot chaque fois. J'oublie les mots qu'on ne me redit pas.",
        ),
        say("sel", "Tu as quoi, sur la peau ?"),
        when(is("transformation.3", "A"), [say("sel", "Ça brille dedans.")]),
        when(is("transformation.3", "B"), [
          say("sel", "On voit à travers tes mains."),
        ]),
        when(is("carnet.Q01", "ouverte"), [
          stage(
            "Le Carnet s'ouvre de lui-même à cette page pendant que Nyx IV parle.",
          ),
        ]),
        say(
          "nyx",
          "Tu veux savoir ce qui arrive à une chose que plus rien ne touche ? Regarde Sel. Ou regarde-moi.",
        ),
        say(
          "nyx",
          "Elle ne disparaît pas. Rien ne disparaît, les Thermistes l'ont assez répété. Elle est toujours là. Mais elle n'a plus d'état par rapport au reste. Ses contours, sa forme, sa place, tout ça n'est défini que par ce qui la touche. Quand plus rien ne la touche, plus rien ne les fixe.",
        ),
        say(
          "nyx",
          "Alors elle sort du monde que les autres partagent. Elle est là, et elle n'est plus là pour personne. C'est ça, une Lacune. Pas un trou. Une chose qui n'est plus tenue.",
        ),
        stage(
          "Q01 : « Que devient une chose quand plus rien ne la touche ? » Réponse trouvée.",
        ),
        fx(set("carnet.Q01", "repondue")),
        say("sel", "Pourquoi il y a des choses ? Au lieu de rien ?"),
        say(
          "tarn",
          "Parce que le rien est impossible, petite. C'est démontré.",
        ),
        choice("q06", [
          opt("demontre", "« C'est démontré ? »", [
            stage("Tarn laisse passer un temps."),
            say(
              "tarn",
              "… Non. C'est une phrase que les Thermistes disaient aux enfants.",
            ),
          ]),
          opt("noter", "Laisser Tarn répondre, et le noter.", [
            fx(set("carnet.Q06", "fausse")),
          ]),
          opt("personne", "« Personne ne sait, Sel. »", [
            say("sel", "Personne. D'accord. Je retiens ce mot-là."),
          ]),
        ]),
        go("4"),
      ],
    },

    // ── 4 ──
    "4": {
      id: "4",
      title: "Le Lac muet",
      kind: "combat",
      setting: "Le Lac de Néréa, 11 × 9",
      beats: [
        stage(
          "L'alerte arrive par un câble : Néréa IV, la dernière lectrice du Lac muet, dérive au milieu d'un lac qui s'effiloche. L'eau ne bouge plus, ne reflète plus rien : le fond est devenu une Lacune. Au centre, un îlot d'une case, et une silhouette debout dessus.",
        ),
        say(
          "nerea",
          "Ne venez pas en ligne droite. Le fond est vide. Suivez les zones qui bougent encore.",
        ),
        { t: "fight", fight: lacMuet },
        when(is("defaite"), [
          stage(
            "La rive nord est déjà grise sous les pieds du héros : plus de retraite. Brutus IV le tire en arrière par le col ; derrière eux, l'îlot disparaît sans bruit.",
          ),
          say(
            "lyra",
            "On n'a rien perdu qui ne se retrouve pas. Il faudra juste le chercher ailleurs.",
          ),
          fx(set("defaite", false)),
        ]),
        when(is("nerea_retrouvee"), [
          say(
            "nerea",
            "Tu es venu par les zones vivantes. Tu as compris le lac plus vite que moi.",
          ),
          go("5"),
        ]),
        stage(
          "L'îlot est devenu gris. Néréa IV ne se disperse pas : un plongeur déliée l'emporte vers le fond, vers les siens. Elle reste chez les Déliés.",
        ),
        when(is("squalor_rejoint"), [
          stage(
            "C'est Squalor IV qui plonge, les crocs refermés sur la corde de son bras.",
          ),
        ]),
        go("6"),
      ],
    },

    // ── 5 ──
    "5": {
      id: "5",
      title: "La dernière strate",
      kind: "scene",
      setting:
        "Le bord du Lac muet, là où l'eau bouge encore (Archive facultative)",
      beats: [
        stage(
          "Néréa IV plonge avec le héros au bord du Lac muet, là où l'eau bouge encore un peu, et lit la carotte de sédiments qu'elle y a prélevée. Le froid mord.",
        ),
        choice("archive", [
          opt("lire", "Lire la carotte avec elle.", [
            fx(add("usure"), add("archives.lues")),
            say(
              "nerea",
              "Tout ce qui tombe finit par se déposer. Ici, couche après couche, depuis l'Aube. Regarde : les crues, les cendres, les années de Marées.",
            ),
            say(
              "nerea",
              "Et là, plus rien. Pas une couche vide : pas de couche du tout. Quand plus rien ne bouge, plus rien ne tombe. Le lac a cessé d'écrire.",
            ),
            when(gte("cristaux.extraits", 1), [
              say(
                "nerea",
                "La dernière couche est pleine de poussière de cristal. Elle vient de Vitrelle. Des fours. Le lac s'est tu peu après qu'on a brisé les Cristaux. Les deux traces se touchent.",
              ),
            ]),
            when(isnt("cristal_rendu", "aucun"), [
              say(
                "nerea",
                "Il y a une veine claire, juste avant le silence. Quelqu'un a rendu un Cristal au monde. Ça n'a pas suffi pour le lac. Ça a suffi pour qu'il reste un peu d'eau qui bouge, là où on est.",
              ),
            ]),
            say(
              "nerea",
              "Les Déliés lisent la signature du Ghom dans les cristaux. Moi, je lis le lac. Et le lac ne dit pas qui a poussé. Il dit seulement ce qui est tombé.",
            ),
          ]),
          opt("laisser", "Laisser la carotte fermée.", [
            stage(
              "Néréa IV la range sans un mot. Le froid, au moins, ne coûte rien.",
            ),
          ]),
        ]),
        go("6"),
      ],
    },

    // ── 6 ──
    "6": {
      id: "6",
      title: "Corde-Basse",
      kind: "veillee",
      setting: "Un village sur une seule corde",
      beats: [
        stage(
          "Un village sur une seule corde, maisons en enfilade. Un feu dans une vasque de pierre suspendue. On parle bas.",
        ),
        when(is("squalor_rejoint"), [
          stage("Une tête grise sort de l'eau sous la corde, crocs en avant."),
          say(
            "squalor",
            "Tu sens le Puits. C'est une odeur de vieux, de très vieux. Ma lignée raconte que la tienne nous a laissé manger, un jour. On n'oublie pas ça, chez les Squales. On n'oublie pas qui a eu faim avec nous.",
          ),
          fx(join("squalor")),
        ]),
        say(
          "nyx",
          "Tu as vu en bas. Ils sont libres. Personne ne les tient. Ils oublient le mot « chaud ».",
        ),
        say(
          "nyx",
          "Je me pose une question depuis que je suis petite. Je te la donne, tu as un carnet pour ça.",
        ),
        fx(set("carnet.Q20", "ouverte")),
        stage("Q20 : « Existe-t-on quand plus rien ne nous touche ? » (Nyx)"),
        say("nyx", "Ne réponds pas. Tu n'as pas la réponse. Moi non plus."),
        hub("ecoutes", [
          topic("eva", "Écouter Eva IV.", [
            say(
              "eva",
              "Ma lignée ne rate jamais. J'ai peur du jour où je raterai. Pas pour la cible. Pour moi. Si je rate, c'est que le monde n'est pas une équation, et alors je ne sais plus ce que je suis.",
            ),
            fx(add("confiance.eva")),
          ]),
          topic(
            "nerea",
            "Écouter Néréa IV.",
            [
              say(
                "nerea",
                "Je suis restée parce qu'il fallait quelqu'un pour lire la dernière couche. Maintenant elle est lue. Je ne sais pas ce qu'on fait, après la dernière couche.",
              ),
              fx(add("confiance.nerea")),
            ],
            { if: is("nerea_retrouvee") },
          ),
          topic("brutus", "Écouter Brutus IV.", [
            say(
              "brutus",
              "Les Déliés ont des murs, eux aussi. Des cordes. Ils disent qu'elles relient. Un mur aussi, ça relie : ceux qui sont du même côté.",
            ),
            fx(add("confiance.brutus")),
          ]),
          topic(
            "gorr",
            "Rester près de Gorr.",
            [
              say(
                "gorr",
                "En bas, Gorr est léger. Personne ne pousse Gorr. Gorr aime. Gorr n'aime pas que les autres s'effacent. Gorr ne sait pas choisir entre les deux.",
              ),
              fx(add("confiance.gorr")),
            ],
            { if: is("gorr_question") },
          ),
          topic(
            "nyx",
            "Écouter Nyx IV.",
            [
              say(
                "nyx",
                "Tu veux savoir pourquoi j'écris aux Ghoms, alors qu'ils ne lisent pas ? Parce que si je n'écris à personne, je finis comme Sel.",
              ),
              fx(add("confiance.nyx")),
            ],
            { if: gte("confiance.nyx", 0) },
          ),
        ]),
        when(gte("confiance.eva", 2), [
          fx(give("objet:registre-d-eva-ii")),
          stage(
            "Eva IV détache son registre de cuir et le pose près du feu. Elle le confie pour la nuit : des colonnes d'angles et de vents sur quatre siècles, la première page d'une main que le héros connaît.",
          ),
        ]),
        go("7"),
      ],
    },

    // ── 7 ──
    "7": {
      id: "7",
      title: "L'appel du Bord",
      kind: "fin",
      setting: "Au matin, sur la corde",
      beats: [
        say(
          "nyx",
          "Demain, j'irai au Bord. J'y appellerai ceux qui te suivent. Les héritiers des lignées que ton Ghom a portées pendant des siècles. Je leur demanderai de choisir.",
        ),
        say("nyx", "Pas toi. Eux. Tu n'auras rien à dire. C'est le principe."),
        choice("appel", [
          opt("choisiront", "« Ils choisiront. »", [
            fx(add("confiance")),
            say("nyx", "On verra si tu le penses encore demain."),
          ]),
          opt("resteront", "« Ils resteront avec moi. »", [
            fx(add("confiance.nyx", -1)),
            say("nyx", "Tu vois ? Tu parles déjà à leur place."),
          ]),
          opt("toi", "« Et toi, qu'est-ce que tu choisis ? »", [
            fx(add("confiance.nyx")),
            stage("Nyx IV se tait un long moment."),
            say(
              "nyx",
              "D'aller au Bord. C'est tout ce que je sais choisir, pour l'instant.",
            ),
          ]),
        ]),
        go(END),
      ],
    },
  },
}
void any
void isnt
void narr
