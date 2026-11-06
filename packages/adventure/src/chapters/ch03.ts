import type { CharacterPreset } from "@realms/engine"
import {
  add,
  around,
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
  opt,
  redirect,
  say,
  set,
  stage,
  topic,
  unlock,
  when,
} from "../dsl"
import { type Chapter, END, type FightSpec } from "../types"

// ─── Actors of the fight (local copies) ─────────────────────────────────────

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

/** A villager who sits: health 5, no action. */
const assis: CharacterPreset = {
  id: "assis",
  name: "Un Assis",
  title: "Villageois de Demeure",
  affinity: "strength",
  stats: {
    health: 5,
    speed: 3.5,
    physicalAttack: 1,
    physicalDefense: 1,
    magicalAttack: 1,
    magicalDefense: 1,
    luck: 1,
  },
  actions: [],
}

// ─── Fight: La nuit du grenier ──────────────────────────────────────────────

const fightNuit: FightSpec = {
  id: "ch3-nuit-du-grenier",
  title: "La nuit du grenier",
  goal: "Les Lacunaires sortent du grenier, à l'intérieur des murs. Protégez les Assis, et laissez partir ceux qui fuient.",
  board: [
    "333.33333",
    "3221....3",
    "3221....3",
    "3....a..3",
    "3.......3",
    "3.......3",
    "3..~....3",
    "3.......3",
    "3333.3333",
  ],
  teams: [
    {
      name: "Le héros, Lyra et Brutus",
      side: "allies",
      fighters: [
        { preset: "@hero", at: { x: 4, y: 7 } },
        { preset: "lyra", at: { x: 5, y: 7 } },
        { preset: "brutus", at: { x: 4, y: 6 } },
      ],
    },
    {
      name: "Les Lacunaires",
      side: "enemies",
      fighters: [
        // They come out of the granary: cells next to its block.
        { preset: instable, at: { x: 3, y: 1 } },
        { preset: instable, at: { x: 3, y: 2 } },
        { preset: instable, at: { x: 1, y: 3 } },
        { preset: instable, at: { x: 2, y: 3 } },
        { preset: effilocheur, at: { x: 3, y: 3 } },
        // 2 more instables out of the granary at turn 5 (about time 40).
        { preset: instable, at: { x: 2, y: 2 }, arrives: { time: 40 } },
        { preset: instable, at: { x: 1, y: 2 }, arrives: { time: 40 } },
      ],
    },
    {
      name: "Les Assis",
      side: "neutral",
      fighters: [
        { preset: assis, at: { x: 4, y: 4 } },
        { preset: assis, at: { x: 5, y: 5 } },
        { preset: assis, at: { x: 3, y: 5 } },
      ],
    },
  ],
  rules: {
    neutral: [2],
    // The two doors; SIMPLIFIED: not "every cell of the map border" (the wall
    // is impassable anyway).
    flee: {
      team: 1,
      below: 0.5,
      exits: [
        { x: 3, y: 0 },
        { x: 4, y: 8 },
      ],
    },
    fixOnDeath: [1],
    // CUT: the effilocheur's cold halo around the Assis at tour 3 (no moving
    // silent cells).
    announce: true,
  },
  influences: ["earthquake", "timeWarp", "blessing"],
  startEnergy: 3,
  defeat: [
    set("defaite"),
    add("usure", 1),
    add("confiance", -1),
    add("confiance.brutus", -2),
  ],
  objectives: [
    {
      id: "laisser-partir",
      mark: "★",
      label: "Laisser partir ceux qui fuient",
      // SIMPLIFIED: the report cannot tell a fixed fugitive from a fixed
      // fighter: we count the Lacunaires that fled (n), the bonus asks for two.
      check: (r) => {
        const n = r.fighters.filter((f) => f.team === 1 && f.fled).length
        return { ok: n >= 1, n }
      },
      success: "Ceux qui partaient sont partis.",
      failure: "Personne n'a pu s'en aller.",
      onSuccess: [{ add: "lacunaires.epargnes", by: 1, perUnit: true }],
    },
    {
      id: "epargne-plusieurs",
      mark: "★",
      label: "Épargner au moins deux fuyards",
      check: (r) =>
        r.fighters.filter((f) => f.team === 1 && f.fled).length >= 2,
      success: "Ce qui s'en va n'a pas besoin d'être brisé.",
      onSuccess: [add("confiance", 1), add("confiance.lyra", 1)],
    },
    {
      id: "proteger-assis",
      mark: "★",
      label: "Protéger les Assis",
      check: (r) => {
        const n = r.fighters.filter((f) => f.team === 2 && f.hp <= 0).length
        return { ok: n === 0, n }
      },
      success: "Aucun villageois n'est tombé de froid.",
      failure: "Un villageois est tombé de froid.",
      onSuccess: [add("confiance.brutus", 2)],
      onFailure: [{ add: "confiance.brutus", by: -1, perUnit: true }],
    },
    {
      id: "sol-de-brutus",
      mark: "◆",
      label: "Ne pas toucher au sol de Brutus",
      check: (r) => {
        const brutus = r.fighters.find((f) => f.preset === "brutus")
        return !r.divineNearAlly.some((d) => d.fighterId === brutus?.id)
      },
      success: "Le Ghom n'a rien secoué sous les pieds de Brutus.",
      onSuccess: [add("confiance.brutus", 1)],
    },
    // CUT: ◆ "Le mur reste entier" (no way to read a Séisme on a wall cell).
  ],
  lines: [
    {
      when: "start",
      who: "brutus",
      text: "Ils sont à l'intérieur. Comment… Ils sont à l'intérieur !",
    },
    {
      when: "start",
      who: "lyra",
      text: "Le grenier, Brutus. Ils viennent du grenier.",
    },
    {
      when: "fleeing",
      who: "lyra",
      text: "Celui-là s'en va. Laisse-le partir. Ce qui s'en va n'a pas besoin d'être brisé.",
    },
    // CUT: lines on a fixed fugitive, Brutus guarding an Assis, Distorsion on
    // Brutus, wall breach and shield knockout (no matching triggers).
    {
      when: "end",
      who: "brutus",
      text: "Ils sont partis. Par les portes. Par mes portes.",
    },
  ],
}

