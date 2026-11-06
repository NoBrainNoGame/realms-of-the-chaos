import { type ActionDefinition, CHARACTERS } from "@realms/engine"
import type { ScriptCond } from "@realms/engine/adventure"
import {
  add,
  all,
  choice,
  fx,
  give,
  go,
  gte,
  hint,
  is,
  join,
  narr,
  opt,
  say,
  set,
  stage,
  when,
} from "../dsl"
import type { Beat, Chapter, FightReport, FightSpec } from "../types"
import {
  ALLY_COND,
  type Ally,
  allyFighter,
  archive,
  byAlly,
  CHRONIQUEUR,
  EXTRACTEUR,
  kitOf,
  LYRA3,
  look,
  place,
  SONNEUR,
} from "./era3-kit"

const GORR_HP = (CHARACTERS.gorr?.stats.health ?? 10) * 7 * 2
/** Poussée de croissance: crystal springs up on a free cell, a height-2 wall. */
const GROWTH: ActionDefinition = {
  id: "growth",
  name: "Poussée de croissance",
  description:
    "Du cristal jaillit sur une case libre et devient un obstacle de hauteur 2.",
  launch: { shape: "diamond", min: 1, max: 2 },
  lineOfSight: false,
  target: "emptyCell",
  timeCost: 1,
  cooldown: 2,
  effects: [{ type: "raise", height: 2 }],
}
const GORR = (extraits: boolean) => {
  const base = kitOf(
    "gorr",
    extraits ? "gorr16b" : "gorr16",
    "Gorr",
    "Golem",
    {
      health: (CHARACTERS.gorr?.stats.health ?? 10) * (extraits ? 1.5 : 2),
    },
    [...(CHARACTERS.gorr?.actions ?? []), "growth"],
  )
  return { ...base, actionDefs: { ...base.actionDefs, growth: GROWTH } }
}

const BOARD = [
  "##1.....1##",
  "#.........#",
  "1..a...a..1",
  "...........",
  "..a.....a..",
  "...........",
  "1..a...a..1",
  "#.........#",
  "##..111..##",
]

/** Both pylônes are silent: broken (their glass dead) or detached. */
const SILENCE: ScriptCond = {
  crystals: ["pylone-o", "pylone-e"],
  is: ["loose", "carried", "deposited", "dead", "broken"],
}

/** The pylônes are silent when one was broken or both were detached. */
const silenced = (r: FightReport) => {
  const c = r.crystals
  if (!c) return false
  const gone = (id: string) =>
    c.extracted.some((e) => e.id === id) || c.dead.includes(id)
  return (
    gone("pylone-o") ||
    gone("pylone-e") ||
    (c.detached.some((d) => d.id === "pylone-o") &&
      c.detached.some((d) => d.id === "pylone-e"))
  )
}

