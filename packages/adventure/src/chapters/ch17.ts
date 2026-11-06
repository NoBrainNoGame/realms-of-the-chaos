import { CHARACTERS } from "@realms/engine"
import {
  add,
  all,
  any,
  choice,
  fx,
  give,
  go,
  gte,
  hub,
  is,
  join,
  lt,
  narr,
  not,
  opt,
  say,
  set,
  stage,
  topic,
  when,
} from "../dsl"
import type { Beat, Chapter, Cond, FightSpec } from "../types"
import {
  ALLY_COND,
  type Ally,
  allyFighter,
  BRUTUS3,
  byAlly,
  CHRONIQUEUR,
  HALLEBARDIER,
  LYRA3,
  look,
  MERLIN3,
  place,
  SONNEUR,
} from "./era3-kit"

const LYRA_HP = (CHARACTERS.lyra?.stats.health ?? 10) * 7

const BOARD = [
  "###.....###",
  "##..1.1..##",
  "#..1...1..#",
  "...1.2.1...",
  ".....2.....",
  "...1.2.1...",
  "#..1...1..#",
  "##.......##",
  "###.....###",
]

function duel(ally: Ally, rallie: boolean, lyraUsee: boolean): FightSpec {
  const allies = [
    { preset: "@hero" as const, at: { x: 3, y: 8 } },
    {
      preset: LYRA3,
      at: { x: 4, y: 8 },
      ...(lyraUsee ? { hp: Math.round(LYRA_HP / 2) } : {}),
    },
    { preset: "gorr" as const, at: { x: 5, y: 8 } },
    ...allyFighter(ally, { x: 6, y: 8 }),
  ]
  if (rallie) allies.push({ preset: CHRONIQUEUR, at: { x: 7, y: 8 } })
  return {
    id: `ch17-duel-${ally}-${rallie ? "c" : "n"}-${lyraUsee ? "u" : "f"}`,
    title: "Le duel du Registre",
    goal: "Vaincre Merlin III. Il se rend sous 25 % de ses forces ; personne ne mourra, c'est une expérience.",
    board: BOARD,
    teams: [
      { name: "Alliés", side: "allies", fighters: allies },
      {
        name: "Le Registre",
        side: "enemies",
        fighters: [
          // CUT: Relevé (sondes brisées, Lacunes), the Certitude gauge and the
          // Argumenter action: the arguments are played before the fight.
          { preset: MERLIN3, at: { x: 5, y: 4 } },
          { preset: BRUTUS3, at: { x: 5, y: 3 } },
          { preset: HALLEBARDIER, at: { x: 5, y: 2 } },
          { preset: HALLEBARDIER, at: { x: 9, y: 4 } },
          { preset: SONNEUR, at: { x: 5, y: 6 } },
        ],
      },
    ],
    rules: {
      flee: { team: 1, below: 0.25, exits: [{ x: 0, y: 3 }] },
      announce: true,
    },
    influences: ["timeWarp"],
    startEnergy: 3,
    defeat: [set("defaite"), add("usure")],
    objectives: [
      {
        id: "merlin",
        mark: "★",
        label: "Vaincre Merlin III (il se rend)",
        check: (r) => {
          const m = r.fighters.find((f) => f.preset === "merlin3")
          return r.result !== "defeat" && (!m || m.hp <= 0 || m.fled)
        },
        success: "Mes relevés étaient exacts. Exacts !",
        failure: "L'expérience continue.",
      },
      {
        id: "garde",
        mark: "◆",
        label: "Personne de la Garde ne se disperse",
        check: (r) =>
          r.result !== "defeat" &&
          r.fighters
            .filter((f) => f.team !== 0 && f.preset !== "merlin3")
            .every((f) => f.hp > 0),
        onSuccess: [add("confiance.brutus")],
      },
    ],
    lines: [
      {
        when: "start",
        who: "merlin",
        text: "Relevé. Position, vitesse, intention probable. Je vous tiens.",
      },
      { when: "start", who: "brutus", text: "Personne ne touche au Maître." },
      {
        when: "tick:1",
        who: "merlin",
        text: "Incident d'instrument. Continuons.",
      },
      {
        when: "tick:3",
        who: "merlin",
        text: "Restez immobiles. Vous êtes plus faciles à lire.",
      },
      { when: "tick:5", who: "gorr", text: "Lui… compte. Gorr, pas chiffre." },
    ],
  }
}

