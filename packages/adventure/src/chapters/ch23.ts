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
  lt,
  opt,
  say,
  set,
  stage,
  topic,
  when,
} from "../dsl"
import type { Beat, Chapter, Cond } from "../types"
import { END } from "../types"
import "./era4kit"

// ─── Helpers ────────────────────────────────────────────────────────────────

/** The scholar of the scene: Merlin IV if he was won over, Tarn otherwise. */
const savant = (text: string): Beat =>
  when(is("merlin_convaincu"), [say("merlin", text)], [say("tarn", text)])

/** a >= b between two counters (the DSL only compares to a number). */
const CAP = 7
const ge = (a: string, b: string): Cond =>
  any(...Array.from({ length: CAP + 1 }, (_, v) => all(is(b, v), gte(a, v))))

// ─── Island ─────────────────────────────────────────────────────────────────

const ISLAND = [
  "...........",
  ".2.......1.",
  "...........",
  "....aa.....",
  "...........",
  ".1.....2...",
  "...........",
  "...2.....1.",
  "...........",
]
const zone = (x: number, y: number) => around(ISLAND, x, y)

// ─── The frieze : one topic for each moment ─────────────────────────────────

const friseTopic = (
  id: string,
  title: string,
  clear: string,
  dark: string,
  cond?: Cond,
  extra: Beat[] = [],
) =>
  topic(
    id,
    title,
    [
      stage(`Faisceau clair. ${clear}`),
      stage(
        `Deux Échos se tiennent sur la même case devant le cristal : une Intrication, la seule lecture assez fine. Faisceau sombre. ${dark}`,
      ),
      ...extra,
      fx(add("frise.lues")),
    ],
    cond ? { if: cond } : {},
  )

// ─── Chapter ────────────────────────────────────────────────────────────────

