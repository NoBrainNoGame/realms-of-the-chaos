import {
  add,
  choice,
  fx,
  go,
  hub,
  is,
  narr,
  opt,
  say,
  set,
  stage,
  topic,
  when,
} from "../dsl"
import {
  type Beat,
  type Chapter,
  END,
  type FightReport,
  type FightSpec,
  type ObjectiveSpec,
} from "../types"
import { at, doubleOf, flat, hero, walk, zone } from "./era5kit"

// Chapter 25, « Les branches » (docs/aventure/05-ombre-du-tout/25-les-branches.md).

const DOUBLE_HERO = doubleOf(7701, "merlin", "Double de")
const DOUBLE_LYRA = doubleOf(7702, "lyra")
const DOUBLE_BRUTUS = doubleOf(7703, "brutus")
const DOUBLE_GORR = doubleOf(7704, "gorr")

const BOARD = flat(9)
  .map((r, y) => (y === 4 ? "....1...." : r))
  .map((r, y) => (y === 1 || y === 7 ? "..~...~.." : r))

const spared = (r: FightReport) =>
  r.fighters.some((f) => f.preset === DOUBLE_HERO.id && (f.hp > 0 || f.fled))
const dispersed = (r: FightReport) =>
  r.fighters.filter((f) => f.team === 1 && f.hp <= 0).length

const objectives: ObjectiveSpec[] = [
  {
    id: "double-epargne",
    mark: "★",
    label: "Épargner ton propre Double",
    check: spared,
    success: "Il se tient debout, de l'autre côté. Il te regarde.",
    failure: "Il s'est dispersé. Ce n'est pas lui qu'on a perdu.",
    onSuccess: [set("double_epargne"), add("doubles.epargnes")],
  },
  {
    id: "aucune-dispersion",
    mark: "◆",
    label: "Aucun Double dispersé",
    check: (r) => dispersed(r) === 0,
    onSuccess: [add("confiance"), add("doubles.epargnes", 4)],
  },
  {
    id: "fixer-l-oree",
    mark: "◆",
    label: "Fixer l'Orée",
    check: (r) => r.fixed.length > 0,
    onSuccess: [add("lacunes.recousues", 0)],
  },
]

export const fight: FightSpec = {
  id: "ch25-les-autres-nous",
  title: "Les autres nous",
  goal: "Les Doubles sont équitables : ni meilleurs, ni pires. Tiens, sans disperser. Épargne le tien.",
  board: BOARD,
  teams: [
    {
      name: "L'équipe",
      side: "allies",
      fighters: [
        hero(1, 4),
        at("lyra", 1, 3),
        at("brutus", 2, 5),
        at("gorr", 1, 5),
      ],
    },
    {
      name: "Les Doubles",
      side: "enemies",
      fighters: [
        at(DOUBLE_HERO, 7, 4),
        at(DOUBLE_LYRA, 7, 3),
        at(DOUBLE_BRUTUS, 6, 5),
        at(DOUBLE_GORR, 7, 5),
      ],
    },
  ],
  rules: {
    clock: { period: 10, limit: 8, winner: 0 },
    flee: {
      team: 1,
      below: 0.3,
      exits: [
        { x: 8, y: 0 },
        { x: 8, y: 8 },
      ],
    },
    zones: [zone("oree", 3, 3, 5, 5)],
    zoneTeams: [0],
    announce: true,
  },
  influences: ["earthquake", "timeWarp", "blessing"],
  startEnergy: 4,
  objectives,
  defeat: [set("defaite"), add("usure"), add("confiance", -1)],
  lines: [
    {
      when: "start",
      who: "branches",
      text: "Dans une autre branche, c'est eux qui se tiennent là, et nous qui venons de l'autre côté. Nous ne savons pas laquelle est celle-ci.",
    },
    {
      when: "start",
      who: "brutus",
      text: "Il a mes bras. Il a ma façon de lever le bouclier. Je n'aime pas ça.",
    },
    {
      when: "tick:1",
      who: "doubles",
      text: "Vous n'êtes pas les méchants. Nous non plus. On se trouve seulement du même côté du trou.",
    },
    {
      when: "tick:3",
      who: "double-heros",
      text: "J'ai fait l'autre choix. Je ne sais pas si c'était le bon. Toi non plus, sûrement.",
    },
    {
      when: "tick:5",
      who: "eva",
      text: "Statistiquement, aucun de nous n'a tort. C'est le plus inquiétant.",
    },
  ],
}

