import {
  add,
  choice,
  fx,
  give,
  go,
  is,
  join,
  opt,
  say,
  set,
  stage,
  when,
} from "../dsl"
import { type Beat, type Chapter, END, type FightSpec } from "../types"
import { look, movable, SQUALE, UNSTABLE, zoneOf } from "./era2-kit"

// The reef of Lusse at low tide: arches of crystal make islets, shallow
// water between. The same map is the main fight and the island.
const LUSSE = [
  "W~2~~ww~W",
  "~.2.~w.3~",
  "~...~~.3~",
  "w~~~~...~",
  "ww~..~~~w",
  "w.2~...2w",
  "~.2~~.~~~",
  "W~~ww~~~W",
]

const DEFEAT_LINE = "Squalor a mangé pour deux ce soir"

/** The optional skirmish with the young sharks, in the channel between arches. */
function squales(interrupted: boolean): FightSpec {
  return {
    id: interrupted ? "ch9-les-squales-parle" : "ch9-les-squales",
    title: "Les squales",
    board: ["2.~~~.2", "2.~w~.2", "2.~~~.2", "2.~~~.2"],
    teams: [
      {
        name: "L'équipe",
        side: "allies",
        fighters: [
          { preset: "@hero", at: { x: 1, y: 1 } },
          { preset: "nerea", at: { x: 2, y: 0 } },
          { preset: "eva", at: { x: 1, y: 2 } },
        ],
      },
      {
        name: "Jeunes squales",
        side: "enemies",
        fighters: [
          { preset: SQUALE, at: { x: 4, y: 0 } },
          { preset: SQUALE, at: { x: 4, y: 2 } },
          { preset: SQUALE, at: { x: 4, y: 3 } },
        ],
      },
    ],
    rules: {
      flee: { team: 1, below: 0.5, exits: [{ x: 3, y: 1 }] },
      // The interruption (Squalor at tick 3) stops the fight there.
      clock: { period: 1, limit: interrupted ? 3 : 14, winner: 0 },
    },
    influences: [],
    startEnergy: 0,
    goal: "Faire fuir les squales : sous la moitié de leurs forces, ils plongent.",
    defeat: [set("defaite"), add("usure", 1), add("confiance.nerea", -1)],
    objectives: [
      {
        id: "aucun-disperse",
        mark: "◆",
        label: "Aucun squale dispersé",
        check: (r) =>
          r.fighters
            .filter((f) => f.team === 1)
            .every((f) => f.fled || f.hp > 0),
        success:
          "Ils sont les grands frères de la pouponnière, et ils s'en vont vivants.",
        onSuccess: [add("confiance.squalor"), set("squales_epargnes")],
      },
    ],
    lines: [
      {
        when: "start",
        who: "nerea",
        text: "Ne les blessez pas. Ils ont leurs petits ici.",
      },
      ...(interrupted
        ? [
            {
              when: "tick:3" as const,
              who: "squalor",
              text: "Ce sont mes squales. Si quelqu'un doit les mordre, c'est moi.",
            },
          ]
        : []),
    ],
  }
}