function duelBeat(): Beat {
  const make = (ally: Ally, rallie: boolean): Beat =>
    when(
      is("lyra_usure"),
      [{ t: "fight", fight: duel(ally, rallie, true) }],
      [{ t: "fight", fight: duel(ally, rallie, false) }],
    )
  return when(
    is("chroniqueur_rejoint"),
    [byAlly((a) => make(a, true))],
    [byAlly((a) => make(a, false))],
  )
}

// ─── Arguments (stand-in for Certitude / Argumenter) ────────────────────────

const ouvert: Cond = all(lt("duel_argumente", 3), not(is("duel_clos")))

const arg = (
  id: string,
  title: string,
  cond: Cond | undefined,
  beats: Beat[],
) =>
  topic(id, title, [fx(add("duel_argumente")), ...beats], {
    if: cond ? all(ouvert, cond) : ouvert,
  })

const arguments_ = hub("arguments", [
  arg(
    "mesure",
    "« Regardez vos sondes. Votre mesure vient d'ouvrir un trou. »",
    undefined,
    [
      say("merlin", "Un incident d'instrument…"),
      stage("Il regarde la Lacune, la sonde brisée, la Lacune encore."),
      say(
        "merlin",
        "Non. Ce n'est pas un incident. Pour savoir où vous êtes, il a fallu que quelque chose vous touche. Et ce quelque chose, il a fallu le prendre quelque part.",
      ),
      fx(set("mesure_jouee")),
    ],
  ),
  arg(
    "gel",
    "« Votre Gel n'a pas été calculé. Il a été allumé dans la peur, en une nuit. »",
    is("gel_lu"),
    [
      say("merlin", "Mes registres disent « dans la sérénité »."),
      stage("Un temps."),
      say(
        "merlin",
        "Mes registres ont été écrits par des gens qui voulaient être sereins après coup.",
      ),
    ],
  ),
  arg(
    "gorr",
    "« Votre outil a posé une question. Il n'a jamais été un instrument. Il était dans le système. »",
    is("gorr_question"),
    [
      say("gorr", "Pourquoi ?"),
      stage("Merlin baisse la Toise d'un pouce."),
      say("merlin", "Je n'ai pas de colonne pour ça."),
    ],
  ),
  arg(
    "rapports",
    "Le Chroniqueur lève les deux versions de son rapport.",
    is("chroniqueur_rejoint"),
    [
      say(
        "merlin",
        "Le même rédacteur, la même anomalie, deux textes contraires. Et les deux sont soigneusement tenus.",
      ),
      stage("Il soupire."),
      say(
        "merlin",
        "On ne lit pas le monde de l'extérieur. On le lit d'où l'on est.",
      ),
    ],
  ),
  arg(
    "demandent",
    "« Trois personnes se sont remises à poser des questions. Votre Registre l'avait prévu ? »",
    gte("questions_rouvertes", 3),
    [
      say(
        "merlin",
        "… Non. Mes modèles ne prévoient pas les questions. Ils prévoient les réponses.",
      ),
    ],
  ),
  arg(
    "cristal",
    "Lever le Premier Cristal, qui pulse : « Vous n'avez jamais pu le mesurer sans le briser. »",
    is("premier_cristal", "sauve"),
    [
      say(
        "merlin",
        "Aucun jumeau connu… parce que je ne pouvais le connaître qu'en le détruisant.",
      ),
    ],
  ),
  arg(
    "fragment",
    "« Les premières Lacunes ne viennent pas de vous. Vous n'êtes pas la cause de tout. Vous en faites partie. »",
    any(is("lumiere_tardive"), gte("ghom_dechu.verite", 2)),
    [
      stage("Pour la première fois, il a l'air soulagé."),
      say(
        "merlin",
        "En faire partie. C'est… moins confortable qu'être dehors. Et plus léger.",
      ),
    ],
  ),
  topic(
    "fin",
    "Laisser les arguments là. Se battre.",
    [
      fx(set("duel_clos")),
      narr("Merlin hoche la tête. L'expérience commence."),
    ],
    { if: ouvert, last: true },
  ),
])

// ─── Veillée ────────────────────────────────────────────────────────────────

