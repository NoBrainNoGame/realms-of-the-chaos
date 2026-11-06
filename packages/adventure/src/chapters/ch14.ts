import {
  add,
  all,
  choice,
  fx,
  give,
  go,
  gte,
  hint,
  hub,
  is,
  join,
  narr,
  not,
  opt,
  say,
  set,
  stage,
  topic,
  when,
} from "../dsl"
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

// ─── Combat A : le Premier Gel (reconstitution, optional Archive) ───────────

const VAGUE = kitOf(
  "squalor",
  "vague",
  "Vague de matière instable",
  "Marée",
  {
    health: 2,
    speed: 3,
    physicalAttack: 3,
    physicalDefense: 1,
    magicalAttack: 1,
  },
  ["kick"],
)
const COLLEGE = kitOf(
  "merlin",
  "college",
  "Membre du Collège",
  "Thermiste",
  { health: 2, speed: 3 },
  ["kick"],
)

const BOARD_A = [
  "..1..~~wwW",
  "..1..~~wwW",
  ".111.~~wwW",
  "..1...~wwW",
  "..1...~wwW",
  ".111.~~wwW",
  "..1..~~wwW",
]

function premierGel(ally: Ally): FightSpec {
  const college = [
    { x: 3, y: 0 },
    { x: 3, y: 1 },
    { x: 4, y: 2 },
    { x: 3, y: 3 },
    { x: 4, y: 5 },
    { x: 3, y: 6 },
  ].map((at) => ({ preset: COLLEGE, at }))
  const objectives: ObjectiveSpec[] = [
    {
      id: "ne-pas-reecrire",
      mark: "★",
      label: "Ne pas réécrire : que personne du Collège ne tombe",
      check: (r) =>
        r.result !== "defeat" &&
        r.fighters.filter((f) => f.team === 1).every((f) => f.hp > 0),
      success: "Les traces tiennent : la reconstitution est fidèle.",
      failure:
        "La reconstitution se brise : elle ne dit plus ce qui s'est passé.",
      onSuccess: [set("reconstitution_fidele"), set("gel_lu")],
    },
  ]
  return {
    id: `ch14-gel-${ally}`,
    title: "Le Premier Gel",
    goal: "Laisser se dérouler ce que les bandes du cristal ont gardé : protéger le Collège pendant qu'il brise les Cristaux, et tenir jusqu'au Gel.",
    board: BOARD_A,
    teams: [
      {
        name: "Sauveteurs",
        side: "allies",
        fighters: [
          { preset: "@hero", at: { x: 0, y: 3 } },
          { preset: LYRA3, at: { x: 0, y: 2 } },
          ...allyFighter(ally, { x: 0, y: 4 }),
        ],
      },
      { name: "Le Collège", side: "neutral", fighters: college },
      {
        name: "La Marée",
        side: "enemies",
        // Three waves: the first at the start, then ticks 3 and 6.
        fighters: [1, 3, 5].map((y, wave) => ({
          preset: VAGUE,
          at: { x: 6, y },
          ...(wave ? { arrives: { tick: wave * 3 } } : {}),
        })),
      },
    ],
    // SIMPLIFIED: the Collège is a neutral team that fights nobody; its six
    // Cristaux and the slowing sea are not scripted (no Extraire in the engine).
    rules: {
      neutral: [1],
      clock: { period: 1, limit: 10, winner: 0 },
      announce: true,
    },
    influences: ["timeWarp"],
    startEnergy: 2,
    defeat: [set("defaite")],
    objectives,
    lines: [
      {
        when: "start",
        who: "college",
        text: "Brisez-les tous ! Tous ! On comptera après !",
      },
      {
        when: "tick:3",
        who: "college",
        text: "Tessa disait qu'une Marée, ça se fige. Elle n'a jamais dit combien ça coûtait. Plus vite !",
      },
      {
        when: "tick:5",
        who: "lyra",
        text: "Ils ne délibèrent pas. Ils ont peur. Ils ont raison d'avoir peur.",
      },
      {
        when: "end",
        who: "chroniqueur",
        text: "Sereine, cette nuit. Unanime. J'ai écrit ça.",
      },
    ],
  }
}

// ─── Combat B : les fonds non conformes ─────────────────────────────────────

const BOARD_B = [
  "#..#....#..#",
  ".....11.....",
  ".##..11..##.",
  ".....11.....",
  ".##......##.",
  ".....11.....",
  ".##..11..##.",
  ".....11.....",
  "#..#....#..#",
]

