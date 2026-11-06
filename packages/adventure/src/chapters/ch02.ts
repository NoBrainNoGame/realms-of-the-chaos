import type { CharacterPreset } from "@realms/engine"
import {
  add,
  around,
  choice,
  fx,
  give,
  go,
  hint,
  hub,
  is,
  isnt,
  narr,
  opt,
  say,
  set,
  stage,
  topic,
  unlock,
  when,
} from "../dsl"
import { type Chapter, END, type FightSpec } from "../types"

// ─── Enemies (local copies: the Lacunaires of the chapter) ──────────────────

const instable: CharacterPreset = {
  id: "lacunaire-instable",
  name: "Lacunaire instable",
  title: "Écho défait",
  affinity: "shadow",
  stats: {
    health: 5,
    speed: 5,
    physicalAttack: 4,
    physicalDefense: 2,
    magicalAttack: 4,
    magicalDefense: 2,
    luck: 3,
  },
  actions: ["kick"],
}

/** Santé 6, vitesse 3 (lent), attaque énergétique 5, défenses 3, chance 4. */
const effilocheur: CharacterPreset = {
  id: "lacunaire-effilocheur",
  name: "Lacunaire effilocheur",
  title: "Écho de givre",
  affinity: "shadow",
  stats: {
    health: 6,
    speed: 3.5,
    physicalAttack: 1,
    physicalDefense: 3,
    magicalAttack: 5,
    magicalDefense: 3,
    luck: 4,
  },
  actions: ["etreinte", "kick"],
  actionDefs: {
    etreinte: {
      id: "etreinte",
      name: "Étreinte",
      description:
        "Corps à corps : dégâts énergétiques, et la cible est ralentie.",
      launch: { shape: "line", min: 1, max: 1 },
      lineOfSight: false,
      target: "enemy",
      timeCost: 1,
      effects: [
        { type: "damage", kind: "magical", power: 5 },
        { type: "status", status: "slowed", turns: 2 },
      ],
    },
  },
}

// ─── Fight: Jusqu'au cœur ───────────────────────────────────────────────────

