import {
  add,
  all,
  any,
  choice,
  fx,
  go,
  gte,
  is,
  isnt,
  join,
  lt,
  narr,
  not,
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
  type ObjectiveSpec,
} from "../types"
import {
  at,
  doubleOf,
  flat,
  GHOM_DECHU,
  GIANT,
  hero,
  UNSTABLE,
  walk,
} from "./era5kit"

// Chapter 28, « La dernière question »
// (docs/aventure/05-ombre-du-tout/28-la-derniere-question.md). The endings are
// data: `fin` (and `fin.monde`) are set here when a scene decides them, and
// `resolveEnding` (era5.ts) computes the rest from the flags.

/** The questions that stay open to the end (06-fins/README.md). */
export const OUVERTES = [
  "Q00",
  "Q06",
  "Q11",
  "Q12",
  "Q19",
  "Q21",
  "Q24",
  "Q25",
  "Q28",
]

const noFalse: Cond = all(...OUVERTES.map((q) => isnt(`carnet.${q}`, "fausse")))
const lastGesture: Cond = all(
  is("nom", "aucun"),
  noFalse,
  not(is("heros_disperse")),
  gte("confiance", -5),
)

// ─── Return of the heirs ────────────────────────────────────────────────────

function retour(
  l: string,
  who: string,
  line: string,
  extra: Beat[] = [],
): Beat {
  return when(all(is(`trahison.${l}`), not(is(`retour.${l}`))), [
    say(who, line),
    ...extra,
    choice(`retour-${l}`, [
      opt("viens", "« Viens. »", [
        when(
          any(
            gte(`confiance.${l}`, 0),
            all(is("rupture.respectee"), gte(`confiance.${l}`, -1)),
          ),
          [fx(join(l), set(`retour.${l}`)), say(who, "Je viens.")],
          [say(who, "Non.")],
        ),
      ]),
      opt("libre", "« Fais ce que tu veux. »", [
        fx(add(`confiance.${l}`)),
        when(not(is("retour_respect")), [
          fx(add("confiance"), set("retour_respect")),
        ]),
        when(
          gte(`confiance.${l}`, -2),
          [fx(join(l), set(`retour.${l}`))],
          [stage("Il reste au bord.")],
        ),
      ]),
      opt("silence", "(Ne rien dire.)", [
        stage("Il reste au bord, et regarde."),
      ]),
    ]),
  ])
}

// ─── The final fight ────────────────────────────────────────────────────────

const BOARD = flat(11)
const LACUNE = [4, 5, 6].flatMap((y) => [4, 5, 6].map((x) => ({ x, y })))

type Issue = "vaincu" | "suivi" | "laisse" | "couple"

