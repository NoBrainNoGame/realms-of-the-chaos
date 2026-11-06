import {
  add,
  all,
  any,
  choice,
  fx,
  give,
  go,
  gte,
  is,
  narr,
  not,
  opt,
  say,
  set,
  stage,
  when,
} from "../dsl"
import type { Beat, Chapter, FightSpec } from "../types"
import {
  ALLY_COND,
  type Ally,
  allyFighter,
  archive,
  BRUTUS3,
  byAlly,
  CHRONIQUEUR,
  HALLEBARDIER,
  kitOf,
  LYRA3,
  look,
  MERLIN3,
  place,
} from "./era3-kit"

const HABITANTS = kitOf("lyra", "habitants", "Habitants", "Groupe", {
  health: 1,
  speed: 2,
})

const BOARD = [
  "####.....####",
  "#...........#",
  "..1...a...1..",
  "..1..aaa..1..",
  ".....aba.....",
  "..1..aaa..1..",
  "..1...a...1..",
  "#...........#",
  "####.....####",
]

const GROUPES = [
  { x: 0, y: 2 },
  { x: 0, y: 3 },
  { x: 0, y: 5 },
  { x: 2, y: 4 },
  { x: 11, y: 6 },
  { x: 3, y: 7 },
]

function evacuation(
  ally: Ally,
  rallie: boolean,
  merlin: boolean,
  portes: boolean,
): FightSpec {
  const allies = [
    { preset: "@hero" as const, at: { x: 4, y: 8 } },
    { preset: LYRA3, at: { x: 5, y: 8 } },
    { preset: "gorr" as const, at: { x: 6, y: 8 } },
    ...allyFighter(ally, { x: 7, y: 8 }),
  ]
  if (rallie) allies.push({ preset: CHRONIQUEUR, at: { x: 8, y: 8 } })
  if (merlin) allies.push({ preset: MERLIN3, at: { x: 4, y: 7 } })
  const garde = [
    { preset: BRUTUS3, at: { x: 6, y: 0 } },
    { preset: HALLEBARDIER, at: { x: 2, y: 1 } },
    { preset: HALLEBARDIER, at: { x: 10, y: 1 } },
  ]
  return {
    id: `ch18-evacuation-${ally}-${rallie ? "c" : "n"}-${merlin ? "m" : "x"}-${portes ? "o" : "f"}`,
    title: "L'évacuation",
    goal: "Faire sortir au moins trois groupes d'habitants avant que la place ne s'effondre. La Fêlure est l'adversaire.",
    board: BOARD,
    teams: [
      { name: "Alliés", side: "allies", fighters: allies },
      // `portes`: Brutus opened the gates, the Garde leads people out.
      {
        name: "La Garde",
        side: portes ? "allies" : "enemies",
        fighters: garde,
      },
      {
        name: "Les habitants",
        side: "neutral",
        // The groups follow the hero (a scripted walk).
        // CUT: autonomous groups (Odile, Tobin, Pia, Corin), the Fêlure growing in steps, Pont de cristal, Rendre,
        // lampadaires. Habitants are neutral units that must survive.
        fighters: GROUPES.map((at) => ({
          preset: HABITANTS,
          at,
          script: [{ act: { do: "follow", team: 0, index: 0 } }],
        })),
      },
    ],
    rules: {
      neutral: [2],
      clock: { period: 1, limit: 12, winner: 0 },
      ...(portes
        ? {}
        : { flee: { team: 1, below: 0.3, exits: [{ x: 6, y: 0 }] } }),
      announce: true,
    },
    influences: ["earthquake"],
    startEnergy: 3,
    defeat: [set("defaite"), add("usure")],
    objectives: [
      {
        id: "evacues",
        mark: "◆",
        label: "Évacuer au moins trois groupes d'habitants",
        check: (r) =>
          r.fighters.filter((f) => f.preset === "habitants" && f.hp > 0)
            .length >= 3,
        success: "Au moins trois groupes sont dehors.",
        onSuccess: [add("vitrelle_evacues", 3)],
      },
      {
        id: "tous",
        mark: "◆",
        label: "Les six groupes sortent",
        check: (r) =>
          r.fighters.filter((f) => f.preset === "habitants" && f.hp > 0)
            .length >= 6,
        onSuccess: [add("vitrelle_evacues", 3), add("confiance", 2)],
      },
    ],
    lines: [
      {
        when: "start",
        who: "lyra",
        text: "On ne sauve pas la ville. On sauve les gens. La ville, elle, on la laisse partir.",
      },
      { when: "tick:1", who: "gorr", text: "Passe. Gorr tient." },
      {
        when: "tick:3",
        who: ally === "squalor" ? "squalor" : "eva",
        text:
          ally === "squalor"
            ? "Le pont tombe. Si quelqu'un sait nager, c'est le moment. Moi je sais."
            : "Pont coupé. Tout le monde par le nord. Probabilités… non. Courez.",
      },
      {
        when: "tick:5",
        who: "brutus",
        text: portes
          ? "Sortez. Doucement. Personne ne pousse. Personne ne reste."
          : "Pas encore. Personne n'est encore là.",
      },
    ],
  }
}