const nuit = hub("nuit", [
  topic("verre", "Merlin et le verre", [
    say(
      "merlin",
      "On disait jadis que le verre coule, très lentement, et que les vieilles vitres sont plus épaisses en bas. C'est faux : il ne coule pas, à aucune échelle de temps qui nous concerne. Les vitriers posaient simplement le côté épais en bas.",
    ),
    stage("Il caresse une paroi."),
    say(
      "merlin",
      "Le verre est un désordre figé. Les atomes y sont en vrac, comme dans un liquide, mais ils ne bougent plus. C'est pour ça que je l'aime. Tout le chaos d'un liquide, et toute la tranquillité d'une pierre.",
    ),
  ]),
  topic(
    "gorr",
    "Merlin et Gorr",
    [
      say("merlin", "Que lui avez-vous fait ?"),
      say("gorr", "Chaud."),
      say("merlin", "Pardon ?"),
      say("gorr", "Eux, chaud. Gorr, plus seul."),
      stage("Merlin reste longtemps silencieux."),
      say(
        "merlin",
        "Je l'ai mesuré pendant trente ans, et il ne m'a jamais rien dit. Je ne lui ai jamais rien demandé, c'est vrai.",
      ),
    ],
    { if: is("gorr_question") },
  ),
  topic(
    "chroniqueur",
    "Merlin et le Chroniqueur",
    [
      say("merlin", "Onzième du nom. Vous rédigiez bien."),
      say(
        "chroniqueur",
        "Je rédigeais faux, Maître. Avec beaucoup d'élégance.",
      ),
      say("merlin", "L'élégance n'est pas une faute."),
      say("chroniqueur", "Elle aggrave les autres."),
    ],
    { if: is("chroniqueur_rejoint") },
  ),
  topic("ghom", "Merlin et le Ghom", [
    say(
      "merlin",
      "Mon ancêtre était un Lumineux. Les Immobilistes disent qu'un Ghom est un dieu figé hors du temps. Les Lumineux, qu'il va à la vitesse de la lumière. J'ai fait le calcul pour m'amuser : à cette vitesse, aucun temps propre ne passe. Les deux écoles décrivent peut-être la même chose.",
    ),
    stage("Il hausse les épaules."),
    say(
      "merlin",
      "Je ne tranche pas. Je n'ai pas de mesure. C'est la seule question de cette cité où je n'ai pas de mesure, et c'est la seule où je dors bien.",
    ),
  ]),
  topic(
    "q06",
    "Q06 reposée",
    [
      stage("Avant de partir, Merlin regarde le ciel net par la coupole."),
      say(
        "merlin",
        "Votre Carnet contient la plus vieille question du monde, je suppose. Pourquoi quelque chose plutôt que rien.",
      ),
      stage("Il sourit."),
      say(
        "merlin",
        "J'ai la réponse. Le rien est instable. Il ne peut pas durer. Il a fallu que quelque chose soit. C'est aussi simple qu'une balance qui penche.",
      ),
      choice("q06", [
        opt("mesure", "Vous avez mesuré le rien ?", [
          stage("Un long silence."),
          say(
            "merlin",
            "… Non. J'ai mesuré le vide. Le vide n'est pas rien : il a de l'énergie, il fluctue. Le rien, je ne l'ai jamais eu sous la main.",
          ),
          say("merlin", "Vous avez raison. Je retire. Je n'ai pas de réponse."),
          fx(add("confiance.merlin")),
        ]),
        opt("belle", "C'est une belle réponse.", [
          stage("Le héros l'écrit dans le Carnet, à côté de la question."),
          fx(set("carnet.Q06", "fausse")),
        ]),
        opt("personne", "Personne ne sait.", [
          say("merlin", "C'est une réponse de lâche."),
          stage("Un temps."),
          say(
            "merlin",
            "Ou une réponse exacte. Je ne sais pas laquelle des deux, et cela m'agace profondément.",
          ),
        ]),
      ]),
    ],
    { last: true },
  ),
])

const ISLAND = [
  "............",
  ".1..........",
  "............",
  "......1.....",
  "............",
  "..1.....11..",
  "............",
  "............",
]

