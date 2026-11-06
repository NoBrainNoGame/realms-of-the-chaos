import {
  add,
  choice,
  fx,
  give,
  go,
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
import { type Chapter, END, type FightSpec } from "../types"
import { look, movable, UNSTABLE, zoneOf } from "./era2-kit"

// The pilotis of the East, between the Pierre Lente (south) and Sauge (north).
// The same map is the fight's board and the island the hero walks.
const PILOTIS = [
  "WWW.11.WW",
  "W~.WW1~WW",
  "W..WW1..W",
  "W1WWWWW1W",
  "W1..~..1W",
  "WWWW~WW.W",
  "W..1.WW.W",
  "W.WW....W",
  "W.WWWWW1W",
  "W...22..W",
  "WW~3#3~WW",
]

const DEFEAT_LINE = "Je vous ai repêché par le col de votre ciré"

const maree: FightSpec = {
  id: "ch7-fuir-la-maree",
  title: "Fuir la Marée",
  board: PILOTIS,
  teams: [
    {
      name: "Le héros et Néréa",
      side: "allies",
      fighters: [
        { preset: "@hero", at: { x: 2, y: 9 } },
        { preset: "nerea", at: { x: 1, y: 9 } },
      ],
    },
    {
      name: "Lacunaires du Front de Marée",
      side: "enemies",
      fighters: [
        { preset: UNSTABLE, at: { x: 7, y: 6 } },
        { preset: UNSTABLE, at: { x: 7, y: 7 } },
        { preset: UNSTABLE, at: { x: 5, y: 7 } },
        { preset: UNSTABLE, at: { x: 6, y: 7 } },
      ],
    },
  ],
  rules: {
    // SIMPLIFIED: the Front de Marée and the double victory (north edge or 12
    // ticks) do not exist. Surviving 12 ticks wins.
    // Planks of the middle that nobody has stepped near yet are uncertain:
    // the first to come within a cell settles them (or the tide, at tick 9).
    superposition: {
      cells: [
        { x: 1, y: 6 },
        { x: 2, y: 6 },
        { x: 4, y: 7 },
      ],
      pVoid: 0.4,
      decohereAt: 9,
    },
    clock: { period: 1, limit: 12, winner: 0 },
    announce: true,
  },
  influences: [],
  startEnergy: 0,
  goal: "Gagner les passerelles du nord sans rien frapper : la Marée prend sous les coups.",
  defeat: [set("defaite"), add("usure", 1), add("confiance.nerea", -1)],
  objectives: [
    {
      id: "ne-pas-combattre",
      mark: "★",
      label: "Ne pas combattre",
      // Not a single blow landed, on anyone.
      when: { not: { struckOn: {} } },
      success: "Personne n'a frappé. La Marée est passée sans prendre.",
      failure:
        "Un coup a été porté : la Marée a pris, de la glace reste sur les pilotis.",
      onSuccess: [
        add("confiance.nerea", 1),
        add("confiance", 1),
        set("ch7_etoile"),
        give("cire_des_pilotis"),
      ],
    },
    {
      id: "pas-de-galet-perdu",
      mark: "◆",
      label: "Aucun des deux ne tombe",
      // SIMPLIFIED: the Galet does not exist; nobody falling (every ally
      // still standing) stands for it.
      check: (r) =>
        r.fighters.filter((f) => f.team === 0).every((f) => f.hp > 0),
      success: "Chaque planche a tenu sous les pas.",
    },
  ],
  lines: [
    {
      when: "start",
      who: "nerea",
      text: "Vers le nord. Les planches hautes d'abord : la Marée monte moins vite que la peur.",
    },
    {
      when: "start",
      who: "nerea",
      text: "Ne frappez rien. La Marée, c'est comme une eau trop froide : un choc, et elle prend.",
    },
    {
      when: "tick:1",
      who: "nerea",
      text: "Si vous doutez d'une planche, jetez un caillou dessus. Si elle existe, elle tiendra. Un regard ne la fixera pas : il faut la toucher.",
    },
    {
      when: "tick:3",
      who: "nerea",
      text: "Contournez-les. Ils sont lents tant qu'on ne les dérange pas.",
    },
    {
      when: "tick:5",
      who: "nerea",
      text: "Ne restez pas là. Vous avez déjà perdu assez de temps près de ce trou.",
    },
    {
      when: "end",
      who: "nerea",
      text: "Elle se retire. On a tenu. Sauge, vous voyez ? On peut arriver quelque part sans rien casser.",
    },
  ],
}

const zone = zoneOf(PILOTIS)

const CHANT_FUSION = [
  "« Au temps où l'eau était basse et le ciel encore jeune, il y avait la Terre Verte, qui se tenait droite, et la Terre Noire, qui avait faim, et dont le dieu dévorait. »",
  "« Quand les deux terres se touchèrent, le Dormeur les regarda, et sous son regard elles devinrent une seule terre. Ce furent les Noces, et la Couture en garde la cicatrice. »",
]
const CHANT_SEPARATION = [
  "« Au temps où l'eau était basse et le ciel encore jeune, il y avait deux sœurs : la Terre Verte, qui se tenait droite, et la Terre Noire, qui avait faim, et dont le dieu dévorait. »",
  "« Quand les deux sœurs se touchèrent, le Dormeur les regarda, et sous son regard elles se reconnurent étrangères. Il dit : « Allez. » Et la Sœur s'en fut dans le Clair. »",
]

export const ch07: Chapter = {
  id: "7",
  era: 2,
  number: 7,
  title: "La sortie du Puits",
  quote: {
    who: "nerea",
    text: "Ma deuxième horloge avait onze jours de retard sur la première.",
  },
  place: "La Pierre Lente, les pilotis de l'Est, Sauge",
  question: { id: "Q07", text: "Suis-je celui de la légende ?" },
  start: "s1",
  exploration: {
    island: PILOTIS,
    start: { x: 1, y: 9 },
    companions: ["nerea"],
    influences: ["timeWarp"],
    encounters: [
      {
        id: "s1",
        label: "La Pierre Lente et ses horloges",
        scene: "s1",
        at: { x: 2, y: 9 },
        zone: zone(2, 9),
        actor: "nerea",
      },
      {
        id: "s2",
        label: "Le chant gravé sur l'étui",
        scene: "s2",
        at: { x: 1, y: 7 },
        zone: zone(1, 7),
        actor: "nerea",
      },
      {
        id: "s3",
        label: "Le Front de Marée, à l'est",
        scene: "s3",
        at: { x: 4, y: 7 },
        auto: true,
      },
      {
        id: "s4",
        label: "Sauge, au nord",
        scene: "s4",
        at: { x: 6, y: 2 },
        zone: zone(6, 2),
      },
      {
        id: "s5",
        label: "La première page",
        scene: "s5",
        at: { x: 4, y: 0 },
        zone: zone(4, 0),
      },
      look("horloges", "Les deux horloges à eau", { x: 2, y: 10 }, [
        "Deux horloges identiques, côte à côte. Les gouttes ne tombent pas au même rythme : l'une a passé un an au bord de la fosse, l'autre à Sauge.",
        {
          who: "nerea",
          style: "say",
          text: "Onze jours de retard. Près du fond, ce serait bien pire.",
        },
      ]),
      look("ardoise", "Une ardoise oubliée", { x: 4, y: 6 }, [
        "Des colonnes de chiffres, des ratures, une flèche tracée vers le bas : le sens de la pente du temps.",
      ]),
      movable(
        "planche-gonflee",
        "Une planche gonflée d'eau",
        { x: 7, y: 8 },
        "timeWarp",
        "Le bois est noir d'humidité et gondolé. Elle ne portera personne telle quelle.",
        "Le temps s'accélère sur elle : le bois sèche et se redresse d'un coup. Elle tient.",
      ),
      {
        id: "errant",
        label: "Un Lacunaire isolé",
        at: { x: 4, y: 4 },
        wander: {
          preset: UNSTABLE,
          title: "Un Lacunaire des pilotis",
          goal: "Le toucher pour qu'il se décide.",
          range: 2,
          radius: 3,
          effects: [{ add: "ecoute", by: 1 }],
          success:
            "Il s'est défait en vase grise entre les planches. L'eau l'a pris sans bruit.",
        },
      },
    ],
  },
  scenes: {
    s1: {
      id: "s1",
      title: "La Pierre Lente",
      kind: "rencontre",
      setting:
        "Une fosse ronde, une eau lisse comme une vitre, deux horloges à eau",
      next: "s2",
      beats: [
        stage(
          "Une fosse ronde, une eau lisse comme une vitre. Au fond, une masse noire qu'aucune lumière n'éclaire vraiment. Sur une plate-forme de bois, deux grandes horloges à eau, identiques, côte à côte : l'une a passé un an au bord de la fosse, l'autre à Sauge. Une femme aux cheveux noués d'algues note des chiffres sur une tablette d'ardoise. Le héros remonte à la surface et s'agrippe aux pilotis.",
        ),
        narr(
          "Là où était la prairie de l'île natale, de l'eau à perte de vue. Quelques crêtes émergent.",
        ),
        when(
          is("fragments", "fusion"),
          [
            stage(
              "Au loin, une ligne où la roche verte et la roche noire se mêlent.",
            ),
          ],
          [
            stage(
              "Au-dessus de l'horizon, une lueur fixe, pâle, dans le Clair.",
            ),
          ],
        ),
        say(
          "nerea",
          "Ne bougez pas. Enfin, si : sortez de l'eau. Mais doucement. Vous venez de là-dessous ?",
        ),
        fx(join("nerea")),
        choice("premiere-question", [
          opt("autres", "Où sont les autres ?", [
            say(
              "nerea",
              "Les autres… Je ne sais pas de qui vous parlez. Ici, il n'y a que moi et mes horloges.",
            ),
          ]),
          opt("temps", "Combien de temps ?", [
            fx(add("confiance.nerea")),
            say(
              "nerea",
              "Bonne question. La seule bonne, d'ailleurs. Pour vous ? Je ne sais pas. Pour nous… Mes deux horloges partent ensemble. Celle que j'ai laissée ici un an a onze jours de retard. Près du fond, ce serait bien pire. Vous étiez près du fond.",
            ),
          ]),
          opt("silence", "Rester silencieux, regarder l'eau.", [
            stage(
              "Il regarde l'eau se refermer. Elle ne dit rien non plus, un moment.",
            ),
          ]),
        ]),
        say(
          "nerea",
          "Je m'appelle Néréa. Des Strates, si vous préférez : il y a eu beaucoup de Néréa.",
        ),
        when(is("transformation.1", "A"), [
          stage("Elle remarque la lueur dans ses yeux."),
          say(
            "nerea",
            "Vos yeux luisent. Comme dans le chant. C'est… gênant, pour une scientifique.",
          ),
        ]),
        when(is("transformation.1", "B"), [
          stage("Elle effleure son bras du bout du trident."),
          say(
            "nerea",
            "Vous êtes en verre. Comme dans le chant. C'est… gênant, pour une scientifique.",
          ),
        ]),
        when(is("objet_de_nyx"), [
          stage("Néréa aperçoit l'objet que Nyx a laissé."),
          say(
            "nerea",
            "Ça, c'est une marque d'Ombre. Les Ombres ne donnent rien à personne. Vous l'avez volé, ou elles vous aimaient bien ?",
          ),
          choice("objet-nyx", [
            opt("donne", "Elle me l'a donné.", [
              fx(set("objet_nyx_confie")),
              stage("Néréa le note dans son journal, sans lever les yeux."),
            ]),
            opt("oublie", "Je ne sais plus.", [
              stage("Elle hoche la tête. Ce qu'on a oublié se garde aussi."),
            ]),
          ]),
        ]),
        stage(
          "L'eau de la fosse frissonne alors que rien ne souffle. Les deux horloges, une seconde, ne gouttent plus au même rythme. Néréa le note sans commentaire.",
        ),
        say(
          "nerea",
          "Journal : il ne savait pas quel siècle nous étions. Je ne le lui ai pas dit tout de suite : on ne verse pas quatre cents ans d'eau froide sur quelqu'un qui tousse encore.",
        ),
      ],
    },

    s2: {
      id: "s2",
      title: "Le chant",
      kind: "rencontre",
      setting: "La plate-forme, l'ardoise et l'étui de Néréa",
      next: "s3",
      beats: [
        stage(
          "Néréa ramasse son ardoise et lui montre, gravé sur la face interne de son étui, le chant que l'on apprend aux enfants de Sauge.",
        ),
        when(
          is("fragments", "fusion"),
          CHANT_FUSION.map((l) => stage(l)),
          CHANT_SEPARATION.map((l) => stage(l)),
        ),
        stage(
          "« Le Dormeur vint de nulle part, et trois marchaient avec lui : Lyra, qui donnait sa chaleur jusqu'à ne plus en avoir, et qui monta au ciel pour devenir le premier matin ; Brutus, qui ne recula jamais, et qui devint le rocher de Sauge, touchez-le : il est encore tiède ; et Néréa la Première, qui descendit sous le lac et devint la mémoire de l'eau. »",
        ),
        when(
          is("transformation.1", "A"),
          [stage("Le chant parle du « Dormeur aux yeux d'aube ».")],
          [
            when(is("transformation.1", "B"), [
              stage("Le chant parle du « Dormeur à la peau de verre »."),
            ]),
          ],
        ),
        when(
          is("nyx_epargnee"),
          [
            stage(
              "« L'Ombre ? Nul ne la toucha : elle resta dans les bords, et ses filles y marchent encore. »",
            ),
          ],
          [
            stage(
              "« L'Ombre se défit sous la main du Dormeur, et ses filles ne lui ont pas pardonné. »",
            ),
          ],
        ),
        when(
          is("lacune_geante_habitee"),
          [
            stage(
              "« Deux se tinrent au bord du Trou, la main dans la main, et le Trou se tut. On n'y va qu'à deux, depuis. »",
            ),
          ],
          [
            stage(
              "« Le Trou resta ouvert, et c'est de lui que montent les Marées. »",
            ),
          ],
        ),
        stage(
          "« Puis le Dormeur descendit sous la Pierre Lente. Il dort. Il reviendra quand l'eau sera haute. »",
        ),
        say(
          "nerea",
          "On l'appelle le Dormeur. On dit qu'il est descendu sous la Pierre Lente, et qu'il reviendra quand l'eau sera haute. L'eau est haute. Les légendes ont parfois de la chance.",
        ),
        choice("chant", [
          opt("pas-ainsi", "Ce n'est pas comme ça que ça s'est passé.", [
            fx(add("confiance.nerea"), set("conteste_chant")),
            say(
              "nerea",
              "Je m'en doutais. Un chant, c'est ce qui reste quand on a oublié les détails et gardé l'émotion. Pour les détails, il faut la vase.",
            ),
          ]),
          opt("lyra", "Lyra n'est pas montée au ciel.", [
            fx(add("confiance.nerea"), set("conteste_chant")),
            say(
              "nerea",
              "Non. Personne ne monte au ciel. Ce qui monte, c'est la chaleur. Vous la connaissiez ?",
            ),
            stage("Le héros acquiesce."),
            say(
              "nerea",
              "Alors vous êtes vieux. Très vieux. Et bien conservé.",
            ),
          ]),
          opt("pas-dormeur", "Je ne suis pas ce Dormeur.", [
            say(
              "nerea",
              "Peut-être. Le chant dit aussi que vous avez regardé deux terres pour les unir. Si vous en êtes capable, regardez cette planche et réparez-la.",
            ),
            stage("Rien ne se passe."),
            say("nerea", "Voilà. Ni vous ni personne."),
          ]),
          opt("beau", "C'est un beau chant.", [
            say("nerea", "Oui. C'est ce qui le rend dangereux."),
          ]),
        ]),
        stage("Le Carnet s'ouvre de lui-même sur une page vierge."),
        hint(
          "Chroniques partiales",
          "Chaque époque raconte la précédente à sa manière.",
        ),
        stage("Néréa lève la tête. L'horizon, côté Clair, devient laiteux."),
        say("nerea", "Marée. Petite, mais assez. Vous savez nager ?"),
        when(is("transformation.1", "B"), [
          say("nerea", "… Vous coulez, n'est-ce pas. Évidemment."),
        ]),
      ],
    },

    s3: {
      id: "s3",
      title: "Fuir la Marée",
      kind: "combat",
      setting: "Les pilotis de l'Est, la Marée arrive",
      next: "s4",
      beats: [
        { t: "fight", fight: maree },
        when(is("defaite"), [
          stage(
            "Le héros tombe entre deux planches et l'eau le prend. Elle ne le laisse pas longtemps : un trident l'accroche par l'étoffe, et la ramène sur une passerelle haute.",
          ),
          say(
            "nerea",
            `${DEFEAT_LINE}. Respirez. La Marée est passée, et elle a gardé ce qu'elle voulait de la glace.`,
          ),
          stage(
            "Ils finissent le chemin à pas lents, par les planches hautes. Sauge est là, ses lanternes d'algues déjà allumées.",
          ),
          fx(set("defaite", false)),
          go("s4"),
        ]),
        when(
          is("ch7_etoile"),
          [],
          [
            stage(
              "Derrière eux, les pilotis de l'Est brillent de glace : la Marée a pris.",
            ),
          ],
        ),
      ],
    },

    s4: {
      id: "s4",
      title: "Sauge",
      kind: "veillee",
      setting: "Le village sur pilotis, de nuit",
      next: "s5",
      beats: [
        stage(
          "Le village sur pilotis, de nuit. Lanternes d'algues, filets, odeur de poisson séché. Au centre, un gros rocher sombre : « le rocher de Brutus ». Aubin, l'ancien des pilotis, tend une écuelle au héros sans rien demander. Des enfants l'observent à distance ; Ilse, douze ans, s'approche la première.",
        ),
        say("ilse", "C'est vrai que tu es le Dormeur ?"),
        say("aubin", "Laisse-le manger. Les légendes, ça mange aussi."),
        say("ilse", "Touche le rocher. Il est tiède. C'est Brutus."),
        choice("rocher", [
          opt("toucher", "Toucher le rocher.", [
            stage("Il est tiède, en effet."),
            say(
              "aubin",
              "Il a pris le soleil toute la journée. Comme Brutus, sans doute.",
            ),
          ]),
          opt("homme", "Brutus était un homme. Pas un rocher.", [
            say("ilse", "Comment tu le sais ?"),
            stage(
              "Le héros ne répond pas tout de suite. Elle attend, sans le quitter des yeux.",
            ),
          ]),
          opt("village", "Racontez-moi le village.", [
            fx(add("confiance.nerea")),
            say(
              "aubin",
              "Des filets, des planches, des enfants qui ne dorment pas. Il y a pire.",
            ),
          ]),
        ]),
        stage("Le héros demande enfin ce que sont devenus ses compagnons."),
        say(
          "nerea",
          "Lyra, Brutus, Néréa… Ce sont des noms de lignées. Il y a toujours une Néréa, parce qu'il y a toujours quelqu'un pour lire la vase. Les Soigneuses et les Gardiens sont partis vers les îles sèches du nord il y a deux générations. Les premiers… ils se sont dispersés il y a quatre siècles. Comme on se disperse. Rien de ce qu'ils étaient n'a disparu, mais plus rien ne se tient ensemble pour s'appeler Lyra.",
        ),
        choice("quatre-siecles", [
          opt("siecles", "Quatre siècles.", [
            fx(add("confiance.nerea")),
            stage("Silence. L'écuelle est encore chaude entre ses mains."),
          ]),
          opt("matin", "Pour moi, c'était ce matin.", [
            fx(add("confiance.nerea"), set("ce_matin")),
            stage("Néréa le note dans son journal."),
          ]),
          opt("seul", "Alors je suis seul.", [
            say(
              "nerea",
              "Vous avez une écuelle et un toit. C'est déjà deux choses.",
            ),
          ]),
        ]),
        say(
          "aubin",
          "Écoute-moi, Dormeur. Ceux d'avant, laisse-les couler. Le passé, c'est comme une ancre : utile pour s'arrêter, pas pour avancer.",
        ),
        say(
          "nerea",
          "Et il y a autre chose. Les Marées montent plus souvent, et de façon moins prévisible. Les Archères de la Tour, qui les calculaient à l'heure près, se trompent depuis un mois. Eva est partie à Peut-Être, l'île indécise, pour comprendre. Elle n'est pas revenue. Elle est têtue : elle reviendra. Mais j'irais bien voir.",
        ),
        stage(
          "Le héros écrit dans son Carnet : « Suis-je celui de la légende ? »",
        ),
        fx(set("carnet.Q07", "ouverte")),
      ],
    },

    s5: {
      id: "s5",
      title: "La première page",
      kind: "fin",
      setting: "Sauge, au matin",
      beats: [
        say(
          "nerea",
          "Journal : je l'ai emmené à Sauge sans lui avoir rien demandé, ce qui ne me ressemble pas. Il n'a pas dit grand-chose. Il a demandé des nouvelles de gens morts depuis quatre siècles avec la voix qu'on prend pour des gens partis la veille. J'ai pensé : voilà ce que c'est, une strate qu'on retrouve en surface. Elle ne sait pas qu'elle est vieille.",
        ),
        stage(
          "Aubin lui noue au cou une écharpe tressée d'algues sèches, qui sent le sel.",
        ),
        say(
          "aubin",
          "Pour le froid. Elle ne sert à rien d'autre, mais elle est à toi.",
        ),
        fx(give("echarpe_d_algues")),
        say(
          "nerea",
          "Demain, nous partons pour Peut-Être. Aubin dit que je suis folle. Aubin dit cela tous les jours, c'est une constante utile.",
        ),
        go(END),
      ],
    },
  },
}
