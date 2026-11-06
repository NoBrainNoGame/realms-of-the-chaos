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
  opt,
  say,
  set,
  stage,
  when,
} from "../dsl"
import {
  type Beat,
  type Chapter,
  type Cond,
  END,
  type FighterSpec,
  type FightSpec,
} from "../types"
import {
  COEUR,
  DEDOUBLE,
  EFFILOCHEUR,
  FORMES_STABILISE,
  GIANT,
  ILSE,
  kitOf,
  look,
  movable,
  STABILISE,
  UNSTABLE,
  zoneOf,
} from "./era2-kit"

type Ile = "sauge" | "lusse" | "strates"

// The chosen island, surrounded by deep water; the Heart sits at the centre.
const SAUGE = [
  "WWWWWWWWWWW",
  "WW~~...~~WW",
  "W~..1.1..~W",
  "W~.......~W",
  "W..1...1..W",
  "W~.......~W",
  "W~..1.1..~W",
  "WW~~...~~WW",
  "WWWWWWWWWWW",
]
// Lusse: crystal arches in place of the footbridges, more shallows.
const LUSSE = SAUGE.map((r) => r.replaceAll("1", "2").replaceAll("W~", "W~"))
// Les Strates: higher ground around the Heart.
const STRATES = SAUGE.map((r, y) =>
  y >= 3 && y <= 5 ? r.replaceAll("1", "3") : r.replaceAll("1", "2"),
)
const BOARDS: Record<Ile, string[]> = {
  sauge: SAUGE,
  lusse: LUSSE,
  strates: STRATES,
}

const OMBRE = kitOf("nyx", "ombre", "Ombre", "Ombre")

const DEFEAT_LINE = "Nous avons tout perdu en en gardant une"

const zone = zoneOf(SAUGE)

