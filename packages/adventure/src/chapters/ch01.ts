import type { ActionDefinition, CharacterPreset } from "@realms/engine"
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
  isnt,
  join,
  narr,
  opt,
  say,
  set,
  stage,
  topic,
  unlock,
  when,
} from "../dsl"
import { type Chapter, END, type FightReport, type FightSpec } from "../types"

const toucherFroid: ActionDefinition = {
  id: "toucherFroid",
  name: "Toucher froid",
  description:
    "Le froid court sur la cible : dégâts énergétiques, et elle ralentit.",
  launch: { shape: "line", min: 1, max: 1 },
  lineOfSight: false,
  target: "enemy",
  timeCost: 1,
  effects: [
    { type: "damage", kind: "magical", power: 4 },
    { type: "status", status: "slowed", turns: 1 },
  ],
}

const lacunaireInstable: CharacterPreset = {
  id: "lacunaire_instable",
  name: "Lacunaire instable",
  title: "Chose qui hésite",
  affinity: "shadow",
  locomotion: "swimmer",
  stats: {
    health: 4,
    speed: 5,
    physicalAttack: 1,
    physicalDefense: 2,
    magicalAttack: 4,
    magicalDefense: 2,
    luck: 6,
  },
  actions: ["toucherFroid"],
  actionDefs: { toucherFroid },
}

const cells = (x0: number, y0: number, x1: number, y1: number) => {
  const out: { x: number; y: number }[] = []
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) out.push({ x, y })
  return out
}

const ZONES = ["feu", "rigole", "semis"]
const zonesKept = (r: FightReport) =>
  ZONES.filter((z) => r.zoneStates[z] !== "lost").length

