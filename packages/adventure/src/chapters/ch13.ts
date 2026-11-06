import {
  add,
  all,
  any,
  choice,
  fx,
  give,
  go,
  gte,
  hint,
  hub,
  is,
  isnt,
  join,
  lt,
  narr,
  not,
  opt,
  redirect,
  say,
  set,
  stage,
  topic,
  when,
} from "../dsl"
import type {
  Beat,
  Chapter,
  Cond,
  FighterSpec,
  FightReport,
  FightSpec,
  FightTeamSpec,
  ObjectiveSpec,
} from "../types"
import {
  ARBALETRIER,
  atLeast,
  BRUTUS3,
  EVA3,
  firstOf,
  HALLEBARDIER,
  LYRA3,
  look,
  place,
  SONNEUR,
  SQUALOR3,
} from "./era3-kit"

// ─── Combat : la grille des Citernes ────────────────────────────────────────

// Walls `#` are thick glass. SIMPLIFIED: the engine has no line-of-sight
// blocking by glass walls (they are hills of height 3).
const BOARD = [
  "..#...1...#~~~",
  "..#...1...#~ww",
  "......1.....wW",
  "##..#111#...wW",
  "......1.....~w",
  "..#...1...#.~~",
  "..#...1...#...",
  "..............",
]

type Ally = "eva" | "squalor" | "none"

const notDispersed = (r: FightReport) =>
  r.fighters.filter((f) => f.team === 1).every((f) => f.hp > 0)

function citernes(ally: Ally, extras: number, broke: boolean): FightSpec {
  // 2 Hallebardiers, +1 per visit beyond the second; one fewer when nobody
  // comes at time 30 (Lyra bribed a keeper) or when a Lacune blocks the way.
  const hallebardiers = Math.max(
    1,
    2 + extras - (ally === "none" ? 1 : 0) - (broke ? 1 : 0),
  )
  const spots = [
    { x: 1, y: 0 },
    { x: 1, y: 6 },
    { x: 0, y: 0 },
    { x: 3, y: 0 },
    { x: 0, y: 1 },
  ]
  const guards: FighterSpec[] = [
    ...spots
      .slice(0, hallebardiers)
      .map((at): FighterSpec => ({ preset: HALLEBARDIER, at })),
    { preset: ARBALETRIER, at: { x: 11, y: 6 } },
    { preset: ARBALETRIER, at: { x: 6, y: 7 } },
    { preset: SONNEUR, at: { x: 11, y: 7 } },
    // SIMPLIFIED: Brutus III enters at time 20 by the south-west corner; the
    // engine cannot bring a fighter in later, he waits there from the start.
    { preset: BRUTUS3, at: { x: 0, y: 7 } },
  ]
  const allies: FighterSpec[] = [
    { preset: "@hero", at: { x: 0, y: 2 } },
    { preset: LYRA3, at: { x: 0, y: 4 } },
  ]
  // SIMPLIFIED: Eva III / Squalor III arrive at time 30 (a scripted entry the
  // engine lacks): they stand by the exits from the start.
  if (ally === "eva") allies.push({ preset: EVA3, at: { x: 13, y: 0 } })
  if (ally === "squalor") allies.push({ preset: SQUALOR3, at: { x: 12, y: 1 } })

  const teams: FightTeamSpec[] = [
    { name: "Alliés", side: "allies", fighters: allies },
    { name: "La Garde de verre", side: "enemies", fighters: guards },
  ]
  const objectives: ObjectiveSpec[] = [
    {
      id: "fuir",
      mark: "★",
      label: "Conduire le héros et Lyra III jusqu'à la grille des Citernes",
      // SIMPLIFIED: the exits `>` are not a rule of the engine; the flight is
      // a clock (8 turns, the grille is reached) and nobody must be dispersed.
      check: (r) => r.result !== "defeat",
      success: "Vous êtes dehors. Dehors, c'est dangereux.",
      failure: "La Garde vous fige avant la grille.",
    },
    {
      id: "gardes",
      mark: "◆",
      label: "Aucun garde dispersé",
      check: notDispersed,
      success: "Personne n'est resté par terre.",
      onSuccess: [add("confiance.brutus", 2), set("gardes_epargnes")],
    },
  ]
  if (!broke)
    objectives.push({
      id: "lampadaires",
      mark: "◆",
      label: "Ne briser aucun Cristal-lampadaire",
      // The Cristal broken or not is decided before the fight (a gesture);
      // here only the flight must succeed.
      check: (r) => r.result !== "defeat",
      success: "Les lampadaires brillent toujours, par paires.",
      onSuccess: [add("confiance.lyra")],
    })

  return {
    id: `ch13-citernes-${ally}-${hallebardiers}-${broke ? "b" : "i"}`,
    title: "La grille des Citernes",
    goal: "Fuir vers les Citernes : tenir jusqu'à la grille sans que le héros ni Lyra III ne se disperse. Un garde qui tombe de trop près ne se relève pas : dose tes coups.",
    board: BOARD,
    teams,
    rules: {
      clock: { period: 1, limit: 8, winner: 0 },
      // SIMPLIFIED: guards and Brutus III break off under 30 % of their HP
      // (the doc says 25 % for the guards, 30 % for Brutus III).
      flee: {
        team: 1,
        below: 0.3,
        exits: [
          { x: 0, y: 0 },
          { x: 0, y: 7 },
        ],
      },
      announce: true,
    },
    influences: ["timeWarp", "earthquake", "blessing"],
    startEnergy: 3,
    defeat: [
      set("defaite"),
      add("usure"),
      add("confiance.lyra", -1),
      // Lyra breaks a Cristal to get the hero out: the easy way, and its price.
      add("cristaux.extraits"),
      set("lampadaire_brise"),
    ],
    objectives,
    lines: [
      {
        when: "start",
        who: "lyra",
        text: "Les Citernes. La grille, là-bas. Si on y est, ils ne nous suivront pas : ils détestent l'eau qui bouge.",
      },
      {
        when: "tick:3",
        who: "brutus",
        text: "Rends-toi. Personne ne te fera de mal. Personne ne fait de mal à personne, ici. C'est le principe.",
      },
      {
        when: "tick:5",
        who: ally === "squalor" ? "squalor" : "eva",
        text:
          ally === "squalor"
            ? "Trois siècles que rien ne nage dans ces eaux. Je commençais à me manger les nageoires. Ceux-là, je ne les mange pas. Le verre, ça passe mal."
            : "Dix ans que je calcule la trajectoire de tout ce qui bouge dans cette cité. Rien ne bouge. Et puis toi. Ne me remercie pas. Je m'ennuyais.",
      },
      {
        when: "fleeing",
        who: "brutus",
        text: "Relevez-le. On ne laisse personne par terre.",
      },
      {
        when: "end",
        who: "brutus",
        text: "Tu es dehors. Dehors, c'est dangereux. Je te retrouverai avant que ça te tue.",
      },
    ],
  }
}