/** The six Cristaux d'archive, in three entangled pairs. */
const ARCHIVES = [
  { id: "a1", at: { x: 3, y: 1 }, twin: "a2" },
  { id: "a2", at: { x: 8, y: 7 }, twin: "a1" },
  { id: "b1", at: { x: 8, y: 1 }, twin: "b2" },
  { id: "b2", at: { x: 3, y: 7 }, twin: "b1" },
  { id: "c1", at: { x: 3, y: 4 }, twin: "c2" },
  { id: "c2", at: { x: 8, y: 4 }, twin: "c1" },
]

function fonds(ally: Ally, rallie: boolean): FightSpec {
  const allies = [
    { preset: "@hero" as const, at: { x: 5, y: 3 } },
    { preset: LYRA3, at: { x: 9, y: 3 } },
    ...allyFighter(ally, { x: 5, y: 6 }),
  ]
  const teams: FightSpec["teams"] = [
    { name: "Alliés", side: "allies", fighters: allies },
    {
      name: "La Garde",
      side: "enemies",
      fighters: [
        { preset: HALLEBARDIER, at: { x: 5, y: 0 } },
        { preset: EXTRACTEUR, at: { x: 6, y: 0 } },
        { preset: EXTRACTEUR, at: { x: 5, y: 8 } },
        { preset: ARBALETRIER, at: { x: 6, y: 8 } },
        // The reinforcements of times 30 and 50 (ticks 3 and 5).
        { preset: HALLEBARDIER, at: { x: 2, y: 0 }, arrives: { tick: 3 } },
        { preset: SONNEUR, at: { x: 9, y: 8 }, arrives: { tick: 5 } },
      ],
    },
  ]
  if (rallie) allies.splice(2, 0, { preset: CHRONIQUEUR, at: { x: 5, y: 2 } })
  else
    teams.push({
      name: "Le Chroniqueur",
      side: "neutral",
      fighters: [{ preset: CHRONIQUEUR, at: { x: 5, y: 2 } }],
    })
  const objectives: ObjectiveSpec[] = [
    {
      id: "fonds",
      mark: "★",
      label:
        "Sauver les archives : mettre les Extracteurs hors d'état de nuire",
      // The fonds are saved when no Extracteur is left on the board.
      check: (r) =>
        r.result !== "defeat" &&
        r.fighters
          .filter((f) => f.preset === "extracteur")
          .every((f) => f.hp <= 0 || f.fled),
      success: "Les fonds tiennent. La Chronique de l'ère IV les aura.",
      failure: "Les traces de la Salle sont perdues.",
      onSuccess: [set("fonds_conformes")],
    },
    {
      id: "six",
      mark: "◆",
      label: "Les six Cristaux intacts",
      // The six Cristaux d'archive (three pairs): none broken, none dead glass.
      check: (r) =>
        r.result !== "defeat" &&
        ARCHIVES.every((c) => r.crystals?.state[c.id] === "set"),
      success: "Pas une fiche de moins.",
      onSuccess: [set("six_cristaux"), add("confiance.chroniqueur")],
    },
  ]
  return {
    id: `ch14-fonds-${ally}-${rallie ? "c" : "n"}`,
    title: "Les fonds non conformes",
    goal: rallie
      ? "Tenir la Salle des Archives : la Garde vient « valoriser » les fonds. Le Chroniqueur se bat avec vous."
      : "Tenir la Salle des Archives. Le Chroniqueur reste sur l'estrade : s'il tombe, c'est perdu.",
    board: BOARD_B,
    teams,
    rules: {
      neutral: rallie ? undefined : [2],
      crystals: { crystals: ARCHIVES, raiders: [1] },
      clock: { period: 1, limit: 12, winner: 0 },
      flee: {
        team: 1,
        below: 0.25,
        exits: [
          { x: 1, y: 0 },
          { x: 10, y: 8 },
        ],
      },
      announce: true,
    },
    influences: ["timeWarp", "earthquake"],
    startEnergy: 3,
    defeat: [set("defaite"), add("usure"), add("confiance.chroniqueur", -1)],
    objectives,
    lines: [
      {
        when: "start",
        who: "lyra",
        text: "Ils cassent les souvenirs de la cité pour la tenir au froid un jour de plus.",
      },
      {
        when: "tick:1",
        who: "chroniqueur",
        text: rallie
          ? "Je n'ai jamais frappé personne. J'ai beaucoup raturé. C'est à peu près pareil."
          : "Je… je ne prends pas parti. Je prends des notes. Ne vous approchez pas des notes.",
      },
      {
        when: "tick:3",
        who: ally === "squalor" ? "squalor" : "eva",
        text:
          ally === "squalor"
            ? "Celui-là a l'air de vouloir tout manger. Je connais. Je n'aime pas qu'on mange chez moi."
            : "Extracteur à quatre cases, trajectoire vers le Cristal du nord-est. Je l'ai.",
      },
      {
        when: "tick:5",
        who: "sonneur",
        text: "Ralentissez. Les archives n'ont pas besoin de vous.",
      },
      {
        when: "fleeing",
        who: "hallebardier",
        text: "Je me rends. Je ne comprends pas pourquoi on se bat pour des cailloux.",
      },
    ],
  }
}