const tenirLesBords: FightSpec = {
  id: "1.bords",
  title: "Tenir les bords",
  goal: "Tenir les trois endroits actifs jusqu'au dixième tour de la Frange, ou fixer tous les Lacunaires.",
  board: [
    ".........",
    "..1......",
    ".121..~..",
    "..1..~~..",
    ".........",
    "...a.....",
    ".......~.",
    ".1....~~.",
    ".........",
  ],
  teams: [
    {
      name: "Les Échos",
      side: "allies",
      fighters: [
        { preset: "@hero", at: { x: 3, y: 4 } },
        { preset: "lyra", at: { x: 2, y: 3 } },
      ],
    },
    {
      name: "Lacunaires",
      side: "enemies",
      // Three waves along the east fringe: 2 at turn 1, 2 at turn 4, 3 at turn 7.
      fighters: [
        { preset: lacunaireInstable, at: { x: 8, y: 2 }, arrives: { tick: 1 } },
        { preset: lacunaireInstable, at: { x: 8, y: 6 }, arrives: { tick: 1 } },
        { preset: lacunaireInstable, at: { x: 8, y: 0 }, arrives: { tick: 4 } },
        { preset: lacunaireInstable, at: { x: 8, y: 4 }, arrives: { tick: 4 } },
        { preset: lacunaireInstable, at: { x: 8, y: 1 }, arrives: { tick: 7 } },
        { preset: lacunaireInstable, at: { x: 8, y: 5 }, arrives: { tick: 7 } },
        { preset: lacunaireInstable, at: { x: 8, y: 8 }, arrives: { tick: 7 } },
      ],
    },
  ],
  rules: {
    // The Frange ticks every 10; holding until tick 10 is a win for the Échos.
    clock: { period: 10, limit: 10, winner: 0 },
    zones: [
      { id: "feu", cells: cells(1, 1, 3, 3) },
      { id: "rigole", cells: cells(5, 2, 7, 4) },
      { id: "semis", cells: cells(5, 6, 7, 8) },
    ],
    zoneTeams: [0],
    fixOnDeath: [1],
    // Réparation stays greyed out ("Pas encore.").
    lockedDivine: ["blessing"],
  },
  influences: ["earthquake", "timeWarp"],
  startEnergy: 3,
  defeat: [set("defaite"), add("usure", 1), add("confiance", -1)],
  objectives: [
    {
      id: "zones",
      mark: "★",
      label: "Garder les trois zones actives",
      check: (r) => ({ ok: zonesKept(r) === 3, n: zonesKept(r) }),
      success: "Le feu, la rigole, les semis : tout a tenu.",
      failure: "Le bord a pris ce qu'on ne tenait pas.",
      // CUT: each lost zone should shrink the map for the whole chapter (a
      // column of Clair); the flag is kept for chapter 2 to read.
      onSuccess: [{ add: "zones_bords_froids", by: 1, perUnit: true }],
      onFailure: [{ add: "zones_bords_froids", by: 1, perUnit: true }],
    },
    {
      id: "seisme_lyra",
      mark: "◆",
      label: "Ne pas pousser la terre sous Lyra",
      check: (r) => {
        const lyra = r.fighters
          .filter((f) => f.preset === "lyra")
          .map((f) => f.id)
        return !r.divineNearAlly.some(
          (d) => d.divineId === "earthquake" && lyra.includes(d.fighterId),
        )
      },
      success: "La terre n'a pas bougé sous elle.",
      failure: "Lyra n'a pas aimé que le sol bouge sous ses pieds.",
      onFailure: [
        { add: "confiance.lyra", by: -1 },
        { add: "confiance", by: -1 },
      ],
    },
    {
      id: "feu_tenu",
      mark: "◆",
      label: "Le feu ne s'éteint pas",
      // SIMPLIFIED: "no Lacunaire reaches the hearth (2,2)" is approximated by
      // "the Feu zone was never lost".
      check: (r) => r.zoneStates.feu !== "lost",
      success: "Le foyer n'a jamais été atteint.",
      onSuccess: [{ set: "feu_tenu", value: true }],
    },
    {
      id: "ghom_agi",
      mark: "◆",
      label: "Le Ghom a agi",
      check: (r) => Object.values(r.divineUsed).some((n) => n > 0),
      onSuccess: [{ set: "ghom_a_agi", value: true }],
    },
  ],
  lines: [
    {
      when: "start",
      who: "lyra",
      text: "Le feu, la rigole, les semis. Il faut qu'il s'y passe quelque chose. Tout le temps.",
    },
    { when: "zone:semis", who: "lyra", text: "Les semis ! Ils se taisent !" },
    {
      when: "zone:rigole",
      who: "lyra",
      text: "La rigole gèle ! Va remuer l'eau !",
    },
    {
      when: "zone:feu",
      who: "lyra",
      text: "Le feu se tait ! Va y faire quelque chose !",
    },
    // CUT: first Séisme/Distorsion, first heal, zone lost and Lacunaire fixed
    // lines depend on game events that the fight spec cannot name.
    {
      when: "end",
      who: "lyra",
      text: "Ils repartent. Le soleil a chauffé le sol, ils ont trouvé plus chaud que nous. Ce n'est pas une victoire, c'est le matin.",
    },
  ],
}