function evacuationBeat(): Beat {
  const make = (ally: Ally, rallie: boolean): Beat =>
    when(
      is("merlin_convaincu"),
      [
        when(
          is("brutus_portes_ouvertes"),
          [{ t: "fight", fight: evacuation(ally, rallie, true, true) }],
          [{ t: "fight", fight: evacuation(ally, rallie, true, false) }],
        ),
      ],
      [
        when(
          is("brutus_portes_ouvertes"),
          [{ t: "fight", fight: evacuation(ally, rallie, false, true) }],
          [{ t: "fight", fight: evacuation(ally, rallie, false, false) }],
        ),
      ],
    )
  return when(
    is("chroniqueur_rejoint"),
    [byAlly((a) => make(a, true))],
    [byAlly((a) => make(a, false))],
  )
}

// ─── Rendre ─────────────────────────────────────────────────────────────────

const lienNom = (
  nom: string,
  quand: ReturnType<typeof gte>,
  lines: Beat[],
): Beat =>
  when(all(is("nom", "aucun"), quand), [
    ...lines,
    choice(`nom-${nom}`, [
      opt("souvenir", "Je m'en souviendrai.", [
        fx(add("nom.propositions"), add(`confiance.${nom}`)),
      ]),
      opt("non", "Non.", [narr("La proposition est retirée.")]),
    ]),
  ])

function manniere(valeur: "A" | "B"): Beat {
  return fx(set("transformation.3", valeur))
}

const rendreChoix = choice("rendre", [
  opt(
    "premier",
    "Rendre le Premier Cristal.",
    [
      say(
        "chroniqueur",
        "La plus vieille archive vivante de l'Archipel. Si on la rend, personne ne pourra plus la lire. Mais tout ce qu'elle reliait reliera de nouveau quelque chose.",
      ),
      fx(
        set("cristal_rendu", "premier"),
        add("cristaux.donnes"),
        add("lacunes.recousues"),
        add("cristaux.gardes", -1),
      ),
    ],
    is("premier_cristal", "sauve"),
  ),
  opt("lien", "Rendre le Cristal du lien.", [
    say(
      "lyra",
      "Ce serait… rendre ce qu'on a tissé. Le lien ne disparaîtra pas. On ne l'aura plus dans la main, c'est tout.",
    ),
    fx(
      set("cristal_rendu", "lien"),
      add("cristaux.donnes"),
      add("lacunes.recousues"),
    ),
  ]),
  opt(
    "gorr",
    "Accepter une part de Gorr.",
    [
      say("gorr", "Gorr croît. Gorr donne… un peu. Gorr repousse."),
      say("lyra", "Tu ne repousseras pas tout, Gorr. Rien ne repousse tout."),
      say("gorr", "… Un peu, Gorr repousse."),
      fx(
        set("cristal_rendu", "gorr"),
        add("cristaux.donnes"),
        add("lacunes.recousues"),
      ),
    ],
    any(gte("confiance.gorr", 3), is("gorr_question")),
  ),
  opt("rien", "Ne rien rendre.", [
    say("lyra", "On n'a rien rendu. On a pris jusqu'au bout."),
    fx(set("cristal_rendu", "aucun"), set("transformation.3", "A")),
  ]),
])