const fightCoeur: FightSpec = {
  id: "ch2-jusqu-au-coeur",
  title: "Jusqu'au cœur",
  goal: "Mener Lyra jusqu'au sommet de la butte, au cœur de la Lacune, et l'y protéger pendant qu'elle recoud le sol.",
  board: [
    ".........",
    "..a......",
    "....1....",
    "...111...",
    "....1....",
    ".........",
    ".a.....~.",
    "......~~.",
    "..1......",
    ".121.....",
    ".........",
  ],
  teams: [
    {
      name: "Le héros et Lyra",
      side: "allies",
      fighters: [
        { preset: "@hero", at: { x: 3, y: 9 } },
        { preset: "lyra", at: { x: 4, y: 10 } },
      ],
    },
    {
      name: "Les Lacunaires",
      side: "enemies",
      fighters: [
        { preset: instable, at: { x: 1, y: 0 } },
        { preset: instable, at: { x: 4, y: 0 } },
        { preset: instable, at: { x: 7, y: 1 } },
        { preset: effilocheur, at: { x: 6, y: 0 } },
        // Reinforcements, in the three ticks the seam is held: 2 instables,
        // then a second effilocheur.
        { preset: instable, at: { x: 2, y: 0 }, arrives: { tick: 1 } },
        { preset: instable, at: { x: 7, y: 0 }, arrives: { tick: 1 } },
        { preset: effilocheur, at: { x: 5, y: 0 }, arrives: { tick: 2 } },
      ],
    },
  ],
  rules: {
    // The Lacune core: 5 silent cells (the butte and its neighbours); 9 when
    // the borders were kept badly (`zones_bords_froids` <= 1, see `rulesIf`).
    // Silent cells hurt whoever starts a turn there (the cold of the Lacune).
    silent: [
      { x: 4, y: 2 },
      { x: 3, y: 3 },
      { x: 4, y: 3 },
      { x: 5, y: 3 },
      { x: 4, y: 4 },
    ],
    // Lyra holds the seam: two Frange turns in a row (three when the borders
    // were lost), giving 10 % of her maximum health at each of her turns.
    // The clock only ticks; the 12 ticks are a safety net.
    clock: { period: 10, limit: 12, winner: null },
    reach: { team: 0, index: 1, cells: [{ x: 4, y: 3 }], ticks: 2 },
    sacrifice: { team: 0, index: 1, cells: [{ x: 4, y: 3 }], pct: 0.1 },
    fixOnDeath: [1],
    announce: true,
    // Réparation unlocks when Lyra reaches the seam.
    regions: { couture: [{ x: 4, y: 3 }] },
    lockedDivine: ["blessing"],
    unlockOnReach: [
      { divineId: "blessing", region: "couture", team: 0, preset: "lyra" },
    ],
  },
  rulesIf: [
    {
      needs: "zones_bords_froids<=1",
      rules: {
        silent: [2, 3, 4].flatMap((y) => [3, 4, 5].map((x) => ({ x, y }))),
        reach: { team: 0, index: 1, cells: [{ x: 4, y: 3 }], ticks: 3 },
      },
    },
  ],
  influences: ["earthquake", "timeWarp", "blessing"],
  startEnergy: 2,
  defeat: [
    set("defaite"),
    add("usure", 1),
    add("confiance.lyra", -1),
    set("lyra_echec"),
  ],
  objectives: [
    {
      id: "lyra-au-dessus",
      mark: "★",
      label: "Lyra ne doit pas tomber sous 50 % de ses PV",
      // At any time: the lowest share Lyra fell to, not only her last one.
      check: (r) => {
        const lyra = r.fighters.find((f) => f.preset === "lyra")
        if (!lyra || lyra.hp <= 0) return false
        return (r.lowest?.[lyra.id] ?? 1) >= 0.5
      },
      success: "Lyra a gardé de quoi donner au sol.",
      failure: "Lyra est arrivée trop vide.",
      onFailure: [set("lyra_echec")],
    },
    {
      id: "intrication-lyra",
      mark: "◆",
      label: "Une Intrication avec Lyra",
      check: (r) => r.intrications >= 1,
      success: "Les deux Échos ne faisaient plus tout à fait deux.",
      onSuccess: [add("confiance.lyra", 1)],
    },
    {
      id: "elan-pour-reparer",
      mark: "◆",
      label: "Garder cinq Élan pour la Réparation",
      check: (r) => (r.energy ?? 0) >= 5,
      onSuccess: [set("ghom_elan_5")],
    },
    {
      id: "sans-reparation",
      mark: "◆",
      label: "Finir la couture sans la Réparation du Ghom",
      check: (r) => (r.divineUsed.blessing ?? 0) === 0,
      success: "Le Ghom a laissé Lyra faire.",
      onSuccess: [set("sans_reparation")],
    },
  ],
  lines: [
    {
      when: "start",
      who: "lyra",
      text: "On ne part pas sur la même case, mais retiens : sur la même case, deux Échos ne font plus tout à fait deux. L'Intrication, c'est ça.",
    },
    {
      when: "start",
      who: "lyra",
      text: "Reste près. Si je tombe, ramasse-moi. Si tu tombes, je te ramasse. On verra qui se fatigue le premier.",
    },
    {
      when: "tick:1",
      who: "lyra",
      text: "Celui-là est vieux. Il a eu le temps de geler tout ce qu'il touche. Ne restez pas à côté de lui.",
    },
    {
      when: "intrication",
      who: "lyra",
      text: "Là. Sur la même case, on ne fait plus tout à fait deux. Garde ça.",
    },
    {
      when: "unlock:blessing",
      who: "lyra",
      text: "J'allume le feu ici. Ghom, si tu veux réparer, c'est maintenant, et ça se paiera ailleurs.",
    },
    {
      when: "heal",
      who: "lyra",
      text: "Je me vide. Ça va. Ça doit aller encore un peu.",
    },
    {
      when: "cast:blessing",
      who: "lyra",
      text: "De la vapeur, au loin. Voilà le prix de l'ordre qu'on vient de faire.",
    },
    { when: "end", who: "lyra", text: "Le sol est chaud. Il est chaud !" },
  ],
}