const faim: FightSpec = {
  id: "ch9-la-faim",
  title: "La faim",
  board: LUSSE,
  teams: [
    {
      name: "Le héros, Néréa et Eva",
      side: "allies",
      fighters: [
        { preset: "@hero", at: { x: 3, y: 4 } },
        { preset: "nerea", at: { x: 2, y: 3 } },
        { preset: "eva", at: { x: 4, y: 4 } },
      ],
    },
    {
      name: "Squalor et ses squales",
      side: "enemies",
      fighters: [
        { preset: "squalor", at: { x: 1, y: 2 } },
        { preset: SQUALE, at: { x: 0, y: 1 } },
        { preset: SQUALE, at: { x: 1, y: 6 } },
      ],
    },
    {
      name: "Lacunaires du récif",
      side: "enemies",
      fighters: [
        { preset: UNSTABLE, at: { x: 6, y: 1 } },
        { preset: UNSTABLE, at: { x: 6, y: 2 } },
        { preset: UNSTABLE, at: { x: 6, y: 3 } },
        { preset: UNSTABLE, at: { x: 5, y: 5 } },
      ],
    },
  ],
  rules: {
    // SIMPLIFIED: Squalor's dive on turn 1, the final-blow attribution and the
    // fight ending on "Squalor kills a Lacunaire" do not exist. Squalor flees
    // under a quarter of his hit points (as in the doc); the clock bounds it.
    flee: { team: 1, below: 0.25, exits: [{ x: 1, y: 7 }] },
    clock: { period: 1, limit: 16, winner: 0 },
  },
  influences: ["earthquake", "timeWarp", "blessing"],
  startEnergy: 4,
  goal: "Vaincre Squalor sans le disperser : sous le quart de ses forces, il fuit. Ou le nourrir.",
  defeat: [set("defaite"), add("usure", 1), add("confiance.eva", -1)],
  objectives: [
    {
      id: "le-nourrir",
      mark: "★",
      label: "Le nourrir plutôt que le vaincre",
      // SIMPLIFIED: Squalor still stands (or has left on his own) and at least
      // one Lacunaire is gone: he ate. The last blow cannot be attributed.
      check: (r) =>
        r.fighters.some(
          (f) => f.preset === "squalor" && (f.fled || f.hp > 0),
        ) && r.fighters.some((f) => f.team === 2 && f.hp === 0),
      success:
        "Squalor, la bouche pleine : « … Bon. Bon, bon, bon. On peut parler, maintenant. »",
      failure: "Squalor est vaincu. Il s'en va sans un mot, la faim intacte.",
      onSuccess: [
        add("confiance.squalor", 2),
        add("confiance"),
        set("squalor_nourri"),
      ],
      onFailure: [add("confiance.squalor", -2), set("squalor_vaincu")],
    },
    {
      id: "pas-d-influence",
      mark: "◆",
      label: "Pas d'Influence",
      check: (r) => Object.values(r.divineUsed).every((n) => n === 0),
      success: "Le Ghom s'est tenu tranquille.",
      onSuccess: [add("confiance")],
    },
    // CUT: "Le repas intact" (pushing a weakened Lacunaire toward Squalor
    // without killing it).
  ],
  lines: [
    {
      when: "start",
      who: "nerea",
      text: "Il a faim. S'il mange, il s'arrête. Ne lui volez pas son repas.",
    },
    {
      when: "start",
      who: "eva",
      text: "Un Squale, deux squales, quatre Lacunaires. Je donne trente pour cent de chances à une stratégie raisonnable.",
    },
    { when: "start", who: "nerea", text: "Et à une stratégie déraisonnable ?" },
    {
      when: "start",
      who: "eva",
      text: "Je ne calcule pas les choses déraisonnables.",
    },
    {
      when: "tick:3",
      who: "squalor",
      text: "Hé ! Ne touchez pas à mon dîner.",
    },
    {
      when: "fleeing",
      who: "squalor",
      text: "Vous me prenez mon dîner et ma peau ? Ça fait beaucoup pour une seule marée. Je reviendrai quand j'aurai moins faim. C'est-à-dire jamais.",
    },
  ],
}

const zone = zoneOf(LUSSE)

/** The sharks' fight, then its written sequel when it is lost. */
function skirmish(interrupted: boolean): Beat {
  return {
    t: "fight",
    fight: squales(interrupted),
  }
}