// CUT: the Sonneur's "Ralentissez" bubble and the Lyra heal bubble, the
// lampadaire pairs on the map (the Extraire action does not exist: breaking a
// Cristal is a gesture before the fight), the figé defeat (three enemies and
// the Sonneur), the people behind the glass raising their heads, the exit at
// (13,2) of Branchies/Squalor.
function citernesBeat(): Beat {
  const allyCond: Record<Ally, Cond> = {
    eva: any(
      is("ile_sauvee", "sauge"),
      all(
        is("ile_sauvee", "strates"),
        atLeast("confiance.eva", "confiance.squalor"),
      ),
    ),
    squalor: any(
      is("ile_sauvee", "lusse"),
      all(
        is("ile_sauvee", "strates"),
        not(atLeast("confiance.eva", "confiance.squalor")),
      ),
    ),
    none: is("ile_sauvee", "aucune"),
  }
  const entries: { cond: Cond; beat: Beat }[] = []
  for (const ally of ["eva", "squalor", "none"] as const)
    for (const extras of [0, 1, 2])
      for (const broke of [false, true])
        entries.push({
          cond: all(
            allyCond[ally],
            extras === 2
              ? gte("habitants.visites", 4)
              : extras === 1
                ? all(gte("habitants.visites", 3), lt("habitants.visites", 4))
                : lt("habitants.visites", 3),
            broke ? is("lampadaire_brise") : not(is("lampadaire_brise")),
          ),
          beat: { t: "fight", fight: citernes(ally, extras, broke) },
        })
  return firstOf(entries)
}

// ─── Chronique d'ouverture (README of the era) ──────────────────────────────