const fightBeat = (): Beat => ({ t: "fight", fight })

export const ch25: Chapter = {
  id: "25",
  era: 5,
  number: 25,
  title: "Les branches",
  quote: {
    who: "Les branches",
    text: "Dans une autre branche, tu as fait l'autre choix. Nous les gardons toutes.",
  },
  place: "L'Orée",
  question: {
    id: "Q25",
    text: "Suis-je mes choix, ou toutes les branches où j'existe ?",
  },
  start: "1",
  scenes: {
    "1": {
      id: "1",
      title: "La chute",
      kind: "rencontre",
      setting: "L'Orée : là où le Tissu s'effiloche",
      next: "2",
      beats: [
        stage(
          "Le sol cède sans bruit. On tombe de quelques pas, dans une clairière qui ressemble à celle qu'on vient de quitter, avec une pierre déplacée et des visages trop proches.",
        ),
        say(
          "branches",
          "Nous sommes les branches. Nous avons toutes été, un instant, celle-ci. Tu peux nous entendre, maintenant que le Tissu est déchiré.",
        ),
        say("lyra", "On dirait chez nous. Ce n'est pas chez nous."),
        say(
          "eva",
          "Quarante-deux pour cent de ressemblance. Je me trompe rarement, sauf ici.",
        ),
        say(
          "nerea",
          "Ce n'est pas un rêve. Les strates ne se déposent pas comme ça. C'est un voisinage.",
        ),
        say(
          "gorr",
          "Gorr voit Gorr. L'autre Gorr ne dit rien. Gorr n'aime pas.",
        ),
        say(
          "lacunaire",
          "Je dis je. Ici, tout le monde dit je. C'est bruyant.",
        ),
        say(
          "merlin",
          "Mesurable : une superposition de configurations compatibles. Je le dirais, si cela voulait dire quelque chose.",
        ),
        choice("chute", [
          opt("1", "« Où sommes-nous ? »", [
            say(
              "branches",
              "À côté. Nous sommes toujours à côté. Ce n'est pas loin, seulement différent.",
            ),
          ]),
          opt("2", "« Ils sont nous ? »", [
            say(
              "branches",
              "Ils sont eux. Ils nous ressemblent comme deux gouttes qui n'ont pas touché la même vitre.",
            ),
            when(is("nyx_epargnee"), [fx(add("confiance.nyx"))]),
          ]),
          opt("3", "(Se taire, regarder.)", [
            narr(
              "Tu laisses les visages se montrer, un à un, sans en choisir aucun.",
            ),
          ]),
        ]),
      ],
    },
    "2": {
      id: "2",
      title: "Le pont des deux branches",
      kind: "lacune",
      setting: "Une Lacune étroite entre deux rives qui ne sont pas la même",
      next: "3",
      beats: [
        stage(
          "Une Lacune longue sépare deux rives. Sur chacune, la même clairière, mais l'herbe n'a pas été foulée aux mêmes endroits.",
        ),
        say(
          "brutus",
          "On passe en force. Le pont tiendra, il n'a pas le choix.",
        ),
        say(
          "nyx",
          "Laissez-le. Un pont qui n'a pas le choix n'est pas un pont, c'est une dette.",
        ),
        say(
          "lyra",
          "Il faut en prendre soin, de quelque façon. Coudre, ouvrir, ou rester dedans.",
        ),
        choice(
          "pont",
          [
            opt("recoudre", "Recoudre le pont : fixer une seule rive.", [
              fx(add("lacunes.recousues")),
              narr(
                "Les fils se serrent. Une rive s'éloigne un peu, définitivement.",
              ),
            ]),
            opt(
              "elargir",
              "Élargir le pont : laisser les deux rives se mêler.",
              [
                fx(add("lacunes.elargies"), add("usure")),
                narr(
                  "Le vide gagne. Les deux rives se touchent presque, et il en coûte.",
                ),
              ],
            ),
            opt("habiter", "Habiter le pont : s'y tenir, ensemble.", [
              fx(
                add("lacunes.habitees"),
                add("confiance.lyra"),
                add("confiance.brutus"),
              ),
              narr(
                "Vous restez au milieu. Le pont n'est ni cousu ni ouvert : il est tenu.",
              ),
            ]),
          ],
          "Que faire du pont ?",
        ),
      ],
    },
    "3": {
      id: "3",
      title: "Les autres nous",
      kind: "combat",
      setting: "L'Orée : neuf cases de pans mêlés",
      beats: [
        stage(
          "Ils arrivent par l'autre rive : Brutus, Lyra, Gorr, et toi, tous un peu décalés. Aucun ne cherche vraiment le combat.",
        ),
        fightBeat(),
        when(is("defaite"), [
          narr(
            "Vous êtes repoussés, et eux aussi. Personne ne poursuit. Les Doubles se détournent, sans triomphe, et le trou se referme à moitié.",
          ),
          fx(set("defaite", false)),
        ]),
        go("4"),
      ],
    },
    "4": {
      id: "4",
      title: "Celui qui a fait l'autre choix",
      kind: "rencontre",
      setting: "Le bord de l'Orée, au calme",
      next: "5",
      beats: [
        when(
          is("double_epargne"),
          [
            stage(
              "Ton Double est là, assis sur une pierre, sans arme. Il ne fuit pas.",
            ),
            say(
              "double-heros",
              "Tu m'as laissé debout. Je ne l'aurais peut-être pas fait.",
            ),
            choice(
              "double",
              [
                opt("1", "« Suis-je toi ? »", [
                  fx(set("carnet.Q25", "fausse")),
                  say(
                    "double-heros",
                    "Tu es toi. Je suis moi. Si l'un de nous disait qu'il est l'autre, il mentirait.",
                  ),
                ]),
                opt("2", "« Qu'as-tu choisi ? »", [
                  fx(set("carnet.Q25", "ouverte")),
                  say(
                    "double-heros",
                    "L'autre côté. Ça n'a rien d'une victoire. C'est seulement ce qui s'est passé.",
                  ),
                ]),
                opt("3", "« Qui est le vrai ? »", [
                  fx(set("carnet.Q25", "ouverte")),
                  say(
                    "double-heros",
                    "Le mot ne s'applique pas. Ni lui, ni moi, ni toi : chacun est l'un des fils.",
                  ),
                ]),
                opt(
                  "4",
                  "« Je suis ce que j'ai fait, et ce que j'aurais pu faire. »",
                  [
                    fx(set("carnet.Q25", "ouverte"), add("confiance")),
                    say(
                      "double-heros",
                      "Les deux ? C'est lourd à porter. Mais c'est exact.",
                    ),
                  ],
                ),
              ],
              "Que lui demander ?",
            ),
            choice("main", [
              opt("tendre", "Lui tendre la main.", [
                fx(set("double_epargne"), add("doubles.epargnes")),
                say(
                  "double-heros",
                  "Je viens. Ce ne sera pas pour toujours : je viens quand même.",
                ),
              ]),
              opt("renvoyer", "Le renvoyer à sa branche.", [
                say("double-heros", "C'est de bonne guerre. Je m'en vais."),
              ]),
            ]),
          ],
          [
            narr(
              "Tu cherches ton Double. Il n'y a qu'une trace, au pied de la pierre, et la sensation qu'une autre vie vient de s'éteindre à côté de la tienne.",
            ),
            fx(set("carnet.Q25", "ouverte")),
            say(
              "branches",
              "Nous le gardons, lui aussi. Aucune de nous n'efface.",
            ),
          ],
        ),
      ],
    },
    "5": {
      id: "5",
      title: "Au bord des pans",
      kind: "veillee",
      setting: "Le bord des pans, sans feu",
      next: "6",
      beats: [
        say(
          "branches",
          "Écoute. Ce sont des Échos d'autres soirs. Ils ne veulent rien. Ils sont.",
        ),
        hub("veillee", [
          topic("echo1", "Écouter un Écho", [
            narr("Un feu qui n'a jamais brûlé ici, et quelqu'un qui rit."),
            fx(add("confiance.lyra")),
          ]),
          topic("echo2", "Écouter un autre Écho", [
            narr("Une marche lente, un pas qui hésite, puis qui repart."),
            fx(add("confiance.brutus")),
          ]),
          topic("lyra", "Lyra", [
            say(
              "lyra",
              "Si je suis toutes mes branches, alors je suis un peu partout bien soignée.",
            ),
          ]),
          topic("brutus", "Brutus", [
            say(
              "brutus",
              "Je ne me demande pas lesquelles. Je tiens celle-ci.",
            ),
          ]),
          topic("eva", "Eva", [
            say(
              "eva",
              "Je calcule. Toutes les branches calculent la même chose, à peu près. C'est rassurant.",
            ),
          ]),
          topic(
            "nyx",
            "Nyx",
            [
              say(
                "nyx",
                "Je suis moins seule, ici. C'est étrange que ce soit si facile.",
              ),
            ],
            { if: is("paix_des_lacunes") },
          ),
          topic("gorr", "Gorr", [
            say(
              "gorr",
              "Gorr est Gorr. Les autres Gorr aussi. Il y a beaucoup de Gorr. Gorr n'est pas moins.",
            ),
          ]),
          topic(
            "chroniqueur",
            "Le Chroniqueur",
            [
              say(
                "chroniqueur",
                "Je n'écris qu'une branche. Je note que c'est un choix. Source : moi.",
              ),
            ],
            { if: is("chroniqueur_rejoint") },
          ),
          topic(
            "merlin",
            "Merlin",
            [
              say(
                "merlin",
                "Mesurer fixe une branche. Je n'ai jamais dit qu'elle était la seule.",
              ),
            ],
            { if: is("merlin_convaincu") },
          ),
          topic(
            "double",
            "Ton Double",
            [say("double-heros", "Ici, je suis moins seul que là-bas.")],
            { if: is("double_epargne") },
          ),
        ]),
        choice("fin-veillee", [
          opt("a", "« Je suis ce que je fais. »", [
            narr("Une branche se referme doucement."),
          ]),
          opt("b", "« Je suis ce que je pourrais être. »", [
            narr("Mille se rouvrent, et aucune ne pèse."),
          ]),
          opt("c", "(Ne pas choisir.)", [
            narr("Tu laisses la question à sa place. Elle ne se plaint pas."),
          ]),
        ]),
      ],
    },
    "6": {
      id: "6",
      title: "La pente",
      kind: "fin",
      setting: "Là où la pente commence",
      beats: [
        narr(
          "Le sol repart, en pente, vers un endroit tiède. Tu emportes une écharpe frangée, faite d'un fil qui n'a pas choisi sa branche.",
        ),
        fx({ give: "habit:echarpe-frangee" }),
        when(is("double_epargne"), [
          stage("Ton Double te suit, à quelques pas, comme un Écho."),
        ]),
        say(
          "branches",
          "Nous te laissons à celle-ci. Elle est un peu plus tienne que les autres.",
        ),
        go(END),
      ],
    },
  },
  exploration: walk(
    [
      { id: "1", label: "La chute" },
      { id: "2", label: "Le pont des deux branches" },
      { id: "3", label: "L'autre rive", auto: true },
      { id: "4", label: "Celui qui a fait l'autre choix" },
      { id: "5", label: "Le bord des pans" },
      { id: "6", label: "La pente" },
    ],
    ["lyra", "brutus", "gorr"],
  ),
}