export const ch17: Chapter = {
  id: "17",
  era: 3,
  number: 17,
  title: "Le Maître du Verre",
  quote: { who: "merlin", text: "Je ne crois pas. Je mesure." },
  place: "Vitrelle : l'Observatoire, au sommet de la Tour du Registre",
  question: { id: "Q17", text: "Peut-on connaître le monde sans le changer ?" },
  start: "1",
  exploration: {
    island: ISLAND,
    start: { x: 0, y: 0 },
    companions: ["lyra"],
    influences: ["timeWarp"],
    encounters: [
      place(ISLAND, "observatoire", "L'Observatoire", "1", 1, 1),
      place(ISLAND, "lunette", "La grande lunette", "2", 4, 2),
      place(ISLAND, "nuit", "La nuit mesurée", "3", 2, 6),
      place(ISLAND, "registre", "La Salle du Registre", "4", 9, 4, {
        auto: true,
      }),
      place(ISLAND, "table", "La table lumineuse", "5", 10, 7),
      look(
        "balance",
        "Une balance étalonnée",
        { x: 7, y: 1 },
        "Deux plateaux de cuivre. Une étiquette : « Ne pas toucher, par méthode. »",
      ),
      look(
        "lentille",
        "Une lentille glacée",
        { x: 5, y: 6 },
        "Le froid de la coupole a givré le bord. Le ciel, au travers, est trop net pour être rassurant.",
      ),
      look(
        "plaque",
        "Une plaque de relevé",
        { x: 1, y: 3 },
        "Des colonnes de chiffres, très fines. Une colonne reste vide, titrée « Autre ».",
      ),
      {
        id: "ronde",
        label: "Un Sonneur d'observatoire",
        at: { x: 8, y: 6 },
        wander: {
          preset: SONNEUR,
          title: "Un Sonneur de service",
          goal: "Passer sans qu'il frappe l'heure.",
          range: 2,
          radius: 3,
          effects: [{ add: "ecoute", by: 1 }],
          success: "Le Sonneur retient son diapason et regarde le ciel.",
        },
      },
    ],
  },
  scenes: {
    "1": {
      id: "1",
      title: "L'Observatoire",
      kind: "rencontre",
      setting: "Une coupole de verre, le ciel net au-dessus",
      beats: [
        stage(
          "Le sommet de la Tour. Une coupole de verre, le ciel net au-dessus, si net qu'on y voit des Fragments lointains, minuscules, comme des grains de sel. Partout, des instruments de cuivre et de verre : aiguilles, balances, lentilles. Au centre, une grande table lumineuse, et un homme mince, en robe grise, appuyé sur un long bâton de verre gradué : la Toise.",
        ),
        say(
          "merlin",
          "Entrez. Ne touchez à rien, pas par principe : par méthode. Tout ici est étalonné.",
        ),
        say(
          "merlin",
          "Le Golem. J'ai lu sa fiche cent fois. Elle disait : « Ne demande rien. » Elle avait tort. J'ai horreur qu'une fiche ait tort. C'est pour ça que je vous ai fait monter.",
        ),
        say(
          "merlin",
          "Et l'anomalie. Deux siècles d'immobilité, un doigt de mouvement. J'ai écrit la note en marge de votre rapport, vous savez. C'était moi. Ce bâton a appartenu au premier de nous. Il vous a mesuré au bord du Puits, il y a huit siècles : « un battement sur cent, sur dix ». Vous êtes, en quelque sorte, notre premier instrument.",
        ),
        choice("accueil", [
          opt("pourquoi", "Pourquoi m'avoir fait monter, et pas arrêter ?", [
            say(
              "merlin",
              "Arrêter, c'est le métier de Brutus. Le mien, c'est savoir. Je veux savoir ce que vous êtes.",
            ),
          ]),
          opt("mines", "Vous savez ce que font vos mines ?", [
            say("merlin", "Évidemment. Venez voir."),
          ]),
          opt("figé", "Vous avez figé le monde.", [
            say(
              "merlin",
              "J'ai refroidi le monde. Mes prédécesseurs l'ont fait, plus exactement ; moi, je tiens les comptes. Figé est un mot de poète. Venez voir, et parlons en chiffres.",
            ),
          ]),
        ]),
        stage(
          "Merlin pose la main sur la table. Une carte de l'Archipel s'y allume : des îles, et des taches grises, des dizaines, mesurées au trait près. Puis il glisse une seconde plaque de verre par-dessus : la carte des mines. Les puits tombent exactement dans les taches. Exactement.",
        ),
        when(is("ile_sauvee", "sauge"), [
          say(
            "merlin",
            "Les premiers relevés ne sont pas de nous. Ils viennent de la Tour des Marées, sur laquelle cette tour est bâtie. Une archère, Ilse. Elle mesurait les Lacunes avant que quiconque sache ce que c'était.",
          ),
          when(ALLY_COND.eva, [
            say(
              "eva",
              "Mon arrière-arrière… beaucoup d'arrière-grand-mère. Elle écrivait ses sept comme moi.",
            ),
          ]),
        ]),
        say(
          "merlin",
          "Voilà. Chaque Cristal brisé consomme une corrélation. Moins de corrélations, moins de Tissu. Là où l'on extrait, le monde s'amincit. Je le sais depuis vingt ans, mon prédécesseur le savait avant moi, et quelqu'un l'avait écrit dès l'an 40. On a jeté la page, je l'ai fait rechercher. Ce n'est pas un secret. C'est un budget.",
        ),
        when(gte("cristaux.extraits", 1), [
          say(
            "merlin",
            "Vous aussi, d'ailleurs. Des Cristaux depuis votre sortie, d'après mes relevés. La Basse-Ville, la Mine, la Fonderie. Vous voyez ces petites taches neuves ? Ce sont les vôtres.",
          ),
          narr("Aucun reproche. Une constatation."),
        ]),
        when(is("premier_cristal", "perdu"), [
          say(
            "merlin",
            "Et l'étalon de la Mine. Le plus beau Cristal de l'Archipel. Vous l'avez brisé pour arrêter ma mine. C'était un choix défendable. C'est exactement le choix que je fais tous les jours.",
          ),
        ]),
        say("lyra", "Un budget payé par qui ?"),
        say(
          "merlin",
          "Par l'avenir, madame. Comme tous les budgets. Sans le Gel, il n'y aurait pas d'avenir du tout : les Marées emportaient une île par décennie. J'ai les chiffres. Voulez-vous les chiffres ?",
        ),
        choice("chiffres", [
          opt("temps", "Combien de temps reste-t-il ?", [
            say(
              "merlin",
              "Trente et une saisons de Cristaux, au rythme actuel. Ensuite, nous chercherons autre chose.",
            ),
            when(is("chroniqueur_rejoint"), [
              say(
                "chroniqueur",
                "« Nous chercherons autre chose » : formule employée dans quatorze rapports depuis l'an 200. Jamais suivie d'effet.",
              ),
            ]),
          ]),
          opt("instruments", "Et vos instruments ? Ils ne coûtent rien ?", [
            say(
              "merlin",
              "Mes instruments regardent. Ils ne prennent rien. Un savant digne de ce nom n'intervient pas dans ce qu'il mesure : il se tient à l'extérieur, et il note.",
            ),
            narr(
              "Tessa, la fondatrice, avait écrit que toute mesure dérange un peu ce qu'elle mesure. Merlin la trouve trop modeste.",
            ),
          ]),
          opt("sauvé", "Vous avez sauvé des gens.", [
            stage("Une seconde de surprise."),
            say(
              "merlin",
              "Oui. On me le dit rarement. On me dit « Maître », on me dit « le Registre l'affirme ». On ne me dit pas ça.",
            ),
            fx(add("confiance.merlin")),
          ]),
        ]),
        say(
          "merlin",
          "Voici ma question, puisque vous collectionnez les questions, à ce qu'on dit. Peut-on connaître le monde sans le changer ? Moi, je réponds oui. Je le fais tous les jours.",
        ),
        fx(set("carnet.Q17", "ouverte")),
        stage(
          "Q17 entre au Carnet : Peut-on connaître le monde sans le changer ?",
        ),
        choice("lunette", [
          opt(
            "voir",
            "Regarder dans la grande lunette.",
            [go("2")],
            is("fonds_conformes"),
          ),
          opt("nuit", "Passer la nuit à l'Observatoire.", [go("3")]),
        ]),
      ],
      next: "3",
    },
    "2": {
      id: "2",
      title: "La lumière tardive",
      kind: "rencontre",
      setting: "La grande lunette",
      beats: [
        stage(
          "La grande lunette. Merlin la pointe vers un Fragment très lointain, au bord du Clair, presque invisible.",
        ),
        say(
          "merlin",
          "Ce Fragment-là est si loin que sa lumière met des siècles à nous parvenir. Ce que nous voyons, c'est lui il y a longtemps : bien avant le Gel, bien avant les Marées. Les plus anciennes Lacunes de ma carte sont là-bas. Je n'ai jamais compris pourquoi. On n'y a jamais miné : il n'y avait personne pour miner.",
        ),
        stage(
          "Rester longtemps l'œil contre une lentille glacée, sous le froid de la coupole, coûte de l'Usure.",
        ),
        stage(
          "Ce que montre la lumière : un Fragment vivant, vert. Puis, en quelques images espacées de plusieurs années, sa lumière qui faiblit, ses bords qui se figent, des taches grises qui s'ouvrent, sans mine, sans extraction, sans rien. Comme si quelque chose qui l'entretenait avait cessé de le faire.",
        ),
        say(
          "merlin",
          "Personne ne l'a miné. Il s'est… éteint. Comme un feu qu'on ne nourrit plus.",
        ),
        when(gte("ghom_dechu.verite", 1), [
          choice("quelquun", [
            opt("quelqu-un", "Quelqu'un a cessé de s'en occuper.", [
              say(
                "merlin",
                "« Quelqu'un ». Vous parlez comme les Immobilistes. Ou comme les Lumineux. Je n'ai pas de colonne pour « quelqu'un ». Mais je n'ai pas non plus d'autre explication.",
              ),
            ]),
            opt("rien", "Se taire.", [
              narr("Le Fragment continue de s'éteindre, très loin."),
            ]),
          ]),
        ]),
        fx(add("archives.lues"), add("usure"), set("lumiere_tardive")),
        when(lt("ghom_dechu.verite", 3), [fx(add("ghom_dechu.verite"))]),
      ],
      next: "3",
    },
    "3": {
      id: "3",
      title: "La nuit mesurée",
      kind: "veillee",
      setting: "L'Observatoire, la nuit",
      beats: [
        stage(
          "Merlin vient, sans sa robe, avec une tasse. Il ne mesure rien, ce soir.",
        ),
        nuit,
      ],
      next: "4",
    },
    "4": {
      id: "4",
      title: "Le duel du Registre",
      kind: "combat",
      setting: "La Salle du Registre, sous la coupole, le sol de verre",
      beats: [
        stage(
          "Au matin, Merlin attend l'équipe dans la Salle du Registre, Brutus III à sa droite. Le sol est de verre : on voit la ville en dessous.",
        ),
        say(
          "merlin",
          "Je vous propose une expérience. Vous dites que je change ce que je mesure. Je dis que non. Battez-vous contre moi, et je vous mesurerai pendant le combat. Si mes relevés sont exacts et que je ne perturbe rien, vous rentrerez dans le Registre comme tout le monde. Si vous me prouvez le contraire… Alors j'aurai appris quelque chose. C'est rare, à mon âge.",
        ),
        say("brutus", "Maître. Ils ont un golem."),
        say(
          "merlin",
          "Et vous avez un bouclier, capitaine. Personne ne mourra. C'est une expérience, pas une guerre.",
        ),
        say(
          "merlin",
          "Relevé. Position, vitesse, intention probable. Je vous tiens.",
        ),
        stage("Une sonde éclate. Une Lacune s'ouvre près du gradin."),
        say("merlin", "Incident d'instrument. Continuons."),
        when(is("transformation.2", "B"), [
          say("merlin", "Le froid ne vous prend pas. Où avez-vous appris ça ?"),
          narr("Dans la mer. (Sans effet.)"),
        ]),
        // SIMPLIFIED: Argumenter / Certitude 3 is a hub of arguments before the
        // fight; Certitude 0 means no fight at all, as an Intrication.
        stage(
          "Le héros peut argumenter. Chaque argument recevable ébranle une certitude de Merlin, une fois.",
        ),
        arguments_,
        when(
          gte("duel_argumente", 3),
          [
            say("brutus", "Si lui doute… alors moi aussi, j'ai le droit."),
            stage(
              "Brutus III abaisse son bouclier. Lentement. Merlin traverse la Salle jusqu'à la case du héros, pose la Toise, et pour la première fois reste sans rien mesurer. Le combat s'arrête : personne n'a gagné.",
            ),
            fx(set("merlin_convaincu"), set("carte_des_lacunes")),
          ],
          [
            duelBeat(),
            when(is("defaite"), [
              stage(
                "Le héros se disperse sur le verre. Merlin note l'heure. Brutus relève l'équipe, avec un respect sans joie, et la Salle est rouverte pour une seconde expérience.",
              ),
              fx(set("defaite", false)),
            ]),
            say("merlin", "Mes relevés étaient exacts. Exacts !"),
            stage("Il regarde les sondes brisées."),
            say("merlin", "… Tous exacts. Et pourtant."),
            stage("Brutus le relève et l'emmène, sans un mot."),
          ],
        ),
      ],
      next: "5",
    },
    "5": {
      id: "5",
      title: "Ce que pèse une mesure",
      kind: "fin",
      setting: "L'Observatoire, la table lumineuse",
      beats: [
        when(
          is("merlin_convaincu"),
          [
            stage(
              "Merlin à la table lumineuse. Il refait un calcul, à la main, sur une feuille.",
            ),
            say(
              "merlin",
              "Trente et une saisons. Je les avais calculées sans compter mes propres mesures. Le Registre, à lui seul, a consommé sept Cristaux sur cent depuis l'an 1. Pour savoir combien il en restait.",
            ),
            stage("Il pose la plume."),
            say(
              "merlin",
              "Avec mes mesures, il ne reste pas trente et une saisons. Il en reste… zéro. On les a déjà dépensées. On vit à crédit depuis dix ans.",
            ),
            fx(set("carnet.Q17", "repondue"), join("merlin")),
            stage(
              "Q17 répondue : on ne peut pas connaître le monde sans le changer. Mesurer, c'est interagir, donc perturber. On le connaît en en faisant partie.",
            ),
            stage(
              "Il plie la carte des Lacunes, la vraie, avec la carte des mines par-dessus, et la tend au héros.",
            ),
            say(
              "merlin",
              "Prenez-la. Je préfère qu'elle soit dans les mains de quelqu'un qui bouge.",
            ),
            fx(add("confiance.merlin", 2)),
            when(gte("confiance.merlin", 3), [
              say(
                "merlin",
                "Et… si je peux me permettre. Vous n'avez pas de nom, je crois. J'en aurais un. Constante. Ce qui ne change pas quand tout le reste change. Je vous ai mesuré à trois époques : vous êtes la seule valeur qui revienne.",
              ),
              choice("constante", [
                opt("souvenir", "Je m'en souviendrai.", [
                  fx(add("nom.propositions")),
                ]),
                opt("non", "Non.", [
                  narr("Le nom ne se prendra qu'à la Nomination."),
                ]),
              ]),
            ]),
          ],
          [
            stage(
              "L'Observatoire est vide. Brutus a emmené Merlin. Sur la table, la carte des Lacunes.",
            ),
            when(
              is("chroniqueur_rejoint"),
              [
                say(
                  "chroniqueur",
                  "Je la copie. Ce n'est pas du vol, c'est de l'archivage.",
                ),
                fx(set("carte_des_lacunes")),
              ],
              [stage("La carte est scellée sous une plaque de verre épais.")],
            ),
            when(is("mesure_jouee"), [
              fx(set("carnet.Q17", "repondue")),
              stage("Le héros a vu, lui, ce que Merlin n'a pas voulu voir."),
            ]),
          ],
        ),
        when(is("carte_des_lacunes"), [
          fx(give("objet:carte-des-lacunes")),
          stage(
            "Objet : la carte des Lacunes. Deux plaques de verre superposées : l'Archipel, ses taches grises, et les puits de mine qui tombent dedans. Certaines taches sont toutes petites, toutes neuves.",
          ),
        ]),
        fx(give("habit:echarpe-de-thermiste")),
        stage(
          "Habit : Écharpe de thermiste. Une longue écharpe grise tissée de fils de cuivre, qui garde la chaleur du corps. +1 Défense énergétique.",
        ),
        stage(
          "Un bruit, très bas, monte de la ville. Pas un tintement : un craquement. Le sol de verre de la Salle du Registre, sous les pieds de l'équipe, se zèbre d'une ligne fine, blanche, qui court vers le nord, vers la Basse-Ville, vers les Mines.",
        ),
        go("$end"),
      ],
    },
  },
}