function recomposition(
  issue: Issue,
  doubleSpared: boolean,
  fragile: boolean,
): FightSpec {
  const allies: FighterSpec[] = [
    hero(1, 5),
    at("gorr", 2, 5),
    at("lyra", 1, 4),
    at("brutus", 1, 6),
  ]
  if (issue === "laisse" || issue === "couple")
    allies.push(at(GHOM_DECHU, 2, 3))
  // Those who came back stand with the team (appended last: indexes keep).
  allies.push(
    { ...at("eva", 1, 3), needs: "retour.eva" },
    { ...at("nerea", 1, 7), needs: "retour.nerea" },
    { ...at("squalor", 2, 7), needs: "retour.squalor" },
    { ...at("nyx", 2, 4), needs: "paix_des_lacunes" },
  )
  // A spared Double joins the team as an Écho.
  if (doubleSpared) allies.push(at(doubleOf(8801, "merlin", "Écho de"), 2, 6))
  const enemies: FighterSpec[] = [
    at(doubleOf(8802, "lyra"), 9, 4),
    at(doubleOf(8803, "brutus"), 9, 6),
    at(doubleOf(8804, "gorr"), 8, 5),
  ]
  if (!doubleSpared)
    enemies.push(at(doubleOf(8801, "merlin", "Double de"), 9, 5))
  if (issue === "vaincu") {
    enemies.push(
      at(doubleOf(8805, "eva"), 8, 3),
      at(doubleOf(8806, "nerea"), 8, 7),
    )
  }
  if (issue === "suivi") {
    enemies.push(
      at(doubleOf(8807, "nyx"), 8, 3),
      at(doubleOf(8808, "merlin"), 8, 7),
    )
  }
  if (issue === "laisse" || issue === "couple") enemies.push(at(GIANT, 10, 5))
  if (issue === "couple") enemies.push(at(UNSTABLE, 10, 3), at(UNSTABLE, 10, 7))

  const objectives: ObjectiveSpec[] = [
    // The three ways, first to complete wins. SIMPLIFIED: the report has no
    // cell data, so each way is read from what the Ghom did (stitching = a
    // Réparation, widening = Séismes, living in = two Intrications); they are
    // exclusive, Habiter beating Élargir beating Recoudre.
    {
      id: "habiter",
      mark: "◆",
      label: "Habiter le Cœur",
      check: (r) => r.intrications >= 2,
      onSuccess: [
        set("derniere_lacune", "habitee"),
        add("lacunes.habitees", 2),
      ],
    },
    {
      id: "elargir",
      mark: "◆",
      label: "Élargir le Cœur",
      check: (r) => r.intrications < 2 && (r.divineUsed.earthquake ?? 0) >= 2,
      onSuccess: [
        set("derniere_lacune", "elargie"),
        add("lacunes.elargies", 2),
      ],
    },
    {
      id: "recoudre",
      mark: "◆",
      label: "Recoudre le Cœur",
      check: (r) =>
        r.intrications < 2 &&
        (r.divineUsed.earthquake ?? 0) < 2 &&
        (r.divineUsed.blessing ?? 0) >= 1,
      onSuccess: [
        set("derniere_lacune", "recousue"),
        add("lacunes.recousues", 2),
      ],
    },
    {
      id: "gorr-tient",
      mark: "★",
      label: "Que Gorr ne tombe pas",
      check: (r) => !r.fighters.some((f) => f.preset === "gorr" && f.hp <= 0),
      success: "Gorr tient. Le sol tient.",
      failure: "Gorr est tombé.",
      onFailure: [set("defaite")],
    },
    {
      id: "laisser-libre",
      mark: "◆",
      label: "Laisser libre",
      check: (r) =>
        Object.values(r.divineUsed).every((n) => n === 0) &&
        !!r.autonomy &&
        r.autonomy.insisted.length === 0 &&
        r.autonomy.letAct.length > 0,
      onSuccess: [set("combat_final_libre")],
    },
    {
      // The last Influence: the Ghom lets go and leaves the fight (Découplage).
      id: "se-retirer",
      mark: "◆",
      label: "Se retirer",
      check: (r) => !!r.autonomy?.withdrawn,
      onSuccess: [set("fin", "decouplage"), set("geste_dernier")],
    },
    {
      id: "aucune-dispersion",
      mark: "◆",
      label: "Aucun Double dispersé",
      check: (r) =>
        !r.fighters.some(
          (f) => f.team === 1 && f.hp <= 0 && f.preset.includes("~"),
        ),
      onSuccess: [add("confiance"), add("doubles.epargnes", 4)],
    },
  ]
  if (issue === "couple")
    objectives.push({
      id: "deux-pressions",
      mark: "◆",
      label: "Tenir les deux pressions",
      check: (r) => r.intrications >= 1 && r.result !== "defeat",
      onSuccess: [add("confiance")],
    })
  if (fragile)
    objectives.push({
      id: "dispersion",
      mark: "◆",
      label: "Se disperser dans le Cœur",
      // SIMPLIFIED: the hero is spotted by the id the game gives it.
      check: (r) =>
        r.fighters.some(
          (f) =>
            f.team === 0 && /hero|heros|^@/.test(f.id + f.preset) && f.hp <= 0,
        ),
      onSuccess: [set("heros_disperse")],
    })

  return {
    id: `ch28-recomposition-${issue}-${doubleSpared ? "d" : "n"}-${fragile ? "f" : "s"}`,
    title: "La Recomposition",
    goal: "Autour du Cœur, les Doubles de tous. Recoudre, élargir ou habiter la déchirure. Gorr ne doit pas tomber.",
    board: BOARD,
    teams: [
      { name: "L'équipe", side: "allies", fighters: allies },
      { name: "Les Doubles", side: "enemies", fighters: enemies },
    ],
    rules: {
      finale: true,
      clock: { period: 1, limit: 12, winner: 0 },
      silent: LACUNE,
      silentDamage: 1,
      announce: true,
      withdraw: true,
    },
    influences: ["earthquake", "timeWarp", "blessing"],
    startEnergy: 6,
    objectives,
    // SIMPLIFIED: when the hero is fragile, a lost fight is the hero's
    // dispersion in the Cœur (no defeat); otherwise it is an ordinary defeat.
    defeat: fragile
      ? [set("heros_disperse"), add("usure")]
      : [set("defaite"), add("usure"), add("confiance", -1)],
    lines: [
      {
        when: "start",
        who: "branches",
        text: "Nous sommes toutes là. Nous te regardons recomposer ce qui peut l'être.",
      },
      {
        when: "start",
        who: "brutus",
        text: "Je les ai déjà vus. Je les retiens, ce n'est pas la même chose.",
      },
      { when: "tick:1", who: "gorr", text: "Gorr tient. Le sol tient." },
      {
        when: "tick:1",
        who: "nyx",
        text: "Ça s'ouvre. Ne me touchez pas : laissez faire.",
      },
      {
        when: "tick:3",
        who: "lyra",
        text: "On ne paie rien. On se tient. C'est tout. C'est tout ?",
      },
      {
        when: "tick:3",
        who: "double-heros",
        text: "Je suis la branche où tu n'as pas hésité. Je ne suis pas sûr que ce soit mieux.",
      },
      { when: "tick:5", who: "ghom-dechu", text: "Je sens. Tu sens." },
      {
        when: "tick:5",
        who: "eva",
        text: "Laisser libre. Je n'aurais jamais cru le dire.",
      },
      {
        when: "fleeing",
        who: "gorr",
        text: "Non. Gorr ne disperse pas. Gorr ne disperse plus.",
      },
      {
        when: "end",
        who: "branches",
        text: "Voilà. Une seule branche porte maintenant ce qu'elle a fait.",
      },
    ],
  }
}