function fonderie(ally: Ally, rallie: boolean, extraits: boolean): FightSpec {
  const allies = [
    { preset: "@hero" as const, at: { x: 4, y: 8 } },
    { preset: LYRA3, at: { x: 5, y: 8 } },
    ...allyFighter(ally, { x: 6, y: 8 }),
  ]
  if (rallie) allies.push({ preset: CHRONIQUEUR, at: { x: 5, y: 7 } })
  return {
    id: `ch16-fonderie-${ally}-${rallie ? "c" : "n"}-${extraits ? "x" : "d"}`,
    title: "La Fonderie",
    goal: "Vaincre le Golem. (Tenir jusqu'à ce qu'il se passe quelque chose.)",
    board: BOARD,
    teams: [
      { name: "Alliés", side: "allies", fighters: allies },
      {
        name: "Le Collège",
        side: "enemies",
        fighters: [
          // Surexcité = Gorr plays his own way while a pylône beats; Ébranlé =
          // he stands still once both are silent (script `while`).
          // Surexcité while a pylône beats; Ébranlé once both are silent: he
          // stands still and is no one's enemy (an ally may share his cell,
          // and the combined actions work with him: `truce`).
          {
            preset: GORR(extraits),
            at: { x: 5, y: 3 },
            script: [{ while: SILENCE, act: { do: "stand" } }],
          },
          { preset: SONNEUR, at: { x: 1, y: 2 } },
          { preset: SONNEUR, at: { x: 9, y: 2 } },
          { preset: EXTRACTEUR, at: { x: 3, y: 7 } },
          { preset: EXTRACTEUR, at: { x: 7, y: 7 } },
        ],
      },
    ],
    // The clock stands for "tenir jusqu'à ce qu'il se passe quelque chose".
    rules: {
      clock: { period: 10, limit: 10, winner: 0 },
      // The two pylônes sit on twin Cristaux: breaking one kills the other
      // (both fall silent); each can also be detached (Désaccorder, twice).
      // The reserve pair is on the east and west edges.
      crystals: {
        crystals: [
          {
            id: "pylone-o",
            at: { x: 1, y: 1 },
            twin: "pylone-e",
            kind: "geode",
            detachSteps: 2,
          },
          {
            id: "pylone-e",
            at: { x: 9, y: 1 },
            twin: "pylone-o",
            kind: "geode",
            detachSteps: 2,
          },
          { id: "reserve-o", at: { x: 0, y: 5 }, twin: "reserve-e" },
          { id: "reserve-e", at: { x: 10, y: 5 }, twin: "reserve-o" },
        ],
      },
      flee: { team: 1, below: 0.25, exits: [{ x: 0, y: 0 }] },
      truce: [{ team: 1, index: 0, cond: SILENCE }],
      announce: true,
    },
    influences: ["timeWarp", "earthquake"],
    startEnergy: 3,
    defeat: [set("defaite"), add("usure")],
    objectives: [
      {
        id: "tenir",
        mark: "★",
        label: "Tenir : faire taire les pylônes sans abattre Gorr",
        check: (r) => {
          const g = r.fighters.find((f) => f.preset.startsWith("gorr"))
          // the pylônes are silent, and an ally of flesh shared Gorr's cell
          // for an Intrication while he kept more than 25 % of his health
          return (
            r.result !== "defeat" &&
            !!g &&
            g.hp > GORR_HP * 0.25 &&
            silenced(r) &&
            r.intrications >= 1
          )
        },
        success: "Les pylônes se taisent. Gorr ne frappe plus en rythme.",
        failure: "Gorr n'a pas eu le temps d'être quelqu'un.",
        onSuccess: [set("gorr_question")],
        onFailure: [add("confiance.gorr", -1)],
      },
      {
        id: "intacts",
        mark: "◆",
        label: "Ne briser aucun Cristal",
        check: (r) =>
          r.result !== "defeat" && (r.crystals?.extracted.length ?? 0) === 0,
        onSuccess: [add("confiance.gorr"), add("confiance.lyra")],
      },
    ],
    lines: [
      {
        when: "start",
        who: "sonneur",
        text: "Réaccord, premier temps. Golem : avance.",
      },
      {
        when: "tick:1",
        who: "lyra",
        text: "Il t'a reconnu. Il t'a reconnu, je te dis.",
      },
      {
        when: "tick:3",
        who: ally === "squalor" ? "squalor" : "eva",
        text:
          ally === "squalor"
            ? "Il a faim de quelque chose. Pas de viande."
            : "Fréquence instable. Il ne sait plus sur quoi battre.",
      },
      {
        when: "tick:5",
        who: "sonneur",
        text: "Il ne répond plus. Il ne répond plus ! Extracteurs !",
      },
    ],
  }
}

function fonderieBeat(): Beat {
  const make = (ally: Ally, rallie: boolean): Beat =>
    when(
      is("pylones", "extraits"),
      [{ t: "fight", fight: fonderie(ally, rallie, true) }],
      [{ t: "fight", fight: fonderie(ally, rallie, false) }],
    )
  return when(
    is("chroniqueur_rejoint"),
    [byAlly((a) => make(a, true))],
    [byAlly((a) => make(a, false))],
  )
}

const ISLAND = [
  "............",
  "..1.........",
  "............",
  "......11....",
  "............",
  "...1........",
  "............",
  "..........1.",
]

