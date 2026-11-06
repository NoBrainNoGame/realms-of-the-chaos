import {
  add,
  any,
  around,
  choice,
  fx,
  give,
  go,
  hub,
  is,
  isnt,
  narr,
  opt,
  say,
  set,
  stage,
  topic,
  when,
} from "../dsl"
import { type Chapter, END, type FightSpec } from "../types"

// Vesce: Nyx's kit, a little weaker (health 5, speed 7).
const vesce = {
  id: "vesce",
  name: "Vesce",
  title: "Jeune Ombre",
  affinity: "shadow" as const,
  kit: "nyx",
  stats: {
    health: 5,
    speed: 7,
    physicalAttack: 6,
    physicalDefense: 3,
    magicalAttack: 3,
    magicalDefense: 3,
    luck: 7,
  },
  actions: ["blade", "leap", "kick"],
}

const jointure: FightSpec = {
  id: "ch5-la-jointure",
  title: "La jointure",
  board: [
    "....a1222",
    "...1a1222",
    "....a.122",
    "..~.a..12",
    ".~~.a...1",
    "..~.a..12",
    "....a.122",
    "...1a1222",
    "....a1222",
  ],
  teams: [
    {
      name: "Alliés",
      side: "allies",
      fighters: [
        { preset: "@hero", at: { x: 1, y: 3 } },
        { preset: "lyra", at: { x: 0, y: 2 } },
        { preset: "brutus", at: { x: 2, y: 6 } },
        { preset: "nerea", at: { x: 2, y: 4 } },
      ],
    },
    {
      name: "Échos de la Dérive",
      side: "enemies",
      fighters: [
        { preset: "nyx", at: { x: 7, y: 1 } },
        { preset: vesce, at: { x: 7, y: 7 } },
        { preset: "merlin", at: { x: 8, y: 4 } },
      ],
    },
  ],
  rules: {
    // The seam: column 4 hurts whoever starts a turn on it.
    silent: Array.from({ length: 9 }, (_, y) => ({ x: 4, y })),
    silentDamage: 2,
    // SIMPLIFIED: one rule for the three of them. Nyx flees under 25 % (Bond
    // toward the wall of the Dérive); Merlin "withdraws" and Vesce gives up by
    // leaving the same way (the doc's three distinct behaviours, withdrawal
    // for Merlin, conditional surrender for Vesce, do not exist).
    flee: {
      team: 1,
      below: 0.25,
      exits: [
        { x: 8, y: 1 },
        { x: 8, y: 7 },
      ],
    },
  },
  influences: ["earthquake", "timeWarp", "blessing"],
  startEnergy: 4,
  goal: "Repousser l'équipe de la Dérive : chacun doit être dispersé ou s'en aller.",
  defeat: [set("defaite"), add("usure", 1), add("confiance.brutus", -1)],
  objectives: [
    {
      id: "nyx-epargnee",
      mark: "★",
      label: "Finir sans disperser Nyx",
      check: (r) =>
        r.fighters.some((f) => f.preset === "nyx" && (f.fled || f.hp > 0)),
      success: "Nyx s'est enfuie, vivante.",
      failure: "Nyx est tombée sur la jointure.",
      onSuccess: [set("nyx_epargnee"), add("confiance.nyx", 2)],
      onFailure: [set("nyx_epargnee", false), add("confiance", -1)],
    },
    {
      id: "vesce-vivante",
      mark: "◆",
      label: "Vesce s'en va vivante",
      // SIMPLIFIED: a surviving Vesce counts as surrendered (vesce_rendue);
      // "fled with Nyx" (no scene) is not distinguished.
      check: (r) =>
        r.fighters.some((f) => f.preset === "vesce" && (f.fled || f.hp > 0)),
      onSuccess: [set("vesce_rendue")],
      onFailure: [set("vesce_dispersee")],
    },
    {
      id: "aucune-dispersion",
      mark: "◆",
      label: "Aucune Dispersion",
      check: (r) =>
        r.fighters.filter((f) => f.team === 1).every((f) => f.fled || f.hp > 0),
      success: "Nyx, Merlin et Vesce s'en vont tous vivants.",
      onSuccess: [
        add("confiance", 1),
        add("confiance.brutus", 1),
        set("aucune_dispersion"),
      ],
    },
    // CUT: "Ne pas toucher la jointure" (the report does not give where the
    // allies end their turns; its only effect was a line from Merlin).
    {
      id: "ghom-tranquille",
      mark: "◆",
      label: "Pas d'Influence",
      check: (r) => Object.values(r.divineUsed).every((n) => n === 0),
      success: "Le Ghom s'est tenu tranquille, comme celui d'en face.",
      onSuccess: [add("confiance.nyx", 1), set("ghom_tranquille")],
    },
  ],
  lines: [
    { when: "start", who: "nyx", text: "Voyons si vous êtes réels." },
    {
      when: "start",
      who: "merlin",
      text: "Vesce, avec moi. Nyx, comme d'habitude, toute seule.",
    },
    { when: "start", who: "nyx", text: "Toujours." },
    { when: "start", who: "brutus", text: "Derrière moi. Tous." },
    {
      when: "fleeing",
      who: "nyx",
      text: "Vous êtes réels. Bon. C'est noté.",
    },
    // CUT: Merlin+Vesce Intrication, "Quelqu'un frappe Nyx", Lyra healing
    // before Merlin, Néréa in water, Vesce giving up: the game reports none of
    // these events. The retreat and surrender lines are folded into the
    // debrief scene (s4).
  ],
}