// ─── L'interrogatoire : les sources ─────────────────────────────────────────

const interrogatoire: Beat[] = [
  say(
    "chroniqueur",
    "Ah. Vous êtes… Non. Si. Vous êtes l'anomalie 0-PUITS-1. Je vous reconnais d'après mon propre signalement, ce qui est, je dois l'admettre, une première.",
  ),
  stage("Il ne touche pas au cordon d'alarme."),
  say(
    "chroniqueur",
    "Asseyez-vous. Non, ne vous asseyez pas, ce siège est classé. Restez debout. Puisque vous êtes là, autant compléter le dossier.",
  ),
  say("lyra", "Il ne va pas appeler la Garde ?"),
  say(
    "chroniqueur",
    "Plus tard. Un dossier incomplet est une faute. Une évasion est un incident. La hiérarchie des urgences est claire, article quatorze. Ou quinze. Quatorze.",
  ),
  stage("Il lit ses sources à voix haute, une à une, en se corrigeant."),
  // source 1
  when(
    is("fragments", "separation"),
    [
      say(
        "chroniqueur",
        "Source un : le chant des pilotis, recueilli en l'an 140 auprès des dernières ondines. « Quand les deux terres se touchèrent, le Dormeur les regarda, et sous son regard elles se reconnurent étrangères. » Votre regard a-t-il séparé deux terres ?",
      ),
    ],
    [
      say(
        "chroniqueur",
        "Source un : le chant des pilotis, recueilli en l'an 140 auprès des dernières ondines. « Quand les deux terres se touchèrent, le Dormeur les regarda, et sous son regard elles devinrent une seule terre. » Votre regard a-t-il uni deux terres ?",
      ),
    ],
  ),
  choice("source1", [
    opt("touche", "Un regard ne fixe rien. Elles se sont touchées.", [
      say("chroniqueur", "Touchées. Pas regardées."),
      stage("Il note."),
      say(
        "chroniqueur",
        "C'est moins beau. C'est sans doute plus exact. Nos propres instruments touchent ce qu'ils mesurent ; je ne vois pas pourquoi des yeux feraient mieux.",
      ),
      fx(add("confiance.chroniqueur")),
    ]),
    opt("souvenir", "Je ne m'en souviens pas comme ça.", [
      say(
        "chroniqueur",
        "Personne ne se souvient de rien comme ça. C'est bien le problème des souvenirs.",
      ),
    ]),
    opt("peutetre", "Peut-être.", [
      say("chroniqueur", "« Peut-être » n'est pas une réponse recevable."),
      stage("Il hésite."),
      say("chroniqueur", "Mais je vais le noter."),
    ]),
  ]),
  // source 2
  when(
    is("journal_nerea", "porte"),
    [
      say(
        "chroniqueur",
        "Source deux : le journal d'une ondine, Néréa dite des Strates. Original perdu. Nous n'en avons que des citations, dans d'autres textes.",
      ),
      stage(
        "Le héros sort le journal de son sac. Le Chroniqueur ne dit rien pendant longtemps.",
      ),
      say(
        "chroniqueur",
        "… L'original. Vous l'aviez sur vous. Dans le Puits. Pendant quatre siècles.",
      ),
      stage("Il n'ose pas le toucher."),
      say(
        "chroniqueur",
        "Il a voyagé moins de temps que tout ce qu'il y a dans cette salle.",
      ),
    ],
    [
      when(is("journal_nerea", "garde"), [
        say(
          "chroniqueur",
          "Source deux : le journal d'une ondine, Néréa dite des Strates. Une copie de copie, folio douze. Non, treize. « Le Dormeur sortit de la Pierre Lente, et la mer s'ouvrit devant lui. » La mer s'est-elle ouverte devant vous ?",
        ),
        choice("source2", [
          opt("fui", "Non. J'ai fui une Marée, avec elle.", [
            say(
              "chroniqueur",
              "Fui. Pas ouvert. Je vois comment on passe de l'un à l'autre en quatre siècles de recopie.",
            ),
          ]),
          opt("silence", "Ne rien répondre.", [stage("Il note le silence.")]),
        ]),
      ]),
    ],
  ),
  // source 3
  say(
    "chroniqueur",
    "Source trois : une tradition de la Basse-Ville. « Il choisit l'île, il laissa les autres. »",
  ),
  when(is("ile_sauvee", "sauge"), [
    say("chroniqueur", "L'île de Sauge, dit-on."),
  ]),
  when(is("ile_sauvee", "lusse"), [
    say("chroniqueur", "L'île de Lusse, dit-on."),
  ]),
  when(is("ile_sauvee", "strates"), [
    say("chroniqueur", "L'île des Strates, dit-on."),
  ]),
  when(is("ile_sauvee", "aucune"), [
    say("chroniqueur", "Une variante dit qu'il les a toutes laissées."),
  ]),
  say("chroniqueur", "Avez-vous choisi ?"),
  choice("source3", [
    opt("doute", "Oui. Et je ne sais pas si j'ai bien choisi.", [
      stage("Il écrit longtemps."),
      say(
        "chroniqueur",
        "Aucune de mes sources ne dit que vous avez douté. Elles disent toutes que vous avez su.",
      ),
      fx(add("confiance.chroniqueur")),
    ]),
    opt("fallait", "Il fallait bien choisir.", [
      say(
        "chroniqueur",
        "C'est ce que dit la chanson. Elle a donc au moins un point exact.",
      ),
    ]),
  ]),
  // source 4: himself
  stage("Il tourne une page, s'arrête."),
  say("chroniqueur", "Source quatre, c'est moi. Mon rapport."),
  stage("Silence."),
  say(
    "chroniqueur",
    "Paragraphe 1.2 : « L'anomalie a déplacé la main d'un doigt en deux siècles. Mouvement non significatif. »",
  ),
  stage("Il regarde la main du héros."),
  say(
    "chroniqueur",
    "C'est vous qui l'avez bougée, ou c'est le Puits qui vous a… Non. Ne répondez pas. Je ne sais pas encore quelle question je pose.",
  ),
  stage(
    "Le héros comprend : la légende parle de lui, mais transformée par chaque main qui l'a recopiée.",
  ),
  when(is("carnet.Q07", "ouverte"), [
    choice("q07", [
      opt(
        "legende",
        "La légende, c'est moi. Plus tous ceux qui l'ont racontée.",
        [fx(add("confiance.chroniqueur"))],
      ),
      opt("pasmoi", "La légende n'est pas moi.", [
        narr("Juste aussi : le Carnet l'accepte."),
      ]),
    ]),
  ]),
  fx(set("carnet.Q07", "repondue")),
  stage("Q07 trouve sa réponse : Suis-je celui de la légende ?"),
]