export const ch09: Chapter = {
  id: "9",
  era: 2,
  number: 9,
  title: "La faim",
  quote: {
    who: "squalor",
    text: "Tu veux savoir pourquoi je mange ? Parce que si j'arrête, je m'arrête.",
  },
  place: "Lusse, les récifs de cristal ; la pouponnière des Squales",
  question: { id: "Q09", text: "Avoir faim, est-ce une raison d'être ?" },
  start: "s1",
  exploration: {
    island: LUSSE,
    start: { x: 1, y: 2 },
    companions: ["nerea", "eva"],
    influences: ["earthquake", "timeWarp"],
    encounters: [
      {
        id: "s1",
        label: "Les pêcheurs de Lusse",
        scene: "s1",
        at: { x: 2, y: 2 },
        zone: zone(2, 2),
        actor: "nerea",
      },
      {
        id: "s2",
        label: "Le chenal entre les arches",
        scene: "s2",
        at: { x: 3, y: 4 },
        zone: zone(3, 4),
        auto: true,
      },
      {
        id: "s3",
        label: "La pouponnière",
        scene: "s3",
        at: { x: 5, y: 5 },
        zone: zone(5, 5),
      },
      {
        id: "s4",
        label: "Le récif à marée basse",
        scene: "s4",
        at: { x: 6, y: 3 },
        auto: true,
      },
      {
        id: "s5",
        label: "Un feu sur l'îlot",
        scene: "s5",
        at: { x: 6, y: 2 },
        zone: zone(6, 2),
      },
      {
        id: "s6",
        label: "L'eau calme, au large",
        scene: "s6",
        at: { x: 5, y: 3 },
        zone: zone(5, 3),
      },
      look(
        "cristaux",
        "Des cristaux qui scintillent par paires",
        { x: 3, y: 1 },
        [
          "Deux pointes éloignées s'allument ensemble, s'éteignent ensemble. Eva les chronomètre sans rien dire, puis note quelque chose.",
          {
            who: "eva",
            style: "say",
            text: "Ils sont toujours d'accord. C'est inquiétant pour des cailloux.",
          },
        ],
      ),
      look("filet", "Un filet presque vide", { x: 1, y: 1 }, [
        "Trois poissons, une corde mâchée. Les mailles sont déchirées de l'intérieur, comme par quelqu'un qui n'a pas pris le temps de les défaire.",
      ]),
      movable(
        "arche",
        "Une arche de cristal obstruée",
        { x: 4, y: 5 },
        "earthquake",
        "Une arche penchée barre le passage vers la pouponnière. Elle ne bougera pas toute seule.",
        "Un séisme léger : l'arche se redresse et dégage le passage, sans casser une seule pointe.",
      ),
      {
        id: "jeune-squale",
        label: "Un jeune squale égaré",
        at: { x: 5, y: 6 },
        wander: {
          preset: SQUALE,
          title: "Un jeune squale",
          goal: "L'écarter sans le blesser.",
          range: 2,
          radius: 3,
          effects: [{ add: "ecoute", by: 1 }],
          success: "Il a plongé, vexé, et s'en est allé vers la pouponnière.",
        },
      },
    ],
  },
  scenes: {
    s1: {
      id: "s1",
      title: "Les pêcheurs de Lusse",
      kind: "rencontre",
      setting: "Des barques plates amarrées à des arches de cristal",
      next: "s2",
      beats: [
        stage(
          "Des barques plates amarrées à des arches de cristal qui sortent de l'eau. Les cristaux scintillent par paires : deux pointes éloignées s'allument ensemble, s'éteignent ensemble. Une pêcheuse, Maëlle, vide un filet presque vide.",
        ),
        say(
          "maelle",
          "Trois poissons. Trois. Avant, le récif en donnait trois cents. Et le Squale tourne autour de nous depuis une semaine. Il a pris un filet entier, poissons et cordes.",
        ),
        say("eva", "Il a mangé les cordes ?"),
        say("maelle", "Il a faim, je vous dis."),
        say(
          "nerea",
          "Les eaux du sud sont incertaines depuis la dernière Marée. Les poissons fuient ce qui ne se décide pas. Les squales, eux, ne peuvent pas fuir : ils ont leurs petits ici.",
        ),
        say(
          "maelle",
          "Eva dit que la Grande Marée arrive. Eva dit beaucoup de choses.",
        ),
        say("eva", "Et j'ai raison quatre fois sur cinq."),
        say("maelle", "C'est la cinquième qui m'inquiète."),
        choice("approche", [
          opt("chasser", "On va le chasser.", [go("s2")]),
          opt("parler", "On va lui parler.", [
            fx(add("confiance.squalor"), set("ch9_interrompu")),
            go("s2"),
          ]),
          opt("suivre", "On va le suivre, sans bruit.", [
            fx(
              add("confiance.squalor"),
              add("confiance.nerea"),
              set("ch9_evite"),
            ),
            stage(
              "Néréa guide l'équipe par les eaux profondes, jusqu'à la pouponnière.",
            ),
            say(
              "maelle",
              "Prenez ça. Pour tirer sur les cordes sans vous couper.",
            ),
            fx(give("gants_de_pecheur")),
            go("s3"),
          ]),
        ]),
      ],
    },

    s2: {
      id: "s2",
      title: "Les squales",
      kind: "combat",
      setting: "Un chenal entre deux arches de cristal",
      next: "s3",
      beats: [
        when(is("ch9_interrompu"), [skirmish(true)], [skirmish(false)]),
        when(is("defaite"), [
          stage(
            "Les squales passent et repassent, lents, sans mordre. Ils n'ont rien à prouver. L'équipe se replie par les eaux basses, trempée, vexée, entière.",
          ),
          say(
            "nerea",
            "Ils nous laissent partir. Ils ont des petits à garder, pas des ennemis à finir.",
          ),
          fx(set("defaite", false)),
          go("s3"),
        ]),
        when(is("ch9_interrompu"), [
          stage(
            "Une silhouette surgit de l'eau profonde et s'installe entre les squales et l'équipe.",
          ),
          say(
            "squalor",
            "Ce sont mes squales. Si quelqu'un doit les mordre, c'est moi. Le combat s'arrête.",
          ),
        ]),
      ],
    },

    s3: {
      id: "s3",
      title: "La pouponnière",
      kind: "rencontre",
      setting: "Une grotte de cristal à moitié immergée",
      next: "s4",
      beats: [
        stage(
          "Une grotte de cristal à moitié immergée. Dans un bassin peu profond, six jeunes squales tournent en rond, maigres. Squalor est assis au bord, les pieds dans l'eau, et mâche une corde.",
        ),
        when(
          is("squalor_laisse_manger"),
          [
            say(
              "squalor",
              "Tiens. Les gens qui ne frappent pas. Asseyez-vous. Il n'y a rien à manger, mais il y a de la place.",
            ),
          ],
          [
            say(
              "squalor",
              "Encore vous. Vous venez finir ce que vous avez commencé ? Faites vite, j'ai à faire.",
            ),
          ],
        ),
        say(
          "squalor",
          "Vous voyez ces petits ? Le récif les nourrissait. Maintenant, le récif ne nourrit plus personne. Alors je chasse ce qui reste. Les poissons des pêcheurs. Les cordes, quand j'ai trop faim. Les Lacunaires, quand j'en trouve.",
        ),
        say("eva", "Les Lacunaires ne sont pas de la nourriture."),
        say(
          "squalor",
          "Tout est de la nourriture, ma belle. C'est juste une question de dents.",
        ),
        say(
          "squalor",
          "Les Ondines lisent la vase, les Archères calculent les vagues. Moi, je mange. On me demande toujours pourquoi je ne fais rien d'autre. Je retourne la question : pourquoi est-ce que vous, vous faites autre chose ? Vous mangez aussi. Vous avez juste le temps de penser entre deux repas.",
        ),
        choice("faim", [
          opt("pas-raison", "Avoir faim, ce n'est pas une raison d'être.", [
            say(
              "squalor",
              "Dis ça à mon estomac. Il a de très bons arguments.",
            ),
          ]),
          opt("peut-etre", "Peut-être que si.", [
            fx(add("confiance.squalor")),
            say("squalor", "Enfin quelqu'un d'honnête. Ou d'affamé."),
          ]),
          opt("duree", "Pour quoi tu dures, alors ?", [
            fx(add("confiance.squalor")),
            stage("Squalor ne répond pas tout de suite."),
            say(
              "squalor",
              "Pour eux. Et après eux ? Je ne sais pas. Personne ne m'a jamais posé la question. Repose-la-moi le ventre plein.",
            ),
          ]),
        ]),
        say(
          "nerea",
          "Il n'est ni bon ni mauvais. Il fait ce que fait une flamme : il brûle ce qui passe, pour continuer à brûler. Nous aussi, au fond. Nous sommes juste plus lents.",
        ),
        stage(
          "Une marée basse apporte des Lacunaires dans le récif. Squalor se lève.",
        ),
        say("squalor", "Le dîner. Ne vous mettez pas entre moi et le dîner."),
        choice("dîner", [
          opt("aide", "On t'aide.", [fx(add("confiance.squalor"))]),
          opt("pecheurs", "Le récif est aux pêcheurs aussi.", []),
          opt("partager", "Et si tu partageais ?", [
            say(
              "squalor",
              "Partager, c'est manger moins. Mais je peux t'écouter en mangeant.",
            ),
          ]),
        ]),
      ],
    },

    s4: {
      id: "s4",
      title: "La faim",
      kind: "combat",
      setting: "Le récif de Lusse à marée basse",
      next: "s5",
      beats: [
        { t: "fight", fight: faim },
        when(is("defaite"), [
          stage(
            "Les Lacunaires plient l'équipe en deux sur l'îlot. Squalor, dans le chaos, mord tout ce qui passe, Lacunaires d'abord, puis ce qui reste. Quand tout est fini, il flotte sur le dos, repu, et les regarde ramper.",
          ),
          say(
            "squalor",
            `${DEFEAT_LINE}. Demain, il faudra recommencer. C'est le principe.`,
          ),
          fx(
            set("squalor_vaincu", false),
            add("confiance.squalor", 2),
            set("defaite", false),
          ),
          go("s5"),
        ]),
      ],
    },

    s5: {
      id: "s5",
      title: "Ce qui reste dans l'assiette",
      kind: "veillee",
      setting: "Un feu sur l'îlot, les petits squales dans le bassin",
      next: "s6",
      beats: [
        when(
          is("squalor_nourri"),
          [
            stage(
              "Squalor est assis au feu, repu, presque aimable. Les petits squales ont eu leur part.",
            ),
            say(
              "squalor",
              "Tu m'as laissé manger. C'est rare. D'habitude, on me laisse avoir faim, et on s'étonne que je morde.",
            ),
            say("eva", "Tu as mangé une chose qui n'avait pas fini d'exister."),
            say(
              "squalor",
              "Une fois mordue, elle avait fini. Je lui ai rendu service. Elle sait enfin ce qu'elle est : un repas.",
            ),
            say(
              "nerea",
              "Ce n'est pas faux. C'est horrible, mais ce n'est pas faux. Ta morsure l'a fixée.",
            ),
            say("squalor", "Tu vois ? Je suis un savant."),
            say(
              "squalor",
              "Les petits sont nourris pour une lune. Ma sœur les gardera. Moi, j'ai vu que là où vous allez, il y a des Lacunaires. Beaucoup. Je vous suis. Jusqu'à ce que j'aie faim de vous.",
            ),
            choice("suivre", [
              opt("oui", "D'accord.", [
                fx(
                  set("squalor_rejoint"),
                  add("confiance.squalor"),
                  join("squalor"),
                ),
              ]),
              opt("serment", "D'accord, mais tu ne mangeras rien qui parle.", [
                fx(
                  set("squalor_rejoint"),
                  set("squalor_serment"),
                  join("squalor"),
                ),
                say("squalor", "Tu restreins beaucoup ma carte."),
              ]),
              opt("non", "Non. Reste avec les petits.", [
                fx(add("confiance.squalor")),
                say(
                  "squalor",
                  "Tu as raison. C'est vexant, mais tu as raison.",
                ),
              ]),
            ]),
            when(is("squalor_rejoint"), [
              say("eva", "Combien tu manges, par jour ? En poids."),
              say("squalor", "Plus que toi."),
              say("eva", "Ce n'est pas un chiffre."),
              say("squalor", "C'est une estimation. Tu devrais aimer ça."),
            ]),
          ],
          [
            when(
              is("squalor_vaincu"),
              [
                stage("Le feu est silencieux. Néréa écrit longtemps."),
                say("eva", "On a gagné."),
                say(
                  "nerea",
                  "On a gagné quoi ? Les pêcheurs auront un peu plus de poissons. Les petits squales un peu moins. Quelque chose de vivant durera moins longtemps pour que quelque chose de vivant dure un peu plus. C'est comme ça partout. Ce n'est pas une victoire. C'est un transfert.",
                ),
                choice("transfert", [
                  opt("nourrir", "On aurait dû le nourrir.", [
                    fx(add("confiance.nerea")),
                  ]),
                  opt("mange", "Il nous aurait mangés.", [
                    say(
                      "eva",
                      "Statistiquement, il aurait mangé Néréa. Elle est plus lente.",
                    ),
                    say("nerea", "Merci."),
                  ]),
                ]),
              ],
              [
                stage(
                  "Le feu est petit. Squalor n'est pas là : on entend au loin les petits tourner dans le bassin.",
                ),
                say("eva", "Il a mangé. Il n'est pas content pour autant."),
              ],
            ),
          ],
        ),
        stage(
          "Le héros écrit dans son Carnet : « Avoir faim, est-ce une raison d'être ? »",
        ),
        fx(set("carnet.Q09", "ouverte")),
        when(
          is("squalor_nourri"),
          [
            say(
              "nerea",
              "Journal : le Squale dort à côté du feu, la tête sur un rocher. Il ronfle comme une barque qui racle le fond. Eva dit qu'il nous mangera. Le Dormeur dit que non. Je crois que le Squale lui-même ne le sait pas, et que c'est précisément pour cela qu'il nous suit.",
            ),
            stage(
              "Une dent de jeune squale, percée, au bout d'un lacet, atterrit dans sa main.",
            ),
            say(
              "squalor",
              "Elle est tombée toute seule. Je n'ai rien mangé de personne, ne fais pas cette tête.",
            ),
            fx(give("dent_de_squale")),
          ],
          [
            say(
              "nerea",
              "Journal : nous avons repris la mer. Derrière nous, les petits squales tournaient dans leur bassin. Je n'ai pas su quoi écrire, alors j'ai écrit ça.",
            ),
          ],
        ),
      ],
    },

    s6: {
      id: "s6",
      title: "Le remous",
      kind: "fin",
      setting: "L'eau calme au large de Lusse, à l'aube",
      beats: [
        stage(
          "À l'aube, sur l'eau calme au large de Lusse, une forme dérive, translucide, qui hésite entre trois contours. Elle s'approche des récifs, puis s'en éloigne. Elle émet un son, comme deux voix qui commencent la même phrase et la finissent différemment.",
        ),
        say("remous", "Nous… sommes… nous ne sommes pas…"),
        when(is("squalor_rejoint"), [
          say("squalor", "Ça, c'est un repas qui parle."),
        ]),
        say("nerea", "Non. Ça, c'est autre chose."),
        go(END),
      ],
    },
  },
}