// ─── Chapter ────────────────────────────────────────────────────────────────

// ─── The island (the fight's wood, walked) ──────────────────────────────────

const ISLAND = fightCoeur.board
const zone = (x: number, y: number) => around(ISLAND, x, y)

export const ch02: Chapter = {
  id: "2",
  era: 1,
  number: 2,
  title: "Ce qui se répare",
  quote: {
    who: "lyra",
    text: "Une coupure se referme. La cicatrice, elle, reste. C'est la part que le temps garde pour lui.",
  },
  place:
    "La Baie grise, au nord des bords froids : un bois de bouleaux que le bord a commencé à défaire",
  question: {
    id: "Q02",
    text: "Peut-on réparer ce que le temps défait ?",
  },
  start: "baie",
  exploration: {
    // The fight's wood is the island: the edge of the birches in the south, the
    // Lacune and its hill in the middle, the pools to the east.
    island: ISLAND,
    start: { x: 4, y: 10 },
    companions: ["lyra"],
    influences: ["earthquake", "timeWarp", "blessing"],
    encounters: [
      {
        id: "baie",
        label: "La Baie grise",
        scene: "baie",
        at: { x: 4, y: 8 },
        zone: zone(4, 8),
      },
      {
        id: "main",
        label: "Avant d'entrer dans le bois",
        scene: "main",
        at: { x: 4, y: 6 },
        zone: zone(4, 6),
      },
      {
        id: "coeur",
        label: "Le bois qui se défait",
        scene: "coeur",
        at: { x: 4, y: 5 },
        auto: true,
      },
      {
        id: "couture",
        label: "Le cœur de la Lacune",
        scene: "couture",
        at: { x: 4, y: 3 },
        zone: zone(4, 3),
      },
      {
        id: "veillee",
        label: "Le feu, à l'orée du bois",
        scene: "veillee",
        at: { x: 7, y: 9 },
        zone: zone(7, 9),
      },
      {
        id: "ouest",
        label: "Le bord, vers l'ouest",
        scene: "ouest",
        at: { x: 0, y: 4 },
        zone: zone(0, 4),
      },
      {
        id: "oiseaux",
        label: "Les oiseaux qui se taisent",
        at: { x: 7, y: 2 },
        examine: {
          lines: [
            {
              text: "À l'orée, les oiseaux chantent. Ici, on en entend un seul, puis plus rien : le silence a gagné d'un arbre à l'autre, comme un gel.",
            },
          ],
          effects: [{ add: "ecoute", by: 1 }],
        },
      },
      {
        id: "mare",
        label: "Une mare lisse",
        at: { x: 7, y: 6 },
        examine: {
          lines: [
            {
              style: "stage",
              text: "Un caillou jeté dans la mare y trace une ride qui s'arrête net, à mi-chemin du bord, comme si l'eau avait oublié la suite.",
            },
          ],
          effects: [{ add: "ecoute", by: 1 }],
        },
      },
      {
        id: "sol_mou",
        label: "Le sol mou",
        at: { x: 2, y: 3 },
        examine: {
          lines: [
            {
              text: "Le sol, au bord de la clairière, est mou comme du pain trempé. Les pas s'y gardent un instant, puis le sol les rend à peine visibles.",
            },
          ],
          effects: [{ add: "ecoute", by: 1 }],
        },
      },
      {
        id: "bouleau",
        label: "Un bouleau qui hésite",
        at: { x: 6, y: 4 },
        obstacle: {
          influence: "blessing",
          before: [
            {
              style: "stage",
              text: "Un bouleau à demi net : d'un côté l'écorce blanche, de l'autre un tronc de brouillard. Il attend qu'on le décide.",
            },
          ],
          after: [
            {
              style: "stage",
              text: "L'écorce se referme d'un seul trait, nette jusqu'aux feuilles. Dans les mares, là-bas, de la vapeur se lève : l'ordre d'ici se paie de chaleur ailleurs.",
            },
          ],
          effects: [{ add: "ecoute", by: 1 }],
        },
      },
      {
        id: "errant",
        label: "Un Lacunaire isolé",
        at: { x: 7, y: 1 },
        wander: {
          preset: instable,
          title: "Un Lacunaire égaré",
          goal: "Le toucher pour qu'il se décide.",
          range: 2,
          radius: 4,
          effects: [{ add: "ecoute", by: 1 }],
          success:
            "Il s'est défait en une poignée de feuilles grises, qui se sont éteintes sur la mousse.",
        },
      },
    ],
  },
  scenes: {
    baie: {
      id: "baie",
      title: "La Baie grise",
      kind: "rencontre",
      setting: "Un bois de bouleaux, au nord.",
      beats: [
        stage(
          "Un bois de bouleaux, au nord. À l'orée, tout est normal : des feuilles neuves, des oiseaux. Plus on avance, plus le bois se tait. Au centre, une clairière qui n'en est pas une : un cercle d'une dizaine de pas où les troncs sont flous, comme dédoublés, où les feuilles ne bougent pas malgré le vent, où la lumière elle-même a l'air de passer sans rien toucher. Au-delà, le bord, et le Clair.",
        ),
        say(
          "lyra",
          "Il y a deux printemps, c'était un bois. L'an dernier, c'était un bois avec un trou. Cette année, c'est un trou avec un bois autour.",
        ),
        narr(
          "Les arbres du milieu ne sont pas morts. Ils ne sont pas vivants non plus. Ils ont l'air d'hésiter.",
        ),
        choice("baie", [
          opt("faire", "Qu'est-ce que tu vas faire ?", [
            say(
              "lyra",
              "Aller au milieu. Allumer du feu, verser de l'eau, marcher en rond, frotter des pierres, chanter faux. Tout ce qui fait qu'il se passe quelque chose. Et rester là jusqu'à ce que le sol se rappelle qu'il est un sol.",
            ),
          ]),
          opt("echec", "Et si ça ne marche pas ?", [
            say(
              "lyra",
              "Alors j'aurai eu froid pour rien. Ça m'est déjà arrivé.",
            ),
          ]),
          opt("cout", "Ça va te coûter quoi ?", [
            fx(add("confiance.lyra", 1)),
            stage(
              "Lyra le regarde, surprise qu'on pose la question avant elle.",
            ),
            say(
              "lyra",
              "Ma chaleur. Mes forces. Un peu de moi qui ne reviendra pas. Tout ce qu'on met dans un endroit, on le prend quelque part. Moi, je le prends en moi. C'est ce que j'ai sous la main.",
            ),
          ]),
        ]),
      ],
      next: "main",
    },

    main: {
      id: "main",
      title: "La main",
      kind: "rencontre",
      setting: "Avant d'entrer dans le bois.",
      beats: [
        stage(
          "Avant d'entrer dans le bois, Lyra s'arrête. Elle prend le poignet du héros, et le place sur la même case qu'elle.",
        ),
        say("lyra", "Reste près. Plus près que ça. Là."),
        say(
          "lyra",
          "Tu sens ? Quand on est vraiment près, on n'est plus tout à fait deux. Ce que tu fais, je le fais un peu. Ce que je fais, tu le fais un peu. Ça ne dure pas : dès qu'on s'écarte, chacun redevient soi.",
        ),
        choice("main", [
          opt("comment", "Comment ça marche ?", [
            say(
              "lyra",
              "Je n'en sais rien. Ma mère disait que c'est parce qu'on vient des bords, nous autres, et que les bords nous ont appris des choses bizarres. Je crois surtout qu'on n'a pas besoin de savoir comment marche une main pour la tenir.",
            ),
          ]),
          opt("agreable", "C'est agréable.", [
            say(
              "lyra",
              "C'est utile. Que ce soit agréable en plus, je ne m'en plains pas.",
            ),
            stage("Elle sourit."),
          ]),
          opt("ghom", "Et le Ghom ? Il est près de nous, lui aussi ?", [
            say(
              "lyra",
              "Le Ghom est près de tout, si j'en crois Demeure. Mais lui, je ne peux pas lui prendre la main.",
            ),
          ]),
        ]),
        hint(
          "Intrication",
          "Deux Échos sur la même case agissent comme un seul système : chacun gagne une version combinée de son action principale, selon l'affinité de l'autre. L'Intrication ajoute un tour de recharge.",
        ),
        fx(unlock("mechanic:intrication")),
      ],
      next: "coeur",
    },

    coeur: {
      id: "coeur",
      title: "Jusqu'au cœur",
      kind: "combat",
      setting: "Le bois de la Baie grise",
      beats: [
        { t: "fight", fight: fightCoeur },
        when(is("defaite"), [
          stage(
            "Lyra tombe à trois pas de la butte, les genoux dans la mousse grise. Les Lacunaires du bois, n'ayant plus rien de chaud à suivre, s'immobilisent. Elle n'a pas la force de se relever. Le héros la ramène par les épaules, hors du flou, dans l'air net où elle reprend peu à peu son souffle.",
          ),
          say(
            "lyra",
            "Je suis arrivée trop vide. C'est tout. Il n'y a rien à rattraper là-dedans.",
          ),
          stage(
            "Derrière eux, la Lacune n'est pas recousue. Le bois reculera encore, un tronc après l'autre. Lyra regarde ses mains : le gris a gagné jusqu'à la deuxième phalange, à force d'avoir donné.",
          ),
          say("lyra", "Ça se refermera ailleurs. Pas ici. Pas cette année."),
          fx(
            add("lacunes.elargies", 1),
            set("lyra_usure"),
            unlock("influence:repair"),
            set("defaite", false),
          ),
          go("veillee"),
        ]),
      ],
      next: "couture",
    },

    couture: {
      id: "couture",
      title: "La couture",
      kind: "lacune",
      setting: "Au cœur de la Lacune",
      beats: [
        stage(
          "Lyra a atteint le cœur de la Lacune et y a tenu. Ou presque. Elle est à genoux près d'un feu minuscule, les mains dans la terre. Autour d'elle, le flou recule, centimètre par centimètre : un tronc redevient net, une feuille se met à trembler dans le vent. Mais le bord de la Lacune, du côté du Clair, résiste encore.",
        ),
        say(
          "lyra",
          "(le souffle court) Encore un peu. Il manque… un peu. Je n'ai plus beaucoup.",
        ),
        when(is("lyra_echec"), [
          say("lyra", "Je n'ai plus assez. Je suis arrivée trop vide."),
        ]),
        choice("couture", [
          opt("chaleur", "Prends ma chaleur.", [
            stage(
              "Le héros s'agenouille sur la même case, en Intrication, et pose les mains dans la terre à côté des siennes.",
            ),
            fx(
              add("lacunes.recousues", 1),
              add("usure", 1),
              add("confiance.lyra", 2),
              add("confiance", 1),
              set("lyra_chaleur"),
            ),
            stage(
              "La lumière change, imperceptiblement. Le flou se resserre et disparaît. Le héros sent le froid lui remonter dans les bras jusqu'aux épaules, puis s'en aller, mais pas tout à fait : il en reste dans ses doigts.",
            ),
            say("lyra", "Idiot."),
            stage("Un temps."),
            say("lyra", "Merci."),
          ]),
          opt("arrete", "Arrête. Tu t'épuises.", [
            fx(add("lacunes.elargies", 1), add("confiance.lyra", 1)),
            stage(
              "Lyra hésite longtemps. Puis elle retire ses mains de la terre. Le flou revient, doucement, comme une marée.",
            ),
            say(
              "lyra",
              "Tu as raison. Je déteste quand on a raison à ma place.",
            ),
            stage("Elle regarde le bois."),
            say(
              "lyra",
              "Le printemps prochain, il n'y aura plus de bois. Il y aura moi, vivante. Je ne sais pas ce qui vaut le plus.",
            ),
          ]),
          opt(
            "seule",
            "Laisser Lyra finir seule.",
            [
              fx(add("lacunes.recousues", 1), set("lyra_usure")),
              stage(
                "Lyra pousse un dernier souffle sur le feu. Le flou se referme. Elle reste à genoux, longtemps, les mains dans la terre réchauffée.",
              ),
              say("lyra", "Voilà. Voilà, c'est fait."),
            ],
            isnt("lyra_echec"),
          ),
          // Offered when the Ghom ended the fight with five Élan.
          opt(
            "ghom",
            "Le Ghom répare.",
            [
              fx(add("lacunes.recousues", 1), add("confiance.lyra", 1)),
              stage(
                "L'air se tend au-dessus du bois. Un flux de chaleur converge vers le cœur de la Lacune, depuis tout le bois à la fois, et le flou s'éteint d'un coup. Puis, tout autour, de la vapeur monte : du lac au sud, des mares, de la rosée des feuilles. Le bois fume comme un cheval après la course.",
              ),
              say("lyra", "Ton Ghom a payé."),
              stage("Elle montre la vapeur."),
              say(
                "lyra",
                "Regarde : c'est la facture. On ne crée pas d'ordre ici sans jeter du désordre là. Même lui. Surtout lui, peut-être.",
              ),
              fx(unlock("influence:repair")),
            ],
            is("ghom_elan_5"),
          ),
        ]),
        // Note: the Réparation creates order here and pays in disorder elsewhere
        // (second principle): never a miracle.
      ],
      next: "veillee",
    },

    veillee: {
      id: "veillee",
      title: "Ce qui reste",
      kind: "veillee",
      setting: "Le soir, à l'orée du bois.",
      beats: [
        stage(
          "Le soir, à l'orée du bois. Lyra a les mains enveloppées dans un linge humide. Quand elle les découvre pour les tremper dans l'eau froide, le héros voit qu'au bout de son index gauche, la peau est devenue grise, lisse, sans plis, comme une pierre polie. Elle ne la cache pas.",
        ),
        say("lyra", "Ça ne repartira pas."),
        when(is("lyra_usure"), [
          stage("Elle a les deux mains grises jusqu'à la deuxième phalange."),
        ]),
        hub("veillee", [
          topic("soigner", "Tu peux te soigner, non ?", [
            say(
              "lyra",
              "Je peux refermer. Je ne peux pas rendre. Une coupure se referme ; la cicatrice reste. Un verre tombé, on recolle les morceaux, mais on voit toujours la ligne. Quelque chose est parti pour de bon, de la chaleur, de l'ordre, je ne sais pas comment l'appeler. Ça s'est éparpillé. Ça ne revient pas en arrière tout seul.",
            ),
            say(
              "lyra",
              "À Demeure, on appelle ça l'Usure. Ils en ont peur, c'est pour ça qu'ils ne bougent plus. Comme si rester assis empêchait de s'user.",
            ),
            stage("Elle rit."),
            say("lyra", "Les chaises s'usent aussi."),
          ]),
          topic("mal", "Ça te fait mal ?", [
            fx(add("confiance.lyra", 1)),
            say(
              "lyra",
              "Non. C'est ça qui est bizarre. Ça ne fait rien. C'est juste… moins moi.",
            ),
          ]),
          topic(
            "paresse",
            "(Lyra repense au combat)",
            [
              say(
                "lyra",
                "Ton Ghom m'a laissée faire. Je ne sais pas si c'est de la confiance ou de la paresse.",
              ),
            ],
            { if: is("sans_reparation") },
          ),
        ]),
        when(is("lyra_chaleur"), [
          say("lyra", "Montre tes mains."),
          stage(
            "Au bout des doigts du héros, une fine ligne grise, à peine visible. Lyra la touche du pouce.",
          ),
          say(
            "lyra",
            "Toi aussi, maintenant. Le temps t'a pris quelque chose, pour la première fois. Bienvenue.",
          ),
          stage("Un temps."),
          say("lyra", "Ne le refais pas trop souvent. Tu n'as que dix doigts."),
          narr(
            "C'est presque rien. Une ligne. Mais je sais que demain, elle sera encore là. Et après-demain. C'est la première chose de moi qui durera.",
          ),
          fx(give("trait:bouts-gris")),
        ]),
        stage(
          "Lyra tend la main vers le Carnet d'écorce du héros, qui se défait par les bords. Elle sort son aiguille d'os.",
        ),
        say(
          "lyra",
          "Donne. Ça, au moins, je peux le recoudre sans y laisser un doigt.",
        ),
        stage(
          "Elle coud les feuillets d'écorce avec un fil de lin, en silence. Puis elle le rend.",
        ),
        fx(give("objet:carnet-recousu"), give("habit:mitaines-de-lin")),
        say(
          "lyra",
          "Écris quelque chose pour moi. Une question. J'en ai une depuis longtemps et je ne sais pas où la mettre.",
        ),
        choice("question", [
          opt("dis-la", "Dis-la.", [fx(add("confiance.lyra", 1))]),
          opt("laquelle", "Laquelle ?"),
        ]),
        say("lyra", "Peut-on réparer ce que le temps défait ?"),
        fx(set("carnet.Q02", "ouverte")),
        stage("Le héros l'écrit. Lyra regarde la page longtemps."),
        say(
          "lyra",
          "Je ne sais pas. Je ne crois pas. Je crois qu'on peut réparer ici, en défaisant un peu là-bas. Ma chaleur dans la terre. La vapeur de ton Ghom au-dessus du lac. Mais réparer pour de vrai, que tout redevienne comme avant, comme si rien ne s'était passé…",
        ),
        stage("Elle replie ses doigts gris."),
        say(
          "lyra",
          "Non. Je ne crois pas. Garde-la quand même. Je peux me tromper. J'aimerais me tromper.",
        ),
      ],
      next: "ouest",
    },

    ouest: {
      id: "ouest",
      title: "Vers l'ouest",
      kind: "fin",
      setting: "L'aube.",
      beats: [
        stage(
          "L'aube. Lyra dort encore, enroulée dans son manteau. Le héros est éveillé. Le long du bord, une file de Lacunaires glisse vers l'ouest, sans s'arrêter aux bois, sans s'arrêter aux mares. Une dizaine. Ils ne cherchent pas la chaleur : ils vont vers quelque chose de froid.",
        ),
        stage("Le héros réveille Lyra. Elle regarde longtemps."),
        say("lyra", "Ils vont vers Demeure."),
        stage("Un temps."),
        say(
          "lyra",
          "Non. Ce n'est pas eux. C'est le bord. Le bord va vers Demeure. Ils ne font que le suivre.",
        ),
        choice("ouest", [
          opt("pourquoi", "Pourquoi Demeure ?", [
            say(
              "lyra",
              "Parce que là-bas, il ne se passe plus rien depuis vingt hivers. Et que le bord adore les endroits où il ne se passe rien.",
            ),
          ]),
          opt("on-y-va", "On y va.", [
            fx(add("confiance.lyra", 1)),
            say("lyra", "On y va."),
            stage(
              "Elle se lève, ramasse son sac, et ajoute sans se retourner :",
            ),
            say(
              "lyra",
              "Mon frère va être furieux de me voir. Ça va lui faire du bien.",
            ),
          ]),
        ]),
        go(END),
      ],
    },
  },
}
