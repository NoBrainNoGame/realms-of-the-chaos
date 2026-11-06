import {
  add,
  choice,
  fx,
  give,
  go,
  gte,
  is,
  join,
  narr,
  opt,
  say,
  set,
  stage,
  when,
} from "../dsl"
import {
  type Beat,
  type Chapter,
  END,
  type FighterSpec,
  type FightSpec,
} from "../types"
import {
  EFFILOCHEUR,
  look,
  movable,
  REMOUS,
  UNSTABLE,
  zoneOf,
} from "./era2-kit"

// The channel between the last piles of Sauge (west) and the first points of
// the Lusse reef (east). The same map is the fight and the island.
const PASSE = [
  "1..~~2~~W",
  "...~~~~wW",
  ".1.~~~~wW",
  "...~~2~wW",
  ".1.~~~~wW",
  "...~~~~wW",
  "1..~~2~~W",
]

const DEFEAT_LINE = "Le creux l'a repris avant que nous ayons un nom"

const zone = zoneOf(PASSE)

/** The fight, with or without Squalor at the hero's side. */
function passe(squalor: boolean): FightSpec {
  const allies: FighterSpec[] = [
    { preset: "@hero", at: { x: 0, y: 3 } },
    { preset: "nerea", at: { x: 1, y: 2 } },
    { preset: "eva", at: { x: 1, y: 4 } },
  ]
  if (squalor) allies.push({ preset: "squalor", at: { x: 0, y: 1 } })
  return {
    id: squalor ? "ch10-la-passe-squalor" : "ch10-la-passe",
    title: "La Passe aux cristaux",
    board: PASSE,
    teams: [
      { name: "Le héros et les Échos", side: "allies", fighters: allies },
      {
        name: "Le Lacunaire",
        side: "neutral",
        fighters: [{ preset: REMOUS, at: { x: 4, y: 3 } }],
      },
      {
        name: "Lacunaires de la Marée",
        side: "enemies",
        fighters: [
          { preset: EFFILOCHEUR, at: { x: 6, y: 0 } },
          { preset: EFFILOCHEUR, at: { x: 6, y: 3 } },
          { preset: EFFILOCHEUR, at: { x: 6, y: 6 } },
          { preset: UNSTABLE, at: { x: 6, y: 1 } },
          { preset: UNSTABLE, at: { x: 6, y: 5 } },
        ],
      },
    ],
    rules: {
      // SIMPLIFIED: no fixation gauge, no Front de Marée, no Superposition of
      // the east columns, no drift and no waves of arrival (tours 1, 3, 4, 5).
      // The Lacunaire is a neutral swimmer with hit points; holding out until
      // the clock runs down stands for "he is fixed".
      neutral: [1],
      clock: { period: 1, limit: 10, winner: 0 },
    },
    influences: ["earthquake", "timeWarp", "blessing"],
    startEnergy: 4,
    goal: "Protéger le Lacunaire pendant qu'il se fixe : tenir la Passe jusqu'à la fin de la Marée.",
    defeat: [set("defaite"), add("usure", 1), add("confiance.lacunaire", -1)],
    objectives: [
      {
        id: "proteger",
        mark: "★",
        label: "Protéger le Lacunaire",
        check: (r) =>
          r.fighters.some((f) => f.preset === "lacunaire_remous" && f.hp > 0),
        success: "Le Lacunaire tient.",
        failure: "Le creux a repris ce qui n'avait pas fini de se fixer.",
        onFailure: [set("lacunaire_perdu"), set("lacunaire.forme", "aucune")],
      },
      {
        id: "douceur",
        mark: "◆",
        label: "Douceur",
        check: (r) =>
          r.fighters.filter((f) => f.team === 0).every((f) => f.hp > 0),
        success:
          "Personne n'a été frappé près de lui : les combats le troublent.",
        onSuccess: [add("confiance")],
      },
      {
        id: "sans-influence",
        mark: "◆",
        label: "Aucune Influence sur lui",
        check: (r) => Object.values(r.divineUsed).every((n) => n === 0),
        success:
          "Le Ghom s'est tenu à distance : la forme n'est pas son choix.",
        onSuccess: [
          add("confiance.lacunaire"),
          set("lacunaire_sans_influence"),
        ],
      },
    ],
    lines: [
      {
        when: "start",
        who: "nerea",
        text: "Le premier qui le touche lui donne sa forme. Choisissez. Ou ne choisissez pas : quelque chose le fera.",
      },
      ...(squalor
        ? [
            {
              when: "start" as const,
              who: "squalor",
              text: "Je protège un repas. C'est nouveau. Je n'aime pas.",
            },
          ]
        : []),
      {
        when: "tick:3",
        who: "eva",
        text: "Jauge à cinq sur huit. Je donne soixante-dix pour cent. Ne me faites pas mentir.",
      },
      {
        when: "tick:5",
        who: "eva",
        text: "Il nous reste quatre tours. Trois et demi, si je suis honnête.",
      },
      { when: "end", who: "lacunaire", text: "Nous… tenons. Nous tenons !" },
    ],
  }
}