/** The defence in waves, for one island, with Squalor or without, with the two Ombres or without. */
function marree(ile: Ile, squalor: boolean, ombres: boolean): FightSpec {
  const allies: FighterSpec[] = [
    { preset: "@hero", at: { x: 3, y: 4 } },
    { preset: "nerea", at: { x: 4, y: 2 } },
    { preset: "eva", at: { x: 6, y: 7 } },
    // the form it took in ch. 10 (one only is on the board; the index stays)
    ...Object.entries(FORMES_STABILISE).map(([forme, preset]) => ({
      preset,
      at: { x: 4, y: 6 },
      needs: `lacunaire.forme=${forme}`,
    })),
    {
      preset: STABILISE,
      at: { x: 4, y: 6 },
      needs: "lacunaire.forme=aucune",
    },
  ]
  if (squalor) allies.push({ preset: "squalor", at: { x: 6, y: 6 } })
  if (ombres) {
    allies.push({ preset: OMBRE, at: { x: 2, y: 3 } })
    allies.push({ preset: OMBRE, at: { x: 2, y: 5 } })
  }
  const heart: FighterSpec[] = [{ preset: COEUR, at: { x: 5, y: 4 } }]
  if (ile === "sauge") heart.push({ preset: ILSE, at: { x: 5, y: 1 } })
  const objectives: FightSpec["objectives"] = [
    {
      id: "tenir",
      mark: "★",
      label: "Le choix : tenir l'île",
      check: (r) =>
        r.fighters.some((f) => f.preset === "coeur_ile" && f.hp > 0),
      success: "Le Cœur de l'île tient.",
      failure: "Le Cœur est tombé : l'île choisie est perdue aussi.",
      onFailure: [set("ile_sauvee", "aucune")],
    },
    {
      id: "sans-influence",
      mark: "◆",
      label: "Pas d'Influence sur les siens",
      check: (r) =>
        (r.divineUsed.earthquake ?? 0) === 0 &&
        (r.divineUsed.timeWarp ?? 0) === 0,
      success: "Le Ghom n'a touché à aucun des siens.",
      onSuccess: [add("confiance")],
    },
    {
      id: "ile-entiere",
      mark: "◆",
      label: "Une île entière",
      // Every cell of the island stayed ground: none of the cells the tide
      // and the ring left uncertain settled into water (an ally standing on
      // one, or next to it, keeps it solid).
      check: (r) =>
        r.fighters.some((f) => f.preset === "coeur_ile" && f.hp > 0) &&
        !(r.measured ?? []).some((m) => m.state === "void"),
      success: "Pas une case dans l'eau. Ilse, note.",
      onSuccess: [set("ch12_ile_entiere")],
    },
  ]
  if (ile === "sauge")
    objectives.push({
      id: "personne-derriere",
      mark: "★",
      label: "Personne derrière",
      // Eva reaches Ilse before the third wave (tick 8) and Ilse is alive at
      // the end.
      when: { touched: { of: "ilse", by: "eva", before: 8 } },
      check: (r) => r.fighters.some((f) => f.preset === "ilse" && f.hp > 0),
      success: "Ta mesure, c'est moi qui la finirai.",
      onSuccess: [set("ch12_personne_derriere")],
    })
  return {
    id: `ch12-grande-maree-${ile}${squalor ? "-sq" : ""}${ombres ? "-om" : ""}`,
    title: "Grande Marée",
    board: BOARDS[ile],
    teams: [
      { name: "L'équipe", side: "allies", fighters: allies },
      { name: "Le Cœur", side: "neutral", fighters: heart },
      {
        name: "La Marée",
        side: "enemies",
        fighters: [
          // wave 1
          { preset: UNSTABLE, at: { x: 2, y: 1 } },
          { preset: UNSTABLE, at: { x: 8, y: 1 } },
          { preset: UNSTABLE, at: { x: 1, y: 4 } },
          { preset: UNSTABLE, at: { x: 9, y: 4 } },
          // wave 2 (tick 4)
          { preset: DEDOUBLE, at: { x: 1, y: 3 }, arrives: { tick: 4 } },
          { preset: DEDOUBLE, at: { x: 9, y: 5 }, arrives: { tick: 4 } },
          // wave 3 (tick 8)
          // (none when Peut-Être was mended)
          {
            preset: EFFILOCHEUR,
            at: { x: 3, y: 7 },
            arrives: { tick: 8 },
            needs: "peut_etre!=recousue",
          },
          {
            preset: EFFILOCHEUR,
            at: { x: 7, y: 7 },
            arrives: { tick: 8 },
            needs: "peut_etre!=recousue",
          },
          // wave 4 (tick 12)
          { preset: GIANT, at: { x: 8, y: 6 }, arrives: { tick: 12 } },
          // wave 3, with the instables (3), and wave 4's two instables
          { preset: UNSTABLE, at: { x: 2, y: 7 }, arrives: { tick: 8 } },
          { preset: UNSTABLE, at: { x: 5, y: 7 }, arrives: { tick: 8 } },
          { preset: UNSTABLE, at: { x: 8, y: 7 }, arrives: { tick: 8 } },
          { preset: UNSTABLE, at: { x: 1, y: 5 }, arrives: { tick: 12 } },
          { preset: UNSTABLE, at: { x: 9, y: 3 }, arrives: { tick: 12 } },
          // the Seuil does not hold: a wave from the Hole between 3 and 4
          {
            preset: UNSTABLE,
            at: { x: 4, y: 7 },
            arrives: { tick: 10 },
            needs: "!lacune_geante_habitee",
          },
          {
            preset: UNSTABLE,
            at: { x: 5, y: 7 },
            arrives: { tick: 10 },
            needs: "!lacune_geante_habitee",
          },
          {
            preset: UNSTABLE,
            at: { x: 6, y: 7 },
            arrives: { tick: 10 },
            needs: "!lacune_geante_habitee",
          },
          // Peut-Être widened: two more instables at wave 3
          {
            preset: UNSTABLE,
            at: { x: 1, y: 6 },
            arrives: { tick: 8 },
            needs: "peut_etre=elargie",
          },
          {
            preset: UNSTABLE,
            at: { x: 9, y: 6 },
            arrives: { tick: 8 },
            needs: "peut_etre=elargie",
          },
        ],
      },
    ],
    // The two Dédoublés of wave 2 are one body in two places (a double); a
    // ring of cells around the Heart is uncertain until measured or until
    // tick 10.
    // The Front de Marée comes from the east (wave 2 side), one column every
    // four ticks. The flags adjust the waves (`needs`) and the rules
    // (`rulesIf`): the ring is uncertain from the start if the star of ch. 7
    // failed, and Peut-Être inhabited lets a fallen ally reform once. The
    // clock stands for "hold the four waves"; the engulfment that ends wave 4
    // is told in the next scene.
    rulesIf: [
      {
        needs: "!ch7_etoile",
        rules: {
          superposition: {
            cells: [
              { x: 2, y: 3 },
              { x: 8, y: 3 },
              { x: 2, y: 5 },
              { x: 8, y: 5 },
              { x: 4, y: 7 },
              { x: 6, y: 7 },
              { x: 2, y: 2 },
              { x: 8, y: 2 },
              { x: 2, y: 6 },
              { x: 8, y: 6 },
              { x: 4, y: 1 },
              { x: 6, y: 1 },
            ],
            pVoid: 0.3,
            decohereAt: 10,
          },
        },
      },
      {
        needs: "peut_etre=habitee",
        rules: {
          recompose: [
            { team: 0, index: 1, after: 3, times: 1 },
            { team: 0, index: 2, after: 3, times: 1 },
          ],
        },
      },
    ],
    rules: {
      tide: { axis: "x", from: 10, dir: -1, every: 4, start: 4 },
      neutral: [1],
      clock: { period: 10, limit: 16, winner: 0 },
      doubles: [{ team: 2, pair: [4, 5] }],
      superposition: {
        cells: [
          { x: 2, y: 3 },
          { x: 8, y: 3 },
          { x: 2, y: 5 },
          { x: 8, y: 5 },
          { x: 4, y: 7 },
          { x: 6, y: 7 },
        ],
        pVoid: 0.3,
        decohereAt: 10,
      },
    },
    influences: ["earthquake", "timeWarp", "blessing"],
    startEnergy: 4,
    goal: "Tenir l'île : on ne gagne rien à frapper la Marée, on gagne à tenir la terre. Le Cœur ne doit pas tomber.",
    defeat: [set("defaite"), add("usure", 1), add("confiance.nerea", -1)],
    objectives,
    lines: [
      {
        when: "start",
        who: "nerea",
        text: "Souvenez-vous : on ne gagne rien à frapper la Marée. On gagne à tenir la terre.",
      },
      ...(squalor
        ? [
            {
              when: "tick:1" as const,
              who: "squalor",
              text: "Une Marée entière à mordre. Je n'ai jamais eu autant de choix.",
            },
          ]
        : []),
      {
        when: "tick:3",
        who: "tessa",
        text: "Hauteur relevée : quatre brasses. Pardon. Je mesure.",
      },
      {
        when: "tick:5",
        who: "eva",
        text: "Quatre cases, chacune à moitié là. Je déteste ce monstre. Il est fait pour me déplaire personnellement.",
      },
      {
        when: "tick:5",
        who: "lacunaire",
        text: "Lui, il n'a jamais été touché par personne. Nous… nous savons ce que c'est.",
      },
      { when: "end", who: "lacunaire", text: "Nous tenons. Nous… tenons !" },
    ],
  }
}