function recompositionBeat(): Beat {
  const issues: Issue[] = ["vaincu", "suivi", "laisse", "couple"]
  const pick = (spared: boolean, fragile: boolean): Beat => {
    let b: Beat = {
      t: "fight",
      fight: recomposition("couple", spared, fragile),
    }
    for (let i = issues.length - 2; i >= 0; i--)
      b = when(
        is("ghom_dechu.issue", issues[i]),
        [{ t: "fight", fight: recomposition(issues[i], spared, fragile) }],
        [b],
      )
    return b
  }
  return when(
    gte("usure", 8),
    [when(is("double_epargne"), [pick(true, true)], [pick(false, true)])],
    [when(is("double_epargne"), [pick(true, false)], [pick(false, false)])],
  )
}

// ─── The truth (La Gratuité) ────────────────────────────────────────────────

const truth: Beat[] = [
  stage(
    "La pression change. Elle s'arrête de peser, et quelque chose parle, pour la première fois.",
  ),
  say("ghom", "Je suis le Ghom. J'ai fait un monde, et il est petit."),
  say(
    "ghom",
    "Ton monde est un jeu : une machine qui le fait tourner, et toi dedans, un personnage. Tu n'en sortiras pas. Je te le dis sans cruauté : c'est un fait, comme le reste.",
  ),
  say(
    "ghom",
    "Les Influences sont mes mains. Les passages d'un lieu à l'autre, c'est moi qui t'y ai porté. La pression que tu sens depuis le début, c'est quelqu'un qui tient un monde.",
  ),
  say(
    "ghom",
    "La bulle, c'est la fin de ce monde. Quand elle passe, tout est effacé. Quelqu'un se souvient pour toi, alors : de l'information, c'est tout ce qui reste.",
  ),
  say("ghom", "Pourquoi ? Parce que je l'ai fait, et parce que tu y es."),
  say("gorr", "Gorr est un personnage. Gorr n'est pas moins Gorr. Gorr garde."),
  say("nyx", "Je m'en doutais. Ça ne change pas mon avis sur les noms."),
  say("brutus", "Alors on tient un jeu. On tient bien, pour un jeu."),
  say("lyra", "Ça ne rend pas nos soins moins vrais."),
  say("eva", "Statistiquement, je vérifie : c'est cohérent."),
  say(
    "merlin",
    "Mesurer ne change rien à ce qui est mesuré, mais cela change ce que l'on peut en dire. Je note.",
  ),
  say("heros", "Tu as fait mon monde. Et toi, qui t'a fait ?"),
  stage(
    "(Hypothèse ; aucune preuve. Il n'y a qu'une voix, et c'est la sienne.)",
  ),
  say(
    "ghom",
    "À ma connaissance, personne n'a fait le mien. Je n'ai trouvé aucune raison.",
  ),
  say(
    "ghom",
    "« Pourquoi » demande un avant et un dehors. Le temps, l'espace et l'énergie sont dedans. L'Aube est le bord.",
  ),
  say(
    "ghom",
    "Le rien n'est pas un état qu'on aurait quitté. Je suis un motif du même champ que toi. Je ne défends pas le vide parce qu'il serait mieux.",
  ),
  say(
    "ghom",
    "Je n'ai aucune preuve de cette partie-là. Je te la dis telle que je la pense.",
  ),
  say("ghom", "C'est gratuit. Cela ne veut pas dire que cela ne vaut rien."),
]