const fightBeat: Beat = when(
  is("squalor_rejoint"),
  [{ t: "fight", fight: passe(true) }],
  [{ t: "fight", fight: passe(false) }],
)

/** The line of the stabilised Lacunaire, by form. */
function formeLines(): Beat[] {
  return [
    when(is("lacunaire.forme", "ondine"), [
      say(
        "lacunaire",
        "Nous avons votre façon de flotter, Néréa. Nous ne savons pas encore lire la vase. Vous nous apprendrez ?",
      ),
      say("nerea", "Il faut quatre siècles."),
      say("lacunaire", "Nous avons le temps. Nous croyons."),
    ]),
    when(is("lacunaire.forme", "aiguille"), [
      say("lacunaire", "Nous sommes droits. Très droits. C'est inconfortable."),
      say("eva", "On s'y fait."),
    ]),
    when(is("lacunaire.forme", "squale"), [
      say(
        "lacunaire",
        "Nous avons des dents. Nous ne mangerons rien qui parle.",
      ),
      say("squalor", "… Ça, c'est de famille."),
    ]),
    when(is("lacunaire.forme", "miroir"), [
      say(
        "lacunaire",
        "Nous vous ressemblons. Pas tout à fait : nous sommes clairs là où vous êtes sombre.",
      ),
      stage(
        "Le héros et le Lacunaire se font face, comme devant une eau calme qui ne serait pas un reflet.",
      ),
    ]),
    when(is("lacunaire.forme", "recif"), [
      say("lacunaire", "Personne ne nous a touchés. Alors la pierre l'a fait."),
      stage("Il pose une main lourde sur le cristal."),
      say(
        "lacunaire",
        "Elle n'a rien voulu. Elle était là. C'est assez, pour donner une forme.",
      ),
      say(
        "nerea",
        "C'est même la plupart du temps comme ça que les choses prennent forme.",
      ),
    ]),
    when(is("lacunaire.forme", "brume"), [
      say(
        "lacunaire",
        "Ce qui nous défaisait nous a touchés en premier. Nous sommes restés à moitié.",
      ),
      say("eva", "À moitié quoi ?"),
      say("lacunaire", "À moitié."),
    ]),
  ]
}