// ─── The island (the Lisière, walked) ───────────────────────────────────────

// The fight's seam (the dry pit of column 4) between the native island (west)
// and the black rock of the Dérive (east hills).
const ISLAND = jointure.board
const zone = (x: number, y: number) => around(ISLAND, x, y)

export const ch05: Chapter = {
  id: "5",
  era: 1,
  number: 5,
  title: "La Collision",
  quote: {
    who: "nyx",
    text: "Personne ne me touche. Donc je suis libre. Voyons si toi, tu existes.",
  },
  place: "La Lisière : la zone où l'île natale touche la Dérive",
  question: {
    id: "Q05",
    text: "Les Échos d'en face sont-ils aussi vivants que les miens ?",
  },
  start: "s1",
  exploration: {
    island: ISLAND,
    start: { x: 0, y: 4 },
    companions: ["lyra", "brutus", "nerea"],
    influences: ["earthquake", "timeWarp", "blessing"],
    encounters: [
      {
        id: "s1",
        label: "Les bords froids, à l'est",
        scene: "s1",
        at: { x: 3, y: 4 },
        zone: zone(3, 4),
      },
      {
        id: "s2",
        label: "Un rocher de la Dérive",
        scene: "s2",
        at: { x: 6, y: 2 },
        actor: "nyx",
      },
      {
        id: "s3",
        label: "La Lisière, le sol bouge",
        scene: "s3",
        at: { x: 3, y: 4 },
        auto: true,
      },
      {
        id: "s4",
        label: "La lame de Nyx",
        scene: "s4",
        at: { x: 4, y: 4 },
        zone: zone(4, 4),
      },
      {
        id: "s5",
        label: "Un petit feu, côté île natale",
        scene: "s5",
        at: { x: 1, y: 7 },
        zone: zone(1, 7),
      },
      {
        id: "s6",
        label: "Le trou du milieu",
        scene: "s6",
        at: { x: 4, y: 3 },
        zone: zone(4, 3),
      },
      {
        id: "muraille",
        label: "La muraille de la Dérive",
        at: { x: 8, y: 4 },
        examine: {
          lines: [
            {
              style: "stage",
              text: "La roche de la Dérive est noire, froide, striée dans un seul sens. Ses arêtes sont neuves : elles viennent d'être cassées par le chemin.",
            },
          ],
          effects: [{ add: "ecoute", by: 1 }],
        },
      },
      {
        id: "cristaux",
        label: "Des cristaux par paires",
        at: { x: 7, y: 6 },
        examine: {
          lines: [
            {
              text: "Les cristaux de la Dérive poussent par deux, à quelques pouces l'un de l'autre, et luisent presque ensemble. Personne ici ne sait pourquoi.",
            },
          ],
          effects: [{ add: "ecoute", by: 1 }],
        },
      },
      {
        id: "sol_plisse",
        label: "Le sol qui se plisse",
        at: { x: 1, y: 2 },
        examine: {
          lines: [
            {
              style: "stage",
              text: "Là où les deux îles se touchent, le sol se plisse comme un tapis poussé du pied : l'herbe d'ici chevauche la mousse noire de là-bas.",
            },
          ],
          effects: [{ add: "ecoute", by: 1 }],
        },
      },
      {
        id: "dalle",
        label: "Une dalle de la jointure",
        at: { x: 4, y: 6 },
        obstacle: {
          influence: "earthquake",
          before: [
            {
              style: "stage",
              text: "Une dalle de roche est coincée dans la jointure, sertie des deux côtés. Elle ne bouge pas : les deux îles s'y appuient l'une sur l'autre.",
            },
          ],
          after: [
            {
              style: "stage",
              text: "Le sol gronde. La dalle saute, retombe un cran plus loin, et la jointure se déplace avec elle. Plus rien ne s'appuie au même endroit.",
            },
          ],
          effects: [{ add: "ecoute", by: 1 }],
        },
      },
      {
        id: "herbe_noire",
        label: "Une herbe qui traverse",
        at: { x: 2, y: 6 },
        obstacle: {
          influence: "blessing",
          before: [
            {
              style: "stage",
              text: "Une touffe d'herbe grise, aplatie contre la roche noire. Du côté de la Dérive, elle est brûlée de froid.",
            },
          ],
          after: [
            {
              style: "stage",
              text: "La touffe se redresse, verte jusqu'à la pointe. Quelques pas plus loin, la roche de la Dérive a pâli d'un ton : ce que l'une gagne, l'autre le perd.",
            },
          ],
          effects: [{ add: "ecoute", by: 1 }],
        },
      },
    ],
  },
  scenes: {
    s1: {
      id: "s1",
      title: "Le frottement",
      kind: "rencontre",
      setting: "Les bords froids, à l'est",
      next: "s2",
      beats: [
        stage(
          "Les bords froids, à l'est. Mais ils ne sont plus au bord de rien : à la place du Clair, il y a une muraille sombre, haute comme dix arbres, qui avance au pas d'un homme et racle le sol. La roche de la Dérive est noire, veinée de cristaux qui scintillent par paires, deux par deux, comme s'ils se répondaient. Le bruit est continu, grave, énorme. La poussière noire de Néréa tombe en neige.",
        ),
        stage(
          "La muraille ralentit. Puis s'arrête. Les deux îles se touchent sur toute la largeur de l'horizon. Entre elles, une bande de sol de quelques dizaines de pas, ni tout à fait l'une ni tout à fait l'autre : la Lisière.",
        ),
        narr(
          "Il n'y a pas eu de choc. Juste ce bruit qui n'en finissait pas, et maintenant ce silence qui n'en finit pas non plus. Deux îles se touchent. Je ne savais pas que les îles pouvaient se toucher.",
        ),
        say("nerea", "Elle est fraîche. Elle tombe d'aujourd'hui."),
        say("brutus", "Il y a quelqu'un en face."),
      ],
    },

    s2: {
      id: "s2",
      title: "Ceux d'en face",
      kind: "rencontre",
      setting: "Un rocher de la Dérive, à vingt pas",
      next: "s3",
      beats: [
        stage(
          "Sur un rocher de la Dérive, à vingt pas, une silhouette mince accroupie, une lame courte de verre noir à la main. Elle est vêtue de gris sombre, sa capuche cache ses yeux. Derrière elle, une plus jeune, plus petite, qui sautille d'un pied sur l'autre. Et un homme grand et maigre, en robe brûlée aux manches, qui plante dans le sol un long bâton couvert de graduations, un cristal pulsant au sommet. Il ne regarde personne. Il lit son bâton.",
        ),
        say(
          "merlin",
          "Trois cent douze. Trois cent treize. Il s'est arrêté. Vesce, note : arrêt complet à la troisième heure après l'aube, frottement résiduel nul, température de la jointure… Il lève enfin les yeux. Ah. Des gens. Bonjour. Ne bougez pas, vous faussez ma mesure, vous êtes tièdes.",
        ),
        say(
          "vesce",
          "Ils sont quatre, Nyx. Quatre. Il y en a un énorme. Il a un bouclier. Pourquoi il a un bouclier ? On a dit qu'on ne se battait pas d'abord, hein ? On a dit qu'on regardait d'abord ?",
        ),
        say("nyx", "Tais-toi, Vesce."),
        say("brutus", "(bas) Ce sont des Lacunaires qui ont pris forme."),
        say("nyx", "Et toi, t'es un mur qui a pris forme."),
        stage("Elle a entendu. Elle sourit sous sa capuche."),
        choice("ouverture", [
          opt("mal", "On ne vous veut pas de mal.", [
            say(
              "nyx",
              "Tu ne sais pas encore ce que tu veux. Ça se voit d'ici.",
            ),
          ]),
          opt("qui", "Qui êtes-vous ?", [
            say(
              "nyx",
              "Nyx. Lui, c'est Merlin, il mesure. Elle, c'est Vesce, elle parle. Nous, on vient de la Dérive. Elle tape du talon sur la roche noire. C'est comme ça qu'on l'appelle. Elle dérive. Comme la vôtre, d'ailleurs. Comment vous l'appelez, la vôtre ?",
            ),
            say("brutus", "Terre-Ferme."),
            stage("Nyx rit, un vrai rire, bref."),
            say(
              "nyx",
              "Terre-Ferme. Elle vient de traverser le Clair pour nous rentrer dedans, ta Terre-Ferme.",
            ),
          ]),
          opt(
            "effrite",
            "Votre île s'effrite.",
            [
              say(
                "merlin",
                "(intéressé, pour la première fois) Vous avez mesuré ça ? Comment ?",
              ),
              say(
                "nerea",
                "Dans ma vase. Votre poussière tombe chez nous depuis mille ans.",
              ),
              say(
                "merlin",
                "Mille ans. Il note. Je l'estimais à huit cents. Vous me devez une conversation.",
              ),
            ],
            is("archive_derive", "disponible"),
          ),
        ]),

        // Merlin and the tide.
        say(
          "nerea",
          "Notre lac monte deux fois par jour depuis un mois. C'est vous ?",
        ),
        say(
          "merlin",
          "C'est nous, oui, et c'est très simple, rien de mystérieux : notre île est lourde, elle tire sur tout ce qui l'approche. Mais elle tire plus fort sur ce qui est près que sur ce qui est loin. Votre lac est plus près de nous que le fond de votre île : il se soulève vers nous, un peu, et il retombe quand vos îles tournent. Une marée. Il sourit, ravi. J'adore les marées. On les prévoit à la minute.",
        ),
        say("nerea", "… Je vais devoir réécrire trois siècles de notes."),

        // Merlin measures the hero.
        stage(
          "Merlin s'approche de la jointure, sans la franchir. Il observe le héros, fronce les sourcils, tend son bâton.",
        ),
        say(
          "merlin",
          "Toi. Celui qui n'a rien dit. Il y a quelque chose autour de toi. L'air se courbe, très légèrement, quand tu bouges. Tu permets ? Une mesure. Ça ne fait pas mal. Presque pas.",
        ),
        choice("mesure", [
          opt("vasy", "Vas-y.", [
            fx(set("merlin_mesure"), add("confiance.merlin", 1)),
            stage(
              "Merlin pose le cristal de son bâton contre le poignet du héros, et compte, les yeux fermés, en regardant une petite horloge à eau pendue à sa ceinture.",
            ),
            say(
              "merlin",
              "Ton cœur bat juste. Mais mon horloge et toi n'êtes pas tout à fait d'accord. D'un rien. D'un battement sur mille, peut-être. Comme si quelque chose avait pesé sur ton temps. Il note longuement. Je t'inscris comme une anomalie. Ne le prends pas mal, c'est ce que j'ai de plus beau dans mes carnets.",
            ),
            fx(give("page_de_merlin")),
          ]),
          opt("non", "Non.", [
            fx(add("confiance.nyx", 1)),
            say("merlin", "Dommage. Il note quand même quelque chose."),
            say("nyx", "Il a dit non, Merlin. Il apprend vite."),
          ]),
        ]),

        // The Ghom.
        say(
          "lyra",
          "Ce qui courbe l'air autour de lui, c'est le Ghom. Il l'a touché.",
        ),
        say(
          "merlin",
          "Touché ! Il se tourne vers Lyra, ravi. Vous entendez ça ? À Demeure, j'imagine qu'on vous a dit que le Ghom est immobile. Au-delà du temps.",
        ),
        say("brutus", "C'est ce qu'on dit."),
        say(
          "merlin",
          "Chez nous, on dit l'inverse. On dit que le Ghom est la chose la plus rapide qui soit : un mouvement perpétuel, à la vitesse de la lumière, et que c'est de ce mouvement que vient toute énergie. On nous appelle les Lumineux. Un temps, plus bas, sincère. Et voici le détail amusant : à la vitesse de la lumière, il ne s'écoule aucun temps. Pas une seconde. Votre Doyenne et moi disons peut-être la même chose avec des mots contraires. Ne le lui répétez pas, ça me ferait de la peine d'avoir raison avec elle.",
        ),

        // Nyx and her Ghom.
        say(
          "nyx",
          "Votre Ghom met les mains partout. Il pousse des rochers, il tord le temps, il fait fumer des bois entiers. On l'a vu, de là-haut. Elle montre la Dérive. Le nôtre ne nous touche pas. Jamais. Pas une fois de toute ma vie. C'est pour ça qu'on l'aime bien.",
        ),
        choice("ghom-nyx", [
          opt("aide", "Il ne vous aide jamais ?", [
            say("nyx", "Il ne nous gêne jamais. C'est mieux."),
          ]),
          opt("existe", "Alors comment savez-vous qu'il existe ?", [
            say(
              "nyx",
              "(un temps, déstabilisée, puis un sourire) Bonne question, la chose sans nom. Je ne sais pas. Peut-être qu'il est parti. Peut-être qu'il regarde. Ça m'est égal, tant qu'il ne touche pas.",
            ),
            // ghom_dechu.verite stays at 0; Merlin, behind her, notes something.
          ]),
        ]),
        say(
          "nyx",
          "Si vos îles et les nôtres se collent, votre Ghom va mettre les mains chez nous aussi. Alors on va vous repousser. Ou au moins voir si vous êtes réels.",
        ),
        say("vesce", "On avait dit qu'on regardait d'abord…"),
        say("nyx", "On a regardé."),
        stage("Elle saute de son rocher."),
      ],
    },

    s3: {
      id: "s3",
      title: "La jointure",
      kind: "combat",
      setting: "La Lisière, le sol bouge",
      next: "s4",
      beats: [
        // CUT: the Collision timeline entity (random rocks on the seam), the
        // full Élan gauge of the enemy Ghom, Nyx refusing every Intrication
        // and the hidden "ne pas toucher la jointure" objective.
        { t: "fight", fight: jointure },
        when(is("defaite"), [
          stage(
            "Les Échos de l'île natale cèdent sur la jointure. Nyx n'achève personne : elle recule d'un pas quand le dernier genou touche le sol, et baisse sa lame de verre noir.",
          ),
          say("nyx", "Vous êtes réels. Mais pas assez. Allez."),
          stage(
            "Merlin note quelque chose sur son bâton, puis le range sans commentaire. Vesce, derrière lui, regarde les blessés sans oser approcher. Ils repartent tous vers la Dérive, vivants. Brutus, adossé à son bouclier fendu, regarde la paroi noire s'éloigner.",
          ),
          say(
            "brutus",
            "Ils nous ont laissés partir. Je ne sais pas ce qui est le pire : avoir perdu, ou avoir été épargné.",
          ),
          fx(
            set("nyx_epargnee"),
            set("vesce_fuie"),
            set("vesce_dispersee", false),
            set("defaite", false),
          ),
          go("s5"),
        ]),
      ],
    },

    s4: {
      id: "s4",
      title: "Ce qui reste sur le sol",
      kind: "rencontre",
      setting: "La jointure, après le combat",
      next: "s5",
      beats: [
        when(
          is("nyx_epargnee"),
          [
            // Version A: Nyx spared.
            say("brutus", "Elle s'est enfuie."),
            say("lyra", "Elle est vivante. Ce n'est pas pareil."),
            stage(
              "Nyx a reculé jusqu'à la paroi de la Dérive, une main sur son flanc. Elle regarde le héros. Pas avec colère : avec une sorte de stupeur.",
            ),
            say("nyx", "Tu m'as touchée."),
            stage("Elle regarde sa propre main, ensanglantée."),
            say("nyx", "Personne ne me touche."),
            when(is("ghom_tranquille"), [
              say("nyx", "Ton Ghom s'est tenu tranquille. Pour une fois."),
            ]),
            stage(
              "Elle prend sa lame de verre noir, la regarde, et, d'un geste rapide, entaille le dos de la lame avec une pierre. Une encoche. Puis elle la plante dans le sol de la Lisière, entre les deux îles, et disparaît dans une faille de la Dérive.",
            ),
            stage(
              "Le héros s'approche. Sur le dos de la lame, il n'y a qu'une seule encoche, fraîche, brillante.",
            ),
            say("nerea", "Une seule. Elle n'avait jamais rien compté, avant."),
            choice("lame-a", [
              opt("prendre", "Prendre la lame.", [
                fx(
                  set("objet_de_nyx"),
                  add("confiance.nyx", 1),
                  give("lame_a_une_encoche"),
                ),
                narr(
                  "Elle est froide, et elle pèse moins que je ne pensais. Il n'y a rien d'écrit, juste cette entaille. Je ne sais pas si c'est une menace, un merci ou une question.",
                ),
              ]),
              opt("laisser", "La laisser plantée.", [
                fx(set("objet_de_nyx", false)),
                narr(
                  "Ce n'est pas à moi. Elle reviendra peut-être la chercher.",
                ),
              ]),
            ]),
          ],
          [
            // Version B: Nyx dispersed.
            stage(
              "Nyx tombe sur la jointure. Il n'y a pas d'âme qui s'élève : sa chaleur se répand sur le sol, horizontalement, en une lumière pâle qui court entre les herbes et la roche noire, puis s'éteint. Ce qu'elle était se défait dans tout ce qui l'entoure, et devient illisible.",
            ),
            stage(
              "Le silence. Vesce, si elle est encore là, crie. Merlin a lâché son bâton.",
            ),
            say(
              "merlin",
              "… Je n'ai pas mesuré. Il le dit très bas. Je mesure tout, et je n'ai pas mesuré ça.",
            ),
            say(
              "lyra",
              "(à genoux, les mains au-dessus du sol, sans pouvoir rien faire) Il n'y a plus rien à refermer.",
            ),
            stage("Sa lame est restée sur le sol, sans encoche."),
            choice("lame-b", [
              opt("prendre", "Prendre la lame.", [
                fx(set("objet_de_nyx", false), give("lame_sans_encoche")),
              ]),
              opt("laisser", "La laisser.", []),
            ]),
          ],
        ),

        // Vesce.
        when(is("vesce_rendue"), [
          stage("Vesce est assise contre un rocher, les genoux dans les bras."),
          say(
            "vesce",
            "Ne me touchez pas. Je veux dire, si, soignez-moi, mais ne me touchez pas. Non, touchez-moi. Je ne sais plus.",
          ),
          stage("Lyra la soigne."),
        ]),
        when(is("vesce_dispersee"), [
          stage(
            "Même animation de Dispersion : la chaleur de Vesce se répand sur le sol, puis s'éteint.",
          ),
          when(is("nyx_epargnee"), [
            say("nyx", "Vesce !"),
            stage("Elle ne revient pas."),
          ]),
        ]),
        // SIMPLIFIED: "Vesce fled with Nyx" is merged with "surrendered".
      ],
    },

    s5: {
      id: "s5",
      title: "La question de Brutus",
      kind: "veillee",
      setting: "Le soir, sur la Lisière, côté île natale",
      next: "s6",
      beats: [
        stage(
          "Le soir, sur la Lisière, côté île natale. Un feu petit. La Dérive est une falaise noire juste derrière eux, avec ses cristaux qui scintillent par paires dans la nuit. Personne ne parle beaucoup.",
        ),
        when(
          is("vesce_rendue"),
          [
            stage(
              "Vesce est là, soignée, enroulée dans la cape de Lyra. Elle parle, beaucoup, puis s'endort d'un coup, la bouche ouverte.",
            ),
            say(
              "vesce",
              "… et chez nous on a des Lacunes partout, on dort au bord, Nyx dort même dedans parfois, pas très loin, juste assez pour que plus rien ne la touche, et le matin elle revient et elle a l'air plus fine, comme une feuille qu'on aurait trop lavée, et Merlin dit que c'est dangereux et elle dit que c'est la liberté, et moi je dis que j'ai froid…",
            ),
            stage(
              "Longtemps après qu'elle s'est endormie, sans regarder personne :",
            ),
            say("brutus", "Elle ronfle."),
            say("lyra", "Oui."),
            say("brutus", "Les Lacunaires ne ronflent pas."),
            stage("Silence."),
          ],
          [
            stage(
              "Brutus est assis face à la Dérive. Il a enlevé son bouclier, ce qui ne lui arrive jamais.",
            ),
            say("brutus", "La fille. La jeune. Elle avait peur."),
            say(
              "brutus",
              "J'ai dit que c'étaient des Lacunaires qui avaient pris forme. Je l'ai dit pour que ce soit plus facile.",
            ),
            when(any(isnt("nyx_epargnee"), is("vesce_dispersee")), [
              say("brutus", "Ce n'était pas plus facile."),
            ]),
          ],
        ),
        say(
          "brutus",
          "Écris ça dans ton carnet. Je ne sais pas écrire. Il le dit sans honte. Est-ce qu'ils sont vivants comme nous ? Ceux d'en face. Pareil. Pas un peu moins.",
        ),
        choice("q05", [
          opt("telle", "L'écrire telle quelle.", [
            fx(set("carnet.Q05", "ouverte"), add("confiance.brutus", 1)),
          ]),
          opt(
            "saignent",
            "Ils saignent comme nous. Ils ont peur comme nous. (puis l'écrire)",
            [
              fx(
                set("carnet.Q05", "ouverte"),
                add("confiance.brutus", 1),
                add("confiance", 1),
              ),
              say(
                "brutus",
                "Oui. Mais écris-la quand même. Je veux en être sûr.",
              ),
            ],
          ),
        ]),
        stage(
          "La question s'écrit : Les Échos d'en face sont-ils aussi vivants que les miens ?",
        ),
        when(is("objet_de_nyx"), [
          hub("lame", [
            topic("lame", "La lame", [
              stage("Néréa prend la lame, la tourne vers le feu."),
              say(
                "nerea",
                "Chez les gens du bord, on dit que les Ombres comptent leurs liens. Une encoche par personne qui a compté. Moins on en a, plus on est libre. Elle passe le doigt sur l'entaille. Elle en avait zéro. Elle t'en a fait une.",
              ),
              choice("lame-sujet", [
                opt("pourquoi", "Pourquoi ?", [
                  say(
                    "nerea",
                    "Je lis la vase, pas les Ombres. Mais je dirais qu'une encoche, c'est une couche. Quelque chose s'est déposé en elle. Que ça lui plaise ou non.",
                  ),
                ]),
                opt("rendre", "Je la lui rendrai.", [
                  fx(add("confiance.nyx", 1)),
                ]),
              ]),
            ]),
          ]),
        ]),
      ],
    },

    s6: {
      id: "s6",
      title: "Le trou du milieu",
      kind: "fin",
      setting: "La nuit",
      beats: [
        stage(
          "La nuit. Le héros est réveillé par le silence : plus d'insectes, plus de vent. Au milieu de la Lisière, à cent pas, la jointure entre les deux îles est devenue noire. Pas sombre : absente. Un cercle qui s'élargit lentement, où le sol, des deux côtés, perd sa netteté et s'en va en fils. Les cristaux de la Dérive, sur ses bords, scintillent plus vite, toujours par paires.",
        ),
        say("lyra", "(déjà debout) Une Lacune. Mais… grande. Comme dix bois."),
        say(
          "nerea",
          "Deux bords froids qui se touchent. Deux endroits où plus rien ne se passait. Ils ont fait un trou à deux.",
        ),
        stage(
          "De l'autre côté du cercle, sur la rive de la Dérive, une lumière : le cristal du bâton de Merlin. Sa voix porte dans le silence.",
        ),
        say(
          "merlin",
          "Vous voyez ça ? Moi je mesure. Il grandit d'un pas par heure. Si personne ne fait rien, à l'aube il nous aura séparés. Un temps. Ou réunis. Je n'arrive pas à savoir lequel. C'est passionnant.",
        ),
        narr(
          "Entre nos deux îles, il y a maintenant un endroit où il ne se passe rien. Et ce rien grandit.",
        ),
        fx(give("echarpe_de_poussiere_noire")),
        go(END),
      ],
    },
  },
}