function chronique(): Beat[] {
  return [
    stage(
      "COLLÈGE DE VITRELLE — BUREAU DU CLASSEMENT. Rapport n° 312-0417. Objet : l'anomalie dite « du Puits », cote 0-PUITS-1. Classement demandé : anomalie historique. Rédacteur : le Chroniqueur, onzième du nom, rédacteur de deuxième rang. Diffusion : Maître du Verre ; capitaine de la Garde ; personne d'autre.",
    ),
    stage(
      "1.1. Depuis l'an 97 du Gel, la Salle du Puits contient une forme humanoïde immobile, à la verticale de l'amas dense. Les relevés thermiques la donnent pour très froide et très rouge : sa lumière nous parvient étirée, comme épuisée par la descente. Le Bureau des Mesures attribue cet effet au ralentissement du temps propre au voisinage de l'amas. Le présent bureau n'a pas d'avis sur la question et s'en tient aux mesures.",
    ),
    stage(
      "1.2. Entre l'an 97 et l'an 311, l'anomalie a déplacé la main droite d'environ un doigt. Ce mouvement a été jugé non significatif. 1.3. Au cours de la nuit du 16 au 17 du mois des Vitres, an 312, l'anomalie a ouvert les yeux.",
    ),
    stage(
      "2.1. Un seul document fiable mentionne l'anomalie : les carnets de Merlin, premier du nom, fondateur de la lignée de notre Maître. Il a observé, depuis le bord du Puits, le ralentissement de sa chute : « un battement sur cent, puis sur dix ». Le Bureau tient ces mesures pour exactes. Toutes les autres sources sont des légendes, toutes antérieures au Gel, toutes contradictoires.",
    ),
    when(is("merlin_mesure"), [
      stage(
        "Il l'a mesurée lui-même et l'a inscrite comme « anomalie » : son horloge et le cœur du sujet n'étaient pas d'accord « d'un battement sur mille ».",
      ),
    ]),
    stage(
      "2.2. Les ondines des anciens pilotis appelaient l'anomalie « le Dormeur ». Il serait sorti de la Pierre Lente au temps des Marées, et aurait « choisi ce qu'on laisserait sombrer ».",
    ),
    when(is("ile_sauvee", "strates"), [
      stage(
        "Le fonds dit « de la Marée » conserve les annales des ondines, en vase et en ardoise, que le Bureau juge exactes et donc sans intérêt pour la question.",
      ),
    ]),
    when(is("ile_sauvee", "sauge"), [
      stage(
        "La Tour des Marées, aujourd'hui fondation de notre Tour du Registre, aurait été sauvée par lui. Le Bureau classe cette affirmation comme reconnaissance de dette non vérifiable.",
      ),
    ]),
    when(is("ile_sauvee", "lusse"), [
      stage(
        "Les squales des Citernes prétendent lui devoir leur lignée. Le Bureau ne recueille pas le témoignage des squales.",
      ),
    ]),
    when(is("ile_sauvee", "aucune"), [
      stage(
        "Il n'aurait rien sauvé du tout. C'est la seule version que le Bureau trouve crédible.",
      ),
    ]),
    when(is("journal_nerea", "garde"), [
      stage(
        "Une copie du journal d'une ondine, Néréa dite des Strates, le décrit en des termes que le Bureau juge poétiques et donc inexploitables.",
      ),
    ]),
    when(
      is("fragments", "fusion"),
      [
        stage(
          "2.3. Les mêmes légendes le rattachent à l'événement dit de la Fusion, au cours duquel deux terres se seraient soudées le long de la Couture, sur laquelle notre Haute-Ville est pavée. La Couture est un fait géologique. Que quelqu'un y ait assisté est une hypothèse superflue.",
        ),
      ],
      [
        when(is("fragments", "separation"), [
          stage(
            "2.3. Les mêmes légendes le rattachent à l'événement dit de la Séparation, à l'origine de l'éloignement de la Sœur, que l'on voit par temps clair. L'éloignement est un fait astronomique. Que quelqu'un l'ait décidé est une hypothèse superflue.",
          ),
        ]),
      ],
    ),
    when(
      isnt("nom", "aucun"),
      [
        stage(
          "2.4. Certaines sources le nomment d'un nom déformé (sic). Le Bureau ne retient pas ce nom, qui varie selon les sources et n'est donc pas une donnée.",
        ),
      ],
      [
        stage(
          "2.4. Aucune source ne lui donne de nom. Le Bureau s'en félicite : un nom est une donnée qu'il faudrait vérifier.",
        ),
      ],
    ),
    stage(
      "3.1. Taille et carrure ordinaires. Habits anciens, d'une coupe antérieure au Gel. 3.2. Particularités physiques :",
    ),
    when(
      is("transformation.1", "A"),
      [
        stage(
          "pupilles qui renvoient la lumière à la manière des bêtes nocturnes ;",
        ),
      ],
      [
        when(is("transformation.1", "B"), [
          stage(
            "plaques translucides sur les avant-bras, d'apparence cristalline (un prélèvement est recommandé) ;",
          ),
        ]),
      ],
    ),
    when(
      is("transformation.2", "A"),
      [stage("fentes respiratoires au cou, de type aquatique.")],
      [
        when(is("transformation.2", "B"), [
          stage("écailles d'un gris bleuté à la nuque et aux épaules."),
        ]),
      ],
    ),
    stage(
      "3.3. Effets personnels : un carnet de cuir, illisible à travers la paroi. Il paraît contenir des questions.",
    ),
    when(is("objet_de_nyx"), [
      stage(
        "Un second objet, saisi à ses pieds en l'an 140, est inventorié comme artefact non classé.",
      ),
    ]),
    stage(
      "4.1. L'anomalie n'a pas été mesurée depuis sa naissance. Elle ne figure dans aucun registre. Elle n'a donc pas d'état connu, ce qui est, pour une cité comme la nôtre, la définition exacte d'un danger. 4.2. Le carnet constitue un risque distinct. Les habitants de Vitrelle disposent depuis trois siècles de toutes les réponses utiles, affichées au Registre. Un document contenant des questions sans réponse officielle pourrait susciter des comparaisons. 4.3. Le Bureau rappelle que les questions ne sont pas interdites. Elles sont inutiles, ce qui revient au même pour la sécurité publique.",
    ),
    stage(
      "5.1. Relever l'anomalie dès sa sortie et la conduire au Bureau des Mesures. 5.2. Saisir le carnet. Ne pas le lire à voix haute. 5.3. Toute personne ayant parlé avec l'anomalie sera relevée et réévaluée. 5.4. Si l'anomalie résiste, la Garde est autorisée à la figer. Fait à Vitrelle, le 17 du mois des Vitres, an 312 du Gel. Le Chroniqueur (11e).",
    ),
    stage(
      "Note marginale, d'une autre main, à l'encre bleue : « 1.2 : un doigt en deux siècles, c'est plus que tout ce que cette cité a bougé dans le même temps. — M. »",
    ),
  ]
}

// ─── Les habitants (scene 4) ────────────────────────────────────────────────

/** Rules of the sablier: four visits at most, and one may stop early. */
const open: Cond = all(lt("habitants.visites", 4), not(is("sablier_fini")))

/** A visit: counts one grain of the sablier. */
const visit: Beat = fx(add("habitants.visites"))
const reopen: Beat = fx(add("questions_rouvertes"))
const answered: Beat = fx(add("habitants.reponses"))

function corinForm(): Beat {
  const form = (value: string, text: string) =>
    when(is("lacunaire.forme", value), [stage(text)])
  return when(
    is("lacunaire.forme", "aucune"),
    [
      stage(
        "Un jeune homme qui porte une forme héritée d'un ancêtre qu'on ne nomme plus, aux contours un peu trop nets. Il est assis dans une maison vide, parfaitement immobile.",
      ),
    ],
    [
      form(
        "ondine",
        "Un jeune homme aux doigts palmés, la peau toujours humide. Il est assis dans une maison vide, parfaitement immobile.",
      ),
      form(
        "aiguille",
        "Un jeune homme au corps long et mince, aux gestes d'une précision de flèche. Il est assis dans une maison vide, parfaitement immobile.",
      ),
      form(
        "squale",
        "Un jeune homme aux dents trop nombreuses quand il sourit, ce qu'il évite. Il est assis dans une maison vide, parfaitement immobile.",
      ),
      form(
        "miroir",
        "Un jeune homme à la peau où l'on se voit un peu, ce qui gêne tout le monde dans une cité de verre. Il est assis dans une maison vide, parfaitement immobile.",
      ),
      form(
        "recif",
        "Un jeune homme aux plaques calcaires aux épaules, rugueuses. Il est assis dans une maison vide, parfaitement immobile.",
      ),
      form(
        "brume",
        "Un jeune homme aux contours flous, comme une photographie qui a bougé. Il est assis dans une maison vide, parfaitement immobile.",
      ),
    ],
  )
}

