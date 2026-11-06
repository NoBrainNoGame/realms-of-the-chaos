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
  lt,
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

// Lacunaires of the Lent: swimmers rising from the abyss.
const unstable = (n: number) => ({
  id: `lacunaire-instable-${n}`,
  name: "Lacunaire instable",
  title: "Nageur de l'abysse",
  affinity: "shadow" as const,
  locomotion: "swimmer" as const,
  stats: {
    health: 4,
    speed: 5,
    physicalAttack: 4,
    physicalDefense: 2,
    magicalAttack: 1,
    magicalDefense: 2,
    luck: 2,
  },
  actions: ["bite", "kick"],
})

const effilocheur = {
  id: "lacunaire-effilocheur",
  name: "Lacunaire effilocheur",
  title: "Nageur de l'abysse",
  affinity: "shadow" as const,
  locomotion: "swimmer" as const,
  stats: {
    health: 7,
    speed: 5,
    physicalAttack: 5,
    physicalDefense: 3,
    magicalAttack: 3,
    magicalDefense: 3,
    luck: 2,
  },
  actions: ["blade", "kick"],
}

const mareeDuLent: FightSpec = {
  id: "ch4-maree-du-lent",
  title: "La marée du Lent",
  board: [
    "..~~~~~..",
    ".~~www~~.",
    "~~wwWww~1",
    "~wwWWWww~",
    "1~wwWww~~",
    "~~~www~~.",
    ".~~~w~~1.",
    "..~~~~~..",
    ".........",
  ],
  teams: [
    {
      name: "Alliés",
      side: "allies",
      fighters: [
        { preset: "@hero", at: { x: 3, y: 8 } },
        { preset: "lyra", at: { x: 4, y: 8 } },
        { preset: "brutus", at: { x: 5, y: 8 } },
        { preset: "nerea", at: { x: 4, y: 5 } },
      ],
    },
    {
      name: "Lacunaires de l'abysse",
      side: "enemies",
      fighters: [
        // The swarm of the doc: 3 + 2 more at each high tide (ticks 1 and 2)
        // + 1 effilocheur.
        { preset: unstable(1), at: { x: 3, y: 3 } },
        { preset: unstable(2), at: { x: 5, y: 3 } },
        { preset: unstable(3), at: { x: 4, y: 4 } },
        { preset: effilocheur, at: { x: 4, y: 2 } },
        { preset: unstable(4), at: { x: 3, y: 4 }, arrives: { tick: 1 } },
        { preset: unstable(5), at: { x: 5, y: 4 }, arrives: { tick: 1 } },
        { preset: unstable(6), at: { x: 4, y: 3 }, arrives: { tick: 2 } },
        { preset: unstable(7), at: { x: 4, y: 2 }, arrives: { tick: 2 } },
      ],
    },
  ],
  rules: {
    // SIMPLIFIED: the tide (shallows turning deep every 4 actions, walkers
    // carried back to the ground) does not exist in the engine. Three clock
    // ticks stand for the three high tides: the fight is held when the third
    // one is over, and the allies win.
    clock: { period: 10, limit: 3, winner: 0 },
    // The Lacunaires set into a rock when they fall, like in chapter 3.
    fixOnDeath: [1],
    // The one who flees dives back toward the abyss (the W cells).
    flee: {
      team: 1,
      below: 0.3,
      exits: [
        { x: 4, y: 2 },
        { x: 3, y: 3 },
        { x: 4, y: 3 },
        { x: 5, y: 3 },
        { x: 4, y: 4 },
      ],
    },
  },
  influences: ["earthquake", "timeWarp", "blessing"],
  startEnergy: 3,
  goal: "Tenir jusqu'à la troisième marée haute : fixer ou faire fuir les Lacunaires, sans perdre Néréa.",
  defeat: [set("defaite"), add("usure", 1), add("confiance.nerea", -1)],
  objectives: [
    {
      id: "fonds",
      mark: "◆",
      label: "Ne pas remuer les fonds",
      // SIMPLIFIED: no Séisme at all and no Lacunaire fixed (the engine does
      // not say whether a fixed one lay in deep water).
      check: (r) =>
        (r.divineUsed.earthquake ?? 0) === 0 && r.fixed.length === 0,
      success: "Le lac n'a rien perdu de ses couches.",
      onSuccess: [add("confiance.nerea", 2), set("fonds_intacts")],
    },
    {
      id: "intrication-eau",
      mark: "◆",
      label: "Une Intrication dans l'eau",
      // SIMPLIFIED: any Intrication counts (the cell's depth is not reported).
      check: (r) => r.intrications > 0,
      success: "Deux Échos sur la même case d'eau.",
      onSuccess: [add("intrications"), set("intrication_eau")],
    },
    {
      id: "fuyards",
      mark: "★",
      label: "Laisser partir ceux qui fuient",
      check: (r) => {
        const n = r.fighters.filter((f) => f.team === 1 && f.fled).length
        return { ok: n > 0, n }
      },
      success: "Ils sont rentrés dans le fond.",
      onSuccess: [{ add: "lacunaires.epargnes", by: 1, perUnit: true }],
    },
  ],
  lines: [
    {
      when: "start",
      who: "nerea",
      text: "Ils remontent du fond. Le fond, c'est l'endroit le plus froid, le plus noir, le plus lent. Ce qui vit au bord du rien. Comme moi, en fait.",
    },
    { when: "start", who: "brutus", text: "Je ne nage pas." },
    { when: "start", who: "nerea", text: "Je sais. Tu as une tête à couler." },
    {
      when: "tick:1",
      who: "lyra",
      text: "L'eau monte ! Sur les rochers, vite !",
    },
    // CUT: lines tied to events the engine does not report (carried walker,
    // tidal wave pushing a Lacunaire to the abyss, Séisme in water, effilocheur's ice).
    {
      when: "end",
      who: "nerea",
      text: "La marée redescend. Ils redescendent avec elle. Le lac respire, maintenant. Il n'avait jamais respiré.",
    },
  ],
}

