import {
  add,
  choice,
  fx,
  give,
  go,
  is,
  join,
  narr,
  opt,
  say,
  set,
  stage,
  when,
} from "../dsl"
import { type Beat, type Chapter, END, type FightSpec } from "../types"
import { DEDOUBLE, look, UNSTABLE, zoneOf } from "./era2-kit"

// Peut-Être: the western half is settled (sand, rocks), the eastern half
// toward the small Lacune is not. The same map is the fight and the island.
const PEUT_ETRE = [
  ".12...~~W",
  ".1.......",
  ".........",
  "..1......",
  ".........",
  "~.....a..",
  "~~.......",
  "W~~..~~WW",
]

const DEFEAT_LINE = "La moitié qui reste est celle qui nous a eus"

const ile: FightSpec = {
  id: "ch8-l-ile-indecise",
  title: "L'île indécise",
  board: PEUT_ETRE,
  teams: [
    {
      name: "Le héros, Néréa et Eva",
      side: "allies",
      fighters: [
        { preset: "@hero", at: { x: 1, y: 3 } },
        { preset: "nerea", at: { x: 1, y: 4 } },
        { preset: "eva", at: { x: 0, y: 2 } },
      ],
    },
    {
      name: "Lacunaires de Peut-Être",
      side: "enemies",
      fighters: [
        { preset: UNSTABLE, at: { x: 6, y: 1 } },
        { preset: UNSTABLE, at: { x: 7, y: 3 } },
        { preset: UNSTABLE, at: { x: 6, y: 5 } },
        { preset: DEDOUBLE, at: { x: 7, y: 2 } },
        { preset: DEDOUBLE, at: { x: 7, y: 4 } },
      ],
    },
    {
      name: "Squalor",
      side: "enemies",
      // He comes in at tick 4 (time 40) by the south-west.
      fighters: [
        { preset: "squalor", at: { x: 1, y: 7 }, arrives: { time: 40 } },
      ],
    },
  ],
  rules: {
    // SIMPLIFIED: Squalor leaves under half his hit points; "after two Lacunaires eaten" does not
    // exist, nor the Superposition layer and the recoherence around the Lacune.
    flee: { team: 2, below: 0.5, exits: [{ x: 5, y: 7 }] },
  },
  influences: [],
  startEnergy: 0,
  goal: "Vaincre les Lacunaires. Squalor ne compte pas : il part de lui-même.",
  defeat: [set("defaite"), add("usure", 1), add("confiance.eva", -1)],
  objectives: [
    {
      id: "carte-complete",
      mark: "★",
      label: "Une carte complète",
      // SIMPLIFIED: the uncertain cells do not exist; nobody falling and the
      // Lacunaires all gone stand for "every cell fixed".
      check: (r) =>
        r.result === "victory" &&
        r.fighters.filter((f) => f.team === 0).every((f) => f.hp > 0),
      success:
        "Carte complète. Eva la roule dans son étui avec une fierté mal cachée.",
      failure: "Il manque des cases. Eva déteste qu'il manque des cases.",
      onSuccess: [add("confiance.eva"), set("ch8_carte")],
    },
    {
      id: "laisser-manger",
      mark: "◆",
      label: "Laisser manger Squalor",
      check: (r) => r.fighters.some((f) => f.preset === "squalor" && f.fled),
      success: "Squalor a mangé, puis il a replongé de lui-même.",
      failure: "Squalor a été frappé : il s'en souviendra.",
      onSuccess: [add("confiance.squalor"), set("squalor_laisse_manger")],
      onFailure: [add("confiance.squalor", -1), set("squalor_frappe")],
    },
    // CUT: "Pas de flèche perdue" (a dédoublé has no empty candidate position
    // in the game, so Eva cannot shoot one).
  ],
  lines: [
    {
      when: "start",
      who: "nerea",
      text: "N'oubliez pas : on ne gagne rien à les regarder. Il faut les toucher.",
    },
    {
      when: "tick:1",
      who: "eva",
      text: "J'ai touché. Il n'était juste pas là. Enfin, peut-être. Je note.",
    },
    {
      when: "tick:3",
      who: "squalor",
      text: "Ne vous gênez pas pour moi. Moi, je ne me gêne pas pour vous.",
    },
    {
      when: "tick:5",
      who: "eva",
      text: "Tiens. Ma flèche fait le travail de vos cailloux. Au moins une chose qui m'obéit.",
    },
    {
      when: "fleeing",
      who: "squalor",
      text: "Le repas est fini. On se reverra, viande sèche.",
    },
    {
      when: "end",
      who: "eva",
      text: "Il manque des cases, ou il n'en manque pas. Dans les deux cas, je déteste ça.",
    },
  ],
}