export const ch01: Chapter = {
  id: "1",
  era: 1,
  number: 1,
  title: "Les bords froids",
  quote: {
    who: "lyra",
    text: "Ici, il ne se passe plus rien. Alors je m'arrange pour qu'il se passe quelque chose.",
  },
  place:
    "Les bords froids, frange orientale de l'île natale ; la Borne de Demeure",
  question: {
    id: "Q01",
    text: "Que devient une chose quand plus rien ne la touche ?",
  },
  start: "borne",
  exploration: {
    // The fight's meadow is the island: feu (NW), rigole (E), semis (SE).
    island: tenirLesBords.board,
    start: { x: 0, y: 7 },
    companions: ["lyra"],
    influences: ["timeWarp", "earthquake"],
    encounters: [
      {
        id: "borne",
        label: "La Borne de Demeure",
        scene: "borne",
        at: { x: 0, y: 5 },
        zone: [
          { x: 0, y: 4 },
          { x: 0, y: 5 },
          { x: 0, y: 6 },
          { x: 1, y: 5 },
        ],
      },
      {
        id: "lyra",
        label: "Lyra, au feu",
        scene: "lyra",
        at: { x: 2, y: 2 },
        actor: "lyra",
        zone: [
          { x: 1, y: 2 },
          { x: 3, y: 2 },
          { x: 2, y: 3 },
          { x: 2, y: 1 },
        ],
      },
      {
        id: "bords",
        label: "Les bords froids",
        scene: "bords",
        at: { x: 8, y: 4 },
        auto: true,
      },
      {
        id: "veillee",
        label: "Le feu de Lyra",
        scene: "veillee",
        at: { x: 2, y: 2 },
        zone: [
          { x: 1, y: 3 },
          { x: 2, y: 3 },
          { x: 3, y: 3 },
          { x: 3, y: 2 },
          { x: 1, y: 2 },
        ],
      },
      {
        id: "depart",
        label: "Le chemin du nord",
        scene: "depart",
        at: { x: 4, y: 0 },
        zone: [
          { x: 3, y: 0 },
          { x: 4, y: 0 },
          { x: 5, y: 0 },
          { x: 4, y: 1 },
        ],
      },
      {
        id: "herbe_grise",
        label: "L'herbe grise",
        at: { x: 4, y: 4 },
        examine: {
          lines: [
            {
              text: "L'herbe est grise et raide, couverte d'une rosée qui ne sèche pas. Pas un insecte.",
            },
          ],
          effects: [{ add: "ecoute", by: 1 }],
        },
      },
      {
        id: "frange",
        label: "Le sol qui se défait",
        at: { x: 8, y: 3 },
        examine: {
          lines: [
            {
              style: "stage",
              text: "Au loin, le sol se défait : ses derniers mètres sont flous, comme vus à travers une vitre sale, et derrière il n'y a que le Clair.",
            },
          ],
          effects: [{ add: "ecoute", by: 1 }],
        },
      },
      {
        id: "rosee",
        label: "Une rosée qui ne sèche pas",
        at: { x: 6, y: 5 },
        obstacle: {
          influence: "timeWarp",
          before: [
            {
              style: "stage",
              text: "Une perle de rosée tremble sur une feuille grise. Elle est là depuis toujours, et attend un matin qui ne vient pas.",
            },
          ],
          after: [
            {
              style: "stage",
              text: "Le temps glisse d'un cran sur la feuille. La perle roule, tombe, disparaît : pour la première fois ici, quelque chose est arrivé.",
            },
          ],
          effects: [{ add: "ecoute", by: 1 }],
        },
      },
      {
        id: "errant",
        label: "Un Lacunaire isolé",
        at: { x: 7, y: 7 },
        wander: {
          preset: lacunaireInstable,
          title: "Un Lacunaire égaré",
          goal: "Le toucher pour qu'il se décide.",
          range: 2,
          radius: 4,
          effects: [{ add: "ecoute", by: 1 }],
          success:
            "Il s'est décidé en un galet, sous la main. Il n'y a rien à ajouter.",
        },
      },
    ],
  },
  scenes: {
    borne: {
      id: "borne",
      title: "La Borne",
      kind: "rencontre",
      setting: "Une pierre levée, là où l'herbe verte devient grise.",
      next: "lyra",
      beats: [
        stage(
          "Une pierre levée au bord du chemin, là où l'herbe verte devient grise. Une pierre grise, haute comme deux Échos, couverte de lichen sauf sur la face gravée, que quelqu'un brosse avec soin. En bas, une ligne plus récente, d'une autre main, plus maladroite.",
        ),
        choice("borne", [
          opt("lire", "Lire la Borne.", [
            fx(set("borne_lue")),
            stage("ICI COMMENCE LE REPOS."),
            stage(
              "Voyageur de Terre-Ferme, arrête ton pas. Au-delà de cette pierre, rien ne bouge, et c'est bien. L'herbe ne pousse plus, et ne meurt plus. Le vent n'y passe plus, et ne l'use plus. C'est ici que le Ghom pose sa main sur le monde : car le Ghom ne bouge pas, et ce qui ne bouge pas lui ressemble.",
            ),
            stage(
              "Tout ce qui change se perd. Tout ce qui se perd a changé. Ne plante pas. Ne bâtis pas. Ne répare pas. Garde ce qui est, et tu dureras comme lui.",
            ),
            stage(
              "Ceux de Demeure ont gardé cette pierre depuis le premier hiver, et n'y ont rien ajouté.",
            ),
            stage(
              "Et, plus bas, d'une autre main, à peine incisée : « Le repos avance d'un pas chaque printemps. J'ai mesuré. - L. »",
            ),
            narr(
              "Quelqu'un a écrit que rien ne bouge, ici, et que c'est bien. Quelqu'un d'autre a écrit, plus bas, que ça avance. Les deux ne peuvent pas avoir raison. Ou alors, ce qui ne bouge pas avance quand même.",
            ),
            narr(
              "Le Ghom ne bouge pas, dit la pierre. Ce matin, ça m'a touché. Je ne sais pas si ce qui touche peut être immobile.",
            ),
          ]),
          opt("passer", "Passer sans lire.", [
            narr(
              "Une pierre avec des mots. Je n'ai pas le temps : là-bas, il y a de la fumée.",
            ),
          ]),
        ]),
      ],
    },
    lyra: {
      id: "lyra",
      title: "La femme au feu",
      kind: "rencontre",
      setting:
        "Les bords froids : herbe grise et raide, rosée qui ne sèche pas, pas un insecte. Un petit feu, très vivant.",
      next: "bords",
      beats: [
        stage(
          "Les bords froids. L'herbe est grise et raide, couverte d'une rosée qui ne sèche pas. Pas un insecte. Au loin, le sol se défait : ses derniers mètres sont flous, comme vus à travers une vitre sale, et derrière il n'y a que le Clair. Au milieu de ce silence, un petit feu, très vivant. Une femme y est agenouillée. Elle remue la terre avec un bâton, souffle sur une poignée de graines, les jette, puis se lève pour aller verser l'eau d'une gourde dans une rigole qu'elle a creusée. Elle ne s'arrête jamais longtemps au même endroit.",
        ),
        say("lyra", "Ne reste pas planté là. Ici, on ne reste pas planté."),
        stage("Elle ne se retourne même pas."),
        say(
          "lyra",
          "Si tu veux être utile, va piétiner les semis, là-bas. Piétiner doucement. Il faut que la terre sente quelque chose.",
        ),
        choice("accueil", [
          opt("aide", "« Tu as besoin d'aide ? »", [
            fx(add("confiance.lyra")),
            say(
              "lyra",
              "Tout le monde a besoin d'aide, aux bords. Les bords plus que tout le monde.",
            ),
          ]),
          opt("quoi", "« Qu'est-ce que tu fais ? »", [
            say(
              "lyra",
              "Je fais en sorte qu'il se passe quelque chose. Du feu, de l'eau qui coule, des graines qui germent, des pieds qui marchent. Tant que ça bouge, ça tient. Quand plus rien ne bouge...",
            ),
            stage("Elle désigne le bord flou."),
            say("lyra", "Ça."),
          ]),
          opt(
            "borne",
            '« C\'est toi, "L." ? »',
            [
              fx(add("confiance.lyra")),
              stage(
                "Lyra s'arrête, pour la première fois. Elle rit, un rire bref.",
              ),
              say(
                "lyra",
                "On l'a encore pas effacée, alors. Tant mieux. Oui. J'ai mesuré, j'ai écrit. Ils ont dit que j'avais abîmé la pierre. J'ai dit que la pierre avait tort.",
              ),
            ],
            is("borne_lue"),
          ),
        ]),
        say("lyra", "Tu viens d'où, toi ?"),
        choice("origine", [
          opt(
            "prairie",
            "« D'une prairie. Au sud. Je me suis réveillé ce matin. »",
          ),
          opt("inconnu", "« Je ne sais pas. »"),
        ]),
        say("lyra", "Ce matin."),
        stage(
          "Elle le regarde enfin, de haut en bas, comme on évalue une plaie.",
        ),
        say(
          "lyra",
          "Tu n'as pas froid, au moins. C'est déjà ça. Bon. Tu as des jambes, j'ai trois endroits à garder vivants et je n'ai que deux jambes. Fais le compte.",
        ),
        stage(
          "Un craquement sec, du côté du bord. Une forme se détache des fils du sol : une flaque, puis un caillou, puis une touffe d'herbe gelée, puis rien de précis. Elle glisse vers le feu.",
        ),
        say("lyra", "Et voilà les visiteurs."),
        choice("visiteurs", [
          opt("quoi", "« Qu'est-ce que c'est ? »", [
            say(
              "lyra",
              "Des Lacunaires. Ce qui sort du bord quand il se défait. Ils ne sont pas méchants, ils sont froids. Ils viennent vers nous comme les papillons de nuit vers la lampe. Sauf que la lampe, c'est nous, et qu'ils nous prennent notre chaleur.",
            ),
          ]),
          opt(
            "galet",
            "« J'en ai touché un, ce matin. Il est devenu un galet. »",
            [
              say(
                "lyra",
                "Il s'est décidé, oui. C'est ce qu'ils font quand on les touche assez fort. Ils deviennent une seule chose, et c'est rarement une chose vivante.",
              ),
              stage("Un temps."),
              say("lyra", "Tu l'as laissé venir près de toi d'abord ?"),
              stage("Le héros acquiesce."),
              say(
                "lyra",
                "Hm. Tu es soit très doux, soit très bête. On verra.",
              ),
            ],
            is("lacunaire_approche"),
          ),
        ]),
        fx(
          join("lyra"),
          unlock("influence:earthquake"),
          unlock("influence:timeWarp"),
        ),
      ],
    },
    bords: {
      id: "bords",
      title: "Tenir les bords",
      kind: "combat",
      setting: "La frange orientale de l'île : le feu, la rigole, les semis.",
      next: "veillee",
      beats: [
        { t: "fight", fight: tenirLesBords },
        when(is("defaite"), [
          stage(
            "Les Échos tombent avant la fin du dixième tour. Le froid prend le feu, puis la rigole, puis les semis, comme un gel qui monte par la terre. Le héros, à genoux, ne voit plus que la frange avancer. Une main le saisit par le col : Lyra, qui se relève la première et le tire hors du gris, pas à pas, jusqu'à la butte où la chaleur tient encore.",
          ),
          say(
            "lyra",
            "Respire. Ce n'est pas toi qui as perdu. Le bord avance d'un pas chaque printemps : aujourd'hui il en a fait trois, voilà tout.",
          ),
          stage(
            "Elle ne lâche pas son bras avant que les Lacunaires, n'ayant plus rien de chaud à suivre, se défassent d'eux-mêmes dans l'herbe grise.",
          ),
          say(
            "lyra",
            "On a perdu des champs. On n'a pas perdu le feu. Viens, il y a de quoi réchauffer deux personnes.",
          ),
          fx(set("defaite", false)),
        ]),
      ],
    },
    veillee: {
      id: "veillee",
      title: "Le feu de Lyra",
      kind: "veillee",
      setting: "Le soir. Le feu, le seul point chaud à des centaines de pas.",
      next: "depart",
      beats: [
        stage(
          "Le soir. Le feu, le seul point chaud à des centaines de pas. Lyra raccommode un pan de sa cape avec une aiguille d'os. Le héros a son Carnet sur les genoux.",
        ),
        when(gte("zones_bords_froids", 1), [
          stage(
            "Derrière eux, le bord est un peu moins flou qu'à midi : ce qui a été tenu a tenu.",
          ),
        ]),
        when(
          is("zones_bords_froids", 3),
          [
            say(
              "lyra",
              "Trois endroits sur trois. Demain, il faudra recommencer. Après-demain aussi. C'est ça, entretenir : ce n'est jamais fini.",
            ),
          ],
          [
            when(
              is("zones_bords_froids", 2),
              [
                say(
                  "lyra",
                  "Deux sur trois. Demain, il faudra recommencer. Après-demain aussi. C'est ça, entretenir : ce n'est jamais fini.",
                ),
              ],
              [
                when(
                  is("zones_bords_froids", 1),
                  [
                    say(
                      "lyra",
                      "Un sur trois. Demain, il faudra recommencer. Après-demain aussi. C'est ça, entretenir : ce n'est jamais fini.",
                    ),
                  ],
                  [
                    say(
                      "lyra",
                      "Aucun des trois. Demain, il faudra recommencer. Après-demain aussi. C'est ça, entretenir : ce n'est jamais fini.",
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
        // CUT: the extra line of Lyra when the hearth was held (flag
        // feu_tenu), the document gives no text for it.
        hub("feu", [
          topic("demeure", "Demeure", [
            say(
              "lyra",
              "Je viens de Demeure. Un village, à l'ouest, derrière la colline aux pierres. Des gens bien. Des gens qui ont décidé que tout ce qui change se perd, et que donc il ne faut rien changer. Ils ne plantent plus : planter, c'est changer la terre. Ils ne bâtissent plus. Ils ne réparent même plus : réparer, c'est changer, disent-ils.",
            ),
            say(
              "lyra",
              "Ils ont raison, c'est ça le pire. Réparer, c'est changer. C'est pour ça que je répare.",
            ),
            choice("demeure", [
              opt("manques", "« Tu leur manques ? »", [
                fx(add("confiance.lyra")),
                say(
                  "lyra",
                  "Je manque à mon frère, peut-être. Il garde les murs. Il garde tout, d'ailleurs. Il me garderait aussi, si je le laissais faire.",
                ),
              ]),
              opt("raison", "« Ils ont peut-être raison de tout garder. »", [
                say("lyra", "Peut-être. Va leur dire. Tu les trouveras assis."),
              ]),
            ]),
            fx(add("ecoute"), add("ecoute_bords")),
          ]),
          topic(
            "ghom",
            "Le Ghom",
            [
              say(
                "lyra",
                "Le rocher qui est sorti de terre, tout à l'heure. Et ce Lacunaire qui s'est mis à bouger comme dans de la mélasse. C'était ton... ce qui t'accompagne ?",
              ),
              choice("ghom", [
                opt("sais_pas", "« Je ne sais pas ce que c'est. »", [
                  say(
                    "lyra",
                    "À Demeure, on l'appelle le Ghom. On dit qu'il ne bouge pas, qu'il est au-delà du temps, et que c'est pour ça qu'il faut lui ressembler.",
                  ),
                  stage("Elle tisonne le feu."),
                  say(
                    "lyra",
                    "Moi, je dis qu'un rocher vient de sortir de terre, et que ça a coûté quelque chose à quelqu'un. Rien ne sort de terre gratuitement.",
                  ),
                ]),
                opt("touche", "« Il m'a touché. Ce matin. »", [
                  stage("Elle pèse le mot."),
                  say(
                    "lyra",
                    "Touché. Alors il n'est pas si immobile que ça. Ne le dis pas trop fort à Demeure.",
                  ),
                ]),
              ]),
              fx(add("ecoute"), add("ecoute_bords")),
            ],
            { if: is("ghom_a_agi") },
          ),
          topic("bords", "Les bords", [
            say(
              "lyra",
              "Le bord avance d'un pas chaque printemps. J'ai planté des piquets, il y a quatre ans. Le premier est dans le Clair, maintenant. Le deuxième est à moitié flou. Il penche, et on ne sait pas vers quoi.",
            ),
            say(
              "lyra",
              "Là où rien ne passe, rien ne chauffe, rien ne pousse, rien ne frotte contre rien... le sol a l'air d'oublier qu'il est là. Pas d'un coup. Il devient... moins sûr. Et puis il n'y a plus de sol.",
            ),
            stage(
              "Le héros sort le Galet tiède de sa poche, ou montre le bord. Il ouvre le Carnet.",
            ),
            choice("q01", [
              opt(
                "chose",
                "« Que devient une chose quand plus rien ne la touche ? »",
              ),
              opt("sol", "« Où va le sol, quand il s'en va ? »", [
                stage(
                  "Le héros écrit, puis corrige, sous le regard de Lyra : « Que devient une chose quand plus rien ne la touche ? »",
                ),
              ]),
            ]),
            fx(set("carnet.Q01", "ouverte")),
            say("lyra", "Je ne sais pas."),
            stage("Un temps."),
            say(
              "lyra",
              "Je déteste dire ça. Mais je ne sais pas. Je sais seulement que ça avance d'un pas par printemps, et que je n'ai que deux jambes.",
            ),
            fx(add("ecoute"), add("ecoute_bords")),
          ]),
          topic(
            "cape",
            "La cape",
            [
              say("lyra", "Tiens."),
              stage("Elle lui tend la cape qu'elle raccommodait."),
              say(
                "lyra",
                "Je la gardais pour quelqu'un qui aurait froid aux bords. Tu as l'air de quelqu'un qui va avoir froid aux bords.",
              ),
              fx(give("cape_du_premier_matin"), give("piquet_de_lyra")),
              choice("cape", [
                opt("merci", "« Merci. »", [fx(add("confiance.lyra"))]),
                opt("garde", "« Garde-la, c'est toi qui as froid. »", [
                  say(
                    "lyra",
                    "J'ai froid depuis quatre ans. Une cape de plus ne changera rien. Prends-la, et ne discute pas avec une soigneuse.",
                  ),
                ]),
              ]),
            ],
            { last: true },
          ),
        ]),
        when(
          any(
            gte("ecoute_bords", 3),
            all(isnt("ghom_a_agi"), gte("ecoute_bords", 2)),
          ),
          [fx(add("confiance"))],
        ),
      ],
    },
    depart: {
      id: "depart",
      title: "Le départ vers le nord",
      kind: "fin",
      setting: "L'aube.",
      beats: [
        stage(
          "L'aube. Lyra a déjà éteint le feu et enterré les braises « pour que la terre ait chaud encore un peu ». Elle regarde vers le nord, où le bord fait une avancée plus nette, une sorte de baie de gris dans le vert.",
        ),
        say(
          "lyra",
          "Là-haut, ça avance plus vite. Il y a un endroit où le bord est entré presque jusqu'aux arbres. Je vais essayer quelque chose. Quelque chose de bête et de fatigant.",
        ),
        choice("depart", [
          opt("avec", "« Je viens avec toi. »", [fx(add("confiance.lyra"))]),
          opt("quoi", "« Quel genre de chose ? »", [
            say(
              "lyra",
              "Le genre de chose qu'on ne fait qu'une fois par an, parce que ça coûte trop cher. Viens, tu verras.",
            ),
          ]),
        ]),
        narr(
          "Je ne sais pas pourquoi je suis là. Mais aujourd'hui, je sais où je vais : derrière elle.",
        ),
        go(END),
      ],
    },
  },
}