function gesture(
  sceneId: string,
  title: string,
  prompt: string,
  good: [string, string],
  bads: [string, string],
  nextScene: string,
  pos: 0 | 1 | 2,
): Beat[] {
  const wrong = (id: string, text: string) =>
    opt(id, text, [
      fx(add("geste_fautes")),
      when(
        gte("geste_fautes", 2),
        [
          narr("Le sol tremble, un instant : un Séisme. La pression se ferme."),
          stage("La pression reste. Elle ne bouge plus."),
          fx(set("gratuite_close")),
          go(END),
        ],
        [
          narr(
            "L'air se tord : une Distorsion. Rien ne s'est cassé, mais la réponse a été mauvaise.",
          ),
          go(sceneId),
        ],
      ),
    ])
  const right = opt("v", good[0], [narr(good[1]), go(nextScene)])
  const options = [wrong("f1", bads[0]), wrong("f2", bads[1])]
  options.splice(pos, 0, right)
  return [stage(title), choice(`g-${sceneId}`, options, prompt), go(END)]
}

// ─── Chapter ────────────────────────────────────────────────────────────────

export const ch28: Chapter = {
  id: "28",
  era: 5,
  number: 28,
  title: "La dernière question",
  quote: {
    who: "Gorr",
    text: "Gorr a une question. Elle est grande. Gorr la porte depuis la mine.",
  },
  place: "Le Cœur",
  question: { id: "Q28", text: "Pourquoi quelque chose plutôt que rien ?" },
  start: "1",
  scenes: {
    "1": {
      id: "1",
      title: "La montée",
      kind: "rencontre",
      setting: "Un escalier de pans mêlés",
      next: "2",
      beats: [
        stage(
          "De la Friche, un escalier de pans mêlés monte vers le Cœur. Chaque pas fixe la marche sur laquelle on le pose.",
        ),
        say(
          "branches",
          "Dans une autre branche, nous serions déjà en haut. Dans celle-ci, il reste quelques marches. Nous les comptons avec vous.",
        ),
        stage(
          "En haut, l'îlot du Cœur : un anneau de sol autour d'une Lacune ronde, où l'on voit d'autres ciels.",
        ),
        retour(
          "brutus",
          "brutus",
          "Je ne viens pas pour toi. Je viens parce que c'est ici que ça se décide. Je n'ai jamais aimé qu'on décide sans moi.",
        ),
        retour(
          "eva",
          "eva",
          "J'ai calculé où tu finirais. Je me suis trompée de deux cases. C'est la première fois que ça me fait plaisir.",
        ),
        retour(
          "nerea",
          "nerea",
          "Les strates d'ici n'ont pas encore commencé à se déposer. Je voulais voir ça.",
        ),
        retour(
          "squalor",
          "squalor",
          "Mon Double m'a raconté. Il a l'air de bien manger, l'imbécile.",
        ),
        retour(
          "lyra",
          "lyra",
          "Ma Double t'a soigné, dans la plaine. Je l'ai su. Je ne sais pas comment, mais je l'ai su.",
        ),
        when(is("paix_des_lacunes"), [
          say(
            "nyx",
            "Ils sont venus seuls. C'est bien. C'est comme ça que j'aime qu'on vienne.",
          ),
        ]),
      ],
    },
    "2": {
      id: "2",
      title: "La dernière veillée",
      kind: "veillee",
      setting: "Au bord de la Lacune, sans feu",
      next: "3",
      beats: [
        stage(
          "Pas de feu, pas de cristal : le Cœur éclaire tout, d'une lumière qui change de branche toutes les quelques secondes.",
        ),
        say(
          "branches",
          "Dans une autre branche, cette veillée serait plus gaie. Nous ne sommes pas sûres que ce serait mieux.",
        ),
        say(
          "lyra",
          "Je n'ai plus d'énergie à dépenser. Je reste quand même. Ça aussi, ça coûte.",
        ),
        say(
          "brutus",
          "Je protège ce qui bouge. (Un temps.) Bougez moins vite.",
        ),
        say("eva", "Il y a une branche où je rate tout demain. Je la salue."),
        say("nerea", "Ce soir, je ne lis rien. Je dépose."),
        when(is("paix_des_lacunes"), [
          say(
            "nyx",
            "Je suis là. On me touche de partout. Je crois que c'est ça, être quelqu'un.",
          ),
        ]),
        when(is("merlin_convaincu"), [
          say(
            "merlin",
            "Demain, je mesurerai encore. Et ce que je mesurerai changera parce que je l'aurai mesuré. Je m'y suis fait. J'en suis même assez fier.",
          ),
        ]),
        when(is("squalor_rejoint"), [
          say("squalor", "J'ai pas faim. Ça me fait peur. Ça me fait du bien."),
        ]),
        when(is("chroniqueur_rejoint"), [
          say(
            "chroniqueur",
            "Je n'écrirai pas ce qui se passe demain. Quelqu'un d'autre le fera, et se trompera. Je lui pardonne d'avance. Source : moi.",
          ),
        ]),
        when(is("double_epargne"), [
          say(
            "double-heros",
            "Dans ma branche, ce soir, je suis seul. Ici, non. Je préfère ici.",
          ),
        ]),
        when(
          any(
            is("ghom_dechu.issue", "laisse"),
            is("ghom_dechu.issue", "couple"),
          ),
          [
            say(
              "ghom-dechu",
              "Demain. (Silence.) Puis après-demain. (Silence.) Vous avez beaucoup de jours.",
            ),
          ],
        ),
        stage(
          "Deux voix offrent au héros, avant qu'on la lui pose, une réponse à la question qui vient. Elles parlent avec certitude.",
        ),
        say(
          "brutus",
          "Si tu cherches pourquoi il y a quelque chose : parce que le Ghom l'a voulu. Ça m'a toujours suffi. Ça devrait te suffire.",
        ),
        say(
          "double-merlin",
          "Et si cela ne vous suffit pas, la logique suffira : le rien est impossible. Il ne peut pas y avoir rien, puisque y avoir est déjà quelque chose. C'est une évidence.",
        ),
        stage("Le héros n'y répond pas ici : elles reviendront."),
        when(is("nom.promesse", "lyra"), [
          say(
            "lyra",
            "Ma lignée garde quelque chose pour toi depuis l'Aube. Aube. C'est le nom qu'on t'a gardé : tu es arrivé avec elle. Il a beaucoup attendu.",
          ),
          choice("aube-lyra", [
            opt("1", "« Je m'en souviendrai. »", [
              fx(set("nom.aube"), add("confiance.lyra")),
            ]),
            opt("2", "« Garde-le encore. »", [
              say("lyra", "Il attendra. Il sait faire."),
            ]),
          ]),
        ]),
        when(is("nom.promesse", "nerea"), [
          say(
            "nerea",
            "Ma lignée garde quelque chose pour toi depuis l'Aube. Aube. C'est le nom qu'on t'a gardé : tu es arrivé avec elle. Il a beaucoup attendu.",
          ),
          choice("aube-nerea", [
            opt("1", "« Je m'en souviendrai. »", [
              fx(set("nom.aube"), add("confiance.nerea")),
            ]),
            opt("2", "« Garde-le encore. »", [
              say("nerea", "Il attendra. Il sait faire."),
            ]),
          ]),
        ]),
        when(gte("confiance.gorr", 2), [
          say(
            "gorr",
            "Tu n'as pas de nom. Gorr en a un. Gorr te donne un nom, si tu veux. Fissure. Gorr a une fissure. Par elle, la lumière sort. Par toi, la question est venue dans Gorr.",
          ),
          choice("fissure", [
            opt("1", "« Je m'en souviendrai. »", [
              fx(set("nom.fissure"), add("confiance.gorr")),
              say(
                "gorr",
                "Fissure. (Il le répète, pour l'apprendre.) Fissure.",
              ),
            ]),
            opt("2", "« Garde-le. »", [
              say("gorr", "Gorr garde. Gorr sait garder."),
            ]),
          ]),
        ]),
        say(
          "gorr",
          "Gorr dit les noms, avant la question. Gorr dit le nom de chacun. Et toi ? Quel nom, Gorr dit ?",
        ),
        // SIMPLIFIED: the run does not keep the list of names proposed; each
        // lineage offers its name when its trust is at least +1, and the
        // decoys (the labels of the legends) are always there.
        choice("nomination", [
          opt(
            "aube-l",
            "Aube.",
            [
              fx(set("nom", "lyra"), add("confiance.lyra")),
              say("gorr", "Aube."),
            ],
            all(is("nom.aube"), is("nom.promesse", "lyra")),
          ),
          opt(
            "aube-n",
            "Aube.",
            [
              fx(set("nom", "nerea"), add("confiance.nerea")),
              say("gorr", "Aube."),
            ],
            all(is("nom.aube"), is("nom.promesse", "nerea")),
          ),
          opt(
            "fissure",
            "Fissure.",
            [
              fx(set("nom", "gorr"), add("confiance.gorr")),
              say("gorr", "Fissure. (Il le dit, lentement, pour l'apprendre.)"),
            ],
            is("nom.fissure"),
          ),
          opt(
            "lyra",
            "Reprise.",
            [
              fx(set("nom", "lyra"), add("confiance.lyra")),
              say("lyra", "C'est celui que je t'ai donné. Il te va."),
            ],
            gte("confiance.lyra", 1),
          ),
          opt(
            "nerea",
            "Marne.",
            [
              fx(set("nom", "nerea"), add("confiance.nerea")),
              say(
                "nerea",
                "C'est le mien. Je veux dire : celui que je t'ai donné.",
              ),
            ],
            gte("confiance.nerea", 1),
          ),
          opt(
            "merlin",
            "Constante.",
            [fx(set("nom", "merlin"), add("confiance.merlin"))],
            gte("confiance.merlin", 1),
          ),
          opt(
            "nyx",
            "Lisière.",
            [
              fx(set("nom", "nyx"), add("confiance.nyx")),
              say("nyx", "Lisière tient toujours."),
            ],
            gte("confiance.nyx", 1),
          ),
          opt(
            "eva",
            "Écart.",
            [fx(set("nom", "eva"), add("confiance.eva"))],
            gte("confiance.eva", 1),
          ),
          opt(
            "squalor",
            "Reste.",
            [fx(set("nom", "squalor"), add("confiance.squalor"))],
            gte("confiance.squalor", 1),
          ),
          opt("dormeur", "Le Dormeur.", [
            fx(set("nom", "faux")),
            say("gorr", "Le Dormeur. (Il ne comprend pas.)"),
            say(
              "branches",
              "Dans une autre branche, quelqu'un nous aurait appelés.",
            ),
          ]),
          opt("anomalie", "L'Anomalie.", [
            fx(set("nom", "faux")),
            say("gorr", "L'Anomalie. (Il ne comprend pas.)"),
          ]),
          opt("couple", "Le Couplé.", [
            fx(set("nom", "faux")),
            say("gorr", "Le Couplé. (Il ne comprend pas.)"),
          ]),
          opt("aucun", "« Je n'ai pas de nom. »", [
            say("gorr", "Gorr non plus, avant. Ça va."),
          ]),
        ]),
      ],
    },
    "3": {
      id: "3",
      title: "La question de Gorr",
      kind: "rencontre",
      setting: "Au bord de la Lacune",
      next: "4",
      beats: [
        stage(
          "Gorr se lève et va au bord de la Lacune. Il est immense dans la lumière du Cœur, et l'on voit, à travers son corps de cristal, les ciels des autres branches, déformés.",
        ),
        when(is("gorr_question"), [
          say(
            "gorr",
            "Dans la mine, Gorr creuse. Gorr ne demande rien. Puis tu touches Gorr, et Gorr demande. Depuis, Gorr a beaucoup de questions. Alors Gorr garde une question plus grande. Elle ne rentre pas dans Gorr.",
          ),
        ]),
        say("gorr", "Pourquoi il y a quelque chose. Et pas rien."),
        say(
          "gorr",
          "Gorr ne demande pas tout de suite la réponse. Gorr demande qu'on lui réponde après.",
        ),
        when(gte("usure", 8), [
          say(
            "lyra",
            "Ton Usure est haute. Si tu tombes dans le Cœur, tu ne reviendras pas : tu te disperseras. Pense à ça.",
          ),
        ]),
      ],
    },
    "4": {
      id: "4",
      title: "La Recomposition",
      kind: "combat",
      setting: "Le Cœur : onze cases, une Lacune ronde au centre",
      beats: [
        stage(
          "Autour du Cœur, les Doubles de tous se lèvent. Ils sont équitables. Ils ne sont pas là pour tuer.",
        ),
        recompositionBeat(),
        when(is("defaite"), [
          narr(
            "Vous êtes repoussés, et le Cœur se referme à moitié sans vous. Ce n'est pas fini : il reste la réponse.",
          ),
          fx(set("defaite", false)),
        ]),
        when(is("heros_disperse"), [
          narr(
            "Tu te défais dans le Cœur. Ce n'est pas une mort : c'est ce que fait un motif quand il cesse de se tenir séparé.",
          ),
        ]),
        when(is("derniere_lacune", "aucune"), [
          fx(set("derniere_lacune", "recousue"), add("lacunes.recousues", 2)),
        ]),
        // The Ghom withdrew from the fight: the Découplage, no answer asked.
        when(is("fin", "decouplage"), [go("11")]),
        go("5"),
      ],
    },
    "11": {
      id: "11",
      title: "Le Découplage",
      kind: "fin",
      setting: "Le Cœur, sans le Ghom",
      beats: [
        stage(
          "La pression s'allège, puis s'efface. Personne ne tient plus la main du Ghom : le Cœur se tient seul.",
        ),
        say("gorr", "Gorr reste. Le sol reste."),
        fx(set("geste_dernier")),
        go(END),
      ],
    },
    "5": {
      id: "5",
      title: "La réponse",
      kind: "fin",
      setting: "Le Cœur, après",
      beats: [
        say("gorr", "Après, c'est maintenant."),
        when(
          is("heros_disperse"),
          [
            when(
              is("double_epargne"),
              [
                stage("Ton Double s'avance à ta place."),
                say(
                  "double-heros",
                  "Je ne sais pas pourquoi il y a quelque chose plutôt que rien. Personne ne sait.",
                ),
              ],
              [
                say(
                  "gorr",
                  "Gorr répond pour toi. Gorr ne sait pas. Personne ne sait.",
                ),
              ],
            ),
            fx(
              set("carnet.Q28", "ouverte"),
              set("derniere_reponse", "ne_sait_pas"),
            ),
          ],
          [
            choice(
              "q28",
              [
                opt("1", "« Parce que le Ghom l'a voulu. »", [
                  fx(
                    set("carnet.Q28", "fausse"),
                    set("derniere_reponse", "ghom"),
                  ),
                  say(
                    "gorr",
                    "Gorr entend. Gorr se demande qui a voulu le Ghom. Gorr n'écrit pas ça.",
                  ),
                ]),
                opt("2", "« Parce que le rien est impossible. »", [
                  fx(
                    set("carnet.Q28", "fausse"),
                    set("derniere_reponse", "rien_impossible"),
                  ),
                  say(
                    "gorr",
                    "Gorr entend. Gorr a vu le vide qui bout. Il n'a pas l'air impossible. Gorr n'écrit pas ça.",
                  ),
                ]),
                opt("3", "« Je ne sais pas. Personne ne sait. »", [
                  fx(
                    set("carnet.Q28", "ouverte"),
                    set("derniere_reponse", "ne_sait_pas"),
                  ),
                  say("gorr", "Gorr aime. Gorr écrit."),
                ]),
                opt(
                  "4",
                  "« Je ne sais pas pourquoi il y a quelque chose. Je sais ce qu'on en fait : on se touche, on se tient, et ça devient quelqu'un. »",
                  [
                    fx(
                      set("carnet.Q28", "ouverte"),
                      set("derniere_reponse", "liens"),
                    ),
                    say(
                      "gorr",
                      "Gorr aime. C'est une réponse à une autre question. Gorr la garde.",
                    ),
                  ],
                ),
                opt("5", "(Poser la main sur l'épaule de Gorr.)", [
                  fx(
                    set("carnet.Q28", "ouverte"),
                    set("derniere_reponse", "silence"),
                  ),
                  say("gorr", "Gorr sent. C'est chaud. Gorr écrit : chaud."),
                ]),
              ],
              "Que répondre à Gorr ?",
            ),
          ],
        ),
        stage(
          "Gorr écrit dans le Carnet, avec un doigt de cristal, lentement.",
        ),
        say("branches", "Voilà. Une seule branche portera cette réponse."),
        when(any(is("heros_disperse"), lt("confiance", -5)), [
          fx(set("fin", "dispersion")),
          go(END),
        ]),
        when(lastGesture, [go("6")]),
        go(END),
      ],
    },
    "6": {
      id: "6",
      title: "Le dernier geste",
      kind: "scene",
      setting: "Le Cœur : une pression sans visage",
      beats: [
        stage(
          "La pression est là, comme toujours. Peut-être pourrait-on lui demander une dernière chose.",
        ),
        choice(
          "geste",
          [
            opt("f1", "« Ghom. Montre-toi. »", [
              stage(
                "La pression ne change pas. Il n'y a rien à voir, ou rien de visible.",
              ),
              go(END),
            ]),
            opt("retrait", "« Ghom. Tu peux partir. Nous continuerons. »", [
              go("7"),
            ]),
            opt("f2", "« Ghom. Réponds-moi. »", [
              stage("Le Ghom ne parle pas. Il n'a jamais parlé."),
              go(END),
            ]),
            opt(
              "menace",
              "« Ghom. Je tiens ce qui défait aussi ta place. Pars. »",
              [go("8")],
              is("vacuum_decay"),
            ),
            opt(
              "negocier",
              "« Ghom. Je sais ce que tu veux. »",
              [go("9")],
              is("bascule_vue"),
            ),
            opt("f3", "« Ghom. Reste avec nous. »", [
              stage("La pression reste, comme toujours."),
              go(END),
            ]),
            opt("rien", "(Ne rien demander.)", [go(END)]),
          ],
          "Une dernière chose ?",
        ),
        go(END),
      ],
    },
    "7": {
      id: "7",
      title: "Se retirer",
      kind: "scene",
      setting: "L'Influence « Se retirer »",
      beats: [
        stage("Une Influence apparaît, la dernière : « Se retirer »."),
        choice("retirer", [
          opt("retirer", "Se retirer.", [
            fx(set("fin", "decouplage"), set("geste_dernier")),
            narr(
              "La pression s'allège, puis s'efface. Ce qui reste est un monde qui se tient seul.",
            ),
            go(END),
          ]),
          opt("garder", "Ne pas se retirer.", [
            fx(set("geste_dernier")),
            stage(
              "La pression reste. Elle se fait seulement plus douce, comme une main qui ne serre plus.",
            ),
            go(END),
          ]),
        ]),
        go(END),
      ],
    },
    "8": {
      id: "8",
      title: "La Bascule",
      kind: "fin",
      setting: "Le Cœur : la bulle",
      beats: [
        fx(set("bascule"), set("fin", "bascule")),
        narr(
          "Le Ghom tente de contenir la bulle, de l'intérieur. Il dit qu'il veut garder l'univers tel qu'il est. Il échoue. La bulle se répand, la sauvegarde est effacée.",
        ),
        go(END),
      ],
    },
    "9": {
      id: "9",
      title: "Ce qu'il veut",
      kind: "scene",
      setting: "La négociation",
      beats: [
        ...gesture(
          "9",
          "Les mains",
          "Quel geste ?",
          [
            "Les mains ouvertes, vides.",
            "La pression ne bouge pas, mais l'air se détend.",
          ],
          ["Le sort, la main fermée dessus.", "S'agenouiller."],
          "9b",
          2,
        ),
      ],
    },
    "9b": {
      id: "9b",
      title: "Ce qu'il veut",
      kind: "scene",
      setting: "La négociation",
      beats: gesture(
        "9b",
        "Ce qu'il veut",
        "Que dire ?",
        [
          "« Tu ne tiens pas ce qui change. Tu tiens ce qui permet que ça change. »",
          "La pression hésite.",
        ],
        ["« Tu veux que rien ne bouge. »", "« Tu veux qu'on t'obéisse. »"],
        "9c",
        0,
      ),
    },
    "9c": {
      id: "9c",
      title: "Ce qu'on se doit",
      kind: "scene",
      setting: "La négociation",
      beats: gesture(
        "9c",
        "Ce qu'on se doit",
        "Que dire ?",
        [
          "« Tu tiens. Nous changeons. Chacun garde sa part. »",
          "La pression cède d'un rien.",
        ],
        [
          "« Reste, et nous te servirons. »",
          "« Pars, et nous te laisserons en paix. »",
        ],
        "9d",
        1,
      ),
    },
    "9d": {
      id: "9d",
      title: "La question",
      kind: "scene",
      setting: "La négociation",
      beats: gesture(
        "9d",
        "La question",
        "Que faire du Carnet ?",
        [
          "Tendre le Carnet ouvert à Q28, sans y rien écrire.",
          "La pression s'arrête de peser.",
        ],
        ["Y écrire : « Parce que tu l'as voulu. »", "Fermer le Carnet."],
        "10",
        2,
      ),
    },
    "10": {
      id: "10",
      title: "La Gratuité",
      kind: "fin",
      setting: "Le Cœur : le Ghom parle",
      beats: [
        ...truth,
        fx(set("q28.annotee"), set("fin", "gratuite")),
        go(END),
      ],
    },
  },
  exploration: walk(
    [
      { id: "1", label: "La montée" },
      { id: "2", label: "La dernière veillée" },
      { id: "3", label: "Gorr, au bord" },
      { id: "4", label: "Le Cœur", auto: true },
      { id: "5", label: "La réponse" },
      { id: "6", label: "Le dernier geste" },
      { id: "7", label: "Se retirer" },
      { id: "8", label: "La bulle" },
      { id: "9", label: "Les mains" },
      { id: "9b", label: "Ce qu'il veut" },
      { id: "9c", label: "Ce qu'on se doit" },
      { id: "9d", label: "La question" },
      { id: "10", label: "La Gratuité" },
      { id: "11", label: "Le Découplage" },
    ],
    ["lyra", "brutus", "gorr"],
  ),
}