// ─── Chapter ────────────────────────────────────────────────────────────────

// ─── The island (Demeure and the fields at its gate, walked) ────────────────

// The fight's village (walls 3, the granary block NW, doors N and S) with the
// fields outside it, and a stair up the east wall to the chemin de ronde.
const ISLAND = [
  "333.33333",
  "3221....3",
  "3221....3",
  "3....a..3",
  "3.......1",
  "3.......2",
  "3..~....3",
  "3.......3",
  "3333.3333",
  ".........",
  "..1...1..",
  ".........",
]
const zone = (x: number, y: number) => around(ISLAND, x, y)

export const ch03: Chapter = {
  id: "3",
  era: 1,
  number: 3,
  title: "Le village immobile",
  quote: {
    who: "doyenne",
    text: "Tout ce qui change se perd. Assieds-toi, voyageur. Ici, tu ne te perdras pas.",
  },
  place:
    "Demeure, le village immobile, à l'ouest de l'île ; son mur, sa place, son grenier scellé",
  question: {
    id: "Q03",
    text: "Si tout est fixé, sommes-nous encore vivants ?",
  },
  start: "mur",
  exploration: {
    island: ISLAND,
    start: { x: 4, y: 11 },
    // Brutus joins at the very end: he follows only once he is in the team.
    companions: ["lyra", "brutus"],
    influences: ["earthquake", "timeWarp", "blessing"],
    encounters: [
      {
        id: "mur",
        label: "Brutus, devant la porte",
        scene: "mur",
        at: { x: 3, y: 9 },
        actor: "brutus",
      },
      {
        id: "doyenne",
        label: "La place de Demeure",
        scene: "doyenne",
        at: { x: 4, y: 5 },
        zone: zone(4, 5),
      },
      {
        id: "pim",
        label: "Derrière la maison commune",
        scene: "pim",
        at: { x: 6, y: 2 },
        zone: zone(6, 2),
      },
      {
        id: "surmur",
        label: "Le chemin de ronde",
        scene: "surmur",
        at: { x: 8, y: 6 },
        zone: zone(8, 6),
      },
      {
        id: "nuit",
        label: "Demeure, de nuit",
        scene: "nuit",
        at: { x: 4, y: 4 },
        auto: true,
      },
      {
        id: "grenier",
        label: "Le grenier scellé",
        scene: "grenier",
        at: { x: 3, y: 1 },
        zone: zone(3, 1),
      },
      {
        id: "place",
        label: "La place, à l'aube",
        scene: "place",
        at: { x: 4, y: 5 },
        zone: zone(4, 5),
      },
      {
        id: "puits",
        label: "Le puits du village",
        at: { x: 3, y: 6 },
        examine: {
          lines: [
            {
              style: "stage",
              text: "Une copie de la Borne est gravée sur la margelle : les lettres du haut sont nettes et fraîches, celles du bas usées par les mains.",
            },
          ],
          effects: [{ add: "ecoute", by: 1 }],
        },
      },
      {
        id: "bancs",
        label: "Les bancs de pierre",
        at: { x: 2, y: 5 },
        examine: {
          lines: [
            {
              text: "Les bancs sont polis par des années d'attente. Au bout de chacun, la pierre est creusée juste à la forme d'une main.",
            },
          ],
          effects: [{ add: "ecoute", by: 1 }],
        },
      },
      {
        id: "friche",
        label: "Les champs en friche",
        at: { x: 0, y: 11 },
        examine: {
          lines: [
            {
              style: "stage",
              text: "Des herbes sèches, hautes jusqu'à la taille, et des sillons effacés : plus personne n'a retourné cette terre depuis longtemps. Elle n'a pourtant rien d'un sol mort.",
            },
          ],
          effects: [{ add: "ecoute", by: 1 }],
        },
      },
      {
        id: "clepsydre",
        label: "Une clepsydre arrêtée",
        at: { x: 6, y: 5 },
        obstacle: {
          influence: "timeWarp",
          before: [
            {
              style: "stage",
              text: "Une clepsydre de pierre, devant la maison commune. Sa dernière goutte est suspendue au bec, depuis si longtemps qu'un lichen la contourne.",
            },
          ],
          after: [
            {
              style: "stage",
              text: "Le temps glisse d'un cran. La goutte tombe, et la pierre en dessous, sèche depuis des années, devient sombre.",
            },
          ],
          effects: [{ add: "ecoute", by: 1 }],
        },
      },
      {
        id: "pave",
        label: "Un pavé scellé",
        at: { x: 5, y: 7 },
        obstacle: {
          influence: "earthquake",
          before: [
            {
              style: "stage",
              text: "Un pavé de la place, scellé au mortier : ses voisins sont rejointoyés à neuf, lui est resté tel quel. Quelque chose pousse en dessous, qui n'a pas la place.",
            },
          ],
          after: [
            {
              style: "stage",
              text: "Le sol tressaille, le mortier cède. Entre les pavés, une pousse verte jaillit, dérisoire, droite. Personne ne l'avait vue venir.",
            },
          ],
          effects: [{ add: "ecoute", by: 1 }],
        },
      },
      {
        id: "errant",
        label: "Un Lacunaire isolé",
        at: { x: 7, y: 10 },
        wander: {
          preset: instable,
          title: "Un Lacunaire égaré",
          goal: "Le toucher pour qu'il se décide.",
          range: 2,
          radius: 4,
          effects: [{ add: "ecoute", by: 1 }],
          success:
            "Il s'est défait en poussière grise dans les herbes sèches. La brise l'a emporté sans bruit.",
        },
      },
    ],
  },
  scenes: {
    mur: {
      id: "mur",
      title: "Le mur",
      kind: "rencontre",
      setting: "Aux portes de Demeure.",
      beats: [
        stage(
          "Une colline de pierres, puis une vallée. Les champs sont en friche depuis longtemps : de hautes herbes sèches, des sillons effacés. Au centre, Demeure : des maisons de pierre sèche aux toits de lauze, serrées les unes contre les autres, et autour, un mur parfait. Pas une pierre ne manque, pas un joint n'est fendu. Un homme massif, un bouclier rond sur le dos, est en train d'y remettre en place un caillou tombé, avec la délicatesse d'un horloger.",
        ),
        say("brutus", "Halte."),
        stage(
          "Il voit Lyra. Il pose le caillou. Il ne dit rien pendant un long moment.",
        ),
        say("brutus", "Tu as abîmé la Borne."),
        say("lyra", "J'ai corrigé la Borne."),
        say("brutus", "On n'a jamais réussi à effacer."),
        say("lyra", "Je sais. J'ai gravé profond."),
        stage("Un temps. Brutus regarde le héros."),
        say("brutus", "Lui."),
        say(
          "lyra",
          "Lui, il m'aide. Il ne sait pas d'où il vient, il n'a pas de nom et il se met entre moi et les Lacunaires. Ça me suffit.",
        ),
        choice("mur", [
          opt("bonjour", "Bonjour.", [
            say("brutus", "… Bonjour."),
            stage("Il semble désarçonné qu'on le salue."),
          ]),
          opt("beau", "Ton mur est très beau.", [
            fx(add("confiance.brutus", 1)),
            say("brutus", "Il est entier. C'est mieux que beau."),
          ]),
          opt("bord", "Le bord vient vers vous.", [
            say("brutus", "Le mur tiendra."),
            stage("Il se remet au travail."),
            say("brutus", "Le mur tient toujours."),
          ]),
        ]),
        narr(
          "Il y a quelque chose d'étrange. Tout le village est immobile, sauf lui. Il est le seul à bouger, et il bouge pour que rien ne bouge.",
        ),
      ],
      next: "doyenne",
    },

    // SIMPLIFIED: nodes 2 and 3 are played in this order only (the doc allows
    // the reverse).
    doyenne: {
      id: "doyenne",
      title: "La Doyenne",
      kind: "rencontre",
      setting: "La place de Demeure.",
      beats: [
        stage(
          "La place de Demeure. Une dizaine de villageois sont assis sur des bancs de pierre, devant leurs portes, les mains sur les genoux. Ils ne parlent presque pas. Ils ne sont pas tristes : ils sont calmes, d'un calme poli et un peu absent. Au centre, sur un siège plus haut, une vieille femme au visage très lisse, enveloppée de châles. La Doyenne Hesta.",
        ),
        say("doyenne", "Lyra. Tu es revenue. Assieds-toi."),
        say(
          "lyra",
          "Non merci, Doyenne. Je suis venue vous dire que le bord arrive.",
        ),
        say(
          "doyenne",
          "Le Repos arrive, tu veux dire. Il est écrit sur la Borne.",
        ),
        stage("Un sourire."),
        say("doyenne", "Celle que tu as rayée."),
        stage("Elle se tourne vers le héros."),
        say(
          "doyenne",
          "Et toi, voyageur. Tu portes une écorce où tu écris des choses. Lyra me l'a toujours dit : écrire, c'est changer le bois. Mais je ne suis pas sévère. Que demandes-tu ?",
        ),
        stage(
          "Le héros ouvre le Carnet à la première page. Hesta lit à voix haute.",
        ),
        say("doyenne", "Pourquoi suis-je là ?"),
        stage("Elle sourit, sans moquerie."),
        say(
          "doyenne",
          "Oh, mais c'est simple, voyageur. Parce que le Ghom t'a voulu. Le Ghom ne bouge pas : il est au-delà du temps. Tout ce qui est, il l'a voulu une fois pour toutes. Toi aussi. Tu n'as rien à chercher. Assieds-toi, et tu le sentiras.",
        ),
        choice("q00", [
          opt("accepte", "Tu as raison. Le Ghom m'a voulu.", [
            fx(set("carnet.Q00", "fausse")),
            stage(
              "Le héros écrit la réponse sous la question. Hesta hoche la tête, satisfaite.",
            ),
            narr("C'est une réponse. Elle est douce. Elle ne me demande rien."),
            stage("Lyra détourne les yeux."),
          ]),
          opt("comment", "Comment le sais-tu ?", [
            say(
              "doyenne",
              "On ne sait pas ces choses-là, voyageur. On les garde.",
            ),
            narr(
              "Elle ne le sait pas. Elle le garde. Ce n'est pas la même chose. Je ne l'écris pas.",
            ),
          ]),
          opt("touche", "Le Ghom m'a touché. Il a bougé.", [
            fx(add("confiance.lyra", 1)),
            stage("Un murmure sur les bancs, le premier bruit de la place."),
            say("doyenne", "Alors ce n'était pas le Ghom."),
            stage("Elle ne cesse pas de sourire."),
            say("doyenne", "Le Ghom ne touche pas. Il est."),
            narr(
              "Ça m'a touché. Je le sais comme je sais que j'ai froid. Mais je ne sais pas ce que c'était. La Doyenne non plus.",
            ),
          ]),
        ]),
        stage("Avant de partir, le héros peut demander :"),
        choice("borne", [
          opt("borne", "La Borne a été écrite quand ?", [
            say(
              "doyenne",
              "Au premier hiver. Et personne n'y a rien ajouté. Sauf Lyra.",
            ),
            stage(
              "Une copie de la Borne est gravée sur le puits du village : les lettres du haut sont nettes et fraîches, celles du bas usées.",
            ),
            narr(
              "On l'a regravée. Plusieurs fois. Même ici, pour que rien ne change, il faut que quelqu'un change la pierre.",
            ),
          ]),
          opt("partir", "Rien d'autre."),
        ]),
      ],
      next: "pim",
    },

    pim: {
      id: "pim",
      title: "Pim",
      kind: "rencontre",
      setting: "Derrière la maison commune.",
      beats: [
        stage(
          "Derrière la maison commune, un enfant de huit ou neuf ans, assis comme les adultes, mais qui ne tient pas en place : il fait tourner un caillou dans ses doigts, s'arrête quand un adulte passe, recommence. Pim.",
        ),
        say("pim", "T'es le voyageur ? Tu bouges beaucoup, toi."),
        choice("pim1", [
          opt("toi-aussi", "Oui. Toi aussi, un peu.", [
            stage("Il cache le caillou."),
            say("pim", "Faut pas le dire."),
          ]),
          opt("ennui", "Tu as l'air de t'ennuyer.", [
            say("pim", "On s'ennuie pas, à Demeure. On dure."),
            stage("Il récite."),
            say("pim", "… Ça veut dire pareil, je crois."),
          ]),
        ]),
        say(
          "pim",
          "Ma grand-mère, elle dit que si on bouge plus du tout, on dure toujours. Comme le Ghom. Mais moi, je grandis. J'y peux rien, je grandis quand même. L'année dernière, mon banc était trop haut. Maintenant mes pieds touchent par terre.",
        ),
        say(
          "pim",
          "Alors je fais mal ? Ou alors c'est ma grand-mère qui se trompe ? Ou alors…",
        ),
        stage("Il baisse la voix."),
        say(
          "pim",
          "Si tout le monde arrête vraiment de bouger, on est encore vivants, ou pas ?",
        ),
        stage("Le héros ouvre le Carnet."),
        choice("pim2", [
          opt("cherchera", "Je vais l'écrire. On cherchera.", [
            fx(set("carnet.Q03", "ouverte"), add("confiance", 1)),
          ]),
          opt("sais-pas", "Je ne sais pas. Je vais l'écrire.", [
            fx(set("carnet.Q03", "ouverte")),
          ]),
        ]),
        stage(
          "La question s'écrit : Si tout est fixé, sommes-nous encore vivants ?",
        ),
        say("pim", "Tu me diras, si tu trouves ?"),
        choice("pim3", [
          opt("promis", "Promis.", [fx(set("pim_promesse"))]),
          opt("si-trouve", "Si je trouve."),
        ]),
      ],
      next: "surmur",
    },

    surmur: {
      id: "surmur",
      title: "Sur le mur",
      kind: "veillee",
      setting: "Le chemin de ronde, le soir.",
      beats: [
        stage(
          "Le soir. Lyra et le héros ont rejoint Brutus sur le chemin de ronde. En bas, le village dort, ou fait semblant. Brutus regarde la plaine. Il n'a pas posé son bouclier.",
        ),
        say("brutus", "Ton ami."),
        stage("À Lyra, du menton vers le héros."),
        say("brutus", "Il a quelque chose qui le suit."),
        say("lyra", "Le Ghom."),
        say("brutus", "Le Ghom ne suit personne."),
        say(
          "lyra",
          "Celui-là, si. Il a sorti un rocher de terre devant moi. Il a fait monter de la vapeur de tout un bois.",
        ),
        stage(
          "Brutus se tourne vers le héros, pour la première fois vraiment.",
        ),
        say(
          "brutus",
          "Écoute. Ce qui te suit. S'il me touche, je le saurai. S'il secoue le sol sous mes pieds, je le saurai. S'il tord mon temps sans me prévenir, je le saurai.",
        ),
        stage("Un temps."),
        say(
          "brutus",
          "Je ne dis pas que je partirai. Je dis que je le saurai.",
        ),
        fx(unlock("ui:confiance")),
        hint(
          "Confiance",
          "Ce que chaque Écho pense du Ghom et de toi. Elle monte quand on protège, épargne, écoute, respecte un refus. Elle baisse quand on sacrifie, qu'on ignore, ou que le Ghom agit sur ses propres Échos.",
        ),
        when(is("seisme_pres_lyra"), [
          say(
            "lyra",
            "Il a déjà secoué le sol sous mes pieds, une fois. Je n'ai pas aimé.",
          ),
          say("brutus", "Voilà."),
        ]),
        hub("surmur", [
          topic("mur", "Le mur", [
            say(
              "brutus",
              "Je l'entretiens depuis douze hivers. Chaque pierre. Une pierre tombe, je la remets. Un joint s'ouvre, je le bouche.",
            ),
            choice("mur-sujet", [
              opt("reste", "Et le reste du village ?", [
                say("brutus", "Le reste ne bouge pas. Ça ne s'use pas."),
                say(
                  "lyra",
                  "Tout s'use, Brutus. Les bancs. Les toits. La Doyenne.",
                ),
                say("brutus", "… Moins vite."),
              ]),
              opt("seul", "Tu es le seul à travailler, ici.", [
                fx(add("confiance.brutus", 1)),
                say(
                  "brutus",
                  "Quelqu'un doit garder. Pour que les autres puissent ne rien faire.",
                ),
                stage("Il entend sa propre phrase."),
                say("brutus", "Dit comme ça."),
              ]),
            ]),
          ]),
          topic("lyra", "Lyra", [
            say(
              "brutus",
              "On est nés dans la même maison. Pas la même lignée : elle chez les Soigneuses, moi chez les Gardiens. Mais la même maison. Elle réparait les oiseaux tombés. Moi je gardais la porte pour qu'ils ne repartent pas.",
            ),
            say(
              "lyra",
              "Il les gardait si bien qu'ils mouraient de vieillesse dans la cuisine.",
            ),
            say("brutus", "Ils étaient en sécurité."),
            say("lyra", "Ils étaient dans une cuisine."),
            choice("lyra-sujet", [
              opt("rire", "Rire.", [
                fx(add("confiance.lyra", 1), add("confiance.brutus", 1)),
              ]),
              opt("ressemblez", "Vous vous ressemblez.", [
                stage("Ils se regardent, outrés, en même temps."),
              ]),
            ]),
          ]),
          topic(
            "ciel",
            "Le ciel",
            [
              stage(
                "Brutus montre le ciel, à l'est. Parmi les Fragments lointains, minuscules et fixes, il y en a un qui est plus gros que les autres : une île, nettement visible, sombre, avec des reflets froids.",
              ),
              say("brutus", "Celle-là. Elle grossit. Chaque nuit un peu."),
              say("lyra", "Elle n'était pas là l'an dernier."),
              say(
                "brutus",
                "Si. Plus petite. Je l'ai dit à la Doyenne. Elle a dit que les étoiles ne bougent pas.",
              ),
              narr(
                "Ce n'est pas une étoile. C'est une île. Elle vient vers nous, ou nous allons vers elle. Ici, tout le monde est assis. Et l'île entière dérive.",
              ),
            ],
            { last: true },
          ),
        ]),
      ],
      next: "nuit",
    },

    nuit: {
      id: "nuit",
      title: "La nuit du grenier",
      kind: "combat",
      setting: "Demeure, de nuit",
      beats: [
        stage(
          "Dans la nuit, quelque chose se fend. Les Lacunaires ne viennent pas de la plaine : ils sortent du grenier, à l'intérieur des murs. Brutus court vers le mur nord, par réflexe, puis s'arrête.",
        ),
        { t: "fight", fight: fightNuit },
        when(is("defaite"), [
          stage(
            "Les murs de Brutus ne tiennent pas ce qui est déjà dedans. Les Échos tombent l'un après l'autre sur les pavés, et les Lacunaires, qui cherchent la chaleur, vont droit aux bancs où les Assis n'ont pas bougé. Quand le froid se retire, une vieille femme ne s'est pas relevée : elle est morte de froid, sans un cri, la main encore ouverte sur son banc.",
          ),
          say(
            "brutus",
            "Je jure de garder, et je n'ai gardé personne. Je me suis tenu devant le mur pendant que ça venait de l'autre côté.",
          ),
          stage(
            "Lyra pose une main sur son épaule ; il ne la repousse pas. Pim, debout dans l'ombre d'une porte, regarde le banc sans rien dire.",
          ),
          fx(set("defaite", false)),
        ]),
      ],
      next: "grenier",
    },

    grenier: {
      id: "grenier",
      title: "Le grenier scellé",
      kind: "lacune",
      setting: "Le grenier de Demeure, après le combat.",
      beats: [
        stage(
          "Après le combat. Le grenier de Demeure : un bâtiment de pierre, porte murée depuis vingt hivers, « pour que le grain dure toujours ». Le mur de la porte est fendu de l'intérieur. Par la fente, on voit : rien de net. Le grain, les poutres, la lumière, tout y est flou. Un froid doux en sort. C'est le cœur de la Lacune.",
        ),
        stage(
          "Les villageois sont sortis de leurs maisons, réveillés par le combat. Pour la première fois, ils sont debout. La Doyenne est au premier rang.",
        ),
        say("brutus", "Mes murs ne les ont pas arrêtés."),
        stage("Un temps."),
        say(
          "brutus",
          "Ils les ont attirés. Le grenier, c'est ce qu'on a le mieux gardé. Personne n'y est entré depuis vingt hivers. Rien n'y a bougé. Rien n'y a chauffé.",
        ),
        say(
          "lyra",
          "Le bord n'est pas venu de la plaine, Brutus. Il est né ici.",
        ),
        say("doyenne", "Le Repos est venu à Demeure. C'est un honneur."),
        say("brutus", "C'est un trou, Doyenne."),
        stage("Le silence. Tout le monde regarde Brutus, puis le héros."),
        choice("grenier", [
          opt("ouvrir", "Ouvrez le grenier. Semez le grain.", [
            when(
              gte("confiance.brutus", 1),
              [
                stage(
                  "Brutus hésite, puis abat la porte murée d'un coup de bouclier. Les villageois, un à un, prennent des poignées de grain. Le flou recule à mesure qu'on remue, qu'on transporte, qu'on sème.",
                ),
                fx(
                  add("lacunes.recousues", 1),
                  add("confiance.brutus", 1),
                  set("demeure_ouverte"),
                ),
                say("brutus", "J'ai juré de garder Demeure tel qu'il est."),
                stage("Il regarde la porte en morceaux."),
                say("brutus", "Demeure n'était plus tel qu'il est. Il gelait."),
              ],
              [
                say("brutus", "Pas sur ta parole. Je ne te connais pas."),
                redirect("decider"),
              ],
            ),
          ]),
          opt("sceller", "Scellez-le mieux. Le froid restera dedans.", [
            fx(add("lacunes.elargies", 1), set("demeure_scellee")),
            stage(
              "Brutus, soulagé, remure la porte. La Doyenne approuve. La Lacune, derrière la pierre, continue de grandir en silence.",
            ),
            stage("Lyra, bas, au héros."),
            say("lyra", "Tu sais ce que tu viens de faire ?"),
            choice("sceller-lyra", [
              opt("voulaient", "Je leur ai laissé ce qu'ils voulaient."),
              opt("sais-pas", "Je ne sais pas."),
            ]),
            say(
              "lyra",
              "Dans dix hivers, il n'y aura plus de grenier. Dans vingt, plus de Demeure. Ils seront assis jusqu'au bout.",
            ),
          ]),
          opt("decider", "Ce n'est pas à moi de décider. C'est leur village.", [
            fx(add("confiance.brutus", 1), add("confiance", 1)),
            stage(
              "Brutus regarde longtemps le héros. Puis il se tourne vers les villageois.",
            ),
            say("brutus", "Alors décidez. Debout, pour une fois."),
            stage(
              "Les villageois se regardent. Pim fait un pas en avant, un caillou à la main, et le jette dans la fente. Un petit bruit. Puis un adulte, un autre. Ils n'ouvrent pas le grenier : ils le laissent tel quel, mais ils restent debout autour.",
            ),
            say("brutus", "Ils ne savent pas quoi faire."),
            stage("Un temps."),
            say("brutus", "Moi non plus. Mais ils sont debout."),
          ]),
        ]),
      ],
      next: "place",
    },

    place: {
      id: "place",
      title: "La place",
      kind: "fin",
      setting: "L'aube sur Demeure.",
      beats: [
        when(is("demeure_ouverte"), [
          stage("L'aube. Des villageois sèment dans les champs."),
        ]),
        when(is("demeure_scellee"), [
          stage("L'aube. Des villageois sont assis devant le grenier remuré."),
        ]),
        when(
          {
            all: [
              { key: "demeure_ouverte", op: "!=", value: true },
              { key: "demeure_scellee", op: "!=", value: true },
            ],
          },
          [stage("L'aube. Des villageois sont debout, incertains.")],
        ),
        stage(
          "La place de Demeure. Lyra fouille son sac. Elle en sort une graine, grosse comme un ongle : une graine d'arbre.",
        ),
        say(
          "lyra",
          "C'est la dernière que j'ai. Je la gardais pour un endroit qui en vaudrait la peine.",
        ),
        stage("Elle la tend au héros, pas à Brutus."),
        choice("graine", [
          opt("planter", "La planter au milieu de la place, entre les bancs.", [
            fx(set("demeure.graine"), add("confiance.lyra", 1)),
            stage(
              "Le héros creuse avec les doigts entre deux pavés disjoints. Hesta regarde, sans rien dire. Pim apporte de l'eau dans ses mains.",
            ),
            say("doyenne", "Tu as changé Demeure, voyageur."),
            choice("planter-hesta", [
              opt("un-peu", "Un peu."),
              opt("changeait", "Elle changeait déjà."),
            ]),
            say("doyenne", "… Oui."),
            stage("C'est tout ce qu'elle dira."),
          ]),
          opt(
            "rendre",
            "La rendre à Lyra. Garde-la pour un endroit qui en vaudra la peine.",
            [
              say("lyra", "Je viens de te dire que c'en était un."),
              stage("Elle la remet dans son sac."),
              say("lyra", "Tant pis. Un jour."),
            ],
          ),
          opt("pim", "La donner à Pim.", [
            fx(set("demeure.graine"), set("pim_graine")),
            say("pim", "Je la plante où ?"),
            choice("pim-ou", [opt("ou-tu-veux", "Où tu veux.")]),
            stage(
              "Pim court vers les champs. Il revient sans la graine, de la terre jusqu'aux coudes.",
            ),
          ]),
        ]),
        when(is("demeure.graine"), [
          stage(
            "Le Carnet note simplement, sous la question de Pim : « Planté une graine. On verra. »",
          ),
        ]),
        stage("Brutus a son bouclier sur le dos et un sac à l'épaule."),
        say(
          "brutus",
          "L'île qui grossit, dans le ciel. Si le bord naît là où rien ne bouge, je veux savoir ce qui arrive quand une île entière vient nous heurter.",
        ),
        stage("Il regarde le mur, une dernière fois."),
        say("brutus", "Le mur tiendra sans moi. Ou pas. On verra."),
        say("lyra", "Toi ? Partir ?"),
        say(
          "brutus",
          "Garder, ce n'est pas rester assis. Tu me l'as assez dit.",
        ),
        say(
          "brutus",
          "Les ondines du Lent lisent ce qui tombe du ciel. Elles sauront ce qu'est cette île. On va au lac.",
        ),
        stage("Brutus I rejoint l'équipe."),
        fx(join("brutus"), give("habit:brassard-de-demeure")),
        go(END),
      ],
    },
  },
}