// ─── La confrontation : les traces ──────────────────────────────────────────

const ouverte = not(is("confrontation_close"))
const trace: Beat[] = [fx(add("traces.chroniqueur"))]

const confrontation = hub("traces", [
  topic(
    "strates",
    "Les strates",
    [
      ...trace,
      stage(
        "Une carotte de sédiments, rapportée jadis des Abysses par une lignée d'ondines, couchée dans sa gouttière de cuivre.",
      ),
      say(
        "chroniqueur",
        "Une couche par an. Ici, les Marées : du sable grossier, chaotique. Ici, le Gel : plus rien, une vase si fine qu'on dirait du verre. Et ici…",
      ),
      stage("Il compte."),
      say(
        "chroniqueur",
        "Vingt couches après le Gel, des cendres de cristal. Partout. Ça ne vient pas de la mer. Ça vient des mines.",
      ),
    ],
    { if: all(ouverte, not(is("ile_sauvee", "aucune"))) },
  ),
  topic(
    "gel",
    "Le Premier Gel",
    [
      ...trace,
      say("chroniqueur", "« Dans la sérénité. »"),
      stage("Il pose le doigt sur la phrase."),
      say(
        "chroniqueur",
        "J'ai recopié cette phrase quatre fois dans ma carrière. Je l'ai même améliorée.",
      ),
    ],
    { if: all(ouverte, is("gel_lu")) },
  ),
  topic(
    "tobin",
    "Les relevés de Tobin",
    [
      ...trace,
      stage(
        "Tobin est là, dans un coin, en chemise de nuit, ses vieux cahiers sur les genoux.",
      ),
      say(
        "tobin",
        "Au début, l'aiguille bougeait. Tous les jours. Un peu. Et puis de moins en moins. Elle ne s'est pas arrêtée parce que le Gel est parfait. Elle s'est arrêtée parce qu'il n'y a plus rien à mesurer qui bouge.",
      ),
    ],
    { if: all(ouverte, is("tobin_rouvert")) },
  ),
  topic(
    "annales",
    "Les annales des Ondines",
    [
      ...trace,
      stage(
        "Les ardoises et les colonnes de vase sauvées de la Grande Marée, rangées au fonds de la Marée, que personne n'a lues depuis le Gel.",
      ),
      say(
        "chroniqueur",
        "Quatre siècles d'annales, tenues par des gens qui ne savaient pas que le Collège existerait. Ils n'avaient aucune raison de lui donner raison.",
      ),
    ],
    { if: all(ouverte, is("ile_sauvee", "strates")) },
  ),
  topic(
    "journal",
    "Le journal original",
    [
      ...trace,
      stage("Le héros pose l'original à côté de la copie du Collège."),
      say(
        "chroniqueur",
        "« La mer s'ouvrit devant lui », dit la copie. « Nous avons fui la Marée, et il courait moins vite que moi », dit l'original.",
      ),
      stage("Il rit malgré lui."),
      say(
        "chroniqueur",
        "Quatre siècles pour transformer une course en miracle.",
      ),
    ],
    { if: all(ouverte, is("journal_nerea", "porte")) },
  ),
  topic(
    "moi",
    "Moi-même : « Ton rapport dit que je suis une légende. Je suis là. »",
    [
      say(
        "chroniqueur",
        "Vous êtes là. Ça prouve que vous existez. Ça ne prouve pas que les légendes sont vraies.",
      ),
      stage("Un temps."),
      say(
        "chroniqueur",
        "Pardon. Déformation professionnelle. Mais c'est exact.",
      ),
    ],
    { if: ouverte },
  ),
  topic(
    "assez",
    "Ne rien présenter de plus",
    [
      fx(set("confrontation_close")),
      hint(
        "Les traces",
        "Il en faut deux pour que le Chroniqueur bascule. Une trace que vous n'avez pas n'est pas proposée.",
      ),
    ],
    { if: ouverte },
  ),
])