/** Picks the fight by island, Squalor and Ombres: a chain of `when`. */
function marreeBeat(): Beat {
  const squalorCond: Cond = any(
    is("squalor_rejoint"),
    is("ile_sauvee", "lusse"),
  )
  const entries: { cond: Cond; fight: FightSpec }[] = []
  for (const ile of ["sauge", "lusse", "strates"] as Ile[])
    for (const sq of [true, false])
      for (const om of [true, false])
        entries.push({
          cond: all(
            is("ile_sauvee", ile),
            sq ? squalorCond : { not: squalorCond },
            om ? is("nyx_epargnee") : { not: is("nyx_epargnee") },
          ),
          fight: marree(ile, sq, om),
        })
  const last = entries[entries.length - 1]
  let acc: Beat = { t: "fight", fight: last.fight }
  for (let i = entries.length - 2; i >= 0; i--)
    acc = when(
      entries[i].cond,
      [{ t: "fight", fight: entries[i].fight }],
      [acc],
    )
  return acc
}

export const ch12: Chapter = {
  id: "12",
  era: 2,
  number: 12,
  title: "Grande Marée",
  quote: {
    who: "nerea",
    text: "Eva a calculé que nous pouvions tenir une île. Une. Elle l'a dit trois fois, comme si le chiffre allait changer à force de le dire. Il n'a pas changé.",
  },
  place:
    "La Tour des Marées (Sauge), puis l'île choisie, enfin la Pierre Lente",
  question: { id: "Q12", text: "Que peut-on laisser disparaître ?" },
  start: "s1",
  exploration: {
    island: SAUGE,
    start: { x: 2, y: 3 },
    companions: ["nerea", "eva"],
    influences: ["earthquake", "timeWarp"],
    encounters: [
      {
        id: "s1",
        label: "Les calculs d'Eva",
        scene: "s1",
        at: { x: 3, y: 3 },
        zone: zone(3, 3),
        actor: "eva",
      },
      {
        id: "s2",
        label: "La barque grise",
        scene: "s2",
        at: { x: 7, y: 3 },
        zone: zone(7, 3),
      },
      {
        id: "s3",
        label: "Le feu de la Tour",
        scene: "s3",
        at: { x: 5, y: 5 },
        zone: zone(5, 5),
      },
      {
        id: "s4",
        label: "L'aube sur la plate-forme",
        scene: "s4",
        at: { x: 5, y: 3 },
        zone: zone(5, 3),
      },
      {
        id: "s5",
        label: "La Grande Marée",
        scene: "s5",
        at: { x: 5, y: 4 },
        auto: true,
      },
      {
        id: "s6",
        label: "Le lendemain",
        scene: "s6",
        at: { x: 3, y: 5 },
        auto: true,
      },
      {
        id: "s7",
        label: "Le bord de la fosse",
        scene: "s7",
        at: { x: 7, y: 5 },
        zone: zone(7, 5),
      },
      look(
        "ardoises",
        "Des ardoises couvertes de chiffres raturés",
        { x: 2, y: 4 },
        [
          "Cinq, quatre-vingt-dix, trente. Les mêmes chiffres, barrés, recopiés, barrés encore. Dans un coin, un chiffre sans rien autour que Néréa a effacé du doigt.",
        ],
      ),
      look("corde", "Une corde graduée qui plonge dans l'eau", { x: 4, y: 3 }, [
        "La corde d'Ilse. Les nœuds sont à une brasse. Elle sort de l'eau mouillée jusqu'au troisième nœud, et personne ne dit combien elle montera.",
        {
          who: "eva",
          style: "say",
          text: "Elle montait d'un nœud par saison. Elle monte d'un nœud par jour.",
        },
      ]),
      movable(
        "barque",
        "Une barque échouée sur la passerelle",
        { x: 6, y: 3 },
        "earthquake",
        "Une barque d'évacuation est coincée sur la passerelle. Elle gêne le passage des habitants.",
        "Un séisme léger : la barque glisse à l'eau d'elle-même, le passage est libre.",
      ),
      {
        id: "instable-egare",
        label: "Un Lacunaire instable",
        at: { x: 4, y: 5 },
        wander: {
          preset: UNSTABLE,
          title: "Un Lacunaire instable",
          goal: "Le détourner de la Tour sans le blesser.",
          range: 2,
          radius: 3,
          effects: [{ add: "ecoute", by: 1 }],
          success: "Il a repris le large, sans se retourner.",
        },
      },
    ],
  },
  scenes: {
    s1: {
      id: "s1",
      title: "Les calculs d'Eva",
      kind: "rencontre",
      setting: "Le sommet de la Tour des Marées, à Sauge",
      next: "s2",
      beats: [
        stage(
          "Le sommet de la Tour des Marées, à Sauge. Des ardoises partout, couvertes de chiffres raturés. Ilse tient une corde graduée qui plonge dans l'eau. Eva n'a pas dormi.",
        ),
        say(
          "eva",
          "La Marée arrive dans deux jours. Elle couvrira tout l'archipel, sauf les crêtes. Trois îles comptent : Sauge, Lusse, les Strates. Sans rien faire, j'ai cinq chances sur cent qu'il en reste une. Avec nous tous sur une seule, quatre-vingt-dix. Sur deux, trente pour chacune. Et sur trois…",
        ),
        say("nerea", "Ne le dis pas."),
        say("eva", "Je ne le dis pas. Mais je l'ai calculé."),
        when(
          is("lacune_geante_habitee"),
          [
            say("ilse", "Et le Seuil ?"),
            say(
              "eva",
              "Le Seuil tiendra. Ceux qui y vivent à deux le maintiennent. Une vague de moins à ce côté-là.",
            ),
          ],
          [
            say("ilse", "Le chant dit que les Marées montent du Trou."),
            say(
              "eva",
              "Le chant a tort. Elles viennent du Clair, je les ai suivies depuis l'horizon. Le Trou ne fait que les accueillir. Mais elles arriveront plus fortes de ce côté, ça, c'est vrai.",
            ),
          ],
        ),
        say(
          "eva",
          "Tu te souviens, sur Peut-Être ? Une archère moins utile qu'un caillou. Là, je suis moins utile qu'une Marée. Elle, au moins, sait où elle va.",
        ),
        choice("calcul", [
          opt("calcule", "Tu as fait ce qu'il fallait : tu as calculé.", [
            fx(add("confiance.eva")),
          ]),
          opt("nous", "Ce n'est pas toi qui choisis. C'est nous.", [
            fx(add("confiance.eva")),
          ]),
          opt("trois", "Et si on tentait les trois ?", [
            say("eva", "Alors on les perd toutes, avec de la conviction."),
          ]),
        ]),
      ],
    },

    s2: {
      id: "s2",
      title: "La thermiste",
      kind: "rencontre",
      setting: "Le ponton de la Tour, une barque à voile grise",
      next: "s3",
      beats: [
        stage(
          "Une barque à voile grise accoste. Une femme en manteau long, à la coupe que le héros reconnaît (celle de Merlin, celle du Thermiste des reconstitutions), en descend avec des instruments de cuivre.",
        ),
        say(
          "tessa",
          "Tessa, des Thermistes des îles sèches. Je suis venue mesurer la Grande Marée. Ne vous inquiétez pas, je ne gênerai personne.",
        ),
        say("nerea", "Vous êtes venue la regarder ?"),
        say(
          "tessa",
          "La mesurer. Ce n'est pas pareil : mes sondes la touchent. Je le sais, elles la font un peu « prendre » autour d'elles. Toute mesure dérange un peu ce qu'elle mesure.",
        ),
        say(
          "tessa",
          "Chez nous, au nord, on pense qu'une Marée, ça se fige. Il suffirait d'assez d'ordre, au bon endroit. Les Gardiens et les Soigneuses qui nous ont rejoints y croient aussi. Il nous manque encore l'énergie. Elle regarde vers le sud, vers Lusse. Vos récifs en contiennent beaucoup.",
        ),
        choice("tessa", [
          opt("vivants", "Les cristaux de Lusse sont vivants.", [
            fx(add("confiance.squalor")),
            say("tessa", "Vivants ? Ce sont des cristaux."),
            when(is("squalor_rejoint"), [
              say("squalor", "Dis ça aux poissons qui y vivaient."),
            ]),
          ]),
          opt("figer", "Figer, c'est arrêter de vivre.", [
            say("tessa", "Ou arrêter de mourir. Ça dépend où l'on se place."),
          ]),
          opt("comment", "Comment feriez-vous ?", [
            say("tessa", "Pas encore. Dans un siècle ou deux. Revenez voir."),
            stage("Elle sourit sans savoir à qui elle parle."),
          ]),
        ]),
      ],
    },

    s3: {
      id: "s3",
      title: "La dernière nuit",
      kind: "veillee",
      setting:
        "Le feu sur la plate-forme de la Tour. Tout le monde est là. Personne ne dort.",
      next: "s4",
      beats: [
        when(all(is("nyx_epargnee"), is("objet_de_nyx")), [
          stage(
            "Une silhouette d'Ombre s'approche au bord de la lumière, regarde l'objet que le héros garde, ne dit rien, et repart.",
          ),
          say("nerea", "Elles viendront demain. Elles ne le diront pas."),
        ]),
        say(
          "lacunaire",
          "Avant, nous étions dans le gris. Là où rien n'arrive. Ici, il y a du feu, des voix, Squalor qui ronfle… Pourquoi il y a tout ça, plutôt que le gris ? Pourquoi il y a quelque chose ?",
        ),
        say(
          "eva",
          "Parce que le rien est impossible. C'est logique : s'il n'y avait rien, il n'y aurait même pas de règle pour qu'il n'y ait rien. Donc il y a quelque chose.",
        ),
        choice("rien", [
          opt("impossible", "Oui. Le rien est impossible.", [
            fx(set("carnet.Q06", "fausse")),
            say("eva", "Voilà. Réglé."),
          ]),
          opt("personne", "Personne ne sait.", [
            fx(add("confiance.lacunaire")),
            say(
              "nerea",
              "Les Ondines non plus. Et nous lisons la vase depuis plus longtemps que tout le monde.",
            ),
            say(
              "eva",
              "… J'ai dit ça parce que ça sonnait juste. Ce n'est pas un calcul. C'est une phrase.",
            ),
          ]),
          opt(
            "ecrire",
            "Écrire la question dans le Carnet, sous celle de l'ère I, sans répondre.",
            [
              say(
                "eva",
                "… J'ai dit ça parce que ça sonnait juste. Ce n'est pas un calcul. C'est une phrase.",
              ),
            ],
          ),
        ]),
        stage(
          "Chaque Écho dont la confiance est assez haute propose un nom au héros, à sa façon.",
        ),
        when(gte("confiance.nerea", 3), [
          say(
            "nerea",
            "Marne. C'est la vase la plus fine, celle qui garde tout. Vous portez une époque entière dans votre corps.",
          ),
          fx(set("nom.propositions.nerea")),
        ]),
        when(gte("confiance.eva", 3), [
          say(
            "eva",
            "Écart. La différence entre ce que je prévois et ce qui arrive. C'est toi, depuis le premier jour. C'est un compliment. Je crois.",
          ),
          fx(set("nom.propositions.eva")),
        ]),
        when(all(is("squalor_rejoint"), gte("confiance.squalor", 3)), [
          say(
            "squalor",
            "Reste. Ce qu'on garde pour plus tard, quand on n'a plus faim. Ne fais pas cette tête. Chez nous, c'est ce qu'il y a de plus précieux.",
          ),
          fx(set("nom.propositions.squalor")),
        ]),
        when(gte("confiance.lacunaire", 3), [
          say(
            "lacunaire",
            "Premier. Le premier qui nous a… parlé. Pas touché. Parlé.",
          ),
          fx(set("nom.propositions.lacunaire")),
        ]),
        stage(
          "Un nom ne se prend pas ici : il se retient, et ne se prendra qu'à la Nomination.",
        ),
        choice("noms", [
          opt(
            "nerea",
            "Je m'en souviendrai : Marne.",
            [fx(add("confiance.nerea"))],
            gte("confiance.nerea", 3),
          ),
          opt(
            "eva",
            "Je m'en souviendrai : Écart.",
            [fx(add("confiance.eva"))],
            gte("confiance.eva", 3),
          ),
          opt(
            "squalor",
            "Je m'en souviendrai : Reste.",
            [fx(add("confiance.squalor"))],
            all(is("squalor_rejoint"), gte("confiance.squalor", 3)),
          ),
          opt(
            "lacunaire",
            "Je m'en souviendrai : Premier.",
            [fx(add("confiance.lacunaire"))],
            gte("confiance.lacunaire", 3),
          ),
          opt("garder", "Gardez-les pour moi.", []),
          opt("aucun", "Je n'en veux pas.", [
            fx(
              set("nom.propositions.nerea", false),
              set("nom.propositions.eva", false),
              set("nom.propositions.squalor", false),
              set("nom.propositions.lacunaire", false),
            ),
          ]),
        ]),
        choice("paires", [
          opt("eva", "Écouter Néréa et Eva.", [
            say("eva", "Tu crois qu'on se souviendra de nous ?"),
            say(
              "nerea",
              "On se souviendra de quelque chose. Ce ne sera pas nous. Ce sera un chant.",
            ),
            say("eva", "Alors j'espère qu'il sera faux dans le bon sens."),
          ]),
          opt(
            "squalor",
            "Écouter Squalor.",
            [
              say(
                "squalor",
                "Tu m'avais demandé pour quoi je dure. J'ai le ventre plein, depuis des jours. Et je ne sais toujours pas. Mais j'ai envie de savoir. C'est nouveau, ça. C'est pire que la faim.",
              ),
            ],
            is("squalor_rejoint"),
          ),
          opt("lacunaire", "Écouter le Lacunaire et Néréa.", [
            say(
              "lacunaire",
              "Si demain nous nous défaisons, est-ce que nous aurons existé ?",
            ),
            say(
              "nerea",
              "Tu as touché des choses, et elles t'ont touché. Ça reste. Même dispersé, ça reste quelque part. Simplement, ça ne s'appellera plus toi.",
            ),
          ]),
        ]),
      ],
    },

    s4: {
      id: "s4",
      title: "Le choix",
      kind: "rencontre",
      setting:
        "À l'aube, sur la plate-forme ; la ligne laiteuse de la Marée est déjà à l'horizon",
      next: "s5",
      beats: [
        stage(
          "À l'aube, sur la plate-forme. La ligne laiteuse de la Marée est déjà à l'horizon. Chacun plaide, sans insister.",
        ),
        say(
          "ilse",
          "La Tour, c'est cinquante ans de mesures. Et c'est chez moi. Je ne veux pas partir. Je veux finir mes relevés.",
        ),
        say("eva", "Ilse…"),
        say("ilse", "Tu l'aurais fait, toi."),
        when(
          is("squalor_rejoint"),
          [
            say(
              "squalor",
              "La pouponnière. Six petits qui ne savent pas encore nager loin. Je ne vous demande rien. Enfin si. Je vous demande ça.",
            ),
          ],
          [
            say(
              "mira",
              "La pouponnière. Six petits qui ne savent pas encore nager loin. Mon frère ne vous demande rien. Moi, si.",
            ),
          ],
        ),
        say(
          "nerea",
          "Les annales. Tout ce que les Ondines ont lu depuis quatre siècles, les colonnes, les ardoises. Ce que nous avons appris au fond des Abysses. Si ça disparaît, il restera mon journal, et un chant faux. Un temps. Je ne vous demanderai pas de choisir les ardoises plutôt qu'une enfant. Je dis seulement ce qui disparaît.",
        ),
        say(
          "aubin",
          "Moi, je reste à Sauge. Quoi que vous choisissiez. Je suis trop vieux pour aller vivre sur l'île de quelqu'un d'autre.",
        ),
        stage(
          "Dans tous les cas, les habitants sont évacués en barque vers l'île sauvée. Ce qui disparaît, c'est ce que l'on ne peut pas mettre dans une barque.",
        ),
        choice("choix", [
          opt("sauge", "Sauver Sauge.", [
            fx(
              set("ile_sauvee", "sauge"),
              add("confiance.eva", 2),
              add("confiance.squalor", -1),
            ),
          ]),
          opt("lusse", "Sauver Lusse.", [
            fx(
              set("ile_sauvee", "lusse"),
              add("confiance.squalor", 2),
              add("confiance.eva", -1),
            ),
          ]),
          opt("strates", "Sauver les Strates.", [
            fx(
              set("ile_sauvee", "strates"),
              add("confiance.nerea", 2),
              add("confiance.eva", -1),
            ),
          ]),
        ]),
      ],
    },

    s5: {
      id: "s5",
      title: "Grande Marée",
      kind: "combat",
      setting: "L'île choisie, entourée d'eau profonde",
      next: "s6",
      beats: [
        when(is("ch7_etoile"), [
          say("nerea", "Vous l'avez déjà fait une fois, sur les pilotis."),
        ]),
        when(is("nyx_epargnee"), [
          stage(
            "À la troisième vague, deux Ombres sortent de l'eau sur le flanc ouest et le tiennent. Elles ne parlent pas.",
          ),
        ]),
        marreeBeat(),
        when(is("defaite"), [
          stage(
            "Le Cœur cède. L'eau monte par le centre, d'un seul mouvement, et l'île choisie disparaît avec les autres.",
          ),
          say("nerea", `${DEFEAT_LINE}.`),
          fx(set("ile_sauvee", "aucune"), set("defaite", false)),
          go("s6"),
        ]),
        stage(
          "Fin de la quatrième vague : le Lacunaire géant s'effondre sur la case du héros. Une masse d'eau et de matière instable l'engloutit. Écran blanc, puis noir.",
        ),
      ],
    },

    s6: {
      id: "s6",
      title: "Ce qui reste",
      kind: "scene",
      setting: "Le lendemain : l'eau a monté de quatre brasses",
      next: "s7",
      beats: [
        stage(
          "Le lendemain. L'eau a monté de quatre brasses. Deux des trois îles ont disparu. Les barques sont amarrées à l'île sauvée, serrées les unes contre les autres.",
        ),
        when(is("ile_sauvee", "sauge"), [
          stage(
            "La Tour tient, Ilse y recopie ses relevés. Lusse est sous l'eau : la pouponnière s'est dispersée dans le large ; les squales ont fui vers le sud. Les annales des Strates sont perdues ; seules restent celles que Néréa avait sur elle, et son journal.",
          ),
          when(is("squalor_rejoint"), [
            say("squalor", "Ils savent nager. Un peu. Ça suffira, ou pas."),
          ]),
        ]),
        when(is("ile_sauvee", "lusse"), [
          stage(
            "Les petits squales tournent dans le bassin, gras de Lacunaires. La Tour de Sauge est sous l'eau ; Ilse est partie vers le nord avec sa famille, chez les Thermistes. Les annales des Strates sont perdues.",
          ),
          say("eva", "Cinquante ans de mesures. Je les referai. Ou quelqu'un."),
        ]),
        when(is("ile_sauvee", "strates"), [
          stage(
            "Les colonnes de vase sont sauves. Sauge et Lusse ont disparu. Ilse est partie vers le nord. Les squales ont fui vers le sud.",
          ),
          say(
            "nerea",
            "J'ai gardé le passé et perdu deux présents. Je ne sais pas si c'était juste. Je sais que c'était un choix.",
          ),
        ]),
        when(is("ile_sauvee", "aucune"), [
          stage(
            "Aucune île n'a tenu. Les barques dérivent entre les crêtes, serrées les unes contre les autres.",
          ),
        ]),
        when(isNotSauge(), [
          say(
            "nerea",
            "Aubin est resté. On ne le retrouve pas. Il disait qu'il fallait laisser le passé couler. Il a été cohérent jusqu'au bout.",
          ),
          stage(
            "Le rocher de Brutus est sous l'eau. Il ne sera plus jamais tiède.",
          ),
        ]),
        say(
          "tessa",
          "Ne soyez pas tristes. Rien ne disparaît vraiment. L'information n'est jamais détruite, c'est une loi. Tout est gardé quelque part.",
        ),
        stage(
          "Le héros écrit dans son Carnet : « Que peut-on laisser disparaître ? »",
        ),
        fx(set("carnet.Q12", "ouverte")),
        choice("disparaitre", [
          opt("rien", "Elle a raison. Rien ne disparaît.", [
            fx(set("carnet.Q12", "fausse")),
            say("tessa", "Vous voyez ?"),
          ]),
          opt(
            "sens",
            "Ce qui est gardé, ce n'est pas ce que ça voulait dire.",
            [
              fx(add("confiance.nerea")),
              say("nerea", "L'encre reste dans l'eau. Pas la lettre."),
              say(
                "tessa",
                "… C'est une distinction intéressante. Je la noterai.",
              ),
            ],
          ),
          opt("eau", "Ne rien répondre. Regarder l'eau.", []),
        ]),
        when(is("ile_sauvee", "sauge"), [
          stage("Ilse, du haut de la Tour, tend un châle brodé de chiffres."),
          fx(give("chale_de_sauge")),
        ]),
        when(is("ile_sauvee", "lusse"), [
          stage(
            "Les pêcheurs de Lusse tendent un châle frangé de dents de lait de squale.",
          ),
          fx(give("chale_de_lusse")),
        ]),
        when(is("ile_sauvee", "strates"), [
          stage("Les Ondines des Strates tendent un châle teint de vase."),
          fx(give("chale_des_strates")),
        ]),
      ],
    },

    s7: {
      id: "s7",
      title: "La Pierre Lente",
      kind: "fin",
      setting: "Au bord de la fosse, devant la Pierre Lente",
      beats: [
        stage(
          "Le héros, ramené des flots par Néréa, a passé un jour et une nuit sans connaissance. Quelque chose a changé en lui.",
        ),
        say(
          "nerea",
          "Je vais vous dire ce qui s'est passé pendant l'engloutissement, et je vais vous proposer.",
        ),
        choice("transformation", [
          opt("A", "Branchies : les berceaux des Ondines.", [
            fx(set("transformation.II", "A"), give("branchies")),
            say(
              "nerea",
              "Vous avez respiré l'eau un moment, et vous n'êtes pas mort. Les Ondines portent dans les plis du cou de minuscules algues qui échangent l'air avec l'eau ; nous les appelons les berceaux. J'en ai mis sur vous pendant que vous dormiez. Elles ont pris. Dans quelques jours, les plis s'ouvriront.",
            ),
          ]),
          opt("B", "Écailles de marée : la nacre.", [
            fx(set("transformation.II", "B"), give("ecailles_de_maree")),
            say(
              "nerea",
              "La Marée s'est déposée sur vous. Ce qui touche quelque chose de fixé finit par se fixer aussi : la matière instable a pris sur votre peau, en petites plaques nacrées, comme le calcaire sur un pilotis. Elles ne partiront pas. Elles sont dures.",
            ),
          ]),
        ]),
        when(all(is("transformation.1", "B"), is("transformation.II", "B")), [
          say(
            "nerea",
            "Du verre et de la nacre. Vous allez finir en récif, Dormeur.",
          ),
        ]),
        when(all(is("transformation.1", "A"), is("transformation.II", "A")), [
          say(
            "nerea",
            "Des yeux pour le noir, une gorge pour l'eau. Vous êtes fait pour les Abysses. Mes aïeules vous auraient adopté.",
          ),
        ]),
        stage(
          "Le Ghom se manifeste : l'eau autour du héros s'alourdit, le temps hésite, ses blessures semblent durer plus longtemps qu'elles ne devraient. Néréa regarde ses horloges.",
        ),
        say(
          "nerea",
          "Votre Ghom vous rappelle à la Pierre Lente. Ou c'est votre corps qui n'en peut plus. Je ne sais pas faire la différence, et je crois que personne ne sait.",
        ),
        choice("adieu", [
          opt("reviendrai", "Je reviendrai.", [
            fx(add("confiance.nerea")),
            say("nerea", "Je sais. Mais pas pour moi."),
          ]),
          opt("viens", "Viens avec moi.", [
            fx(add("confiance.nerea")),
            say("nerea", "Au fond ? Et qui écrirait le journal ?"),
          ]),
          opt("demain", "Pour moi, ce sera demain matin.", [
            fx(add("confiance.nerea")),
            when(is("ce_matin"), [
              say("nerea", "Vous l'aviez déjà dit, la première nuit."),
            ]),
          ]),
        ]),
        say(
          "eva",
          "Je calculerai combien de temps tu dors. Je ne serai plus là pour vérifier. C'est le calcul le plus inutile de ma vie. Je vais le faire quand même.",
        ),
        when(is("squalor_rejoint"), [
          say(
            "squalor",
            "Tu as de la chance que je n'aie pas faim. Un temps. Je n'ai plus faim de toi depuis longtemps, en fait. C'est bizarre.",
          ),
        ]),
        when(
          is("lacunaire_perdu"),
          [],
          [
            say(
              "lacunaire",
              "Nous… Il s'arrête. Non. Je. Je me souviendrai. Moi. Pas nous.",
            ),
            say(
              "lacunaire",
              "Je ferai d'autres comme moi. Je leur apprendrai à se fixer.",
            ),
          ],
        ),
        stage("Néréa tient son journal contre elle."),
        choice("journal", [
          opt("garde", "Garde-le pour les Ondines.", [
            fx(set("journal_nerea", "garde")),
          ]),
          opt("porte", "Accepter qu'elle le lui donne.", [
            fx(set("journal_nerea", "porte"), give("journal_de_nerea")),
            say(
              "nerea",
              "Prenez-le. Les copies mentent toujours un peu. Au moins, l'original aura dormi avec quelqu'un qui était là.",
            ),
          ]),
        ]),
        when(is("eclat_jumelle"), [
          choice("eclat", [
            opt("garder", "Garder l'Éclat de jumelle.", [
              fx(add("cristaux.gardes")),
            ]),
            opt("porter", "Le porter, incrusté dans la peau.", [
              fx(add("cristaux.portes")),
            ]),
            opt(
              "donner",
              "Le donner à Néréa, pour recoudre la Lacune avant de partir.",
              [
                fx(
                  set("eclat_donne_neree"),
                  add("cristaux.donnes"),
                  add("lacunes.recousues"),
                ),
              ],
            ),
          ]),
        ]),
        stage(
          "Néréa détache la plus petite de ses deux horloges à eau et la lui tend.",
        ),
        say(
          "nerea",
          "Emportez-la. Quand vous sortirez, comparez-la à n'importe quelle horloge du monde. Vous saurez combien de temps on vous a attendus.",
        ),
        fx(give("clepsydre_de_nerea")),
        stage(
          "Le héros descend dans la fosse. Néréa nage avec lui jusqu'à ce que la pression l'oblige à remonter. La dernière image : sa silhouette au-dessus, la lanterne de vase, qui devient un point, puis rien.",
        ),
        narr(
          "Dernière page de l'année 417. Il est descendu. J'ai remonté seule. Mes horloges disent que l'eau, autour de lui, coule déjà plus lentement que la mienne. Pour lui, quelques heures. Pour nous, je ne sais pas : assez pour que je devienne une couche. Une couche fine, j'espère, mais lisible. À celle qui me suivra : ne chante pas qu'il dort. Écris qu'il attend au fond d'un puits où le temps ralentit, et qu'il ne sait pas qu'il est vieux. Écris que nous l'avons aimé. Ça, au moins, c'est une trace.",
        ),
        go(END),
      ],
    },
  },
}

/** Sauge was not saved (Aubin stayed on a drowned island). */
function isNotSauge(): Cond {
  return { not: is("ile_sauvee", "sauge") }
}