const zone = zoneOf(PEUT_ETRE)

export const ch08: Chapter = {
  id: "8",
  era: 2,
  number: 8,
  title: "L'île indécise",
  quote: {
    who: "eva",
    text: "J'ai touché la cible. Ce n'était juste pas la cible que je visais.",
  },
  place: "L'île indécise (Peut-Être), à une demi-journée de barque de Sauge",
  question: {
    id: "Q08",
    text: "Une chose a-t-elle un état avant qu'on la touche ?",
  },
  start: "s1",
  exploration: {
    island: PEUT_ETRE,
    start: { x: 0, y: 3 },
    companions: ["nerea"],
    influences: ["earthquake"],
    encounters: [
      {
        id: "s1",
        label: "Le camp d'Eva",
        scene: "s1",
        at: { x: 2, y: 3 },
        zone: zone(2, 3),
        actor: "eva",
      },
      {
        id: "s2",
        label: "Le chemin des galets",
        scene: "s2",
        at: { x: 4, y: 4 },
        zone: zone(4, 4),
      },
      {
        id: "s3",
        label: "L'est de l'île, qui ne se décide pas",
        scene: "s3",
        at: { x: 5, y: 3 },
        auto: true,
      },
      {
        id: "s4",
        label: "Le creux au cœur de l'île",
        scene: "s4",
        at: { x: 6, y: 2 },
        zone: zone(6, 2),
      },
      {
        id: "s5",
        label: "Un feu sur la plage fixée",
        scene: "s5",
        at: { x: 3, y: 6 },
        zone: zone(3, 6),
      },
      look("souche", "La souche d'Eva", { x: 3, y: 1 }, [
        "Une souche qui tremble entre deux formes : une souche, un rocher. Elle porte trois flèches, plantées côté rocher.",
      ]),
      look("ardoises", "Les ardoises d'Eva", { x: 0, y: 4 }, [
        "Des ardoises couvertes de chiffres, rayées, reprises. En marge, au charbon : « donnée manquante ».",
        {
          who: "eva",
          style: "say",
          text: "Ne touchez pas. C'est dans un ordre que moi seule comprends.",
        },
      ]),
      look("plage", "La plage qui ondule", { x: 1, y: 5 }, [
        "Le sable et l'eau se superposent, comme une image mal réglée. Un galet jeté dessus la fige un instant, puis la plage reprend son ondulation.",
      ]),
      {
        id: "dedouble",
        label: "Un Lacunaire dédoublé",
        at: { x: 5, y: 6 },
        wander: {
          preset: DEDOUBLE,
          title: "Un Lacunaire dédoublé",
          goal: "Le toucher : l'autre position disparaîtra.",
          range: 2,
          radius: 3,
          effects: [{ add: "ecoute", by: 1 }],
          success:
            "Il s'est défait là où on l'a touché. L'autre place est restée vide.",
        },
      },
    ],
  },
  scenes: {
    s1: {
      id: "s1",
      title: "Le camp d'Eva",
      kind: "rencontre",
      setting: "Une barque échouée sur une plage qui ondule",
      next: "s2",
      beats: [
        stage(
          "Une barque échouée sur une plage qui ondule, mi-sable mi-eau, comme une image mal réglée. Des piquets, des cordes, des ardoises couvertes de chiffres. Une archère, assise sur un tonneau, vise une souche à vingt pas. La souche tremble entre deux formes : une souche, un rocher. Eva tire. La flèche se plante dans… un rocher. Elle soupire.",
        ),
        say(
          "eva",
          "Quarante-deux pour cent. C'était écrit : quarante-deux pour cent rocher. Et ça tombe sur rocher. Évidemment. Ça tombe toujours sur ce qui m'arrange le moins.",
        ),
        say("nerea", "Ça ne tombe pas toujours sur rocher."),
        say("eva", "Non. Mais je m'en souviens mieux."),
        stage("Elle remarque le héros."),
        say(
          "eva",
          "C'est lui ? Le Dormeur ? Il est plus petit que dans le chant.",
        ),
        choice("accueil", [
          opt("petit", "Je suis plus petit que dans tout.", [
            fx(add("confiance.eva")),
          ]),
          opt("calculs", "Que calcules-tu ?", [
            fx(add("confiance.eva")),
            say(
              "eva",
              "Les Marées. Leur heure, leur hauteur, leur direction. J'avais tout, à la minute près. Et puis l'île est devenue indécise, et mes tables avec. Il me manque une donnée. Je suis venue la chercher.",
            ),
          ]),
          opt("souche", "Pourquoi tires-tu sur une souche ?", [
            say("eva", "Parce qu'elle ne se décide pas. J'ai voulu la forcer."),
          ]),
        ]),
        say(
          "eva",
          "Pendant trois jours, je l'ai fixée des yeux. Une archère sait regarder. Si la souche devait se décider pour quelqu'un, c'était pour moi.",
        ),
        say("nerea", "Et ?"),
        say("eva", "Et rien. Elle s'en moque."),
        choice("regard", [
          opt("yeux", "Les yeux ne touchent rien.", demo()),
          opt("fort", "Peut-être que tu ne regardais pas assez fort.", [
            fx(add("confiance.eva")),
            stage("Eva rit, malgré elle."),
          ]),
          opt("galet", "Lancer un galet sur la souche.", demo()),
        ]),
        when(is("transformation.1", "A"), [
          say(
            "eva",
            "Et lui ? Ses yeux luisent. Il voit dans le noir. Il ne fixerait pas les choses, lui ?",
          ),
          say(
            "nerea",
            "Il voit mieux la lumière faible. Il en reçoit plus. Il n'en envoie pas. Regardez.",
          ),
          stage("Le héros fixe une flaque incertaine. Rien."),
          say("eva", "Bon. Les légendes non plus ne servent à rien."),
        ]),
      ],
    },

    s2: {
      id: "s2",
      title: "Le chemin des galets",
      kind: "lacune",
      setting: "Six cases incertaines entre deux rochers fixés",
      next: "s3",
      beats: [
        stage(
          "Pour rejoindre le centre de l'île, un passage de six cases incertaines entre deux rochers fixés. Le héros a quatre galets. Eva en a deux de plus, si on les lui demande.",
        ),
        choice(
          "chemin",
          [
            opt(
              "prudente",
              "Fixer d'abord la case la plus probable, puis la suivante.",
              [
                stage(
                  "Un galet sur la case de gauche, qui tient à quatre chances sur cinq. Un autre ensuite.",
                ),
                say("eva", "Commencer par le plus probable. Évidemment."),
              ],
            ),
            opt("hardie", "Marcher sans galet.", [
              stage(
                "Le héros pose le pied sur la première case. Elle tient. La deuxième aussi. La troisième cède, un instant, puis revient.",
              ),
              say(
                "nerea",
                "Vous comptez sur la chance. Elle ne compte pas sur vous.",
              ),
            ]),
            opt(
              "inventive",
              "Demander à Néréa un Raz-de-marée au-dessus de la rangée.",
              [
                stage(
                  "La vague touche trois cases d'un coup et les fixe toutes. Une tombe en eau ; Néréa la traverse à la nage et tend la main.",
                ),
                say(
                  "nerea",
                  "Prenez ma main. Je suis meilleure pour les trous qui sont pleins d'eau.",
                ),
              ],
            ),
          ],
          "Un chemin de six cases, quatre galets.",
        ),
        say("eva", "Moi aussi j'ai essayé de la regarder méchamment."),
        narr(
          "Il n'y a pas d'échec ici, seulement des galets dépensés et des pieds mouillés.",
        ),
      ],
    },

    s3: {
      id: "s3",
      title: "L'île indécise",
      kind: "combat",
      setting: "L'est de l'île, vers la Lacune",
      next: "s4",
      beats: [
        { t: "fight", fight: ile },
        when(is("defaite"), [
          stage(
            "Les Lacunaires les repoussent jusqu'à la plage fixée. Squalor, lui, a déjà plongé : il a mangé ce qu'il pouvait et s'est servi du désordre. Eva, essoufflée, regarde les cases qu'elle n'a pas pu fixer.",
          ),
          say("eva", `Carte à moitié faite. ${DEFEAT_LINE}.`),
          say(
            "nerea",
            "La Lacune est jeune. Elle ne nous attendra pas, mais elle ne s'en ira pas non plus.",
          ),
          stage(
            "Ils reprennent leur souffle près du feu, puis retournent au cœur de l'île, plus lentement.",
          ),
          fx(set("defaite", false)),
          go("s4"),
        ]),
      ],
    },

    s4: {
      id: "s4",
      title: "Le cœur",
      kind: "lacune",
      setting: "Un creux où l'air ne bouge pas",
      next: "s5",
      beats: [
        stage(
          "Au centre de l'île, un creux où l'air ne bouge pas, où le sable ne crisse plus, où même le bruit de la mer paraît loin. Une petite Lacune, de la taille d'une barque. Le Tissu y est si lâche que les bords tremblent entre plusieurs formes.",
        ),
        stage(
          "Quelque chose bouge au fond : un remous de matière qui n'a pas de forme. Il ne fuit pas, n'attaque pas. Il dérive vers le large et disparaît.",
        ),
        say(
          "nerea",
          "Une Lacune jeune. Si on la laisse, elle grandira. Si on la soigne, elle se refermera.",
        ),
        say("eva", "Et si on s'assoit dedans ?"),
        say(
          "nerea",
          "À deux, il paraît que ça tient. Les anciens disent qu'on n'y va qu'à deux.",
        ),
        when(
          is("lacune_geante_habitee"),
          [
            say(
              "nerea",
              "Au Seuil, on fait comme ça depuis quatre siècles. Ça tient.",
            ),
          ],
          [say("nerea", "Au Trou, personne ne l'a jamais fait.")],
        ),
        choice("coeur", [
          opt(
            "recoudre",
            "Recoudre : planter des pilotis, allumer un feu, y faire passer les barques.",
            [
              fx(
                add("lacunes.recousues"),
                add("confiance.nerea"),
                set("peut_etre", "recousue"),
              ),
            ],
          ),
          opt(
            "elargir",
            "Élargir : ne rien faire, laisser la Lacune s'étendre.",
            [
              fx(
                add("lacunes.elargies"),
                add("confiance.squalor"),
                set("peut_etre", "elargie"),
              ),
              narr(
                "Squalor y chassera mieux. D'autres remous comme celui-ci naîtront.",
              ),
            ],
          ),
          opt(
            "habiter",
            "Habiter à deux : rester sur la même case, au cœur, avec un Écho.",
            [
              fx(add("lacunes.habitees"), set("peut_etre", "habitee")),
              choice("echo", [
                opt("nerea", "Néréa", [fx(add("confiance.nerea"))]),
                opt("eva", "Eva", [fx(add("confiance.eva"))]),
              ]),
              stage(
                "Trois tours, côte à côte, pendant que les cases voisines se défont et que les galets les retiennent. L'île reste fragile, mais stable.",
              ),
            ],
          ),
        ]),
        say(
          "eva",
          "Le remous, tout à l'heure. Il n'avait pas de forme. Il avait… plusieurs brouillons.",
        ),
      ],
    },

    s5: {
      id: "s5",
      title: "Les tables d'Eva",
      kind: "veillee",
      setting: "Un feu sur la plage enfin fixée",
      beats: [
        stage(
          "Un feu sur la plage enfin fixée. Eva étale ses ardoises. Le héros ouvre son Carnet.",
        ),
        say(
          "eva",
          "Tout se calcule. Une flèche, c'est un angle, une force, du vent. Une Marée, c'est le Clair, les Fragments, les courants. Il suffit d'avoir toutes les données.",
        ),
        say("nerea", "Et ici ?"),
        say(
          "eva",
          "Ici, il me manque une donnée. Je ne sais pas laquelle. C'est pire que de ne pas savoir : c'est savoir qu'on ne sait pas.",
        ),
        choice("donnee", [
          opt("pas-de-donnee", "Peut-être qu'il n'y a pas de donnée cachée.", [
            say("eva", "Ne dis pas de bêtises. Il y a toujours une donnée."),
          ]),
          opt("vise-bien", "Tu vises bien. Ça ne te suffit pas ?", [
            fx(add("confiance.eva")),
            say("eva", "Viser, ce n'est pas choisir où ça tombe."),
          ]),
          opt("viens", "Viens avec nous.", [fx(add("confiance.eva"))]),
        ]),
        say(
          "eva",
          "Je viens. Pas pour vous : pour la donnée. Et parce que la Tour a besoin de quelqu'un qui revienne avec une réponse, et que je préfère que ce soit moi.",
        ),
        fx(join("eva"), set("eva_rejointe")),
        say(
          "nerea",
          "Tu sais que les Ondines ont toujours trouvé les Archères arrogantes ?",
        ),
        say(
          "eva",
          "Et les Archères ont toujours trouvé les Ondines lentes. Vous avez mis trois cents ans à remarquer que le Lac était devenu une fosse.",
        ),
        say("nerea", "Deux cent quatre-vingts. Et nous l'avons noté."),
        when(is("squalor_laisse_manger"), [
          say(
            "eva",
            "Le requin. Il reviendra. Il avait faim comme on a faim quand on ne sait pas faire autre chose.",
          ),
        ]),
        stage(
          "Le héros écrit dans son Carnet : « Une chose a-t-elle un état avant qu'on la touche ? »",
        ),
        fx(set("carnet.Q08", "ouverte")),
        say(
          "nerea",
          "Journal : Eva nous a rejoints. Elle a recalculé trois fois la probabilité que nous survivions jusqu'à la Grande Marée, et elle refuse de nous dire le résultat. Le Dormeur a demandé si une chose a un état avant qu'on la touche. Je ne savais pas répondre. J'ai dit : « Demain. » C'est ce que disent les Ondines quand elles ne savent pas, et cela marche presque toujours, parce que demain finit par arriver.",
        ),
        stage(
          "Des bottes de peau de squale, montantes, cousues serré, attendent près de la barque. Eva les pousse du pied vers lui.",
        ),
        fx(give("bottes_de_vase")),
        when(is("ch8_carte"), [
          say("eva", "Comme ça, tu auras au moins un calcul juste sur toi."),
          stage(
            "Elle noue un bandeau de toile à son front : l'angle d'un tir parfait y est noté à l'encre. Puis elle sort une plaque de nacre gravée, copie de sa carte des Lacunes.",
          ),
          fx(give("bandeau_d_archere"), give("carte_des_lacunes")),
        ]),
        go(END),
      ],
    },
  },
}

function demo(): Beat[] {
  return [
    fx(add("confiance.nerea")),
    stage(
      "Le galet roule contre la souche. Elle se fixe : souche, cette fois.",
    ),
    say(
      "nerea",
      "Vos yeux reçoivent la lumière qui vient de la souche. Ils ne lui envoient rien. Le galet, lui, la cogne. C'est ça qui compte : qu'il se passe quelque chose entre elle et le reste du monde.",
    ),
    say("eva", "Donc une archère est moins utile qu'un caillou."),
    say("nerea", "Ici, oui."),
    say("eva", "Je vais l'écrire. Avec rancune."),
  ]
}