// ─── L'île ───────────────────────────────────────────────────────────────────

const ISLAND = [
  "............",
  ".1.......1..",
  "............",
  "......1.....",
  "............",
  "..1.......1.",
  "............",
  "............",
]

export const ch14: Chapter = {
  id: "14",
  era: 3,
  number: 14,
  title: "Le Chroniqueur",
  quote: {
    who: "chroniqueur",
    text: "Le Bureau ne retient pas ce nom, qui varie selon les sources et n'est donc pas une donnée.",
  },
  place: "Vitrelle : la descente des liasses, la Salle des Archives",
  question: {
    id: "Q14",
    text: "L'Histoire est-elle ce qui s'est passé, ou ce qu'on en a gardé ?",
  },
  start: "1",
  exploration: {
    island: ISLAND,
    start: { x: 0, y: 7 },
    companions: ["lyra"],
    influences: ["timeWarp"],
    encounters: [
      place(ISLAND, "liasses", "La descente des liasses", "1", 1, 6, {
        auto: true,
      }),
      place(ISLAND, "bureau", "Le bureau du Chroniqueur", "2", 4, 4),
      place(ISLAND, "cristal", "Le cristal de croissance", "3", 8, 2),
      place(ISLAND, "estrade", "L'estrade", "4", 5, 2),
      place(ISLAND, "salle", "La Salle des Archives", "5", 9, 5, {
        auto: true,
      }),
      place(ISLAND, "page", "La page révisée", "6", 6, 6),
      look(
        "liasse",
        "Une liasse jetée",
        { x: 2, y: 7 },
        "Une page de Registre de l'an 40 du Gel, gonflée d'eau immobile. Une ligne y est barrée : « Les Lacunes de l'Est progressent depuis l'ouverture du puits de mine n° 3. » Au-dessus, d'une autre encre : « Sans objet. »",
      ),
      look(
        "carotte",
        "Une carotte de sédiments",
        { x: 7, y: 4 },
        "Des couches, une par an, couchées dans leur gouttière de cuivre. Là où le Gel commence, la vase devient si fine qu'on la dirait de verre.",
      ),
      look(
        "fiche",
        "Une fiche d'inventaire des Mines",
        { x: 10, y: 1 },
        "« Gisement n° 1. Rendement exceptionnel. Aucun jumeau connu. Pulse sans cause identifiée. Extraction programmée. »",
        "narr",
      ),
      {
        id: "ronde",
        label: "Une ronde de la Garde",
        at: { x: 3, y: 1 },
        wander: {
          preset: HALLEBARDIER,
          title: "Un garde égaré dans les rayons",
          goal: "Le renvoyer sans casser un rayonnage.",
          range: 2,
          radius: 4,
          effects: [{ add: "ecoute", by: 1 }],
          success: "Le garde s'en va en s'excusant auprès d'une étagère.",
        },
      },
    ],
  },
  scenes: {
    "1": {
      id: "1",
      title: "La descente des liasses",
      kind: "rencontre",
      setting: "Un conduit de verre dépoli, presque vertical",
      beats: [
        stage(
          "Un conduit de verre dépoli, presque vertical, qui monte des Citernes jusqu'au sommet de la Tour. Autrefois, on y jetait les papiers « sans objet ». Il en reste au fond, en couches, gonflés d'eau immobile.",
        ),
        byAlly((ally) =>
          ally === "squalor"
            ? say(
                "squalor",
                "Un tuyau qui sent le papier mouillé et la peur des chefs. Je passe devant.",
              )
            : ally === "eva"
              ? say(
                  "eva",
                  "Quarante-deux mètres, pente de quatre-vingt-un degrés. Si quelqu'un glisse, il arrive en bas en trois secondes. J'ai vérifié deux fois.",
                )
              : narr("Personne ne parle : on grimpe."),
        ),
        stage(
          "Le héros peut ramasser une liasse au fond : une page de Registre de l'an 40 du Gel.",
        ),
        archive(
          "Registre, an 40 du Gel, page jetée",
          "« Sans objet. »",
          "« Sans objet. » (Annotation : jetée parce qu'exacte. — C.)",
        ),
        say(
          "lyra",
          "Ils ont jeté ça. Ils l'ont écrit, et puis ils l'ont jeté.",
        ),
      ],
      next: "2",
    },
    "2": {
      id: "2",
      title: "L'interrogatoire",
      kind: "rencontre",
      setting: "La Salle des Archives",
      beats: [
        stage(
          "La Salle des Archives : des rayonnages de verre jusqu'au plafond, des liasses, des carottes de sédiments couchées dans des gouttières de cuivre, et des étagères de Cristaux d'intrication, petits, chacun étiqueté. Au centre, une estrade et un bureau couvert de papiers. Un homme long et voûté, des lunettes de lecture remontées sur le front, une plume dans chaque main, lève les yeux.",
        ),
        ...interrogatoire,
      ],
      next: "3",
    },
    "3": {
      id: "3",
      title: "Le Premier Gel",
      kind: "scene",
      setting: "Une étagère de la Salle des Archives",
      beats: [
        stage(
          "Sur une étagère, un Cristal d'archive plus gros que les autres, terne, strié de bandes. Étiquette : « Fonds ancien — Cristal de croissance, an 0 du Gel. Non conforme. »",
        ),
        say(
          "chroniqueur",
          "Ce cristal a poussé dans une grotte marine pendant des siècles. Chaque saison laisse une bande, comme les cernes d'un arbre. Les contraintes, la chaleur, le froid laissent des défauts, et les défauts ne mentent pas : ils n'ont pas d'opinion.",
        ),
        stage("Il hésite."),
        say(
          "chroniqueur",
          "Le Bureau l'a classé non conforme parce que ses bandes ne disent pas la même chose que le Registre. Je ne l'ai jamais lu. Personne ne m'a demandé de le lire.",
        ),
        say(
          "lyra",
          "Lire ça, c'est rester longtemps près d'un cristal instable. Ça use.",
        ),
        hint(
          "Lire le cristal",
          "Archive : Usure +1. La reconstitution se joue comme un combat.",
        ),
        choice("gel", [
          opt("lire", "Lisons-le.", [
            fx(add("archives.lues"), add("usure")),
            stage(
              "Les bandes du cristal racontent une dernière saison de grandes vagues de chaleur et de froid, puis un arrêt brutal : le froid tombe d'un coup, la croissance cesse.",
            ),
            byAlly((ally) => ({ t: "fight", fight: premierGel(ally) })),
            when(is("defaite"), [
              stage(
                "Le Collège recule, un membre s'effondre, la reconstitution se brise : l'image se décolore sans rien avoir dit. Le Chroniqueur repose le cristal sans un mot.",
              ),
              fx(set("defaite", false)),
            ]),
            when(is("reconstitution_fidele"), [
              archive(
                "Registre officiel, an 0 du Gel",
                "« Le Gel fut décidé dans la sérénité, au terme de longues délibérations, par un Collège unanime. »",
                "« Le Gel fut décidé dans la sérénité… » (Faux. Vérifié aux bandes du cristal. — C.)",
              ),
              stage(
                "Ce que montrent les traces : une Marée qui frappe la côte, des gens qui courent, un Collège de dix personnes qui allument le Gel en catastrophe, en brisant tous les Cristaux qu'ils ont sous la main. Personne n'a délibéré. Ils ont sauvé tout le monde, en une nuit, dans la panique.",
              ),
            ]),
          ]),
          opt("pas", "Pas maintenant.", [
            narr("Le cristal reste sur son étagère."),
          ]),
        ]),
      ],
      next: "4",
    },
    "4": {
      id: "4",
      title: "La confrontation",
      kind: "rencontre",
      setting: "Le bureau du Chroniqueur",
      beats: [
        stage(
          "Le Chroniqueur à son bureau, son rapport d'un côté, les traces de l'autre. Chaque trace présentée compte ; il en faut deux pour qu'il bascule.",
        ),
        confrontation,
        when(
          gte("traces.chroniqueur", 2),
          [
            say("chroniqueur", "Bon."),
            stage("Il enlève ses lunettes, les remet."),
            say(
              "chroniqueur",
              "Bon. Le Registre dit ce qu'on a voulu garder. Les strates disent ce qui s'est déposé. Ce n'est pas la même chose. Je le savais, bien sûr. Tout rédacteur le sait. Mais je croyais que l'écart était petit.",
            ),
            stage("Il regarde son rapport."),
            say(
              "chroniqueur",
              "Paragraphe 4.1 : « L'anomalie n'a pas d'état connu, donc c'est un danger. » Non. Elle n'a pas d'état dans mon registre. C'est mon registre qui est incomplet, pas elle.",
            ),
            stage("Il barre le paragraphe."),
            fx(set("chroniqueur_rejoint"), set("carnet.Q14", "ouverte")),
            stage(
              "Q14 entre au Carnet : L'Histoire est-elle ce qui s'est passé, ou ce qu'on en a gardé ?",
            ),
          ],
          [
            say(
              "chroniqueur",
              "C'est troublant. C'est… une anomalie de plus. Je vais l'inscrire.",
            ),
            stage("Il l'inscrit. Il ne bascule pas."),
            fx(set("carnet.Q14", "ouverte")),
            stage(
              "Q14 entre au Carnet : L'Histoire est-elle ce qui s'est passé, ou ce qu'on en a gardé ?",
            ),
          ],
        ),
      ],
      next: "5",
    },
    "5": {
      id: "5",
      title: "Les fonds non conformes",
      kind: "combat",
      setting: "La Salle des Archives",
      beats: [
        stage(
          "Ordre de service n° 312-0419. « Les fonds non conformes de la Salle des Archives seront valorisés sans délai au profit du Gel. La Garde procédera. »",
        ),
        when(is("chroniqueur_rejoint"), [
          stage("(Dans la marge : « Valorisés : brisés. — C. »)"),
        ]),
        stage(
          "La Garde entre par le nord et par le sud. Les Extracteurs foncent vers le Cristal le plus proche.",
        ),
        when(
          is("chroniqueur_rejoint"),
          [byAlly((ally) => ({ t: "fight", fight: fonds(ally, true) }))],
          [byAlly((ally) => ({ t: "fight", fight: fonds(ally, false) }))],
        ),
        when(is("defaite"), [
          stage(
            "Les hallebardes se resserrent. Le héros est figé debout, au pied de l'estrade ; Lyra III fait ce qu'elle déteste : elle brise un Cristal d'archive pour couvrir la sortie. Une feuille de Registre s'envole de l'étagère, la première chose qui bouge dans l'air de Vitrelle.",
          ),
          say(
            "chroniqueur",
            "Fonds ancien, cote dix-sept. Il n'y en avait qu'un exemplaire. Il n'y en a plus aucun.",
          ),
          fx(add("cristaux.extraits"), set("defaite", false)),
        ]),
        when(is("fonds_conformes"), [
          stage("Les rayonnages tiennent. Une partie des fonds est intacte."),
        ]),
      ],
      next: "6",
    },
    "6": {
      id: "6",
      title: "La page révisée",
      kind: "fin",
      setting: "La Salle des Archives, après le combat",
      beats: [
        stage(
          "Après le combat, dans la salle dévastée ou intacte. Le Chroniqueur ramasse des feuilles.",
        ),
        when(
          is("chroniqueur_rejoint"),
          [
            say(
              "chroniqueur",
              "Je vais réécrire le rapport. Non. Je vais écrire un second rapport, et laisser le premier à côté. Qu'on voie l'écart. Si on efface le premier, on refait exactement la même faute.",
            ),
            say("lyra", "Tu vas te faire réévaluer."),
            say(
              "chroniqueur",
              "Je vais me faire réaffecter aux Mines, plus exactement. « Réévaluer » est un euphémisme. Je les connais tous, j'en ai inventé trois.",
            ),
            when(ALLY_COND.eva, [
              say(
                "eva",
                "Probabilité qu'il nous ralentisse : soixante pour cent. Probabilité qu'il nous soit utile : soixante pour cent aussi. Ça s'additionne mal, mais j'aime bien ce genre de problème.",
              ),
            ]),
            when(ALLY_COND.squalor, [
              say(
                "squalor",
                "Il parle beaucoup. Mais au moins, il a faim de quelque chose.",
              ),
            ]),
            choice("q14", [
              opt(
                "gardé",
                "L'Histoire, c'est ce qu'on en a gardé. C'est pour ça qu'il faut la comparer aux traces.",
                [fx(add("confiance.chroniqueur"))],
              ),
              opt(
                "passe",
                "L'Histoire, c'est ce qui s'est passé. Le reste, ce sont des mensonges.",
                [
                  say(
                    "chroniqueur",
                    "Non. Ce qui s'est passé, personne ne l'a. On a des traces, et des récits. Les récits mentent parfois. Les traces ne mentent pas, mais elles ne parlent pas non plus : il faut quelqu'un pour les lire.",
                  ),
                ],
              ),
            ]),
            fx(set("carnet.Q14", "repondue"), join("chroniqueur")),
            stage("Q14 trouve sa réponse. Le Chroniqueur rejoint l'équipe."),
            stage(
              "Extrait des archives — Rapport n° 312-0417 bis. « 1. Constat. L'anomalie est une personne. 2. Antécédents. Toutes mes sources la déforment, la mienne comprise. 3. Mesure recommandée : la confronter, elle aussi, aux traces. Elle ne s'en offusque pas. — Le Chroniqueur (11e), rédacteur sans rang. »",
            ),
          ],
          [
            stage("Le Chroniqueur reste à son bureau."),
            say(
              "chroniqueur",
              "Partez. Je n'ai rien vu. Ce n'est pas exact : j'ai tout vu. Mais je ne l'écrirai pas.",
            ),
          ],
        ),
        stage(
          "En rangeant, le Chroniqueur tombe sur une fiche d'inventaire des Mines : « Gisement n° 1. Rendement exceptionnel. Aucun jumeau connu. Pulse sans cause identifiée. Extraction programmée. »",
        ),
        when(is("transformation.1", "B"), [
          stage(
            "Le héros sent sa peau de cristal se serrer en lisant la fiche.",
          ),
        ]),
        fx(give("habit:brassard-du-registre")),
        stage(
          "Habit : Brassard du Registre. Un brassard de commis, arraché à un rayonnage, où l'on a gratté le numéro. +1 Défense énergétique.",
        ),
        when(is("six_cristaux"), [
          fx(give("habit:besicles-de-redacteur")),
          stage(
            "Habit : Bésicles de rédacteur. Deux verres ronds, rayés à force d'avoir lu de travers. La prochaine Archive ne coûte pas d'Usure.",
          ),
        ]),
        go("$end"),
      ],
    },
  },
}