export const ch16: Chapter = {
  id: "16",
  era: 3,
  number: 16,
  title: "Le Golem",
  quote: {
    who: "chroniqueur",
    text: "Ne mange pas. Ne dort pas. Ne demande rien.",
  },
  place:
    "Vitrelle : les ateliers de la Fonderie, au pied de la Tour du Registre",
  question: { id: "Q16", text: "Une question peut-elle naître d'une pierre ?" },
  start: "1",
  exploration: {
    island: ISLAND,
    start: { x: 0, y: 0 },
    companions: ["lyra"],
    influences: ["earthquake"],
    encounters: [
      place(ISLAND, "ordre", "L'ordre de service", "1", 1, 1),
      place(ISLAND, "passerelle", "La passerelle de verre", "2", 4, 2),
      place(ISLAND, "recoin", "Sous la passerelle", "3", 3, 5),
      place(ISLAND, "fonderie", "La Fonderie", "4", 8, 4, { auto: true }),
      place(ISLAND, "parole", "La première phrase", "5", 10, 6),
      look(
        "four",
        "Un four",
        { x: 6, y: 1 },
        "La chaleur monte en vagues. Un tablier de cuir roussi pend à un clou.",
      ),
      look(
        "chaine",
        "Une chaîne brisée",
        { x: 7, y: 6 },
        "Des maillons de la taille d'un poing. Gorr ne les a pas brisés : il a simplement cessé de les tenir pour des limites.",
      ),
      look(
        "creux",
        "Un creux de coulée",
        { x: 1, y: 5 },
        "Du verre refroidi y garde la forme d'une main.",
      ),
      {
        id: "ronde",
        label: "Un Sonneur de ronde",
        at: { x: 9, y: 1 },
        wander: {
          preset: SONNEUR,
          title: "Un Sonneur de ronde",
          goal: "Le faire taire avant qu'il frappe son diapason.",
          range: 2,
          radius: 3,
          effects: [{ add: "ecoute", by: 1 }],
          success: "Le diapason se tait. Le Sonneur s'assoit, soulagé.",
        },
      },
    ],
  },
  scenes: {
    "1": {
      id: "1",
      title: "L'ordre de service",
      kind: "rencontre",
      setting: "Les abords de la Fonderie",
      beats: [
        archive(
          "Ordre de service n° 312-0423",
          "« Le Golem (fiche d'outillage n° 7) sera conduit à la Fonderie pour réaccord sous deux pylônes. En cas d'échec du réaccord, il sera procédé à sa valorisation. Rendement estimé : quarante gisements, soit l'entretien du Gel pendant une saison. »",
          "« Valorisation : extraction. On va casser un être qui se répare seul pour chauffer… non. Pour refroidir. Pour refroidir une saison. — C. »",
        ),
        when(
          is("chroniqueur_rejoint"),
          [
            stage(
              "Le Chroniqueur a volé l'ordre de service au Registre. Il le lit deux fois, à voix haute, la seconde en remplaçant chaque euphémisme par le mot exact.",
            ),
          ],
          [
            stage(
              "C'est Garance, la mineuse, qui l'apporte, pliée en huit dans sa botte.",
            ),
            say(
              "garance",
              "Ils l'ont emmené à la Fonderie. Il ne bougeait plus. Ils l'ont tiré avec des chaînes, il ne s'est pas défendu. Il n'a jamais su se défendre. Il n'a jamais su qu'on pouvait.",
            ),
          ],
        ),
        say("lyra", "Quarante gisements. Ils le mesurent en gisements."),
        choice("ordre", [
          opt("y-aller", "On y va.", [fx(add("confiance.gorr"))]),
          opt(
            "pourquoi",
            "Pourquoi le Collège a-t-il besoin de lui à ce point ?",
            [
              say(
                "chroniqueur",
                "Parce que les Cristaux s'épuisent. Il en reste de moins en moins, et de plus en plus profond. Le Gel a faim.",
              ),
              when(ALLY_COND.squalor, [
                say(
                  "squalor",
                  "Ah. Je connais ce genre de faim. Celle qui mange ce qui la nourrit.",
                ),
              ]),
            ],
          ),
        ]),
      ],
      next: "2",
    },
    "2": {
      id: "2",
      title: "Est-ce quelqu'un ?",
      kind: "rencontre",
      setting: "Une passerelle de verre au-dessus de la Fonderie",
      beats: [
        stage(
          "En bas, la lueur rouge des fours. Au milieu, Gorr, enchaîné entre deux pylônes de cuivre qui vibrent.",
        ),
        when(ALLY_COND.eva, [
          say(
            "eva",
            "Question technique. Si on le libère, et qu'il ne sait faire que pousser, il va pousser où ?",
          ),
        ]),
        when(ALLY_COND.squalor, [
          say(
            "squalor",
            "Question technique. Est-ce que ça se mange ? Non. Bon. Alors c'est pas une proie. Alors c'est quoi ?",
          ),
        ]),
        say(
          "lyra",
          "Il se répare seul. Il grandit. Il prend de la chaleur et il en fait de la forme. C'est exactement ce que je fais quand je soigne, sauf que moi, je me demande pourquoi.",
        ),
        when(is("chroniqueur_rejoint"), [
          say(
            "chroniqueur",
            "La question n'est pas de savoir s'il est vivant. Selon toute définition qui ne triche pas, il l'est : il se maintient, il croît, il se répare. La question est de savoir s'il est quelqu'un. Et je n'ai aucune source là-dessus. Personne ne lui a jamais rien demandé.",
          ),
        ]),
        choice("quelqu-un", [
          opt(
            "pas-besoin",
            "Il n'a pas besoin d'être quelqu'un pour qu'on ne le casse pas.",
            [
              say("lyra", "… Oui. Oui, c'est vrai."),
              fx(add("confiance.lyra"), add("confiance.gorr")),
            ],
          ),
          opt("pierre", "C'est une pierre. Une pierre qui pousse.", [
            say("lyra", "Peut-être. On verra bien ce que fait la pierre."),
          ]),
          opt(
            "relation",
            "On ne le saura que si on entre en relation avec lui.",
            [
              say(
                "chroniqueur",
                "C'est la seule méthode que je connaisse qui ne soit pas une légende.",
              ),
              fx(add("confiance.chroniqueur")),
            ],
          ),
        ]),
      ],
      next: "3",
    },
    "3": {
      id: "3",
      title: "Qui ira vers lui ?",
      kind: "veillee",
      setting: "Sous la passerelle, dans un recoin chaud",
      beats: [
        stage("Personne ne dort."),
        say(
          "lyra",
          "Dans les Mines, quand on habitait la Lacune à deux, c'était comme… on existait plus fort l'un par l'autre. Si quelqu'un se met tout contre lui, sur sa case, et qu'ils agissent ensemble… il sentira peut-être autre chose que le Diapason.",
        ),
        when(ALLY_COND.eva, [
          say(
            "eva",
            "Se mettre sur la case d'un golem de trois mètres qui frappe un battement sur deux. Probabilité de survie : je préfère ne pas la dire à voix haute.",
          ),
        ]),
        // The pylônes: the two gestures of the ★ objective.
        hint(
          "Les pylônes",
          "Désaccorder les pylônes ou extraire leur Cristal ? L'extraction est plus rapide, mais elle coûte un lien.",
        ),
        choice("pylones", [
          opt(
            "desaccorder",
            "Désaccorder les pylônes, un geste après l'autre.",
            [
              narr("Deux actions, d'un allié adjacent, pour chacun."),
              fx(set("pylones", "desaccordes")),
            ],
          ),
          opt(
            "extraire",
            "Extraire le Cristal d'un pylône : les deux se taisent d'un coup.",
            [
              say("lyra", "Ça se tait. Mais ce qui se tait ne revient pas."),
              fx(set("pylones", "extraits"), add("cristaux.extraits")),
            ],
          ),
        ]),
        choice("vers", [
          opt("heros", "Le héros lui-même.", [
            say("lyra", "Évidemment."),
            fx(set("qui_va_vers_gorr", "heros")),
          ]),
          opt("lyra", "Lyra III.", [
            say(
              "lyra",
              "Je le soignerai. Le Diapason l'a fendu partout. Un soin, c'est une forme d'Intrication, après tout : il faut toucher.",
            ),
            fx(set("qui_va_vers_gorr", "lyra")),
          ]),
          opt(
            "eva",
            "Eva III.",
            [
              say(
                "eva",
                "Bon. Au moins je saurai enfin quelque chose que je n'ai pas calculé.",
              ),
              fx(set("qui_va_vers_gorr", "eva")),
            ],
            ALLY_COND.eva,
          ),
          opt(
            "squalor",
            "Squalor III.",
            [
              say(
                "squalor",
                "Je vais lui mordre l'épaule pour lui dire bonjour. Non. Je plaisante. Peut-être.",
              ),
              fx(set("qui_va_vers_gorr", "squalor")),
            ],
            ALLY_COND.squalor,
          ),
          opt(
            "chroniqueur",
            "Le Chroniqueur.",
            [
              say(
                "chroniqueur",
                "Moi ? Je… Bien. Quelqu'un devra noter ce qu'il dit. Autant être sur place.",
              ),
              fx(set("qui_va_vers_gorr", "chroniqueur")),
            ],
            is("chroniqueur_rejoint"),
          ),
        ]),
      ],
      next: "4",
    },
    "4": {
      id: "4",
      title: "La Fonderie",
      kind: "combat",
      setting:
        "Un grand atelier rectangulaire, deux pylônes de cuivre aux coins nord",
      beats: [
        stage(
          "Deux pylônes de cuivre aux coins nord, chacun posé sur un Cristal d'intrication qui l'alimente. Gorr au centre, chaînes brisées. Des fours le long des murs.",
        ),
        stage("Les Sonneurs frappent. Gorr se tourne vers l'équipe."),
        when(gte("confiance.gorr", 1), [
          stage(
            "Gorr lève le bras… et le garde levé un battement entier. Puis il frappe la case d'à côté.",
          ),
          say("lyra", "Il t'a reconnu. Il t'a reconnu, je te dis."),
        ]),
        fonderieBeat(),
        when(is("defaite"), [
          stage(
            "Le Golem frappe, et le héros se disperse. Plus tard, dans l'atelier vide, l'équipe le retrouve. Les Sonneurs ont repris leur mesure. L'ordre de service est toujours affiché au mur.",
          ),
          say("lyra", "On recommence. Autrement."),
          fx(set("defaite", false)),
        ]),
        when(
          is("gorr_question"),
          [
            stage(
              "Tout s'arrête. Les Sonneurs baissent leurs diapasons sans savoir pourquoi. L'Écho qui partage la case de Gorr sent, sous sa main, la vibration lente du cristal ; et Gorr sent, contre lui, autre chose : une chaleur qui bat vite, irrégulière, qui ne vient pas des fours. Un autre rythme. Pas un ordre. Un autre.",
            ),
            when(is("qui_va_vers_gorr", "lyra"), [
              say(
                "lyra",
                "Ne bouge pas. Je répare. Ça va me coûter, à moi. Pas à toi.",
              ),
              fx(add("confiance.lyra")),
            ]),
            when(is("qui_va_vers_gorr", "eva"), [
              say(
                "eva",
                "Je ne calcule plus rien. Je… c'est la première fois que ça me fait plaisir.",
              ),
              fx(add("confiance.eva")),
            ]),
            when(is("qui_va_vers_gorr", "squalor"), [
              say(
                "squalor",
                "T'es froid. T'as faim de quelque chose, toi aussi. Pas de viande. D'autre chose.",
              ),
              fx(add("confiance.squalor")),
            ]),
            when(is("qui_va_vers_gorr", "chroniqueur"), [
              say("chroniqueur", "Je note. Je… non. Je ne note pas. J'écoute."),
              fx(add("confiance.chroniqueur")),
            ]),
            when(is("qui_va_vers_gorr", "heros"), [
              stage("Le héros ne dit rien. Sa main sur le cristal."),
            ]),
            stage(
              "Pour la première fois, une voix sort du cristal : grave, sans souffle, comme un frottement de pierres.",
            ),
            say("gorr", "… Chaud."),
            stage(
              "La lueur de ses facettes cherche, trouve, se cale à moitié sur le pouls de l'Écho qui le touche.",
            ),
            say("gorr", "Gorr croît."),
            say("gorr", "… Pourquoi ?"),
            stage(
              "Le silence de la Fonderie. Même les fours ont l'air d'écouter.",
            ),
            when(is("premier_cristal.lieu", "cairn"), [
              stage(
                "Les facettes de Gorr se tournent vers le héros, très lentement, comme on se tourne vers un bruit ancien.",
              ),
              say("gorr", "Gorr a porté des pierres. Pour toi. Avant."),
              fx(add("confiance.gorr")),
            ]),
            fx(set("carnet.Q16", "ouverte")),
          ],
          [
            stage(
              "Gorr est fendu, immobile, éteint. Les Extracteurs ont fui. Lyra III s'agenouille près de lui.",
            ),
            fx(set("gorr_dort"), set("lyra_usure")),
          ],
        ),
        archive(
          "Rapport de réaccord, Fonderie, an 312",
          "« Réaccord : échec. Valorisation : échec. Le Golem a quitté la Fonderie de lui-même, en compagnie de l'anomalie. »",
          "« Le Sonneur dit vrai. J'étais là. Il a dit « pourquoi ». J'ai attendu toute ma vie d'entendre quelqu'un le dire à Vitrelle. Je ne pensais pas que ce serait une montagne de quartz. — C. »",
        ),
      ],
      next: "5",
    },
    "5": {
      id: "5",
      title: "La première phrase",
      kind: "fin",
      setting: "La Fonderie, après",
      beats: [
        when(
          is("gorr_question"),
          [
            stage(
              "Gorr ne bouge pas. Il attend, sans savoir qu'il attend. L'équipe autour de lui.",
            ),
            say(
              "lyra",
              "Pourquoi tu croîs ? Je ne sais pas. Personne ne sait pourquoi il croît. Mais tu viens de te le demander. C'est déjà… beaucoup.",
            ),
            stage(
              "Q16 entre au Carnet : Une question peut-elle naître d'une pierre ?",
            ),
            choice("q16", [
              opt("oui", "Oui. Elle vient d'en naître une.", [
                fx(set("carnet.Q16", "repondue"), add("confiance.gorr")),
              ]),
              opt("pas-pierre", "Ce n'est pas une pierre.", [
                say(
                  "chroniqueur",
                  "C'en est une, au sens où il est minéral. Et c'est quelqu'un. Les deux. Je crois que c'est tout l'intérêt.",
                ),
                fx(set("carnet.Q16", "repondue")),
              ]),
              opt("carnet", "Montrer le Carnet à Gorr.", [
                stage(
                  "Gorr regarde la page, les signes qu'il ne sait pas lire. Il pose un doigt de cristal, très doucement, à côté de la question. Le papier ne se déchire pas.",
                ),
                say("gorr", "Gorr… aussi."),
                fx(set("carnet.Q16", "repondue"), add("confiance.gorr", 2)),
              ]),
            ]),
            fx(join("gorr")),
            say("gorr", "Gorr suit."),
            say("gorr", "Toi, chaud. Gorr suit chaud."),
            when(is("premier_cristal", "sauve"), [
              stage(
                "Gorr s'arrête devant le héros, se penche vers le Cristal qu'il porte. Les deux battent, un instant, au même rythme.",
              ),
              say("gorr", "Lui… croît pas. Lui, garde."),
              when(is("chroniqueur_rejoint"), [
                say(
                  "chroniqueur",
                  "Il fait la différence entre croître et garder. J'ai des collègues qui ne la font pas.",
                ),
              ]),
            ]),
            fx(give("habit:bracelet-de-quartz")),
            stage(
              "Habit : Bracelet de quartz. Un anneau de cristal gris-vert a poussé au poignet du héros, sans serrer. +1 Défense physique.",
            ),
          ],
          [
            say(
              "lyra",
              "Il se répare seul, d'après leur fiche. Mais pas vite. Pas assez vite pour la Garde.",
            ),
            stage(
              "Elle pose les mains sur la fêlure la plus large. Veillée de réparation. Au matin, Gorr se relève, lentement. Il ne dit rien. Il suit l'équipe, sans qu'on sache pourquoi.",
            ),
            fx(join("gorr"), add("confiance.gorr", -1), add("usure")),
          ],
        ),
        stage(
          "Habit : Tablier de Fonderie. Un tablier de cuir roussi, abandonné près des fours. +1 Défense énergétique.",
        ),
        fx(give("habit:tablier-de-fonderie")),
        stage(
          "Juste avant de quitter la Fonderie, un tube acoustique de cuivre, au mur, grésille.",
        ),
        say(
          "merlin",
          "Intéressant. Il a parlé. Je n'ai pas de colonne pour ça dans mes registres. Montez donc à l'Observatoire, tous. Je préférerais vous mesurer de près.",
        ),
        go("$end"),
      ],
    },
  },
}

void all