export const ch23: Chapter = {
  id: "23",
  era: 4,
  number: 23,
  title: "Le couplage réciproque",
  quote: {
    who: "nyx",
    text: "Les Thermistes se sont trompés de sens. Ou plutôt : ils n'ont regardé qu'un sens. Ce que vous nous avez fait, nous vous l'avons fait aussi. Je ne sais pas si c'est une consolation.",
  },
  place: "La Salle des Défauts, sous Haut-Pendant",
  question: { id: "Q23", text: "Qui oriente qui ?" },
  start: "1",
  exploration: {
    island: ISLAND,
    start: { x: 0, y: 3 },
    companions: ["gorr", "brutus", "lyra"],
    influences: ["earthquake", "timeWarp", "blessing"],
    encounters: [
      {
        id: "e1",
        label: "Le puits de corde sous Haut-Pendant",
        scene: "1",
        at: { x: 2, y: 3 },
        zone: zone(2, 3),
      },
      {
        id: "e2",
        label: "La frise des défauts",
        scene: "2",
        at: { x: 4, y: 5 },
        zone: zone(4, 5),
      },
      {
        id: "e3",
        label: "Le silence après la frise",
        scene: "3",
        at: { x: 6, y: 3 },
        zone: zone(6, 3),
      },
      {
        id: "e4",
        label: "Ce qu'il doit",
        scene: "4",
        at: { x: 8, y: 5 },
        zone: zone(8, 5),
      },
      {
        id: "e5",
        label: "La plateforme de Haut-Pendant",
        scene: "5",
        at: { x: 9, y: 2 },
        zone: zone(9, 2),
      },
      {
        id: "lampe",
        label: "Une lampe descendue au bout d'une corde",
        at: { x: 1, y: 7 },
        examine: {
          lines: [
            {
              style: "stage",
              text: "Une lampe pend au bout d'une corde, devant un cristal gros comme une maison. La lumière en ressort changée, découpée, ralentie par des milliers de défauts internes. Les Déliés appellent ça lire.",
            },
          ],
          effects: [{ add: "ecoute", by: 1 }],
        },
      },
      {
        id: "defaut",
        label: "Un cristal fendu",
        at: { x: 5, y: 8 },
        examine: {
          lines: [
            {
              text: "Un cristal garde dans sa structure les traces des contraintes qu'il a subies : chaleur, poussée, lenteur. Chaque défaut est la mémoire d'une force passée.",
            },
          ],
          effects: [{ add: "ecoute", by: 1 }],
        },
      },
      {
        id: "eboulis",
        label: "Un éboulis de cristal",
        at: { x: 10, y: 8 },
        obstacle: {
          influence: "earthquake",
          before: [
            {
              style: "stage",
              text: "Un éboulis de cristal barre un passage de la grotte, entassé de travers.",
            },
          ],
          after: [
            {
              style: "stage",
              text: "Le sol tressaille ; les éclats roulent, et un passage s'ouvre entre les blocs.",
            },
          ],
          effects: [{ add: "ecoute", by: 1 }],
        },
      },
    ],
  },
  scenes: {
    // ── 1 ──
    "1": {
      id: "1",
      title: "La descente",
      kind: "rencontre",
      setting:
        "Un puits de corde sous Haut-Pendant, puis une grotte de cristaux",
      beats: [
        stage(
          "Un puits de corde sous Haut-Pendant, puis une grotte. Les parois sont tapissées de cristaux, certains gros comme des maisons. Ils ne brillent pas d'eux-mêmes : on y descend des lampes, et la lumière en ressort changée, découpée, ralentie par des milliers de défauts internes. Les Déliés appellent ça lire.",
        ),
        stage(
          "Ceux qui sont partis à la lèvre du Bord sont là, assis avec les Déliés. Ils saluent le héros d'un signe de tête. Personne ne se lève.",
        ),
        say(
          "nyx",
          "C'est ici qu'on a compris. Je veux que tu voies ce qu'on a vu. Après, tu feras ce que tu veux. Comme nous.",
        ),
        when(
          is("merlin_convaincu"),
          [
            say(
              "merlin",
              "Merlin, quatrième du nom. Mon ancêtre a cru qu'on pouvait mesurer le monde sans le toucher. Ton passage l'a fait douter ; ma lignée a fait de ce doute une méthode. Tout ce que tu vas voir est mesuré trois fois. Je préviens : je déteste avoir tort, et je le dis quand c'est le cas.",
            ),
          ],
          [
            say(
              "tarn",
              "L'ordre de Merlin a mesuré tout ça il y a deux siècles. Ils ont classé les relevés et ne les ont jamais relus. Néréa et moi, on les a relus.",
            ),
          ],
        ),
        say(
          "nerea",
          "Les cristaux déposent comme un lac. Une contrainte, un défaut. Couche après couche. Je sais lire ça.",
        ),
        when(is("chroniqueur_rejoint"), [
          say(
            "chroniqueur",
            "C'est moi qui ai écrit la Chronique que tu as lue en sortant. Toutes les sources sont ici. Toutes. Je veux dire : toutes celles que j'ai utilisées. Il est possible qu'il y en ait d'autres. Il est même probable. Je lis avec toi.",
          ),
        ]),
        when(is("premier_cristal", "sauve"), [
          stage(
            "Le Premier Cristal, là où l'ère précédente l'a laissé, est apporté dans la Salle et posé au centre.",
          ),
          savant(
            "Celui-là a tout vu depuis l'Aube. C'est notre meilleur témoin.",
          ),
        ]),
        go("2"),
      ],
    },

    // ── 2 ──
    "2": {
      id: "2",
      title: "Les défauts",
      kind: "scene",
      setting:
        "La Salle des Défauts : une frise des grandes actions du Ghom (Archive)",
      beats: [
        stage(
          "La Salle projette une frise des grandes actions du Ghom, de l'Aube à la Fêlure. Pour chaque moment, deux faisceaux sortent du cristal : le clair, ce que l'Influence a fait à l'Archipel, que les Déliés ont toujours lu ; et le sombre, la signature de l'Influence elle-même, sa forme, sa chaleur, sa lenteur, que personne n'avait cherché.",
        ),
        hub("frise", [
          friseTopic(
            "aube",
            "L'Aube",
            "Une première Réparation sur une zone qui s'effilochait.",
            "Une signature brute, sans forme, presque tiède. Comme une main qui n'a encore rien touché.",
            is("premier_cristal", "sauve"),
          ),
          friseTopic(
            "bords-froids",
            "Les bords froids",
            "Les Lacunes repoussées, le Tissu entretenu.",
            "La Réparation suivante rejette sa chaleur plus près : la signature s'est resserrée, au contact des bords froids.",
          ),
          friseTopic(
            "collision",
            "La Collision",
            "Les Fragments qui se touchent.",
            "Le Séisme d'après porte deux motifs mêlés : la roche de l'île, et celle du Fragment du Chaos.",
          ),
          friseTopic(
            "marees",
            "Les Marées",
            "L'île sauvée de l'eau.",
            "La Distorsion d'après est plus lente, plus profonde : elle a la forme des abysses. Elle a pris le pas de l'eau.",
          ),
          friseTopic(
            "strates",
            "Les strates",
            "Les reconstitutions jouées avec Néréa II.",
            "Chaque lecture a laissé une marque dans les deux sens : le Ghom a lu le passé, et le passé lu a refroidi sa signature.",
            gte("archives.lues", 2),
          ),
          friseTopic(
            "mines",
            "Les mines",
            "Les Cristaux brisés, les Lacunes qui grandissent.",
            "Le Séisme d'après est cassant, à facettes : la signature du verre. Plus d'Élan, moins de tenue.",
            gte("cristaux.extraits", 1),
          ),
          friseTopic(
            "rendu",
            "Le Cristal rendu",
            "Une Lacune recousue par un lien donné.",
            "Une signature plus dense, comme si le Ghom tenait mieux là où l'on avait rendu.",
            is("cristal_rendu"),
          ),
          friseTopic(
            "felure",
            "La Fêlure",
            "Vitrelle qui se fend.",
            "Une signature brouillée, inquiète.",
            undefined,
            [
              savant(
                "Je n'ai pas de mot scientifique pour ça. « Inquiète » n'en est pas un. Je le garde quand même.",
              ),
            ],
          ),
          friseTopic(
            "puits",
            "Le Puits",
            "Le héros déposé dans le Puits, à chaque fin d'ère.",
            "Chaque fois, la Distorsion suivante a une lentille plus profonde. Le Ghom a touché le temps le plus lent du Fragment ; le temps lent l'a marqué.",
            undefined,
            [
              when(is("depart.lyra", "aucun"), [
                say(
                  "lyra",
                  "Ce que je répare ici, je le paie ailleurs. Lui aussi. Et là où il paie, ça le change.",
                ),
              ]),
            ],
          ),
        ]),
        savant("Attendez. Ce motif-là. Ce n'est pas le même qu'avant."),
        savant(
          "On a lu le faisceau clair pendant deux siècles. On cherchait ce que le Ghom avait fait. On n'a jamais cherché ce qui lui avait été fait.",
        ),
        when(is("chroniqueur_rejoint"), [
          say(
            "chroniqueur",
            "Je n'ai jamais… Aucune de mes sources ne… Non. Mes sources le disaient. Je ne les lisais que dans un sens.",
          ),
        ]),
        fx(add("archives.lues"), add("usure")),
        go("3"),
      ],
    },

    // ── 3 ──
    "3": {
      id: "3",
      title: "L'autre sens",
      kind: "rencontre",
      setting: "La frise s'éteint, dans le silence de la Salle",
      beats: [
        stage(
          "La frise s'éteint. Dans le silence, le savant parle lentement, pour une fois.",
        ),
        when(
          is("merlin_convaincu"),
          [
            say(
              "merlin",
              "Une interaction n'a pas de sens unique. Quand deux choses se touchent, chacune garde une trace de l'autre. Ce n'est pas une idée de Délié, c'est la base de toute mesure. Mon ancêtre l'a appris au prix de son orgueil : on ne mesure rien sans être perturbé en retour.",
            ),
            say(
              "merlin",
              "Le Ghom a poussé l'Archipel. Les cristaux le montrent, on avait raison. Mais l'Archipel a poussé le Ghom. Chaque Fragment qu'il a touché, chaque eau, chaque cristal, chaque Écho. Ses Influences d'aujourd'hui ne sont pas celles de l'Aube. Elles sont faites de nous.",
            ),
            say(
              "merlin",
              "On ne peut pas agir sur un système sans être modifié par lui. Même un Ghom. Surtout un Ghom : il agit plus que n'importe qui.",
            ),
          ],
          [
            say(
              "tarn",
              "Je disais que tout était écrit, et que c'était le Ghom qui écrivait. On a les deux mains sur la même plume. Je ne sais plus qui écrit.",
            ),
          ],
        ),
        say("nyx", "Donc on l'a taillé aussi."),
        say("nyx", "Ça ne change rien à ce qu'il nous a fait."),
        stage("Un temps."),
        say("nyx", "Ça change à qui on parle."),
        stage(
          "Un Délié âgé, Immobiliste, se lève : « Un dieu immobile ne change pas. Si ça change, ce n'est pas un dieu. » Une jeune Déliée, Lumineuse, lui répond : « Pour ce qui va à la vitesse de la lumière, aucun temps ne passe. Il ne change pas pour lui. Il change pour nous. Ça ne contredit rien. »",
        ),
        savant(
          "Les deux ont une réponse. Les cristaux ne tranchent pas entre elles. Ils disent seulement que, vu d'ici, il a changé. Je ne sais pas ce qu'il est. Je sais ce qu'il a touché.",
        ),
        when(gte("frise.lues", 3), [
          stage(
            "Dans un coin de la Salle, un cristal plus sombre que les autres. Une lampe y descend. La lumière en ressort à peine.",
          ),
          say(
            "nerea",
            "Celle-là, ce n'est pas la signature de ton Ghom. C'est celle d'en face. Le Ghom du Chaos.",
          ),
          say(
            "nerea",
            "Elle change aussi. Elle devient froide. De plus en plus froide, et de plus en plus rare. Il a laissé son Fragment s'éteindre, et le Fragment éteint l'a refroidi en retour. Il s'est fait Lacune lui-même, un peu.",
          ),
          fx(add("ghom_dechu.verite")),
        ]),
        stage(
          "Gorr s'est approché du grand cristal. Sa propre surface renvoie la lumière des lampes. Le reflet tombe sur la frise, et un motif s'y allume : les Séismes des mines, à facettes, et sous eux un motif plus fin, régulier, que personne n'avait remarqué.",
        ),
        savant(
          "Ça… c'est le motif de croissance de Gorr. Il est dans la signature des Séismes, depuis les mines.",
        ),
        when(
          is("gorr_question"),
          [
            say("gorr", "Gorr a changé le Ghom. Le Ghom le sait ?"),
            savant(
              "Personne ne sait ce que sait un Ghom. Personne ne sait s'il sait.",
            ),
            say("gorr", "Alors Gorr garde la question. Gorr a de la place."),
            fx(add("confiance.gorr")),
          ],
          [
            stage(
              "La fissure lumineuse apparue sur son flanc s'élargit. Gorr reste immobile très longtemps. Puis :",
            ),
            say("gorr", "Gorr… a changé le Ghom ?"),
            stage(
              "Toute la salle se tourne vers lui. C'est la première fois qu'il demande quelque chose.",
            ),
            fx(set("gorr_question")),
            when(is("carnet.Q16", "ouverte"), [
              fx(set("carnet.Q16", "repondue")),
            ]),
            say("nyx", "Il a demandé. La pierre a demandé."),
          ],
        ),
        stage("Le Carnet s'ouvre."),
        fx(set("carnet.Q23", "ouverte")),
        stage("Q23 : « Qui oriente qui ? »"),
        go("4"),
      ],
    },

    // ── 4 ──
    "4": {
      id: "4",
      title: "Ce qu'il doit",
      kind: "rencontre",
      setting: "La Salle des Défauts, tous les regards sur le héros",
      beats: [
        stage(
          "Tous regardent le héros. Pas lui : ce qui se tient derrière lui, la pression dans l'air que tout le monde sent depuis qu'il est entré, et qui a fait scintiller les cristaux pendant la lecture.",
        ),
        say(
          "nyx",
          "Tu es le seul qui le touche de l'intérieur. Alors dis-le. Qu'est-ce qu'il nous doit ?",
        ),
        choice("doit", [
          opt("devenu", "« Il vous doit ce qu'il est devenu. »", [
            fx(
              add("confiance", 2),
              add("confiance.nyx"),
              set("carnet.Q23", "repondue"),
            ),
            say("nyx", "C'est beaucoup. C'est même tout."),
          ]),
          opt("autant", "« Il vous doit autant que vous lui devez. »", [
            fx(
              add("confiance"),
              add("confiance.nyx", 2),
              set("carnet.Q23", "repondue"),
            ),
            savant(
              "C'est la seule phrase de la journée que je signerais sans relire.",
            ),
            say(
              "nyx",
              "Je n'aime pas la deuxième moitié. Elle est vraie quand même.",
            ),
          ]),
          opt("rien", "« Il ne doit rien. Il agit, c'est tout. »", [
            fx(add("confiance", -2), add("confiance.nyx", -2)),
            say(
              "nyx",
              "Alors les cristaux mentent, ou tu ne sais pas lire. Je ne sais pas ce qui est pire.",
            ),
          ]),
          opt(
            "taire",
            "Se taire, et laisser la pression derrière lui se manifester.",
            [
              fx(
                add("confiance"),
                add("confiance.nyx"),
                set("carnet.Q23", "repondue"),
              ),
              stage(
                "La pression qui accompagne le héros se retire de la Salle, lentement, pour la première fois depuis l'Aube. Sans elle, les cristaux s'assombrissent d'un cran : tout le monde voit qu'elle les touchait. Les Déliés retiennent leur souffle. Puis la pression revient, plus douce, et les cristaux se rallument, pas tout à fait comme avant.",
              ),
              savant(
                "Vous avez vu ? Ils ne se sont pas rallumés pareil. Elle a touché, elle a été touchée. Ça vient de se refaire sous nos yeux.",
              ),
            ],
          ),
        ]),
        when(is("chroniqueur_rejoint"), [
          say(
            "chroniqueur",
            "Correction à la Chronique de la Frange, troisième note. Le Couplé n'était pas la main du Ghom. Il était l'endroit où les deux se touchaient. Je… je dois tout reprendre. C'est la meilleure nouvelle de ma vie.",
          ),
        ]),
        go("5"),
      ],
    },

    // ── 5 ──
    "5": {
      id: "5",
      title: "L'alliance",
      kind: "fin",
      setting: "La plateforme de Haut-Pendant, le vent",
      beats: [
        stage(
          "On remonte. Sur la plateforme de Haut-Pendant, le vent. Au sud, au-dessus du Bord, une lueur froide.",
        ),
        when(is("fragments", "separation"), [
          stage("C'est le Fragment du Chaos, plus près que jamais."),
        ]),
        when(is("fragments", "fusion"), [
          stage("C'est la vieille soudure qui se fend."),
        ]),
        say(
          "nyx",
          "Le Bord grandit. Le Ghom d'en face pousse. Il ne peut pas toucher le gris, pas plus que le tien, mais il peut l'élargir en éteignant ce qui l'entoure. Si le Bord avale la Frange, il n'y aura plus de bord du tout. Juste du gris. Et on n'y vivra pas longtemps.",
        ),
        say(
          "nyx",
          "Alors je te propose quelque chose. Je n'aime pas ça. Je le propose quand même.",
        ),
        say(
          "nyx",
          "Au Bord, on se bat ensemble. À trois conditions. Tu ne forces personne : pas d'Insistance, jamais. Ton Ghom ne touche aucun Délié, et aucun des tiens qui n'a pas demandé. Et toi, tu viens dans le gris avec moi, quand il le faudra. Tu y ramènes ton Ghom. Je veux voir ce que ça fait, de près, quand c'est moi qui choisis.",
        ),
        fx(set("alliance_nyx", false)),
        choice("alliance", [
          opt("accepte", "« J'accepte. »", [
            when(
              all(
                gte("confiance.nyx", 0),
                any(is("rupture.respectee"), lt("autonomie.insistances", 2)),
                isnt("partant_disperse"),
              ),
              [fx(set("alliance_nyx"))],
              [say("nyx", "Non. Pas encore. Je ne peux pas.")],
            ),
          ]),
          opt(
            "revenir",
            "« J'accepte, si ceux qui sont partis peuvent revenir quand ils le veulent. »",
            [
              when(
                all(
                  gte("confiance.nyx", 0),
                  any(is("rupture.respectee"), lt("autonomie.insistances", 2)),
                  isnt("partant_disperse"),
                ),
                [
                  fx(set("alliance_nyx"), add("confiance.nyx")),
                  say(
                    "nyx",
                    "Ils l'ont toujours pu. C'est toi qui ne le savais pas.",
                  ),
                ],
                [say("nyx", "Non. Pas encore. Je ne peux pas.")],
              ),
            ],
          ),
          opt("non", "« Non. »", [
            say("nyx", "D'accord. Au moins, tu as refusé toi-même."),
          ]),
        ]),
        when(is("alliance_nyx"), [
          stage(
            "Nyx IV tend la main. Elle s'arrête à un doigt, comme à Haut-Pendant. Puis elle touche. C'est le premier contact de l'ère entre eux.",
          ),
          say("nyx", "Ça fait ça, alors."),
          fx(give("objet:le-premier-contact")),
        ]),
        // The imprints, worked out from the flags (ch. 24 and era V).
        stage(
          "L'éclat-témoin garde dans ses défauts un instant du Ghom et un instant de l'Archipel, inséparables. Il montre l'Empreinte de chaque Influence.",
        ),
        fx(give("objet:eclat-temoin")),
        when(
          any(gte("archives.lues", 3), is("transformation.2", "A")),
          [
            fx(set("empreinte.distorsion", "abysses")),
            stage(
              "Distorsion des abysses : retarder un ennemi le retarde de 5 de plus ; avancer un allié l'avance de 5 de moins.",
            ),
          ],
          [
            fx(set("empreinte.distorsion", "puits")),
            stage("Distorsion du Puits : la lentille est plus profonde."),
          ],
        ),
        when(any(is("cristal_rendu"), gte("cristaux.donnes", 1)), [
          fx(set("empreinte.seisme_ancrage")),
          stage(
            "Séisme d'ancrage : le rocher surgi empêche les cases adjacentes de s'effilocher pendant 3 tours.",
          ),
        ]),
        when(gte("cristaux.extraits", 2), [
          fx(set("empreinte.seisme_verre")),
          stage(
            "Séisme de verre : le rocher surgi est un cristal, il se brise au premier coup reçu et rend 1 Élan.",
          ),
        ]),
        when(is("gorr_question"), [
          fx(set("empreinte.seisme_gorr")),
          stage("Séisme de Gorr : le rocher pousse en facettes régulières."),
        ]),
        when(
          all(
            ge("lacunes.habitees", "lacunes.recousues"),
            ge("lacunes.habitees", "lacunes.elargies"),
          ),
          [
            fx(set("empreinte.reparation", "partagee")),
            stage(
              "Réparation partagée : soigne aussi tout Écho, de n'importe quel camp, qui partage une case avec un allié.",
            ),
          ],
          [
            when(
              ge("lacunes.recousues", "lacunes.elargies"),
              [
                fx(set("empreinte.reparation", "serree")),
                stage(
                  "Réparation serrée : +2 au soin ; la chaleur rejetée inflige 1 dégât aux cases adjacentes aux soignés.",
                ),
              ],
              [
                fx(set("empreinte.reparation", "lache")),
                stage(
                  "Réparation lâche : −2 au soin ; la chaleur part dans le Clair ; soigne aussi les Échos neutres.",
                ),
              ],
            ),
          ],
        ),
        go(END),
      ],
    },
  },
}