const habitants = hub("habitants", [
  topic(
    "odile",
    "Odile, la verrière",
    [
      visit,
      stage(
        "Un atelier ouvert sur la rue. Une femme souffle un carreau, le pose sur une pile de carreaux identiques, en souffle un autre.",
      ),
      say(
        "odile",
        "Carreau réglementaire numéro quatre. Le Registre dit que le verre parfait n'a pas de bulle. Je n'en fais jamais. Trente et un ans sans une bulle.",
      ),
      choice("odile", [
        opt("autre", "Tu pourrais faire autre chose.", [
          say("odile", "Pourquoi ?"),
          stage("Elle se remet au travail."),
        ]),
        opt("bulle", "Que fait la lumière, quand elle traverse une bulle ?", [
          stage("Odile s'arrête, la canne en l'air."),
          say(
            "odile",
            "Elle… se tord, je crois. Le Registre ne le dit pas. Il dit seulement qu'il n'en faut pas.",
          ),
          stage("Elle regarde son souffle refroidir dans la canne."),
          say("odile", "Je pourrais en faire une. Une seule. Pour voir."),
          reopen,
        ]),
        opt("travail", "Bon travail.", [stage("Elle hoche la tête.")]),
      ]),
    ],
    { if: open },
  ),
  topic(
    "tobin",
    "Tobin, le releveur",
    [
      visit,
      stage(
        "Tobin, rentré chez lui en tremblant, recopie dans un cahier la valeur de la jauge du Gel affichée face à sa fenêtre. Toujours la même.",
      ),
      say(
        "tobin",
        "Quatre degrés sous la marque. Toutes les heures. Depuis vingt ans. Je recopie.",
      ),
      choice("tobin", [
        opt("aiguille", "Depuis quand l'aiguille ne bouge-t-elle plus ?", [
          say("tobin", "Depuis toujours."),
          stage("Un silence."),
          say(
            "tobin",
            "Enfin… je n'ai que mes vingt ans de cahiers. Les plus anciens sont aux Archives.",
          ),
          stage(
            "Il fronce les sourcils, comme si quelque chose lui faisait mal.",
          ),
          say("tobin", "Pourquoi est-ce que je ne me suis jamais demandé ça ?"),
          reopen,
          fx(set("tobin_rouvert")),
        ]),
        opt("parfait", "Elle ne bougera jamais. Le Gel est parfait.", [
          say("tobin", "Merci. C'est ce que dit le Registre."),
          answered,
        ]),
        opt("desole", "Je suis désolé de t'avoir fait peur.", [
          say(
            "tobin",
            "Vous n'êtes pas au règlement. Ce n'est pas votre faute.",
          ),
          fx(add("confiance")),
        ]),
      ]),
    ],
    { if: open },
  ),
  topic(
    "pia",
    "Pia, l'écolière",
    [
      visit,
      stage(
        "Une fillette assise seule derrière une paroi d'école, récitant à mi-voix.",
      ),
      say(
        "pia",
        "Pourquoi le ciel est-il net ? Parce que le Gel. Pourquoi la mer est-elle calme ? Parce que le Gel. Pourquoi…",
      ),
      choice("pia", [
        opt(
          "demander",
          "Et toi, qu'est-ce que tu demanderais, si le Registre n'existait pas ?",
          [
            stage("Elle réfléchit longtemps."),
            say(
              "pia",
              "Ma grand-mère parlait d'une chose qui pousse les nuages. Le vent. C'est quoi, le vent ?",
            ),
            stage("Lyra, derrière le héros, détourne les yeux."),
            reopen,
            fx(add("confiance.lyra")),
          ],
        ),
        opt(
          "repondre",
          "Le vent, c'est de l'air qui bouge parce qu'il fait plus chaud ici que là-bas.",
          [
            stage(
              "Pia note la réponse dans son cahier, très soigneusement, et ne demande rien d'autre.",
            ),
            answered,
          ],
        ),
        opt("reciter", "Tu récites bien.", [say("pia", "Je sais.")]),
      ]),
    ],
    { if: open },
  ),
  topic(
    "corin",
    "Corin, le Fixé",
    [
      visit,
      corinForm(),
      say(
        "corin",
        "Nous… je suis bien, ici. Rien ne change. Mes ancêtres hésitaient, ils changeaient de forme selon qui ils croisaient. Ici, plus rien ne nous croise. Je reste moi.",
      ),
      choice("corin", [
        opt("ancetre", "Ton ancêtre a-t-il choisi sa forme ?", [
          say(
            "corin",
            "On dit qu'il l'a prise de la première main qui l'a touché.",
          ),
          stage("Il regarde ses propres mains."),
          say(
            "corin",
            "Alors… si quelqu'un d'autre m'avait touché… je serais quelqu'un d'autre ? Est-ce que je pourrais encore l'être ?",
          ),
          when(is("carnet.Q10", "repondue"), [
            narr("En partie."),
            stage("Corin sourit pour la première fois."),
          ]),
          reopen,
        ]),
        opt("garder", "Tu as raison, ne change pas.", [
          say("corin", "Merci. Nous… je ne changerai pas."),
          answered,
        ]),
        opt("main", "Lui tendre la main.", [
          stage("Il la regarde longtemps, ne la prend pas."),
          say("corin", "Pas encore."),
        ]),
      ]),
    ],
    { if: open },
  ),
  topic(
    "heritier",
    "L'héritier de l'île, ou Maud la passeuse",
    [
      visit,
      when(
        isnt("ile_sauvee", "aucune"),
        [
          when(is("ile_sauvee", "sauge"), [
            stage(
              "Un vieil homme bourru, arrière-arrière-petit-fils d'Aubin, tient un étal de poisson séché sans poisson.",
            ),
          ]),
          when(is("ile_sauvee", "lusse"), [
            stage(
              "Une vieille squale aux dents usées monte des Citernes vendre des algues.",
            ),
          ]),
          when(is("ile_sauvee", "strates"), [
            stage(
              "Une ondine copiste recopie les annales pour le fonds de la Marée, sans les lire.",
            ),
          ]),
          say(
            "heritier",
            "Chez nous, on dit que le Dormeur de la Pierre Lente a choisi de sauver notre île. Le Collège dit que c'est une légende.",
          ),
          stage("Il regarde le héros."),
          say("heritier", "Vous lui ressemblez."),
          choice("heritier", [
            opt("vrai", "Que ferais-tu, si c'était vrai ?", [
              say(
                "heritier",
                "Je… lui demanderais pourquoi nous. Pourquoi pas les autres.",
              ),
              narr("Je n'ai pas de réponse. C'est bien."),
              reopen,
            ]),
            opt("moi", "C'était moi.", [
              say("heritier", "Alors merci."),
              stage("Il est content, et c'est tout."),
              answered,
              fx(add("confiance")),
            ]),
          ]),
        ],
        [
          stage(
            "Maud, une vieille passeuse qui ne passe plus personne : les canaux sont gelés.",
          ),
          say(
            "maud",
            "Avant, je savais lire l'eau. Maintenant elle ne dit plus rien.",
          ),
          choice("maud", [
            opt("disait", "Qu'est-ce qu'elle disait ?", [
              say("maud", "D'où venait le courant. Où il allait."),
              stage("Elle se tait."),
              say("maud", "Où est-ce qu'il est allé, le courant ?"),
              reopen,
            ]),
            opt("gel", "Le Gel l'a arrêté.", [say("maud", "Oui."), answered]),
          ]),
        ],
      ),
    ],
    { if: open },
  ),
  topic(
    "assez",
    "Retourner au passage dépoli : le sablier est presque vide",
    [fx(set("sablier_fini"))],
    { if: open },
  ),
])