export const ch10: Chapter = {
  id: "10",
  era: 2,
  number: 10,
  title: "Le Lacunaire qui voulait une forme",
  quote: {
    who: "lacunaire",
    text: "Nous voudrions… nous voudrions être quelqu'un. Un seul. Lequel, nous ne savons pas encore.",
  },
  place: "Sous les pilotis de Sauge, puis la Passe aux cristaux",
  question: {
    id: "Q10",
    text: "Devient-on ce que nos rencontres font de nous ?",
  },
  start: "s1",
  exploration: {
    island: PASSE,
    start: { x: 0, y: 3 },
    companions: ["nerea", "eva"],
    influences: ["earthquake", "timeWarp"],
    encounters: [
      {
        id: "s1",
        label: "Sous les pilotis",
        scene: "s1",
        at: { x: 1, y: 3 },
        zone: zone(1, 3),
        actor: "nerea",
      },
      {
        id: "s2",
        label: "Les cristaux jumeaux",
        scene: "s2",
        at: { x: 2, y: 1 },
        zone: zone(2, 1),
        actor: "eva",
      },
      {
        id: "s3",
        label: "Le bassin du Lacunaire",
        scene: "s3",
        at: { x: 2, y: 5 },
        zone: zone(2, 5),
        if: is("squalor_rejoint"),
      },
      {
        id: "s4",
        label: "La Passe aux cristaux",
        scene: "s4",
        at: { x: 3, y: 3 },
        zone: zone(3, 3),
        auto: true,
      },
      {
        id: "s5",
        label: "La forme",
        scene: "s5",
        at: { x: 4, y: 2 },
        auto: true,
      },
      {
        id: "s6",
        label: "Le feu de veille",
        scene: "s6",
        at: { x: 0, y: 5 },
        zone: zone(0, 5),
      },
      look("poteaux", "Des poteaux couverts de moules", { x: 2, y: 3 }, [
        "Les moules ont poussé en couronnes. Une forme les a effleurées : la moitié des coquilles sont ouvertes, l'autre moitié closes, sans règle visible.",
        {
          who: "eva",
          style: "say",
          text: "Ça ressemble à un tirage. Je ne devrais pas, mais je note.",
        },
      ]),
      look("ardoises", "Les ardoises d'Eva", { x: 1, y: 1 }, [
        "Des colonnes de croix bleues et vertes, deux couleurs d'écriture, des totaux barrés puis recomptés. En marge : « pas possible ».",
      ]),
      movable(
        "perche",
        "Une perche coincée entre deux pointes",
        { x: 2, y: 6 },
        "earthquake",
        "Une longue perche de pêcheur est coincée entre deux cristaux. En tirant, on casserait un des deux.",
        "Une secousse légère : la perche glisse d'elle-même, sans rien casser.",
      ),
      {
        id: "effilocheur-egare",
        label: "Un effilocheur égaré",
        at: { x: 4, y: 5 },
        wander: {
          preset: EFFILOCHEUR,
          title: "Un effilocheur",
          goal: "Le détourner du bassin sans le blesser.",
          range: 2,
          radius: 3,
          effects: [{ add: "ecoute", by: 1 }],
          success: "Il a repris le large, hésitant, vers l'est.",
        },
      },
    ],
  },
  scenes: {
    s1: {
      id: "s1",
      title: "Sous les pilotis",
      kind: "rencontre",
      setting: "Sous le village de Sauge, entre les poteaux couverts de moules",
      next: "s2",
      beats: [
        stage(
          "Sous le village, entre les poteaux couverts de moules, une forme translucide flotte, de la taille d'un enfant. Ses contours tremblent entre plusieurs dessins : une nageoire, une main, une arête de cristal, rien. Des villageois, perches levées. Aubin au premier rang.",
        ),
        say(
          "aubin",
          "On le repousse au large. Une perche, un coup sec, et on n'en parle plus.",
        ),
        say("nerea", "Personne ne le touche."),
        say("aubin", "Pourquoi ?"),
        say(
          "nerea",
          "Parce qu'il n'a pas encore de forme, et que la première chose qui le touchera lui en donnera une. Tu veux un Lacunaire en forme de perche sous ta maison, Aubin ?",
        ),
        stage("Aubin baisse sa perche."),
        say("aubin", "… Non."),
        stage(
          "Le remous parle. Deux voix superposées, qui commencent la même phrase et la finissent différemment.",
        ),
        say(
          "lacunaire",
          "Nous… nous étions dans le creux. Là-bas, rien ne nous touchait. Nous étions beaucoup de choses. Puis de moins en moins. Nous nous défaisions.",
        ),
        say(
          "lacunaire",
          "Ici, tout touche tout. L'eau, les poteaux, les voix. Nous avons peur de devenir… n'importe quoi. Nous voudrions… choisir.",
        ),
        choice("accueil", [
          opt("quoi", "Qu'est-ce que tu es ?", [
            fx(add("confiance.lacunaire")),
            say(
              "lacunaire",
              "De la matière. Comme vous. Mais à qui rien n'est jamais arrivé.",
            ),
          ]),
          opt("aider", "On va t'aider.", [
            fx(add("confiance.lacunaire"), add("confiance")),
          ]),
          opt("danger", "Tu es dangereux ?", [
            say(
              "lacunaire",
              "Nous ne savons pas. Nous ne sommes pas encore assez quelqu'un pour être dangereux.",
            ),
          ]),
        ]),
        when(gte("lacunes.elargies", 1), [
          say(
            "nerea",
            "Il vient de la Lacune que nous avons laissée grandir. Il est plus incertain que les autres. Il pourrait même prendre la forme de… ce qui le défait.",
          ),
        ]),
      ],
    },

    s2: {
      id: "s2",
      title: "Les cristaux jumeaux",
      kind: "rencontre",
      setting: "La plate-forme de la Tour des Marées, et la jetée à cent pas",
      next: "s4",
      beats: [
        stage(
          "Sur la plate-forme de la Tour des Marées. Eva a rapporté de Lusse deux petits cristaux qui scintillent ensemble. Elle en garde un, donne l'autre à Néréa, qui s'éloigne au bout de la jetée, à cent pas. Chacune a deux baguettes : une d'os, une de bois. Frapper un cristal le fait briller bleu ou vert.",
        ),
        say(
          "eva",
          "Voilà ma donnée cachée. Chaque cristal sait d'avance de quelle couleur il brillera, pour chaque baguette. C'est écrit dedans, comme l'angle est écrit dans une flèche. Il suffit de compter.",
        ),
        say("nerea", "Et si ce n'est pas écrit ?"),
        say("eva", "Alors je mange mes ardoises."),
        // SIMPLIFIED: the playable short scene (ten strokes, then a hundred
        // simulated) is told, with the doc's figures.
        narr(
          "On frappe une dizaine de coups, chacune sa baguette tirée au hasard, puis on simule les cent suivants. De chaque côté, seul, c'est pile ou face : bleu la moitié du temps, vert l'autre moitié. En comparant les ardoises, les paires gagnent environ quatre-vingt-cinq fois sur cent. (La règle : on gagne si les couleurs sont les mêmes, sauf quand les deux ont pris le bois : là, il faut des couleurs différentes.)",
        ),
        say(
          "eva",
          "Si chaque cristal portait sa réponse écrite d'avance, il n'existerait aucune façon de l'écrire qui gagne plus de trois fois sur quatre. Aucune. J'ai essayé toutes les tables, une nuit entière. Les cristaux font mieux.",
        ),
        say("nerea", "Donc ?"),
        say(
          "eva",
          "Donc rien n'était écrit. La couleur ne se décide qu'au coup de baguette. Et pourtant, les deux cristaux s'accordent plus que n'importe quelle réponse cachée ne le permettrait.",
        ),
        say(
          "eva",
          "Et ne me demandez pas de m'en servir pour envoyer des messages à Néréa : de mon côté, c'est pile ou face, quoi qu'elle fasse. On ne voit l'accord qu'en comparant les ardoises, après.",
        ),
        choice("etat", [
          opt(
            "pas-etat",
            "Alors une chose n'a pas d'état avant qu'on la touche ?",
            [],
          ),
          opt(
            "relatif",
            "Alors elle a un état… par rapport à ce qui l'a touchée.",
            [fx(add("confiance.nerea"), add("confiance.eva"))],
          ),
          opt("ardoises", "Tu vas manger tes ardoises ?", [
            fx(add("confiance.eva")),
            say("eva", "J'ai dit ça au figuré. Statistiquement."),
          ]),
        ]),
        say(
          "nerea",
          "Elle a un état par rapport à ce qui l'a déjà touchée. Le cristal et sa jumelle sont liés : l'un dit quelque chose de l'autre. Mais il n'y a pas de couleur cachée, toute prête, qui attendrait qu'on vienne la lire. Le Lacunaire non plus n'a pas de forme cachée. Elle se fera au contact.",
        ),
        stage(
          "Le Carnet : « Une chose a-t-elle un état avant qu'on la touche ? » Réponse : elle a un état relativement à ce qui l'a déjà touchée. Aucune valeur cachée n'attend d'être découverte : les cristaux jumeaux le montrent.",
        ),
        fx(set("carnet.Q08", "repondue")),
        say(
          "eva",
          "Je ne ratais jamais. Je croyais que c'était parce que tout se calcule. Peut-être que c'est seulement parce que je tirais sur des choses déjà décidées.",
        ),
        stage(
          "Eva détache un des deux cristaux, le monte sur un lacet, et le tend au héros.",
        ),
        fx(set("eclat_jumelle"), give("eclat_de_jumelle")),
        when(is("squalor_rejoint"), [go("s3")], [go("s4")]),
      ],
    },

    s3: {
      id: "s3",
      title: "La règle de Squalor",
      kind: "rencontre",
      setting: "Le bassin où flotte le Lacunaire, le soir",
      next: "s4",
      beats: [
        stage(
          "Le soir, Squalor s'approche du bassin où flotte le Lacunaire. Il le renifle longuement. Le Lacunaire ne recule pas.",
        ),
        say("squalor", "Je vais être franc. Tu as l'air délicieux."),
        say("lacunaire", "Nous… avons l'air de beaucoup de choses."),
        say("squalor", "Ça fait plus de goûts."),
        when(
          is("squalor_serment"),
          [
            say("squalor", "Mais j'ai promis. Rien qui parle."),
            stage("Un temps."),
            say("squalor", "Je me suis fait avoir."),
          ],
          [
            stage("Long silence."),
            say(
              "squalor",
              "Non. Celui-là m'a parlé. Je ne mange pas ce qui m'a parlé. Nouvelle règle. Je viens de l'inventer.",
            ),
          ],
        ),
        choice("regle", [
          opt("pourquoi", "Pourquoi ?", [
            fx(add("confiance.squalor")),
            say(
              "squalor",
              "Je ne sais pas. J'ai faim pareil. Mais ce serait… comme manger un des petits. Ne me demande pas plus, je n'ai pas les mots. Les Squales n'ont pas beaucoup de mots pour ce qui ne se mange pas.",
            ),
          ]),
          opt("silence", "Ne rien dire.", [fx(add("confiance.squalor"))]),
        ]),
        say(
          "nerea",
          "Journal : le Squale a passé la nuit à côté du bassin, comme on veille un malade, ou un repas qu'on s'interdit. Je ne sais pas lequel des deux. Lui non plus, je crois.",
        ),
      ],
    },

    s4: {
      id: "s4",
      title: "La Passe aux cristaux",
      kind: "combat",
      setting:
        "Un chenal entre les derniers pilotis de Sauge et les pointes de Lusse",
      next: "s5",
      beats: [
        stage(
          "La Marée tire à l'est. Des effilocheurs viennent reprendre ce qui n'a pas fini de se fixer. Néréa annonce : le premier qui touche le Lacunaire lui donne sa forme.",
        ),
        // SIMPLIFIED: the first interaction cannot be read from the fight, so
        // the player chooses who touches first, before it begins.
        choice("premier", [
          opt("nerea", "Que Néréa le touche la première.", [
            fx(set("lacunaire.forme", "ondine")),
          ]),
          opt("eva", "Que ce soit Eva (une flèche émoussée).", [
            fx(set("lacunaire.forme", "aiguille")),
          ]),
          opt(
            "squalor",
            "Que Squalor le goûte, sans mordre.",
            [fx(set("lacunaire.forme", "squale"))],
            is("squalor_rejoint"),
          ),
          opt("heros", "Le toucher moi-même.", [
            fx(set("lacunaire.forme", "miroir")),
          ]),
          opt("personne", "Ne choisir personne.", [
            fx(set("lacunaire.forme", "recif")),
          ]),
          opt(
            "effilocheur",
            "Laisser un effilocheur le toucher.",
            [fx(set("lacunaire.forme", "brume"))],
            gte("lacunes.elargies", 1),
          ),
        ]),
        fightBeat,
        when(is("defaite"), [
          stage(
            "Le Lacunaire dérive vers l'est, plus vite que les rames. Il ne se débat pas. Il se laisse reprendre par l'eau profonde, et par le creux.",
          ),
          say("lacunaire", `${DEFEAT_LINE}.`),
          fx(
            set("lacunaire_perdu"),
            set("lacunaire.forme", "aucune"),
            set("defaite", false),
          ),
          go("s5"),
        ]),
      ],
    },

    s5: {
      id: "s5",
      title: "La forme",
      kind: "rencontre",
      setting: "Après le combat, au bord de l'eau",
      next: "s6",
      beats: [
        when(
          is("lacunaire_perdu"),
          [
            stage(
              "Plus rien ne flotte dans la Passe. Il reste une vague lente qui s'éloigne vers le creux.",
            ),
            say(
              "nerea",
              "Il a choisi la seule chose qui le touchait encore : le creux.",
            ),
            stage(
              "Le Carnet : « Devient-on ce que nos rencontres font de nous ? » Réponse : en partie. Nos interactions fixent notre état, mais nous choisissons aussi lesquelles.",
            ),
            fx(set("carnet.Q10", "repondue")),
            go("s6"),
          ],
          [
            stage(
              "Le Lacunaire s'est fixé. Il se regarde, se touche, essaie de marcher, ou de nager.",
            ),
            say("lacunaire", "Nous… sommes ça."),
            stage("Un temps."),
            say(
              "lacunaire",
              "Nous sommes ça maintenant. Avant, nous étions tout ce que ça aurait pu être. Il y en avait de plus beaux.",
            ),
            say("nerea", "Il y en avait de pires."),
            say("lacunaire", "Oui. Nous les avons sentis partir."),
            ...formeLines(),
            say(
              "lacunaire",
              "Dites. Est-ce que nous sommes devenus ce que cette rencontre a fait de nous ? Est-ce que nous n'avons rien choisi ?",
            ),
            choice("question", [
              opt("touche", "Oui. Tu es ce qui t'a touché.", [
                say("nerea", "En partie seulement."),
              ]),
              opt("partie", "En partie. La suite, tu la choisiras.", [
                fx(add("confiance.lacunaire")),
              ]),
              opt("pardon", "C'est nous qui avons choisi pour toi. Pardon.", [
                fx(add("confiance.lacunaire"), add("confiance")),
              ]),
            ]),
            say(
              "nerea",
              "Ce qui nous touche nous fixe. Mais nous choisissons aussi ce que nous laissons nous toucher, et ce que nous allons toucher. C'est peu. C'est tout ce qu'il y a.",
            ),
            say("lacunaire", "Alors la prochaine fois… nous choisirons. Nous…"),
            stage("La phrase bifurque."),
            say("lacunaire", "… je… nous choisirons."),
            stage(
              "Le Carnet : « Devient-on ce que nos rencontres font de nous ? » Réponse : en partie. Nos interactions fixent notre état, mais nous choisissons aussi lesquelles.",
            ),
            fx(set("carnet.Q10", "repondue")),
          ],
        ),
      ],
    },

    s6: {
      id: "s6",
      title: "Nous",
      kind: "veillee",
      setting: "Un feu de veille sur la jetée",
      beats: [
        when(
          is("lacunaire_perdu"),
          [
            stage("Le feu brûle sans personne à côté du bassin vide."),
            say(
              "eva",
              "Je l'avais calculé à soixante-dix pour cent. Je déteste avoir raison sur les trente.",
            ),
            say(
              "nerea",
              "Journal : nous avons perdu un compagnon qu'on n'avait pas encore. Je ne sais pas comment on porte ça. Nous avons gardé le bassin.",
            ),
          ],
          [
            fx(join("lacunaire")),
            stage(
              "Le Lacunaire stabilisé est près du feu, pour la première fois. Il découvre la chaleur. Il approche la main, la retire, recommence.",
            ),
            say(
              "lacunaire",
              "C'est… beaucoup de choses qui nous touchent à la fois.",
            ),
            say(
              "eva",
              "Ça s'appelle du feu. Ça touche tout. C'est pour ça qu'on l'aime.",
            ),
            say(
              "eva",
              "Quelle était la probabilité que tu prennes cette forme ?",
            ),
            say("lacunaire", "Avant ? Petite. Maintenant ? Toute."),
            say("eva", "… Je déteste que ce soit la bonne réponse."),
            say("nerea", "Comment veux-tu qu'on t'appelle ?"),
            say("lacunaire", "Nous ne savons pas."),
            narr("Je l'appelle « Nous », faute de mieux."),
            when(is("squalor_rejoint"), [
              say("squalor", "Si un jour tu as faim, je te montrerai."),
              say("lacunaire", "Nous n'avons pas faim."),
              say(
                "squalor",
                "Ça viendra. C'est ce qui arrive aux choses qui durent.",
              ),
            ]),
            say(
              "nerea",
              "Journal : nous avons un compagnon de plus. Il dit « nous » ; je ne le corrige pas. Peut-être qu'il est encore plusieurs, à l'intérieur, d'une façon que mes strates ne savent pas lire. Eva a mangé un coin de son ardoise, devant tout le monde. Elle tient ses promesses, même figurées.",
            ),
          ],
        ),
        go(END),
      ],
    },
  },
}
