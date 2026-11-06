import {
  add,
  all,
  choice,
  fx,
  give,
  go,
  hint,
  hub,
  is,
  lt,
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
import type { Beat, Chapter, FightSpec, ObjectiveSpec } from "../types"
import {
  ALLY_COND,
  type Ally,
  ARBALETRIER,
  allyFighter,
  archive,
  byAlly,
  CHRONIQUEUR,
  EXTRACTEUR,
  HALLEBARDIER,
  kitOf,
  LYRA3,
  look,
  place,
  SONNEUR,
} from "./era3-kit"

const GORR = kitOf("gorr", "gorr3", "Gorr", "Golem")
const MINEUR = kitOf("brutus", "mineur", "Mineur", "Réaffecté", {
  health: 1,
  speed: 3,
  physicalAttack: 1,
})
const BRUTUS_MINE = kitOf("brutus", "brutus3", "Brutus III", "Capitaine")

// ─── Combat : la Chambre du Diapason ────────────────────────────────────────

// `P` (the étalon) and `D` (the pylône) are not objects of the engine.
const BOARD = [
  "##1.....1##.",
  "#1...22...1#",
  "1...2..2...1",
  "..a......a..",
  ".aba.##.aba.",
  "..a......a..",
  ".....11.....",
  "~~.........~",
  "w~...11...~w",
]

type Lacune = "aucune" | "elargie" | "habitee" | "recousue"

function chambre(ally: Ally, rallie: boolean, lacune: Lacune): FightSpec {
  const row = lacune === "elargie" ? 5 : 8
  const x0 = lacune === "elargie" ? 4 : 4
  const allies = [
    { preset: "@hero" as const, at: { x: x0 + 1, y: row } },
    { preset: LYRA3, at: { x: x0 + 2, y: row } },
    ...allyFighter(ally, { x: x0, y: row }),
  ]
  if (rallie) allies.push({ preset: CHRONIQUEUR, at: { x: x0 + 3, y: row } })
  const foes = [
    { preset: SONNEUR, at: { x: 4, y: 2 } },
    { preset: SONNEUR, at: { x: 7, y: 2 } },
    { preset: HALLEBARDIER, at: { x: 3, y: 3 } },
    { preset: HALLEBARDIER, at: { x: 8, y: 3 } },
    { preset: EXTRACTEUR, at: { x: 0, y: 2 } },
    // SIMPLIFIED: the third Sonneur and his étalon de secours (time 40) stand
    // near the monte-charge from the start.
    { preset: SONNEUR, at: { x: 9, y: 8 } },
  ]
  if (lacune === "habitee")
    foes.push({ preset: ARBALETRIER, at: { x: 10, y: 2 } })
  const objectives: ObjectiveSpec[] = [
    {
      id: "diapason",
      mark: "★",
      label: "Faire taire le Diapason : mettre les Sonneurs hors de combat",
      // SIMPLIFIED: the pylône and the étalon do not exist; the Diapason falls
      // silent when every Sonneur is dispersed or has fled. Briser / Détacher
      // is a gesture after the fight.
      check: (r) =>
        r.result !== "defeat" &&
        r.fighters
          .filter((f) => f.preset === "sonneur")
          .every((f) => f.hp <= 0 || f.fled),
      success: "Le Diapason se tait.",
      failure: "Le Diapason bat toujours.",
    },
    {
      id: "mineurs",
      mark: "◆",
      label: "Les deux mineurs sortent vivants",
      check: (r) =>
        r.result !== "defeat" &&
        r.fighters.filter((f) => f.preset === "mineur" && f.hp > 0).length >= 2,
      success: "Brutus III : « … Merci. »",
      onSuccess: [add("confiance.brutus", 2), add("confiance")],
    },
  ]
  return {
    id: `ch15-diapason-${ally}-${rallie ? "c" : "n"}-${lacune}`,
    title: "La Chambre du Diapason",
    goal: "Faire taire le Diapason avant que la Chambre ne s'effondre. Gorr obéit au rythme et ses coups touchent tout le monde ; Brutus III et deux mineurs ne sont pas vos ennemis.",
    board: BOARD,
    teams: [
      { name: "Alliés", side: "allies", fighters: allies },
      { name: "Le Collège", side: "enemies", fighters: foes },
      {
        name: "La Mine",
        side: "neutral",
        // CUT: Gorr being untargetable, and Brutus holding a beam from time 30.
        fighters: [
          {
            preset: GORR,
            at: { x: 11, y: 3 },
            // Gorr obeys the rhythm: Écrasement at every second beat
            script: [
              { every: 2, act: { do: "use", action: "smash", at: "nearest" } },
              { act: { do: "stand" } },
            ],
          },
          { preset: BRUTUS_MINE, at: { x: 10, y: 7 } },
          { preset: MINEUR, at: { x: 2, y: 7 } },
          { preset: MINEUR, at: { x: 9, y: 7 } },
        ],
      },
    ],
    // CUT: damage from level changes and the final collapse; a clock stands
    // for the collapse. The relief shifts by scripted Séismes.
    rules: {
      scripted: [
        {
          tick: 3,
          kind: "earthquake",
          at: [
            { x: 5, y: 6 },
            { x: 6, y: 6 },
          ],
        },
        {
          tick: 6,
          kind: "earthquake",
          at: [
            { x: 4, y: 3 },
            { x: 7, y: 3 },
          ],
        },
        {
          tick: 9,
          kind: "earthquake",
          at: [
            { x: 5, y: 8 },
            { x: 6, y: 8 },
          ],
        },
      ],
      neutral: [2],
      clock: { period: 1, limit: 12, winner: 0 },
      flee: { team: 1, below: 0.3, exits: [{ x: 0, y: 0 }] },
      announce: true,
    },
    influences: ["earthquake", "timeWarp"],
    startEnergy: lacune === "elargie" ? 5 : 3,
    defeat: [set("defaite"), add("usure"), set("premier_cristal", "perdu")],
    objectives,
    lines: [
      {
        when: "start",
        who: "lyra",
        text: "Le Cristal, là-haut. Il bat. Tu le sens ?",
      },
      {
        when: "start",
        who: "brutus",
        text: "Encore toi. Je n'ai pas le temps. La mine tombe.",
      },
      {
        when: "tick:1",
        who: ally === "squalor" ? "squalor" : "eva",
        text:
          ally === "squalor"
            ? "Ces galeries noyées, c'est chez moi. Si quelqu'un doit sortir par le bas, il me suit."
            : "Le Golem frappe un battement sur deux. Fenêtre de dix. Je compte pour vous.",
      },
      {
        when: "tick:3",
        who: "sonneur",
        text: "Avance, Golem. Avance. Tu ne sais rien faire d'autre.",
      },
      {
        when: "tick:5",
        who: "brutus",
        text: "Je tiens. Je tiens tant qu'ils ne sont pas sortis.",
      },
    ],
  }
}

function chambreBeat(): Beat {
  // 3 Echos x 2 (Chroniqueur) x 3 Lacune states, picked by nested `when`.
  const lac = (l: Lacune) =>
    l === "aucune" ? is("lacune_mine", "aucune") : is("lacune_mine", l)
  const make = (ally: Ally, rallie: boolean): Beat => {
    const pick = (l: Lacune): Beat => ({
      t: "fight",
      fight: chambre(ally, rallie, l),
    })
    return when(
      lac("elargie"),
      [pick("elargie")],
      [when(lac("habitee"), [pick("habitee")], [pick("aucune")])],
    )
  }
  return when(
    is("chroniqueur_rejoint"),
    [byAlly((a) => make(a, true))],
    [byAlly((a) => make(a, false))],
  )
}

// ─── Les réaffectés ─────────────────────────────────────────────────────────

const garance = choice("garance", [
  opt("forme", "Qu'est-ce que c'est ?", [
    say(
      "garance",
      "Le Golem. Gorr, disent les vieux. Il est là depuis avant le Gel. Avant les mines, même. Il croît, c'est tout ce qu'il fait. Le Collège a trouvé comment le faire croître dans la bonne direction.",
    ),
    stage("Elle montre les Sonneurs."),
    say("garance", "Le Diapason. Il suit le rythme."),
  ]),
  opt("pourquoi", "Pourquoi êtes-vous ici ?", [
    say("garance", "J'ai soufflé un carreau avec une bulle."),
    stage("Elle hausse les épaules."),
    say("garance", "Une seule. Pour voir."),
    when(
      lt("questions_rouvertes", 1),
      [],
      [
        say(
          "garance",
          "Odile, à l'atelier d'à côté, m'a regardée faire. Elle a eu l'air… je ne sais pas. Contente ?",
        ),
        fx(set("garance_confiante")),
      ],
    ),
  ]),
  opt("cristaux", "Où vont les Cristaux ?", [
    say(
      "garance",
      "En haut. Au Gel. On les casse là-haut, on ne les casse jamais ici. Ici, on les détache. On n'est pas des brutes.",
    ),
    stage("Un rire sans joie."),
  ]),
])

const gorrChoice = choice("gorr", [
  opt("toucher", "Toucher son flanc.", [
    stage(
      "Le cristal est tiède, comme une pierre au soleil. Sous la main, une vibration très lente, qui n'est pas celle du Diapason : la sienne. Gorr ne s'arrête pas. Une facette, sous les doigts du héros, s'épaissit d'un cheveu.",
    ),
    fx(add("confiance.gorr")),
  ]),
  opt("devant", "Se mettre devant lui.", [
    stage("Gorr avance. Il ne frappe pas, il pousse. Le héros doit s'écarter."),
    say("sonneur", "Ne gênez pas le Golem, il ne sait pas qu'il vous écrase."),
  ]),
  opt("laisser", "Le laisser.", [
    say("lyra", "Il est vivant, tu crois ?"),
    when(is("chroniqueur_rejoint"), [
      say("chroniqueur", "Mes fiches disent « outillage »."),
      stage("Un temps."),
      say(
        "chroniqueur",
        "Mes fiches disaient aussi que vous étiez une statue.",
      ),
    ]),
  ]),
])

// ─── Sous les étais ─────────────────────────────────────────────────────────

const deux = lt("veillee15", 2)
const sujet: Beat = fx(add("veillee15"))

const veillee = hub("etais", [
  topic(
    "lyra",
    "Lyra III et l'extraction",
    [
      sujet,
      say(
        "lyra",
        "Quand je soigne, je prends de l'ordre en moi et je le donne. Je fatigue. C'est le prix, et je le vois. Eux, ils prennent l'ordre dans les Cristaux, c'est-à-dire dans les liens d'autrefois, et ils ne voient pas le prix. Il tombe sur les galeries qui se taisent.",
      ),
      choice("lyra15", [
        opt("cout", "Tout soin coûte quelque chose.", [
          say("lyra", "Oui. Toujours. La seule question, c'est qui paie."),
          fx(add("confiance.lyra")),
        ]),
        opt("seule", "Et si les Cristaux étaient la seule solution ?", [
          say(
            "lyra",
            "Alors il faudrait au moins savoir qu'on emprunte. Et à qui.",
          ),
        ]),
      ]),
    ],
    { if: deux },
  ),
  topic(
    "chroniqueur",
    "Le Chroniqueur et Gorr",
    [
      sujet,
      say(
        "chroniqueur",
        "Une fiche d'outillage, sur un être qui se répare seul. Je l'ai relue trois fois. Dans mon métier, une chose qui se répare seule, c'est… une archive vivante. Si on la casse, rien n'en reste. Si on la laisse, elle dit ce qu'elle a traversé.",
      ),
    ],
    { if: all(deux, is("chroniqueur_rejoint")) },
  ),
  topic(
    "eva",
    "Eva III et le rythme",
    [
      sujet,
      say(
        "eva",
        "Le Diapason bat à zéro virgule huit. Le gisement n° 1 aussi, d'après la fiche. Ce n'est pas un hasard : c'est lui qui donne la mesure. On a mis le cœur d'un monde dans une horloge.",
      ),
    ],
    { if: all(deux, ALLY_COND.eva) },
  ),
  topic(
    "squalor",
    "Squalor III et la faim",
    [
      sujet,
      say(
        "squalor",
        "Le Golem ne mange pas. Il croît sur la chaleur, comme une flamme. Moi je mange. On n'est pas si différents : on dure parce que quelque chose passe à travers nous.",
      ),
      stage("Un temps."),
      say("squalor", "Lui, au moins, il ne se demande pas pourquoi."),
    ],
    { if: all(deux, ALLY_COND.squalor) },
  ),
  topic(
    "cristal",
    "Le Premier Cristal",
    [
      stage("Le héros sait désormais où est le gisement n° 1."),
      say(
        "lyra",
        "Si c'est ton Cristal, celui de ta légende… qu'est-ce qu'il y a dedans ?",
      ),
      when(is("premier_cristal.lieu", "cairn"), [
        say(
          "chroniqueur",
          "La fiche dit qu'on l'a trouvé en l'an 3 du Gel, quand les eaux ont baissé, en perçant une butte sur la Couture. Sous la vase, il y avait des pierres empilées. Quelqu'un l'avait mis à l'abri, il y a très longtemps. Le Collège a noté : « amas naturel ».",
        ),
      ]),
      when(is("premier_cristal.lieu", "lacune"), [
        say(
          "chroniqueur",
          "La fiche dit qu'on l'a trouvé en sondant sous la Couture, parce qu'il pulsait. Il était pris dans la roche comme un nœud dans un fil. Quand on l'a dégagé, la Couture a commencé à se défaire autour du puits. C'est la première Lacune de la Mine. Le Collège a noté : « incident d'extraction ».",
        ),
      ]),
      say(
        "chroniqueur",
        "Premier gisement ouvert par le Collège. D'où le numéro un. On a creusé la mine autour de lui.",
      ),
      when(is("premier_cristal.paire", "heros+nyx"), [
        say(
          "chroniqueur",
          "La fiche note deux corrélations dominantes, « d'origine inconnue, dont une sans lien avec cette île ».",
        ),
      ]),
      choice("dedans", [
        opt("liens", "Les liens de ceux que j'ai connus.", [
          say(
            "chroniqueur",
            "Pas leurs souvenirs. Je préfère le dire avant qu'on en fasse une légende de plus. Des corrélations : des états qui restent accordés, deux à deux, à l'intérieur du cristal. Il est son propre jumeau. C'est pour ça que le Collège ne lui trouve pas de paire.",
          ),
        ]),
        opt("sais-pas", "Je ne sais pas.", [say("lyra", "Alors on ira voir.")]),
      ]),
    ],
    { last: true },
  ),
])

// ─── L'île ───────────────────────────────────────────────────────────────────

const ISLAND = [
  "............",
  ".1......11..",
  "............",
  "...1........",
  "............",
  "......1....1",
  "............",
  "............",
]

// The little map of the Lacune (5 x 5, the hole in the middle, radius 1): the
// edge cells touch it, the walled vein sits in the south-east corner.
const BORD = [1, 2, 3].flatMap((i) => [
  { x: 0, y: i },
  { x: 4, y: i },
  { x: i, y: 0 },
  { x: i, y: 4 },
])
const LACUNE_PUZZLE: PuzzleSpec = {
  kind: "grid",
  w: 5,
  h: 5,
  holes: [1, 2, 3].flatMap((x) => [1, 2, 3].map((y) => ({ x, y }))),
  marks: [
    { label: "Bord de la Lacune", cells: BORD },
    { label: "Veine murée", cells: [{ x: 4, y: 4 }] },
  ],
  tokens: [
    { id: "heros", label: "Le héros", at: { x: 0, y: 4 } },
    { id: "lyra", label: "Lyra", at: { x: 0, y: 0 } },
    { id: "gorr", label: "Gorr", at: { x: 4, y: 0 } },
  ],
  moves: 6,
  first: true,
  rules: [
    { id: "elargir", kind: "occupy", cells: [{ x: 4, y: 4 }] },
    { id: "recoudre", kind: "spread", n: 3, cells: BORD },
    { id: "habiter", kind: "stacked", n: 2, cells: BORD },
  ],
}

export const ch15: Chapter = {
  id: "15",
  era: 3,
  number: 15,
  title: "La Mine",
  quote: {
    who: "chroniqueur",
    text: "Gisement n° 1. Rendement exceptionnel. Aucun jumeau connu. Pulse sans cause identifiée. Extraction programmée.",
  },
  place:
    "Les Mines du Collège : le monte-charge, les galeries, la Chambre du Diapason",
  question: {
    id: "Q15",
    text: "Que perd-on quand un lien devient une ressource ?",
  },
  start: "1",
  exploration: {
    island: ISLAND,
    start: { x: 0, y: 0 },
    companions: ["lyra"],
    influences: ["earthquake"],
    encounters: [
      place(ISLAND, "monte-charge", "Le monte-charge", "1", 1, 1, {
        auto: true,
      }),
      place(ISLAND, "reaffectes", "Les réaffectés", "2", 4, 3),
      place(ISLAND, "lacune", "La galerie qui se tait", "3", 7, 3),
      place(ISLAND, "etais", "Sous les étais", "4", 3, 6),
      place(ISLAND, "chambre", "La Chambre du Diapason", "5", 9, 5, {
        auto: true,
      }),
      place(ISLAND, "poussiere", "La poussière", "6", 11, 7),
      look(
        "etai",
        "Un étai de bois",
        { x: 5, y: 1 },
        "Une poutre fendue, noircie de sueur. Quelqu'un y a gravé une date, puis l'a barrée.",
      ),
      look(
        "caisse",
        "Une caisse capitonnée",
        { x: 2, y: 4 },
        "Des Cristaux détachés à la pince, rangés par paires dans leur capiton. Entre chaque paire, un fil de lumière ténu.",
      ),
      look(
        "ardoise",
        "Une ardoise de poste",
        { x: 8, y: 0 },
        "« Réaffectés : 212. Évacués : 0. Cadence : conforme. » Une main plus récente a ajouté : « Bruit toléré. »",
        "narr",
      ),
      {
        id: "eboulis",
        label: "Un éboulis",
        at: { x: 6, y: 5 },
        obstacle: {
          influence: "earthquake",
          before: [
            {
              style: "stage",
              text: "Un éboulis ferme la galerie, tenu en équilibre par un seul bloc.",
            },
          ],
          after: [
            {
              style: "stage",
              text: "Le bloc roule : la galerie s'ouvre dans un nuage de poussière.",
            },
          ],
          effects: [{ add: "ecoute", by: 1 }],
        },
      },
      {
        id: "ronde",
        label: "Un Hallebardier de garde",
        at: { x: 10, y: 2 },
        wander: {
          preset: HALLEBARDIER,
          title: "Un garde de galerie",
          goal: "Passer sans qu'il donne l'alarme.",
          range: 2,
          radius: 3,
          effects: [{ add: "ecoute", by: 1 }],
          success: "Le garde s'assoit sur un étai, rassuré que rien ne change.",
        },
      },
    ],
  },
  scenes: {
    "1": {
      id: "1",
      title: "Le monte-charge",
      kind: "rencontre",
      setting: "Une cage de verre et de cuivre",
      beats: [
        stage(
          "Une cage de verre et de cuivre qui descend le long d'une paroi. À mesure qu'elle descend, le verre devient sale, rayé, puis disparaît : en bas, il n'y a que de la roche et des étais de bois. Il fait chaud. C'est la première chaleur de l'ère.",
        ),
        archive(
          "Règlement des Mines, article 2",
          "« Les Mines sont un lieu de travail. Le bruit y est toléré. »",
          "« Les Mines sont un lieu de travail. Le bruit y est toléré. » (Toléré parce qu'on ne l'entend pas d'en haut. — C.)",
        ),
        when(is("chroniqueur_rejoint"), [
          say(
            "chroniqueur",
            "Je n'étais jamais descendu. J'ai pourtant rédigé quarante-trois rapports sur les Mines. Ils étaient très bien écrits.",
          ),
        ]),
        say(
          "lyra",
          "Il fait chaud. Ça sent quelque chose. Le sel, la sueur… On dirait une ville vivante.",
        ),
        when(is("transformation.1", "A"), [
          stage(
            "Le héros voit, à travers les parois, des centaines de lueurs pâles qui battent par deux, comme des cœurs. Une seule bat seule, très loin en bas, plus fort que les autres.",
          ),
        ]),
        when(is("transformation.1", "B"), [
          stage(
            "La peau des avant-bras du héros se met à pulser, lentement. Personne d'autre ne le remarque.",
          ),
          when(ALLY_COND.eva, [
            say(
              "eva",
              "Ton bras. Il bat à une fréquence de… zéro virgule huit. Exactement. Exactement, c'est rare.",
            ),
          ]),
        ]),
      ],
      next: "2",
    },
    "2": {
      id: "2",
      title: "Les réaffectés",
      kind: "rencontre",
      setting: "Une galerie large",
      beats: [
        stage(
          "Une galerie large. Des mineurs, en silence, détachent des Cristaux à la pince et les posent dans des caisses capitonnées. Plus loin, une forme immense avance dans la roche : un corps de cristal gris-vert, aux facettes émoussées, haut de trois hommes. Il ne creuse pas : il pousse. Le cristal de son corps croît dans les fissures, élargit la roche, et la roche cède. Derrière lui, deux Sonneurs frappent des diapasons de verre, en mesure. Chaque coup, la forme s'avance d'un pas.",
        ),
        say(
          "garance",
          "Vous n'êtes pas réaffectés, vous. Ça se voit : vous regardez autour de vous.",
        ),
        garance,
        stage("Gorr ne se retourne pas. Le héros peut s'approcher."),
        gorrChoice,
        stage(
          "Extrait des archives — Fiche d'outillage n° 7, « Golem (dit Gorr) ». « Formation cristalline autonome. Croissance : 4 doigts par jour sous Diapason, 1 doigt sans. Se répare seul en cas de fêlure. Ne mange pas. Ne dort pas. Ne demande rien. Rendement : excellent. »",
        ),
        narr(
          "Ce que la fiche décrit sans le dire : un être qui se maintient en puisant dans un flux d'énergie, la chaleur des profondeurs, et qui répare lui-même sa forme. Un vivant.",
        ),
      ],
      next: "3",
    },
    "3": {
      id: "3",
      title: "La galerie qui se tait",
      kind: "lacune",
      setting: "Un embranchement où le bruit s'arrête net",
      beats: [
        stage(
          "Un embranchement où le bruit s'arrête net. Ni chaleur, ni courant d'air, ni écho. Au milieu de la galerie, une Lacune : un trou dans le monde, d'un gris qui n'est pas une couleur, aux bords qui s'effilochent. Une rangée de logements de cristaux vides la borde. On a tout extrait ici, puis on a muré.",
        ),
        say(
          "lyra",
          "C'est ça, une Lacune ? On dirait… une pièce où personne n'est jamais entré.",
        ),
        when(ALLY_COND.eva, [
          say(
            "eva",
            "Aucun écho. Le son ne revient pas. Je ne peux rien calculer là-dedans. Ça me déplaît fortement.",
          ),
        ]),
        when(ALLY_COND.squalor, [
          say(
            "squalor",
            "Ça sent rien. Rien du tout. Même le vide sent quelque chose, d'habitude.",
          ),
        ]),
        puzzle(
          "lacune",
          LACUNE_PUZZLE,
          {
            elargir: [
              when(ALLY_COND.squalor, [
                say(
                  "squalor",
                  "Un trou de plus. Mais un trou qui mène quelque part.",
                ),
              ]),
              stage(
                "La Lacune ronge le mur et ouvre un raccourci vers la Chambre du Diapason.",
              ),
              fx(
                add("lacunes.elargies"),
                add("cristaux.extraits"),
                set("lacune_mine", "elargie"),
              ),
            ],
            recoudre: [
              say(
                "lyra",
                "On la réchauffe. Comme un malade. Ça coûte, bien sûr.",
              ),
              fx(
                add("lacunes.recousues"),
                set("lacune_mine", "recousue"),
                add("usure"),
              ),
            ],
            habiter: [
              say(
                "lyra",
                "C'est étrange. Là, au bord, j'existe plus fort. Parce que tu es là.",
              ),
              stage("Plus loin, la Garde entend le silence se rompre."),
              fx(
                add("lacunes.habitees"),
                set("lacune_mine", "habitee"),
                add("confiance.lyra"),
              ),
            ],
          },
          {
            prompt:
              "Placez les Échos sur le bord de la Lacune, ou brisez le Cristal de la veine murée (case de la veine). Rien à faire : terminer sans placer personne.",
            none: [narr("La Lacune reste.")],
          },
        ),
      ],
      next: "4",
    },
    "4": {
      id: "4",
      title: "Sous les étais",
      kind: "veillee",
      setting: "Une galerie abandonnée, étayée de poutres",
      beats: [
        stage(
          "Une galerie abandonnée, étayée de poutres. Une lampe à huile : Lyra n'en veut pas d'autre.",
        ),
        veillee,
      ],
      next: "5",
    },
    "5": {
      id: "5",
      title: "La Chambre du Diapason",
      kind: "combat",
      setting: "Le fond de la mine",
      beats: [
        stage(
          "Le fond de la mine. Au nord, sur une estrade, la Chambre du Diapason : un pylône de cuivre massif qui vibre et, enchâssé dans un socle à côté, l'étalon : le Premier Cristal. Le centre est un dédale de creux et de piliers. Au sud, le monte-charge.",
        ),
        hint(
          "Plus important que l'objectif principal",
          "Sauver le Premier Cristal.",
        ),
        chambreBeat(),
        when(is("defaite"), [
          stage(
            "Le Golem frappe. La Chambre s'effondre autour du héros, figé. Brutus III, qui n'a pas le temps, l'attrape sous les bras et le traîne jusqu'à la cage avec les mineurs. Le socle du Premier Cristal disparaît sous les gravats.",
          ),
          say("brutus", "Encore toi. Je n'ai pas le temps. La mine tombe."),
          fx(set("defaite", false)),
        ]),
        // The étalon: three ways, now that the Chambre is held.
        when(
          is("premier_cristal", "perdu"),
          [stage("Il n'y a plus d'étalon à prendre.")],
          [
            stage(
              "Le Premier Cristal bat dans son socle. Le héros pose la main dessus : une pulsation passe dans ses mains. Pas des images : un accord, comme deux cordes qui vibrent ensemble.",
            ),
            when(is("transformation.1", "B"), [
              stage("Sa peau répond au même rythme."),
            ]),
            say("lyra", "Tu trembles."),
            hint(
              "L'étalon",
              "Briser l'étalon le fait taire pour toujours (gain doublé). Le détacher le sauve, mais un étalon de secours peut recaler le Diapason.",
            ),
            choice("etalon", [
              opt("briser", "Briser l'étalon.", [
                say(
                  "brutus",
                  "Tu as cassé le cœur de la mine. Elle va se taire. Mes mineurs vont rentrer chez eux.",
                ),
                stage("Un temps."),
                say(
                  "brutus",
                  "Et le Gel, qu'est-ce qu'il va manger, maintenant ?",
                ),
                fx(
                  set("premier_cristal", "perdu"),
                  set("mine_arretee"),
                  add("cristaux.extraits"),
                ),
              ]),
              opt("sauver", "Le détacher et l'emporter.", [
                fx(set("premier_cristal", "sauve"), add("cristaux.gardes")),
              ]),
              opt(
                "sauver-barrer",
                "Le détacher, et barrer la route à l'étalon de secours.",
                [
                  fx(
                    set("premier_cristal", "sauve"),
                    add("cristaux.gardes"),
                    set("mine_arretee"),
                  ),
                ],
              ),
            ]),
          ],
        ),
      ],
      next: "6",
    },
    "6": {
      id: "6",
      title: "La poussière",
      kind: "fin",
      setting: "Le monte-charge remonte dans la poussière",
      beats: [
        stage(
          "Le monte-charge remonte dans la poussière. En bas, la Chambre s'effondre.",
        ),
        when(is("premier_cristal", "sauve"), [
          stage(
            "Le Cristal est dans les bras du héros, enveloppé dans le manteau de Lyra. Il pulse lentement.",
          ),
          say("lyra", "Il est lourd ?"),
          choice("lourd", [
            opt("non", "Non.", [narr("Les deux sont vrais.")]),
            opt("oui", "Oui.", [narr("Les deux sont vrais.")]),
          ]),
          when(
            is("mine_arretee"),
            [],
            [
              stage(
                "Au fond, le Diapason reprend, plus aigu, sur l'étalon de secours.",
              ),
              when(ALLY_COND.eva, [
                say(
                  "eva",
                  "Zéro virgule quatre-vingt-trois. Faux. Il bat faux, maintenant.",
                ),
              ]),
              when(is("chroniqueur_rejoint"), [
                say(
                  "chroniqueur",
                  "La mine continue. Mais elle continue moins bien. C'est déjà une information.",
                ),
              ]),
            ],
          ),
          fx(give("objet:premier-cristal")),
          stage(
            "Objet : le Premier Cristal. Gros comme deux poings, tiède, il bat à zéro virgule huit.",
          ),
        ]),
        when(is("premier_cristal", "perdu"), [
          stage(
            "Il n'y a plus de pulsation. À la place du socle, une Lacune de deux pas de large, grise, muette. La mine se tait, toute entière.",
          ),
          say("lyra", "On a arrêté la mine."),
          stage("Un temps."),
          say("lyra", "Avec ce qu'il y avait de plus précieux dedans."),
          when(is("transformation.1", "B"), [
            stage(
              "La peau du héros ne pulse plus. Elle reste froide pendant tout le reste de l'ère.",
            ),
          ]),
          fx(give("objet:eclat-d-etalon")),
          stage(
            "Objet : Éclat d'étalon. Il ne bat plus. On le garde quand même.",
          ),
        ]),
        stage(
          "Avant que la cage ne s'élève, le héros voit Gorr, immobile dans la poussière, au milieu des décombres. Il ne pousse plus. Il a l'air d'écouter quelque chose qui n'est plus là. Puis la paroi le cache.",
        ),
        fx(give("habit:casque-de-galerie"), set("carnet.Q15", "ouverte")),
        stage(
          "Habit : Casque de galerie. Un casque de cuir bouilli, cabossé, avec une encoche pour la lampe. +2 Défense physique.",
        ),
        stage(
          "Q15 entre au Carnet : Que perd-on quand un lien devient une ressource ?",
        ),
        go("$end"),
      ],
    },
  },
}