// ─── The island (the lake and its shore, walked) ────────────────────────────

const ISLAND = mareeDuLent.board
const zone = (x: number, y: number) => around(ISLAND, x, y)

export const ch04: Chapter = {
  id: "4",
  era: 1,
  number: 4,
  title: "Les abysses",
  quote: {
    who: "nerea",
    text: "Tout ce qui tombe finit par se déposer. Même vous. Surtout vous, si vous continuez à remuer ma vase.",
  },
  place: "Le Lac de Néréa, que les ondines appellent le Lent",
  question: {
    id: "Q04",
    text: "Que gardent les profondeurs de ce qui a été ?",
  },
  start: "s1",
  exploration: {
    // The fight's lake is the island: a ring of shallows around the deep water
    // (walkers cannot enter it), the beach in the south.
    island: ISLAND,
    start: { x: 4, y: 8 },
    // Nérea joins at the evening fire; Brutus and Lyra are already there.
    companions: ["lyra", "brutus", "nerea"],
    influences: ["earthquake", "timeWarp", "blessing"],
    encounters: [
      {
        id: "s1",
        label: "Le lac qui respire",
        scene: "s1",
        at: { x: 4, y: 7 },
        zone: zone(4, 7),
      },
      {
        id: "s2",
        label: "Un remous au centre du lac",
        scene: "s2",
        at: { x: 6, y: 5 },
        actor: "nerea",
      },
      {
        id: "s3",
        label: "Néréa, les pieds dans l'eau",
        scene: "s3",
        at: { x: 7, y: 4 },
        actor: "nerea",
      },
      {
        id: "s4",
        label: "Le Lent, noir et profond",
        scene: "s4",
        at: { x: 4, y: 7 },
        auto: true,
      },
      {
        id: "s5",
        label: "Un feu sur la berge",
        scene: "s5",
        at: { x: 1, y: 8 },
        zone: zone(1, 8),
      },
      {
        id: "s6",
        label: "La rive, à l'aube",
        scene: "s6",
        at: { x: 7, y: 8 },
        zone: zone(7, 8),
      },
      {
        id: "roseaux",
        label: "Des roseaux couchés",
        at: { x: 8, y: 5 },
        examine: {
          lines: [
            {
              style: "stage",
              text: "Les roseaux sont couchés tous dans le même sens, vers le lac, comme après une longue inspiration. Au-dessus d'eux, une ligne de vase humide marque où l'eau est montée.",
            },
          ],
          effects: [{ add: "ecoute", by: 1 }],
        },
      },
      {
        id: "eau_noire",
        label: "L'eau noire",
        at: { x: 0, y: 2 },
        examine: {
          lines: [
            {
              text: "L'eau est si calme qu'on y voit le ciel. L'île de l'est y paraît plus grande que là-haut, comme si le reflet tirait sur la surface.",
            },
          ],
          effects: [{ add: "ecoute", by: 1 }],
        },
      },
      {
        id: "cuvette",
        label: "La cuvette boisée",
        at: { x: 4, y: 0 },
        examine: {
          lines: [
            {
              style: "stage",
              text: "Les arbres de la cuvette penchent un peu vers le lac. Au pied de chacun, un anneau de vase séchée donne la hauteur de la dernière marée.",
            },
          ],
          effects: [{ add: "ecoute", by: 1 }],
        },
      },
      {
        id: "vase",
        label: "Une ligne de vase humide",
        at: { x: 8, y: 6 },
        obstacle: {
          influence: "timeWarp",
          before: [
            {
              style: "stage",
              text: "La vase brille, encore humide, à la hauteur d'une marée qui n'est pas revenue. Le lac attend, lui aussi : ce soir ou jamais.",
            },
          ],
          after: [
            {
              style: "stage",
              text: "Le temps glisse d'un cran. La vase sèche d'un coup, se craquelle en écailles. Au loin, l'eau se retire d'un pas, et revient, plus lentement.",
            },
          ],
          effects: [{ add: "ecoute", by: 1 }],
        },
      },
      {
        id: "strate",
        label: "Une berge en couches",
        at: { x: 0, y: 6 },
        obstacle: {
          influence: "earthquake",
          before: [
            {
              style: "stage",
              text: "La berge est faite de couches fines, grises, empilées comme des pages collées. Impossible de les compter sans les ouvrir.",
            },
          ],
          after: [
            {
              style: "stage",
              text: "Le sol se fend net, comme une page tournée. Les couches s'ouvrent, régulières : chacune porte, figée, la trace d'une marée.",
            },
          ],
          effects: [{ add: "ecoute", by: 1 }],
        },
      },
      {
        id: "nageur",
        label: "Un nageur de l'abysse",
        at: { x: 6, y: 7 },
        wander: {
          preset: unstable(1),
          title: "Un nageur égaré",
          goal: "Le toucher pour qu'il se décide.",
          range: 2,
          radius: 4,
          effects: [{ add: "ecoute", by: 1 }],
          success:
            "Il s'est défait en filaments sombres, que l'eau a déroulés, puis plus rien.",
        },
      },
    ],
  },
  scenes: {
    s1: {
      id: "s1",
      title: "Le lac qui respire",
      kind: "rencontre",
      setting: "Un lac rond au milieu d'une cuvette boisée",
      next: "s2",
      beats: [
        stage(
          "Un lac rond au milieu d'une cuvette boisée. L'eau est noire, si calme qu'on y voit le ciel. Mais sur la berge, une ligne de vase humide montre que l'eau était plus haute il y a peu. Des roseaux sont couchés dans le même sens. On entend un bruit très lent, comme une respiration : l'eau revient.",
        ),
        say(
          "brutus",
          "Il n'a jamais fait ça. Mon grand-père pêchait ici. Le lac ne bougeait pas.",
        ),
        say("lyra", "Tout bouge, Brutus."),
        say("brutus", "Pas les lacs."),
        stage("L'eau monte de deux pieds en quelques minutes, puis s'arrête."),
        choice("lac", [
          opt("pourquoi", "Pourquoi il monte ?", [
            say("lyra", "Je ne sais pas. Quelque chose le tire."),
          ]),
          opt("ile", "Regarder l'île du ciel.", [
            narr(
              "L'île de l'est est là, au-dessus des arbres, en plein jour maintenant. Le lac monte vers elle. Ou c'est l'impression que ça donne.",
            ),
          ]),
        ]),
      ],
    },

    s2: {
      id: "s2",
      title: "La remontée",
      kind: "rencontre",
      setting: "Un remous au centre du lac",
      next: "s3",
      beats: [
        stage(
          "Un remous au centre du lac. Une silhouette jaillit de l'eau, se hisse sur un rocher plat, et secoue la tête. Peau bleu-vert, longs cheveux plaqués, une écharpe de vase sur les épaules et un trident à la main. Elle est furieuse, et parle lentement, ce qui la rend encore plus effrayante.",
        ),
        say("nerea", "Qui. A. Jeté. Des cailloux."),
        say("brutus", "… Personne."),
        say(
          "nerea",
          "Le lac a monté. Trois fois en une semaine. Il a remué les fonds. Et ce matin, quelqu'un a jeté des cailloux. Trois siècles de vase, brouillés. Trois siècles que je lisais comme on lit un visage.",
        ),
        stage(
          "Brutus a, effectivement, un caillou à la main. Il le pose, discrètement.",
        ),
        choice("remontee", [
          opt("pardon", "Pardon. On ne savait pas.", [
            say(
              "nerea",
              "On ne sait jamais. C'est pour ça qu'il faut lire avant de jeter.",
            ),
          ]),
          opt("lire", "Lire la vase ?", [
            say(
              "nerea",
              "Les couches. Ce qui tombe au fond d'un lac s'y dépose, un peu chaque année. Le pollen au printemps, les feuilles en automne, la poussière quand il fait sec. Une couche par an. Au fond du Lent, il y en a des milliers. C'est l'histoire de l'île, écrite par tout ce qui y est tombé.",
            ),
          ]),
          opt("lui", "C'est lui. (désigner Brutus)", [
            fx(add("confiance.brutus", -1), add("confiance.nerea", 1)),
            say("brutus", "…"),
            say(
              "nerea",
              "Je sais. Il avait la tête de quelqu'un qui jette des cailloux.",
            ),
          ]),
        ]),
      ],
    },

    // The Écoute: four steps, one can leave at each of them.
    s3: {
      id: "s3",
      title: "Les couches",
      kind: "rencontre",
      setting: "Néréa, les pieds dans l'eau",
      next: "s4",
      beats: [
        stage(
          "Néréa s'assoit sur son rocher, les pieds dans l'eau. Elle est apaisée, maintenant qu'on l'écoute, et elle parle avec une lenteur infinie.",
        ),
        // Step 1
        say(
          "nerea",
          "Vous voulez savoir ce qu'est l'île du ciel. Les gens de Demeure envoient toujours quelqu'un aux ondines quand le ciel change. Tous les trois cents ans, à peu près. Ma lignée tient le compte. Pour bien comprendre, il faut commencer par le fond.",
        ),
        say("brutus", "Le fond de quoi ?"),
        say("nerea", "Du lac."),
        choice("ecoute1", [
          opt("ecoute", "Je t'écoute.", [
            // Step 2
            say(
              "nerea",
              "Au fond, tout en bas, les couches sont claires. Du pollen, du sable fin, des coquilles minuscules. Une île jeune, chaude, pleine de choses. Puis, en remontant… il y a mille ans, peut-être… une première couche noire. Fine comme un cil. De la poussière qui ne vient pas d'ici : on ne trouve pas cette roche sur notre île.",
            ),
            say("nerea", "Elle est tombée du ciel."),
            stage("Brutus soupire et s'assoit dans les roseaux."),
            say("brutus", "Il va falloir un moment."),
            choice("ecoute2", [
              opt("continue", "Continue.", [
                fx(add("confiance.nerea", 1)),
                // Step 3
                say(
                  "nerea",
                  "Puis une autre couche noire, deux siècles plus haut. Puis une autre, un siècle plus haut. Puis tous les cinquante ans. Puis tous les dix ans. Puis tous les ans. Les dernières sont épaisses comme un doigt.",
                ),
                say(
                  "nerea",
                  "Quelque chose, là-haut, s'effrite. Depuis mille ans. Et ses miettes tombent chez nous de plus en plus souvent, parce qu'elle est de plus en plus près.",
                ),
                say("lyra", "L'île du ciel."),
                say(
                  "nerea",
                  "L'île du ciel. Elle perd ses bords. Comme vos bords froids, Lyra. Mais en plus vieux.",
                ),
                stage("Le héros sort le Carnet."),
                choice("ecoute3", [
                  opt("pourquoi", "Pourquoi elle s'effrite ?", [
                    // Step 4
                    say(
                      "nerea",
                      "Ça, mes couches ne le disent pas. Elles disent qu'il est tombé quelque chose. Pas pourquoi. Une couche, c'est une trace, pas une raison. Pour savoir pourquoi elle s'effrite, il faudrait lire ses fonds à elle. Ses lacs. Ses vases. Si elle a des lacs.",
                    ),
                    say(
                      "nerea",
                      "Si un jour elle vient assez près… Elle regarde le ciel. Et elle vient.",
                    ),
                    narr(
                      "Elle parle de l'île qui va nous heurter comme on parle d'un livre qu'on va enfin pouvoir ouvrir.",
                    ),
                    fx(
                      set("archive_derive", "disponible"),
                      add("confiance.nerea", 1),
                      add("confiance", 1),
                    ),
                    say("brutus", "Fini ?"),
                    say(
                      "nerea",
                      "Non. Mais vous avez écouté plus longtemps que tous les autres en mille ans. Je peux m'arrêter là.",
                    ),
                  ]),
                  opt("tard3", "Plus tard.", [
                    fx(set("archive_derive", "aucune")),
                    go("s4"),
                  ]),
                ]),
              ]),
              opt("tard2", "Plus tard.", [
                fx(set("archive_derive", "aucune")),
                go("s4"),
              ]),
            ]),
          ]),
          opt("court", "Tu peux faire court ?", [
            say("nerea", "Non."),
            // Does not close anything: she goes on at step 2.
            redirect("ecoute"),
          ]),
          opt("tard1", "Plus tard.", [
            fx(set("archive_derive", "aucune")),
            go("s4"),
          ]),
        ]),
      ],
    },

    s4: {
      id: "s4",
      title: "La marée du Lent",
      kind: "combat",
      setting: "Le Lent, noir et profond",
      next: "s5",
      beats: [
        stage(
          "La marée monte encore. Au centre du lac, l'eau devient plus noire, et des formes remontent de l'abysse.",
        ),
        hint(
          "L'eau",
          "Les marcheurs pataugent dans l'eau peu profonde (déplacement plus cher) et ne vont pas en eau profonde. Néréa est aquatique : elle va partout sans pénalité. Son Raz-de-marée repousse et ralentit.",
        ),
        fx(unlock("mecanique:eau")),
        { t: "fight", fight: mareeDuLent },
        when(is("defaite"), [
          stage(
            "La troisième marée emporte Néréa. Le Lent la prend d'un coup, noir et froid, avec ce qui remontait du fond. Brutus, qui ne nage pas, entre dans l'eau jusqu'à la poitrine et la ramène par le bras, toussant, sans trident.",
          ),
          say(
            "nerea",
            "J'ai lu ce lac toute ma vie. Il m'a quand même eue. Les fonds sont remués : cette année, la couche sera illisible.",
          ),
          stage(
            "Les Lacunaires, n'ayant plus de chaleur à suivre, se défont dans la vase. Le lac redescend, trouble, et garde sa couche brouillée.",
          ),
          fx(set("defaite", false)),
        ]),
      ],
    },

    s5: {
      id: "s5",
      title: "Sur la berge",
      kind: "veillee",
      setting: "Le soir. Un feu sur la berge",
      next: "s6",
      beats: [
        stage(
          "Le soir. Le lac est redescendu. Un feu sur la berge, que Néréa regarde avec méfiance (« ça sèche »). Elle a gardé les pieds dans l'eau.",
        ),
        when(gte("confiance.nerea", 0), [say("nerea", "Je viens avec vous.")]),
        when(lt("confiance.nerea", 0), [
          say(
            "nerea",
            "Je viens avec vous. Ne croyez pas que ce soit de la gratitude.",
          ),
        ]),
        stage("Personne n'a rien demandé."),
        say(
          "nerea",
          "Si l'île du ciel arrive, je veux être la première à mettre la main dans sa vase.",
        ),
        stage("Néréa I rejoint l'équipe."),
        fx(join("nerea")),
        when(is("fonds_intacts"), [
          say(
            "nerea",
            "Vous avez combattu sur mon lac sans salir mes fonds. Je ne savais pas que c'était possible.",
          ),
        ]),
        when(is("intrication_eau"), [
          say("nerea", "On tient à deux là où on se noierait seul."),
        ]),
        hub("berge", [
          topic("heros", "Le héros", [
            stage("Néréa observe le héros longtemps, la tête penchée."),
            say("nerea", "Toi, tu n'as pas de couches."),
            choice("couches", [
              opt("comment", "Comment ça ?", [
                say(
                  "nerea",
                  "Tout le monde a des couches. Lyra a des doigts gris, des cals de soigneuse, une cicatrice au menton qu'elle s'est faite à six ans. Brutus a les épaules d'un homme qui porte des pierres depuis douze hivers. Ce qui nous arrive se dépose en nous.",
                ),
                when(
                  gte("usure", 1),
                  [
                    say(
                      "nerea",
                      "Toi… tu as une ligne grise au bout des doigts. Une seule. Elle est toute neuve. Sous elle, rien.",
                    ),
                  ],
                  [
                    say(
                      "nerea",
                      "Toi… rien. Pas une ride, pas un cal. Comme une vase qui vient de se poser.",
                    ),
                  ],
                ),
              ]),
              opt("reveil", "Je me suis réveillé il y a quelques jours.", [
                say("nerea", "Alors tu es très jeune, ou très bien lavé."),
                say("nerea", "Les couches viendront. Elles viennent toujours."),
              ]),
            ]),
          ]),
          topic("ghom", "Le Ghom", [
            say(
              "nerea",
              "Les gens de Demeure disent qu'il est immobile. Les ondines n'en savent rien. Nous, on attend qu'il tombe.",
            ),
            choice("tombe", [
              opt("quil", "Qu'il tombe ?", [
                say(
                  "nerea",
                  "Tout ce qui existe laisse quelque chose au fond, un jour. Une poussière, une chaleur, une trace. S'il existe, il laisse une couche. Je la cherche.",
                ),
                stage("Elle sourit, pour la première fois."),
                say(
                  "nerea",
                  "Je ne l'ai pas encore trouvée. Ça ne prouve rien. Le fond est grand.",
                ),
              ]),
            ]),
          ]),
          topic(
            "question",
            "La question",
            [
              say(
                "nerea",
                "Lyra dit que tu écris des questions. Écris la mienne. Elle est vieille. Ma mère l'avait, sa mère aussi.",
              ),
              say("nerea", "Que gardent les profondeurs de ce qui a été ?"),
              choice("q04", [
                opt("ecrire", "L'écrire.", [
                  fx(set("carnet.Q04", "ouverte"), add("confiance.nerea", 1)),
                ]),
                opt("tout", "Elles gardent tout, non ? Tu viens de le dire.", [
                  say(
                    "nerea",
                    "J'ai dit qu'elles gardent ce qui est tombé. Pas ce qui s'est passé. Une couche de cendre, ce n'est pas un incendie. C'est ce qui reste d'un incendie.",
                  ),
                  stage("Le héros écrit."),
                  fx(set("carnet.Q04", "ouverte")),
                ]),
              ]),
            ],
            { last: true },
          ),
        ]),
      ],
    },

    s6: {
      id: "s6",
      title: "Le quart du ciel",
      kind: "fin",
      setting: "L'aube",
      beats: [
        stage(
          "L'aube. L'île de l'est n'est plus une tache : elle occupe un quart du ciel. On distingue ses falaises sombres, des reflets froids sur ses crêtes, et, sur ses bords, une sorte de brume qui s'effiloche vers le Clair. Le lac monte, plus haut que la veille. Puis le sol tremble, longuement, sans secousse brutale : un grondement sourd, comme une porte immense qu'on ouvre très lentement.",
        ),
        say("brutus", "Elle va nous toucher."),
        say(
          "nerea",
          "Elle va nous toucher à l'est, là où vos bords sont les plus froids. Les couches de poussière sont plus épaisses du côté est du lac.",
        ),
        say("lyra", "La Lisière. On y va ?"),
        choice("fin", [
          opt("allons", "On y va.", []),
          opt("faire", "Pour faire quoi ?", [
            say(
              "lyra",
              "Être là. C'est déjà beaucoup, être là quand les choses arrivent.",
            ),
          ]),
        ]),
        narr(
          "Une île entière vient vers nous. Je devrais avoir peur. J'ai surtout envie de savoir qui vit dessus.",
        ),
        when(is("archive_derive", "disponible"), [
          fx(give("eclat_de_poussiere_noire")),
        ]),
        fx(give("sandales_de_jonc")),
        go(END),
      ],
    },
  },
}