const manniereChoix = when(not(is("cristal_rendu", "aucun")), [
  choice("maniere", [
    opt(
      "seul",
      "Seul, contre soi : serrer le Cristal contre sa poitrine en le donnant.",
      [
        stage(
          "La poussière de cristal qui jaillit de la Fêlure entre dans ses veines.",
        ),
        manniere("A"),
      ],
    ),
    opt("deux", "À deux mains, avec un autre : tendre le Cristal ensemble.", [
      stage("Le verre qui se forme sur leurs paumes ne casse pas."),
      manniere("B"),
    ]),
  ]),
])

const ISLAND = [
  "............",
  ".1......1...",
  "............",
  "...1........",
  "............",
  "........11..",
  "............",
  "..1.........",
]

export const ch18: Chapter = {
  id: "18",
  era: 3,
  number: 18,
  title: "La Fêlure",
  quote: {
    who: "merlin",
    text: "Ce qui ne bouge pas ne plie pas. Ce qui ne plie pas casse.",
  },
  place:
    "Vitrelle : la Haute-Ville, la place du Registre, les Portes, le Pont de l'Est ; enfin la Salle du Puits",
  question: {
    id: "Q18",
    text: "Le monde a-t-il besoin de nous pour avoir un sens ?",
  },
  start: "1",
  exploration: {
    island: ISLAND,
    start: { x: 0, y: 0 },
    companions: ["lyra"],
    influences: ["earthquake"],
    encounters: [
      place(ISLAND, "ville", "La ville qui craque", "1", 1, 1),
      place(ISLAND, "portes", "Les Portes", "2", 4, 3),
      place(ISLAND, "porche", "Le porche", "3", 2, 6),
      place(ISLAND, "place", "La place du Registre", "4", 8, 4, { auto: true }),
      place(ISLAND, "vent", "Le premier vent", "5", 10, 6),
      place(ISLAND, "puits", "Le Puits", "6", 11, 7),
      look(
        "facade",
        "Une façade fendue",
        { x: 6, y: 1 },
        "Une ligne blanche, fine, qui court du toit au sol. Derrière, une table dressée.",
      ),
      look(
        "lampadaire",
        "Un lampadaire à Cristal",
        { x: 5, y: 5 },
        "Il éclaire encore. La fissure passe à un pas de son pied.",
      ),
      look(
        "avis",
        "Un avis affiché",
        { x: 9, y: 1 },
        "« Restez chez vous. Le Registre vous informera. » Le papier est encore humide de colle.",
        "narr",
      ),
      {
        id: "garde",
        label: "Un Hallebardier des Portes",
        at: { x: 3, y: 4 },
        wander: {
          preset: HALLEBARDIER,
          title: "Un garde des Portes",
          goal: "Le convaincre de ne pas barrer la rue.",
          range: 2,
          radius: 3,
          effects: [{ add: "ecoute", by: 1 }],
          success: "Le garde baisse sa hallebarde et regarde la fissure.",
        },
      },
    ],
  },
  scenes: {
    "1": {
      id: "1",
      title: "La ville qui craque",
      kind: "rencontre",
      setting: "La Haute-Ville",
      beats: [
        stage(
          "La Haute-Ville. Les tours de verre chantent : un son aigu, continu, comme un doigt mouillé sur le bord d'un verre. Des lignes blanches courent sur les façades. Derrière les parois, les habitants sont toujours assis à leur table. Ils regardent les fissures. Ils ne bougent pas.",
        ),
        archive(
          "Avis à la population, affiché à 6 heures",
          "« Des fissures sont constatées. Elles sont mesurées. Restez chez vous. Le Registre vous informera. »",
          "« Le Registre ne vous informera pas. Sortez. — C. »",
        ),
        when(is("merlin_convaincu"), [
          say(
            "merlin",
            "Le verre ne se déforme pas, il n'a aucune souplesse. Quand le sol bouge sous lui, il ne peut pas suivre : il casse. Et le sol bouge, parce que dessous, le Tissu est troué partout où nous avons miné. Tant que le Gel tenait tout immobile, la tension s'accumulait sans rien dire. Le Gel faiblit. Elle parle.",
          ),
        ]),
        when(is("chroniqueur_rejoint"), [
          say(
            "chroniqueur",
            "Regardez le tracé. Il passe par la Basse-Ville, par la Mine, par la Fonderie. Il relie nos Lacunes comme un enfant relie des points.",
          ),
        ]),
        when(is("lampadaire_brise"), [
          stage(
            "Une fissure part exactement de l'endroit où l'on a brisé les lampadaires. Personne ne le fait remarquer. Le joueur le voit.",
          ),
        ]),
        say(
          "lyra",
          "Ils ne bougent pas. Ils attendent qu'on leur dise. Personne ne leur a rien dit depuis trois cents ans, à part « restez ».",
        ),
        stage(
          "Le héros regarde une maison où une femme est assise, immobile, pendant que la paroi se fend au-dessus de sa tête.",
        ),
        narr(
          "Q03 trouve sa réponse. Si tout est fixé, sommes-nous encore vivants ? Non. Un vivant est une forme traversée par un flux ; figée, elle ne vit plus, elle dure.",
        ),
        narr(
          "Q13 trouve sa réponse. Une vie sans questions est-elle une vie ? La cité sans questions ne vivait plus. Elle tenait, c'est tout.",
        ),
        fx(set("carnet.Q03", "repondue"), set("carnet.Q13", "repondue")),
        choice("paroi", [
          opt("sortez", "Sortez !", [
            stage("La femme le regarde. Elle ne comprend pas le mot."),
          ]),
          opt("voulez", "Vous voulez sortir ?", [
            stage("La femme le regarde. Puis, lentement, elle se lève."),
            say("lyra", "Tu vois. Une question. Pas un ordre."),
            fx(add("confiance")),
          ]),
        ]),
      ],
      next: "2",
    },
    "2": {
      id: "2",
      title: "Les Portes",
      kind: "rencontre",
      setting: "Deux battants de verre trempé, hauts comme quatre hommes",
      beats: [
        stage(
          "Les Portes de Vitrelle : deux battants de verre trempé, hauts comme quatre hommes, fermés depuis le Gel. Devant, Brutus III et une ligne de Hallebardiers.",
        ),
        say(
          "brutus",
          "Personne ne sort. Dehors, il fait froid, il y a le Clair, il y a des Lacunes. Ici, il y a des murs.",
        ),
        stage(
          "Il ne regarde pas l'équipe. Il regarde la fissure qui monte le long des battants.",
        ),
        say(
          "brutus",
          "Mes ancêtres gardaient un village où rien ne changeait. Demeure, ça s'appelait. Puis ils sont venus au nord, avec les Thermistes, pour arrêter les Marées. On me l'a raconté quand j'étais petit. Ils disaient que c'était pour protéger. J'ai fait pareil. J'ai tout figé, pour qu'ils soient en sécurité.",
        ),
        stage("Un temps."),
        say("brutus", "Et c'est ce qui les tue."),
        when(
          is("merlin_convaincu"),
          [
            say(
              "merlin",
              "Capitaine. Ouvrez. Ce n'est pas un ordre : je n'ai plus d'ordres. C'est une mesure.",
            ),
            stage("Brutus ouvre."),
            fx(set("brutus_portes_ouvertes")),
          ],
          [
            when(
              gte("confiance.brutus", 3),
              [
                choice("poutre", [
                  opt(
                    "poutre",
                    "Tu as tenu une poutre pour tes mineurs. Pas un mur.",
                    [
                      stage("Il ferme les yeux."),
                      say("brutus", "… Une poutre, ça plie. Un mur, ça casse."),
                      stage("Il pose la main à plat sur le battant."),
                      say("brutus", "Ouvrez."),
                      fx(set("brutus_portes_ouvertes")),
                    ],
                  ),
                ]),
              ],
              [
                choice("portes", [
                  opt("ouvre", "Ouvre, Brutus.", [
                    say("brutus", "Non."),
                    stage(
                      "Il lève son bouclier. Les Portes resteront fermées au début du combat.",
                    ),
                  ]),
                  opt("protege", "Qu'est-ce que tu protèges, exactement ?", [
                    stage("Long silence."),
                    say("brutus", "Je ne sais plus."),
                    narr(
                      "Les Portes restent fermées, mais Brutus III pourra être convaincu en combat.",
                    ),
                    fx(add("confiance.brutus")),
                  ]),
                ]),
              ],
            ),
          ],
        ),
      ],
      next: "3",
    },
    "3": {
      id: "3",
      title: "Ce qu'on peut rendre",
      kind: "veillee",
      setting:
        "Un abri sous un porche, pendant qu'une tour s'effondre lentement au loin",
      beats: [
        stage(
          "Un abri sous un porche, pendant qu'une tour s'effondre lentement au loin, presque en silence. L'équipe se compte.",
        ),
        stage(
          "Lyra III ouvre la main du héros. Dans sa paume, il y a un petit Cristal, clair, qui n'y était pas hier. Il bat doucement, par paires.",
        ),
        say(
          "lyra",
          "Les vieux disaient que les liens forts laissent des cristaux. Que c'est comme ça qu'ils se forment, au fond des mines : des gens qui ont tenu ensemble, il y a très longtemps. Je ne les croyais pas. Celui-là, il est à nous.",
        ),
        narr("Ce qu'on rendra au monde se décidera au cœur de la Fêlure."),
        lienNom("lyra", gte("confiance.lyra", 3), [
          say(
            "lyra",
            "Tu n'as pas de nom. Dans ma famille, on donne aux enfants le nom de ce qu'on a réussi à réparer. J'en ai un pour toi : Reprise. C'est le point qui refait un tissu troué, fil par fil, sans qu'on voie où il a cédé.",
          ),
        ]),
        when(
          all(
            is("nom", "aucun"),
            is("gorr_question"),
            gte("confiance.gorr", 3),
          ),
          [
            stage("Gorr pose un doigt de cristal sur la poitrine du héros."),
            say("gorr", "Chaud."),
            stage("Un temps."),
            say("gorr", "Toi : Chaud."),
            stage("Tout le monde comprend que c'est un nom."),
            choice("nom-gorr", [
              opt("souvenir", "Je m'en souviendrai.", [
                fx(add("nom.propositions"), add("confiance.gorr")),
              ]),
              opt("non", "Non.", [narr("La proposition est retirée.")]),
            ]),
          ],
        ),
      ],
      next: "4",
    },
    "4": {
      id: "4",
      title: "L'évacuation",
      kind: "combat",
      setting: "La place du Registre, au cœur de la Haute-Ville",
      beats: [
        stage(
          "La place du Registre. Au centre, le cœur de la Fêlure : un cratère gris où la ville s'ouvre. Autour, un anneau de creux qui s'effondre. Au nord, les Portes ; à l'est, le Pont de l'Est, qui sera coupé. Six groupes d'habitants attendent qu'on leur dise quoi faire.",
        ),
        rendreChoix,
        manniereChoix,
        evacuationBeat(),
        when(is("defaite"), [
          stage(
            "Le sol glisse. Le héros tombe dans une case devenue Lacune, la Fêlure ne l'achève pas : elle l'avale à moitié et le recrache plus loin, vidé. Gorr le tire par le bras. Lyra paie.",
          ),
          fx(set("defaite", false)),
        ]),
        when(is("chroniqueur_rejoint"), [
          say(
            "chroniqueur",
            "Je n'écris plus. Je porte des gens. J'ai écrit qu'on ne pouvait pas faire les deux. C'était faux aussi.",
          ),
        ]),
        when(is("merlin_convaincu"), [
          say(
            "merlin",
            "Le froid une dernière fois. Pour retenir, pas pour figer. La nuance a l'air mince. Elle ne l'est pas.",
          ),
        ]),
        when(is("lacunaire.forme", "recif"), [
          stage(
            "Gorr s'arrête, touche du bout du doigt les plaques calcaires de l'épaule de Corin.",
          ),
          say("gorr", "Lui… pierre aussi ?"),
          say("corin", "Nous… je ne sais pas. Un peu."),
          say("gorr", "Un peu, c'est bien."),
          fx(add("confiance.gorr")),
        ]),
      ],
      next: "5",
    },
    "5": {
      id: "5",
      title: "Le premier vent",
      kind: "rencontre",
      setting: "Hors des murs, au bord du Fragment",
      beats: [
        stage(
          "Après l'effondrement de la place. L'équipe, hors des murs, ou sur ce qu'il en reste. Les habitants évacués sont assis dans l'herbe rase, au bord du Fragment. Il y a de l'air qui bouge. L'air chaud de la ville fendue monte par les fissures, l'air froid du Gel descend : pour la première fois depuis trois siècles, il y a une différence de température, et donc un courant.",
        ),
        when(gte("vitrelle_evacues", 3), [
          say("pia", "C'est ça ? C'est ça, le vent ?"),
          choice("pia", [
            opt("oui", "Oui.", [stage("Elle rit.")]),
            opt("pense", "Qu'est-ce que tu en penses ?", [
              say(
                "pia",
                "Que ça pousse. Que ça pousse tout. Que rien ne reste pareil.",
              ),
              stage("Elle a l'air ravie."),
              fx(add("confiance")),
            ]),
          ]),
        ]),
        narr(
          "Q15 trouve sa réponse. Que perd-on quand un lien devient une ressource ? Le lien lui-même. On l'a brûlé pour durer, et le Tissu s'est effiloché là où l'on minait, jusqu'à ce que la ville tombe dedans.",
        ),
        fx(set("carnet.Q15", "repondue")),
        say(
          "lyra",
          "Le Collège disait qu'on ne perdait rien. On perdait ce qui tenait la ville. On ne le voyait pas, parce que ça ne se mesure pas en chaleur.",
        ),
        when(is("cristal_rendu", "premier"), [
          say(
            "chroniqueur",
            "La plus vieille archive de l'Archipel est dans le sol, maintenant. Personne ne la lira plus.",
          ),
          stage("Un temps."),
          say(
            "chroniqueur",
            "Elle fait mieux que d'être lue. Elle tient quelque chose.",
          ),
        ]),
        when(is("cristal_rendu", "lien"), [
          stage("Lyra regarde sa main vide, puis celle du héros."),
          say(
            "lyra",
            "Je le sens encore. Ce n'était pas le Cristal, le lien. Le Cristal, c'était sa trace.",
          ),
        ]),
        when(is("cristal_rendu", "gorr"), [
          stage("Gorr a une entaille claire au flanc, là où il s'est donné."),
          say("gorr", "Gorr moins."),
          stage("Un temps."),
          say("gorr", "Gorr pas moins. Gorr… ailleurs aussi."),
        ]),
        stage(
          "La ville fendue, derrière eux, au soleil. Elle est belle, même cassée. Surtout cassée.",
        ),
        when(
          is("chroniqueur_rejoint"),
          [
            say(
              "chroniqueur",
              "Si Vitrelle tombe, et que personne ne l'écrit… est-ce que ça aura voulu dire quelque chose ?",
            ),
          ],
          [
            when(
              is("merlin_convaincu"),
              [
                say(
                  "merlin",
                  "Si personne ne mesure cette chute, aura-t-elle eu lieu ?",
                ),
                say(
                  "merlin",
                  "Si, bien sûr. La pierre n'a pas besoin de moi pour tomber. C'est autre chose que je demande.",
                ),
              ],
              [
                say(
                  "lyra",
                  "Si personne ne regarde, est-ce que ça compte ? Je crois que oui. Mais pas de la même façon.",
                ),
              ],
            ),
            // The Chroniqueur never joined: Q14 is answered here instead.
            fx(set("carnet.Q14", "repondue")),
          ],
        ),
        fx(set("carnet.Q18", "ouverte")),
        stage(
          "Q18 entre au Carnet : Le monde a-t-il besoin de nous pour avoir un sens ?",
        ),
        when(is("brutus_portes_ouvertes"), [
          stage(
            "Brutus III s'assoit dans l'herbe, retire son casque de verre.",
          ),
          say(
            "brutus",
            "Le vent. Il fait froid, il fait chaud, ça change tout le temps. C'est… inconfortable.",
          ),
          stage("Un temps."),
          say(
            "brutus",
            "Il va falloir protéger autre chose. Quelque chose qui bouge. Je ne sais pas comment on fait.",
          ),
        ]),
      ],
      next: "6",
    },
    "6": {
      id: "6",
      title: "Le Puits",
      kind: "fin",
      setting: "La Salle du Puits, sous la place effondrée",
      beats: [
        stage(
          "La Fêlure a continué de descendre. Sous la place effondrée, à travers les étages de verre brisé, on voit la Salle du Puits, et, plus bas, la lueur rouge et immobile de l'amas dense : la Pierre Lente, comme disaient les ondines. La cuve de verre du héros a éclaté. Le Puits, lui, est toujours là : rien de ce qui arrive aux villes ne l'atteint.",
        ),
        stage(
          "Le héros sent une pression dans l'air, lente, comme un temps qui s'épaissit. Le Ghom. Personne ne le dit. Tout le monde le sent.",
        ),
        say("lyra", "Tu y retournes. Tu reviendras dans combien ?"),
        choice("adieu-lyra", [
          opt("sais-pas", "Je ne sais pas.", [
            say(
              "lyra",
              "Alors je ne t'attendrai pas. Je soignerai des gens. C'est mieux que d'attendre. Mais je raconterai à mes enfants qu'il faut garder une lampe à huile, au cas où.",
            ),
          ]),
          opt("longtemps", "Longtemps.", [
            say(
              "lyra",
              "Alors ce ne sera pas moi. Ce sera une autre, avec mon nom. Sois gentil avec elle. Elle sera sûrement aussi têtue.",
            ),
          ]),
        ]),
        when(ALLY_COND.eva, [
          say("eva", "Probabilité de te revoir : nulle. Je parie quand même."),
        ]),
        when(ALLY_COND.squalor, [
          say("squalor", "Je garde l'eau pour toi. Elle bougera, maintenant."),
        ]),
        when(is("chroniqueur_rejoint"), [
          say(
            "chroniqueur",
            "Je vais tout écrire. Deux fois. Une version pour ceux qui veulent croire, une pour ceux qui veulent vérifier. Et je les relierai ensemble, pour qu'on ne puisse pas lire l'une sans voir l'autre.",
          ),
        ]),
        when(is("merlin_convaincu"), [
          say(
            "merlin",
            "Je vais baisser le Gel. Lentement, une saison à la fois. Pas l'éteindre : on retomberait dans les Marées. Trouver le bord, entre les deux. Je n'ai pas de mesure pour ça. Je vais devoir essayer.",
          ),
          stage(
            "Il lui tend la Toise ; elle est fendue en deux depuis la Fêlure. Il en garde une moitié.",
          ),
          say(
            "merlin",
            "L'autre moitié est pour le prochain qui me ressemble. Dites-lui de s'en servir comme d'une canne, pas comme d'une règle.",
          ),
        ]),
        say(
          "brutus",
          "Je protège ceux-là, maintenant. Dehors. Ça bouge tout le temps, dehors.",
        ),
        stage("Gorr reste le dernier. Il ne dit rien un long moment."),
        say("gorr", "Toi, dormir."),
        say("gorr", "Gorr, pas dormir. Gorr croît."),
        stage("Un temps."),
        say("gorr", "Gorr attend."),
        choice("adieu-gorr", [
          opt("long", "Ce sera très long, Gorr.", [
            say("gorr", "Long."),
            stage(
              "Il regarde le ciel, qui commence à se couvrir : les premiers nuages depuis trois siècles.",
            ),
            say("gorr", "Gorr… aime long."),
          ]),
          opt("souvenir", "Tu te souviendras de moi ?", [
            say("gorr", "Gorr garde. Dans Gorr."),
            narr(
              "Pas un souvenir : une forme. Le cristal garde la trace de ce qu'il a traversé.",
            ),
          ]),
          opt("main", "Poser la main sur son flanc, sans rien dire.", [
            stage(
              "Le cristal est tiède. Sous la main, la vibration lente. Et une autre, plus rapide, qui n'était pas là au ch. 15 : un rythme qu'il a appris de quelqu'un.",
            ),
            fx(add("confiance.gorr")),
          ]),
        ]),
        stage(
          "Le héros descend dans la Fêlure. Les sons d'en haut montent dans les aigus et s'accélèrent ; la lumière du ciel bleuit. Là-haut, de plus en plus vite, les nuages passent, les saisons passent, la ville fendue se couvre de mousse. Le dernier plan, vu d'en bas : une silhouette de cristal gris-vert, au bord du gouffre, qui ne bouge pas, et qui pourtant grandit à vue d'œil. Gorr croît. Gorr attend.",
        ),
        when(is("transformation.3", "B"), [
          stage(
            "Mains de verre. Les paumes et les doigts du héros sont devenus d'un verre souple, tiède, qui ne casse pas.",
          ),
        ]),
        when(not(is("transformation.3", "B")), [
          stage(
            "Veines de cristal. Sous la peau des bras et du cou, de fines veines claires luisent quand le héros fait un effort.",
          ),
          fx(set("transformation.3", "A")),
        ]),
        when(
          is("chroniqueur_rejoint"),
          [
            archive(
              "Rapport n° 312-0441, Bureau du Classement",
              "« Objet : Vitrelle. Classement demandé : ville ouverte. 1. Constat : la cité s'est fendue le 3 du mois des Vents (mois créé ce jour, faute de nom pour ce qui souffle). Des groupes d'habitants sont sortis. Ils ne savent pas encore où aller. Ils posent des questions. 2. L'anomalie 0-PUITS-1 est redescendue dans le Puits. Elle n'est plus classée. Elle n'a jamais été une anomalie : c'est notre registre qui en était une. 3. Mesures recommandées : aucune. Regarder ce qui pousse. »",
              "« — Le Chroniqueur »",
            ),
          ],
          [
            stage(
              "Rapport n° 312-0441, Bureau du Classement. « Objet : fissures. Les fissures sont mesurées. Les habitants sont priés de rester chez eux. Le Registre les informera dès que la cause aura été classée. Le Bureau rappelle que les questions ne sont pas interdites, mais que la sécurité publique exige que »",
            ),
            narr(
              "Le texte s'arrête au milieu de la ligne. La page suivante est blanche.",
            ),
          ],
        ),
        when(gte("vitrelle_evacues", 3), [
          fx(give("habit:col-des-vents")),
          stage(
            "Habit : Col des Vents. Une bande de toile cousue à la hâte par les évacués, du premier tissu qu'ils ont trouvé : elle claque au vent. +1 Chance.",
          ),
        ]),
        fx(give("habit:eclat-de-vitrelle")),
        stage(
          "Habit : Éclat de Vitrelle. Un éclat de façade, poli par le frottement, porté en pendentif. Il renvoie la lumière par moments, sans qu'on sache d'où. « On voit à travers. Tout passe. »",
        ),
        go("$end"),
      ],
    },
  },
}