// ─── L'île : la Basse-Ville, ses rues de verre, ses Citernes ───────────────

const ISLAND = [
  "..............",
  ".1.......11...",
  "..............",
  "....1.........",
  "..............",
  ".1.......1....",
  "..............",
  "..........~~..",
]

const nameWanderer = {
  preset: HALLEBARDIER,
  title: "Une ronde de la Garde",
  goal: "Passer la ronde sans que personne ne se disperse.",
  range: 2,
  radius: 4,
  effects: [{ add: "ecoute", by: 1 }],
  success: "Le garde s'assied contre une paroi, étonné d'être encore en vie.",
}

export const ch13: Chapter = {
  id: "13",
  era: 3,
  number: 13,
  title: "La Cité sans questions",
  quote: {
    who: "chroniqueur",
    text: "1.3. Au cours de la nuit du 16 au 17 du mois des Vitres, an 312, l'anomalie a ouvert les yeux.",
  },
  place:
    "Vitrelle : la Salle du Puits, la Basse-Ville, l'arrière-salle, les Citernes",
  question: { id: "Q13", text: "Une vie sans questions est-elle une vie ?" },
  start: "1",
  exploration: {
    island: ISLAND,
    start: { x: 0, y: 2 },
    companions: ["lyra"],
    influences: ["timeWarp"],
    encounters: [
      place(ISLAND, "puits", "La Salle du Puits", "1", 1, 2, { auto: true }),
      place(ISLAND, "passage", "Le passage dépoli", "2", 3, 4),
      place(ISLAND, "arriere", "L'arrière-salle", "3", 5, 1),
      place(ISLAND, "rues", "Les rues de la Basse-Ville", "4", 7, 3),
      place(ISLAND, "carnet", "Le passage dépoli, au tintement", "5", 8, 6),
      place(ISLAND, "grille", "La grille des Citernes", "6", 10, 4, {
        auto: true,
      }),
      place(ISLAND, "fin", "Sous la ville", "7", 12, 6),
      look(
        "plaque",
        "La plaque de règlement",
        { x: 2, y: 1 },
        "Une plaque de règlement de trois pieds de haut : toutes les réponses utiles y sont affichées, en colonnes. On voit le doigt des lecteurs, usé dans le verre, aux mêmes lignes. Les dernières lignes sont intactes.",
      ),
      look(
        "paroi",
        "Une paroi de verre",
        { x: 9, y: 1 },
        "On voit les gens dans leurs maisons, assis, chacun seul, chacun à sa table. Personne ne lève la tête. Pas un souffle d'air : rien ne bouge dans la cité, sauf toi.",
      ),
      look(
        "lampadaire",
        "Un lampadaire à Cristal",
        { x: 5, y: 3 },
        "Un Cristal dans une cage de verre, qui éclaire la rue. Un fil de lumière ténu le relie à un autre, quelque part derrière une façade. Il scintille avec lui, à l'unisson.",
      ),
      look(
        "clepsydre",
        "La clepsydre de Néréa",
        { x: 1, y: 6 },
        "L'eau n'est descendue que d'un doigt : quelques heures pour toi, trois siècles pour la cité. Les deux mesures sont exactes. Ce sont deux temps, voilà tout.",
        "narr",
      ),
      {
        id: "ronde",
        label: "Une ronde de la Garde",
        at: { x: 11, y: 2 },
        wander: nameWanderer,
      },
      {
        id: "cloche",
        label: "Un timbre de verre",
        at: { x: 12, y: 1 },
        obstacle: {
          influence: "timeWarp",
          before: [
            {
              style: "stage",
              text: "Un timbre de verre tinte trois fois, net, puis recommence, toujours à la même cadence. Une patrouille passe, comme réglée sur lui.",
            },
          ],
          after: [
            {
              style: "stage",
              text: "Le temps du timbre s'étire d'un battement : la patrouille arrive trop tard sous la fenêtre, et ne voit personne.",
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
      title: "La Salle du Puits",
      kind: "rencontre",
      setting: "Vitrelle, Salle du Puits, niveau zéro",
      beats: [
        ...chronique(),
        stage(
          "Noir. Puis une lumière qui redescend du bleu vers le blanc, comme si quelqu'un tournait lentement une molette : vu du fond, le monde d'en haut paraissait accéléré et bleui ; à mesure que le héros remonte, il reprend son rythme et sa couleur. Le héros est debout au fond d'une cuve de verre. Autour, des dizaines d'instruments : aiguilles, tubes gradués, lentilles braquées sur lui. Tout est propre. Sur une étiquette : « 0-PUITS-1 ». Un homme maigre en blouse grise, un registre à la main, le regarde comme on regarde une aiguille qui bouge alors qu'elle ne doit pas.",
        ),
        stage(
          "Extrait des archives — Journal de garde de la Salle du Puits, an 312. « Heure 3. Relevé thermique : en hausse. Heure 3 et quart : en hausse. Heure 3 et demie : le sujet est sorti de la cuve. Je note qu'il n'a rien dit. Je note que moi non plus. »",
        ),
        say(
          "tobin",
          "Vous… Vous n'êtes pas censé… Le Registre dit que vous êtes immobile.",
        ),
        choice("puits", [
          opt("ou", "Où suis-je ?", [
            say(
              "tobin",
              "À Vitrelle. Salle du Puits. Niveau zéro. Tout est écrit sur la porte.",
            ),
            stage("Il désigne une plaque de règlement de trois pieds de haut."),
          ]),
          opt("temps", "Combien de temps ?", [
            say(
              "tobin",
              "Vous êtes inscrit depuis l'an 97. Nous sommes en 312. Je n'ai pas fait le calcul, ce n'est pas mon service.",
            ),
            stage(
              "Le héros sort de sa poche la clepsydre de Néréa. L'eau y est descendue d'un doigt à peine : quelques heures. Il la regarde, puis regarde Tobin.",
            ),
            say(
              "tobin",
              "Elle retarde, votre horloge. Toutes les horloges retardent, près de la Pierre… pardon, près du Puits. Ma grand-mère disait « la Pierre Lente ». On n'a plus le droit.",
            ),
          ]),
          opt("toucher", "Ne rien dire, et toucher la paroi de la cuve.", [
            stage(
              "Le verre est tiède là où il a posé la main, froid partout ailleurs.",
            ),
            stage("Tobin note : « Le sujet… touche. »"),
          ]),
        ]),
        stage(
          "Quel que soit le choix, Tobin tire un cordon. Quelque part, très loin, un timbre de verre tinte trois fois. Il n'y a pas de sirène à Vitrelle : il y a ce tintement, net, qui se répète.",
        ),
        when(is("objet_de_nyx"), [
          stage(
            "Dans une vitrine, à hauteur de main, une lame courte de verre noir, avec une encoche au dos : la lame de Nyx. L'étiquette dit : « Artefact non classé. Origine : le sujet. » Le héros la reprend.",
          ),
        ]),
        when(is("transformation.1", "B"), [
          say(
            "tobin",
            "Vos bras… Ce sont des Cristaux ? Ne bougez pas, il faut que je vous inscrive aux gisements.",
          ),
        ]),
      ],
      next: "2",
    },

    // ── 2 ──
    "2": {
      id: "2",
      title: "La soigneuse sans permis",
      kind: "rencontre",
      setting: "Une rue de la Basse-Ville",
      beats: [
        stage(
          "Une rue de la Basse-Ville. Des façades transparentes : on voit les gens dans leurs maisons, assis, chacun seul, chacun à sa table. Personne ne lève la tête. Le ciel est d'un bleu sans nuage, sans oiseau, sans rien. Pas un souffle d'air. Le héros trébuche, s'appuie contre une paroi. Une main aux bouts des doigts gris, comme brûlés par le froid (la marque des Soigneuses, depuis toujours), le tire dans un passage étroit, entre deux murs de verre dépoli, les seuls qu'on ne voit pas au travers.",
        ),
        say(
          "lyra",
          "Pas là. Ici, le dépoli. C'est le seul endroit où personne ne voit rien.",
        ),
        stage("Elle le regarde de haut en bas."),
        say(
          "lyra",
          "Tu saignes. Non, tu ne saignes pas. Tu es froid comme une pierre de fond. Tu sors d'où ?",
        ),
        choice("lyra3", [
          opt("puits", "D'en bas. Du Puits.", [
            say(
              "lyra",
              "Alors c'est toi, l'anomalie. Ils en parlent depuis que je suis petite. On disait que tu étais une statue.",
            ),
            fx(add("confiance.lyra")),
          ]),
          opt("qui", "Qui es-tu ?", [
            say(
              "lyra",
              "Quelqu'un qui soigne sans permis. Ça suffit comme présentation, à Vitrelle.",
            ),
          ]),
          opt("pourquoi", "Pourquoi tu m'aides ?", [
            say(
              "lyra",
              "Parce que la Garde va te figer, et que je n'aime pas qu'on fige les gens.",
            ),
          ]),
        ]),
        stage(
          "Elle pose deux doigts sur son poignet. Une chaleur passe : le Soin, à l'ancienne. Elle pâlit un peu.",
        ),
        say(
          "lyra",
          "Voilà. Ce que je répare ici, je le paie ailleurs : moi, ce soir, je dormirai mal. Au dispensaire, ils auraient brisé un Cristal. Ça ne leur coûte rien, à eux. Ça coûte à ceux qui ne sont pas encore nés.",
        ),
        fx(join("lyra")),
        stage("Lyra III rejoint l'équipe."),
      ],
      next: "3",
    },

    // ── 3 ──
    "3": {
      id: "3",
      title: "L'arrière-salle",
      kind: "veillee",
      setting: "Derrière une blanchisserie",
      beats: [
        stage(
          "Une pièce sans fenêtre derrière une blanchisserie. Des bandes de lin, des bassines, une lampe à huile. Pas de Cristal : Lyra n'en veut pas chez elle.",
        ),
        hub("arriere", [
          topic("gel", "Le Gel", [
            say(
              "lyra",
              "Il y a trois siècles, les Marées emportaient des îles entières. Mes aïeules sont venues du sud avec les Gardiens, parce que les Thermistes du nord promettaient de les arrêter. Le Collège a refroidi les bords du monde. Plus de Marées. Plus de vent non plus, plus de pluie, plus d'oiseaux. Mais plus de Marées. Elles ont eu ce qu'elles voulaient.",
            ),
          ]),
          topic("registre", "Le Registre", [
            say(
              "lyra",
              "Tout ce qu'il est utile de savoir est affiché sur les murs de la Tour. Quand on a une question, on va lire la réponse. Avec le temps, on a arrêté d'y aller. On a arrêté d'avoir des questions.",
            ),
          ]),
          topic("parois", "Les parois", [
            say(
              "lyra",
              "On se voit tous. On ne se touche plus. Un soin officiel, c'est derrière une vitre, avec une pince. Moi, je touche. C'est pour ça que c'est interdit.",
            ),
          ]),
          topic("cristaux", "Les Cristaux", [
            say(
              "lyra",
              "On les casse, on récupère ce qu'il y avait dedans : de la chaleur, de l'ordre, du soin. Ma grand-mère disait que dedans, il y avait les liens des gens d'avant. Le Collège dit que c'est une superstition.",
            ),
            stage("Un temps."),
            say(
              "lyra",
              "Le Collège dit aussi que les Lacunes n'ont rien à voir avec les mines.",
            ),
          ]),
        ]),
        stage(
          "Lyra pose sur la table un petit sablier de verre, quatre grains.",
        ),
        say(
          "lyra",
          "La Garde ratisse la Basse-Ville par carrés. Tu as le temps de voir trois, quatre personnes, pas plus. Si tu veux voir des gens. Moi, à ta place, je fuirais tout de suite.",
        ),
        hint(
          "Le sablier",
          "Chaque visite retire un grain. Au-delà de la deuxième, la Garde envoie un Hallebardier de plus à la poursuite.",
        ),
        choice("sablier", [
          opt("voir", "Je veux les voir. Ceux qui ne demandent plus rien.", [
            fx(add("confiance.lyra")),
            say("lyra", "Tu es bizarre. Bon. Je t'accompagne."),
          ]),
          opt("fuir", "Fuyons tout de suite.", [
            // ★ fails: questions_rouvertes stays 0
            go("5"),
          ]),
        ]),
      ],
      next: "4",
    },

    // ── 4 ──
    "4": {
      id: "4",
      title: "Les habitants",
      kind: "rencontre",
      setting: "La Basse-Ville, derrière les parois",
      beats: [
        stage(
          "Cinq maisons de verre à portée de pas, dont on n'en visitera que quatre. On rouvre une question en posant une question, jamais en donnant une réponse.",
        ),
        habitants,
        when(is("habitants.reponses"), [
          stage(
            "Derrière eux, ceux à qui l'on a répondu ont déjà repris leur place.",
          ),
        ]),
      ],
      next: "5",
    },

    // ── 5 ──
    "5": {
      id: "5",
      title: "Le Carnet",
      kind: "rencontre",
      setting: "Le passage dépoli, au tintement",
      beats: [
        stage(
          "De retour dans le passage dépoli. Le tintement de verre se rapproche, trois coups, trois coups.",
        ),
        say(
          "lyra",
          "Ils ne cherchent pas seulement toi. Ils cherchent ton cahier. On a affiché ton signalement au Registre : « un carnet de cuir contenant des questions ». Je n'avais jamais vu le Collège avoir peur d'un cahier.",
        ),
        stage(
          "Le héros ouvre le Carnet. Les questions des ères précédentes y sont, de sa main. Il en écrit une nouvelle.",
        ),
        when(
          is("questions_rouvertes", 0),
          [
            stage("Il écrit vite, sans regarder en arrière."),
            say("lyra", "Tu as bien fait de fuir. Je crois."),
          ],
          [
            when(
              lt("questions_rouvertes", 3),
              [
                say(
                  "lyra",
                  "Tu as vu leur tête ? Comme quand on rallume une lampe dans une pièce où on dormait. Ça fait mal aux yeux.",
                ),
              ],
              [
                say(
                  "lyra",
                  "Trois. Trois personnes qui vont rester éveillées cette nuit.",
                ),
                stage("Elle rit, doucement."),
                say(
                  "lyra",
                  "Le Collège va devoir afficher des réponses en plus.",
                ),
              ],
            ),
          ],
        ),
        fx(set("carnet.Q13", "ouverte")),
        stage(
          "Q13 entre au Carnet : Une vie sans questions est-elle une vie ?",
        ),
        say(
          "lyra",
          "Ma grand-mère aurait dit que oui. Qu'on peut vivre très bien sans se demander rien.",
        ),
        stage("Un temps."),
        say(
          "lyra",
          "Ma grand-mère est morte dans une maison de verre, assise à sa table. Personne ne l'a vue se disperser, alors que tout le monde la voyait.",
        ),
        when(gte("questions_rouvertes", 3), [fx(set("voix_qui_demande"))]),
      ],
      next: "6",
    },

    // ── 6 ──
    "6": {
      id: "6",
      title: "La grille des Citernes",
      kind: "combat",
      setting:
        "Une place de la Basse-Ville, de verre et de lampadaires à Cristal",
      beats: [
        stage(
          "Une place de la Basse-Ville, entre des façades de verre épais. Des marches mènent à une terrasse centrale. À l'est, un canal immobile : l'entrée des Citernes. Des lampadaires à Cristal éclairent la place, par paires.",
        ),
        hint(
          "Extraire",
          "Briser le Cristal : gain immédiat. Son jumeau s'éteint. Une Lacune s'ouvre.",
        ),
        choice("extraire", [
          opt(
            "briser",
            "Briser un lampadaire : la Lacune arrêtera ceux qui nous suivent.",
            [
              fx(add("cristaux.extraits"), set("lampadaire_brise")),
              stage(
                "Le Cristal se brise dans un son très pur. Quelque part derrière une façade, son jumeau s'éteint. Au pied du lampadaire, le sol se creuse d'un gris sans profondeur. Les passants, derrière les parois, lèvent la tête pour la première fois.",
              ),
              say(
                "lyra",
                "Voilà. On a payé avec l'argent de quelqu'un d'autre.",
              ),
            ],
          ),
          opt("laisser", "Ne toucher à rien.", [
            stage(
              "Les lampadaires brillent, par paires, au-dessus de la Garde qui se déploie.",
            ),
          ]),
        ]),
        stage("La Garde surgit. Brutus n'est pas encore là."),
        citernesBeat(),
        when(is("defaite"), [
          stage(
            "Les hallebardes se resserrent, le Sonneur lève son diapason, et le monde ralentit : le héros est figé, debout, les pieds dans le verre. Lyra III ne dit rien. Elle pose les deux mains sur lui, pâlit, et brise le lampadaire le plus proche : la Lacune s'ouvre entre eux et la Garde, et l'entraîne, lui, tout entier, dans l'eau des Citernes.",
          ),
          say(
            "lyra",
            "Je l'ai cassé. Pour toi. Ne me demande pas de dire que c'est bien.",
          ),
          fx(set("defaite", false)),
        ]),
        when(is("habitants.reponses"), [
          stage("Bilan : vous avez répondu à leur place."),
        ]),
        when(gte("questions_rouvertes", 3), [
          stage(
            "Bilan : rouvrir une question chez trois habitants avant de fuir, c'est fait.",
          ),
        ]),
      ],
      next: "7",
    },

    // ── 7 ──
    "7": {
      id: "7",
      title: "Sous la ville",
      kind: "fin",
      setting: "Les Citernes",
      beats: [
        stage(
          "Les Citernes. Une eau noire, parfaitement immobile, sous des voûtes de verre où filtre un jour bleuâtre. Pas une ride.",
        ),
        when(
          any(
            is("ile_sauvee", "sauge"),
            all(
              is("ile_sauvee", "strates"),
              atLeast("confiance.eva", "confiance.squalor"),
            ),
          ),
          [
            say(
              "eva",
              "Statistiquement, je n'avais aucune raison de faire ça. J'adore.",
            ),
            fx(join("eva")),
          ],
          [
            when(not(is("ile_sauvee", "aucune")), [
              say(
                "squalor",
                "Ici, au moins, on peut parler. L'eau ne rapporte pas.",
              ),
              fx(join("squalor")),
            ]),
          ],
        ),
        say(
          "lyra",
          "Demain, ils vont afficher ton signalement partout. Il faut quelqu'un qui sache ce qu'ils savent sur toi. Il y a un rédacteur, à la Tour du Registre. C'est lui qui a écrit sur toi. On dit qu'il ne dort jamais, et qu'il se corrige même en parlant.",
        ),
        stage(
          "Extrait des archives — Ordre de service n° 312-0418. « L'anomalie s'est soustraite à son relevé. Le carnet n'a pas été saisi.",
        ),
        when(
          is("questions_rouvertes", 0),
          [stage("Aucun incident à signaler. »")],
          [
            when(
              is("questions_rouvertes", 1),
              [
                stage(
                  "Un habitant de la Basse-Ville a été vu debout à sa fenêtre après le couvre-feu, ce qui ne s'était pas produit depuis l'an 201. Il sera réévalué. »",
                ),
              ],
              [
                when(
                  is("questions_rouvertes", 2),
                  [
                    stage(
                      "Deux habitants de la Basse-Ville ont été vus debout à leur fenêtre après le couvre-feu, ce qui ne s'était pas produit depuis l'an 201. Ils seront réévalués. »",
                    ),
                  ],
                  [
                    stage(
                      "Trois habitants de la Basse-Ville ont été vus debout à leur fenêtre après le couvre-feu, ce qui ne s'était pas produit depuis l'an 201. Ils seront réévalués. »",
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
        fx(give("habit:manteau-de-depoli")),
        stage(
          "Habit : Manteau de dépoli. Un manteau gris coupé dans la toile qui sert à doubler les vitres opaques : on y voit mal au travers. +1 Vitesse.",
        ),
        when(is("voix_qui_demande"), [
          fx(give("trait:voix-qui-demande")),
          stage(
            "Trait : Voix qui demande. Une façon de poser les questions qui donne envie d'y répondre.",
          ),
        ]),
        go("$end"),
      ],
    },
  },
}

// Silence the unused import of `redirect`: the habitants are heard once each.
void redirect
