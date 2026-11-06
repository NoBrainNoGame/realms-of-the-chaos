import {
  add,
  all,
  any,
  around,
  choice,
  fx,
  give,
  go,
  hub,
  is,
  not,
  opt,
  say,
  set,
  stage,
  topic,
  when,
} from "../dsl"
import type { Chapter, Cond, FightReport, FightSpec } from "../types"
import { END } from "../types"
import {
  BRUTUS4,
  EVA4,
  GIANT,
  GUETTEUR,
  kitOf,
  LYRA4,
  lacuneBoard,
  UNSTABLE,
  WILL,
} from "./era4kit"

// ─── Combat : Les ancrages ──────────────────────────────────────────────────

// The three anchors (A) are stone on height-2 rocks; the Superposition layer
// (?) is not terrain, so it is plain ground here.
const { board: CUVETTE, silent: CUVETTE_X } = lacuneBoard([
  ".22.....2.",
  ".22......2",
  "..........",
  ".?xxxxxx?.".replaceAll("?", "."),
  ".?xx..xx?.".replaceAll("?", "."),
  ".?xxxxxx?.".replaceAll("?", "."),
  "..........",
  ".22....22.",
  "A22.......".replace("A", "."),
])

/** A stone anchor: a neutral hit-point sponge with no real action. */
const ANCRAGE = kitOf(
  "brutus",
  "ancrage",
  "Ancrage",
  "Pierre",
  { health: 5, speed: 1 },
  ["kick"],
)

const anchorsAlive = (r: FightReport) =>
  r.fighters.filter((f) => f.preset === ANCRAGE.id && f.hp > 0).length
const nbInfluences = (r: FightReport) =>
  Object.values(r.divineUsed).reduce((a, b) => a + b, 0)
const evaAlive = (r: FightReport) =>
  r.fighters.some((f) => f.preset === EVA4.id && f.hp > 0)

const ancrages: FightSpec = {
  id: "ch22-ancrages",
  title: "Les ancrages",
  goal: "Garde au moins deux ancrages jusqu'au tour 8. Ce qui clignote entre deux cases n'est pas encore quelque part : laisse Eva IV choisir sa cible.",
  board: CUVETTE,
  teams: [
    {
      name: "Alliés",
      side: "allies",
      fighters: [
        { preset: "@hero", at: { x: 4, y: 6 } },
        { preset: EVA4, autonomy: WILL.eva, at: { x: 5, y: 6 } },
        { preset: BRUTUS4, autonomy: WILL.brutus, at: { x: 2, y: 7 } },
        { preset: LYRA4, autonomy: WILL.lyra, at: { x: 3, y: 6 } },
        { preset: "gorr", at: { x: 6, y: 6 }, autonomy: WILL.gorr },
        // SIMPLIFIED: the two Guetteurs of Nyx IV defend the anchor of Sel as
        // allies (the engine has one allied team); they take no orders in the
        // doc, here the player moves them.
        { preset: GUETTEUR, at: { x: 7, y: 6 } },
        { preset: GUETTEUR, at: { x: 8, y: 6 } },
      ],
    },
    {
      name: "Les Lacunaires",
      side: "enemies",
      fighters: [
        // SIMPLIFIED: no Superposition (two states, probabilities, fixing on
        // contact): the unstable ones stand in the bowl and the engine fights
        // them as ordinary enemies. The giant, due on turn 4, starts at the
        // centre.
        { preset: UNSTABLE, at: { x: 3, y: 3 } },
        { preset: UNSTABLE, at: { x: 6, y: 3 } },
        { preset: UNSTABLE, at: { x: 3, y: 5 } },
        { preset: UNSTABLE, at: { x: 6, y: 5 } },
        {
          preset: {
            ...UNSTABLE,
            id: "lacunaire_dedouble",
            name: "Lacunaire dédoublé",
          },
          at: { x: 4, y: 3 },
        },
        {
          preset: {
            ...UNSTABLE,
            id: "lacunaire_dedouble",
            name: "Lacunaire dédoublé",
          },
          at: { x: 5, y: 5 },
        },
        { preset: GIANT, at: { x: 4, y: 4 } },
      ],
    },
    {
      name: "Les ancrages",
      side: "neutral",
      fighters: [
        { preset: ANCRAGE, at: { x: 2, y: 0 } },
        { preset: ANCRAGE, at: { x: 8, y: 7 } },
        { preset: ANCRAGE, at: { x: 1, y: 8 } },
      ],
    },
  ],
  rules: {
    silent: CUVETTE_X,
    silentDamage: 1,
    neutral: [2],
    clock: { period: 1, limit: 8, winner: 0 },
    announce: true,
  },
  influences: ["earthquake", "timeWarp", "blessing"],
  startEnergy: 3,
  defeat: [set("defaite"), add("usure"), add("confiance", -1)],
  objectives: [
    {
      id: "deux-ancrages",
      mark: "◆",
      label: "Garder au moins deux ancrages",
      check: (r) => anchorsAlive(r) >= 2,
      failure: "Deux ancrages sont tombés : le village penche.",
      onFailure: [set("defaite"), add("usure")],
    },
    {
      id: "viser-sans-savoir",
      mark: "★",
      label:
        "Viser sans savoir : Eva IV tire d'elle-même sur ce qui n'est pas encore quelque part",
      // SIMPLIFIED: no Superposition and no log of her shots; Eva IV standing
      // at the end, with the village held, stands for "she shot without being
      // forced". The scene cancels it if the hero forced her (eva_forcee) or
      // never lifted R4-eva (r4_eva_levee).
      check: (r) =>
        r.result !== "defeat" && evaAlive(r) && anchorsAlive(r) >= 2,
      success: "Eva IV a tiré sans savoir. La flèche est à elle.",
      failure: "Eva IV n'a pas tiré au hasard.",
      onSuccess: [
        set("tir_hasard_compris"),
        set("carnet.Q22", "repondue"),
        add("confiance.eva", 2),
      ],
    },
    {
      id: "trois-ancrages",
      mark: "◆",
      label: "Garder les trois ancrages",
      check: (r) => anchorsAlive(r) === 3,
      onSuccess: [add("confiance.nyx"), set("ancrages_intacts")],
    },
    {
      id: "aucune-influence",
      mark: "◆",
      label: "Ne fixer aucun Lacunaire par une Influence",
      check: (r) => nbInfluences(r) === 0,
      onSuccess: [add("confiance.merlin")],
    },
  ],
  lines: [
    {
      when: "start",
      who: "eva",
      text: "Je tire sur ce qui est à un endroit. Le reste, débrouillez-vous.",
    },
    {
      when: "tick:1",
      who: "lyra",
      text: "Celui-là clignote. Ne marchez pas dessus avant que je sois prête.",
    },
    {
      when: "tick:3",
      who: "gorr",
      text: "Gorr marche dessus. Gorr fixe. Gorr est un pas.",
    },
    {
      when: "tick:3",
      who: "brutus",
      text: "Je garde l'ancrage. Peu importe où il tombe, il tombera sur moi.",
    },
    { when: "tick:5", who: "eva", text: "Je ne sais pas. Je tire quand même." },
    {
      when: "end",
      who: "eva",
      text: "… Voilà. Il est quelque part, maintenant.",
    },
  ],
}

// ─── Island ─────────────────────────────────────────────────────────────────

const ISLAND = [
  "...........",
  ".1.......2.",
  "...........",
  "....aa.....",
  "...........",
  ".2.....2...",
  "...........",
  "...1.....1.",
  "...........",
]
const zone = (x: number, y: number) => around(ISLAND, x, y)

const stayed = (l: string): Cond =>
  any(is(`depart.${l}`, "aucun"), is(`depart.${l}`, "retenu"))
const evaLent = any(is("depart.eva", "paix"), is("depart.eva", "rupture"))

// ─── Chapter ────────────────────────────────────────────────────────────────

export const ch22: Chapter = {
  id: "22",
  era: 4,
  number: 22,
  title: "Viser sans savoir",
  quote: {
    who: "nyx",
    text: "Eva dit qu'un tir n'est ni écrit d'avance ni jeté au hasard. Qu'il reste celle qui vise. Je ne sais pas encore quoi faire de cette phrase. Je la grave pour ne pas l'oublier.",
  },
  place: "Sous Corde-Basse, la cuvette et ses trois ancrages",
  question: {
    id: "Q22",
    text: "Si tout est déterminé, viser est-il un choix ?",
  },
  start: "1",
  exploration: {
    island: ISLAND,
    start: { x: 0, y: 3 },
    companions: ["gorr", "brutus", "lyra", "eva"],
    influences: ["earthquake", "timeWarp", "blessing"],
    encounters: [
      {
        id: "e1",
        label: "Le registre d'Eva IV",
        scene: "1",
        at: { x: 2, y: 3 },
        zone: zone(2, 3),
      },
      {
        id: "e2",
        label: "Les ancrages, sous Corde-Basse",
        scene: "2",
        at: { x: 5, y: 5 },
        zone: zone(5, 5),
      },
      {
        id: "e3",
        label: "La plateforme d'ancrage, le soir",
        scene: "3",
        at: { x: 8, y: 6 },
        zone: zone(8, 6),
      },
      {
        id: "e4",
        label: "La huitième ardoise",
        scene: "4",
        at: { x: 9, y: 2 },
        zone: zone(9, 2),
      },
      {
        id: "cible",
        label: "Une cible peinte sur une planche",
        at: { x: 1, y: 6 },
        examine: {
          lines: [
            {
              style: "stage",
              text: "Une planche de bois couverte de flèches : un cercle, toujours le même, touché à chaque fois en son centre. Des siècles de tirs sûrs. Une seule flèche, au bord, loin du centre, n'a pas été retirée.",
            },
          ],
          effects: [{ add: "ecoute", by: 1 }],
        },
      },
      {
        id: "cuvette",
        label: "Le bord de la cuvette",
        at: { x: 3, y: 1 },
        examine: {
          lines: [
            {
              text: "Les Lacunaires clignotent entre deux positions : le contour est à deux endroits à la fois, et à aucun des deux. Rien d'invisible n'y attend un coup de flèche : le résultat n'existe qu'au moment du contact.",
            },
          ],
          effects: [{ add: "ecoute", by: 1 }],
        },
      },
      {
        id: "corde",
        label: "Une corde d'ancrage détendue",
        at: { x: 9, y: 8 },
        obstacle: {
          influence: "earthquake",
          before: [
            {
              style: "stage",
              text: "Une corde d'ancrage pend, détendue. Le village balance plus qu'il ne devrait.",
            },
          ],
          after: [
            {
              style: "stage",
              text: "Le sol tressaille ; la corde se tend et le village reprend son assise.",
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
      title: "Le registre",
      kind: "rencontre",
      setting: "Corde-Basse, à l'aube",
      beats: [
        stage(
          "Corde-Basse, à l'aube. Le village oscille plus que d'habitude. En dessous, dans la cuvette grise, des formes bougent : ou plutôt, elles sont à deux endroits à la fois, et ni à l'un ni à l'autre. Leur contour clignote entre deux positions, comme une image mal réglée.",
        ),
        when(evaLent, [
          stage(
            "Un Délié descend la corde avec Eva IV. Elle a un nouveau fil de lisière au poignet. Elle ne regarde pas le héros d'abord.",
          ),
          say(
            "eva",
            "Nyx m'envoie. Elle dit que tu es le seul à ramener du Tissu là où tu marches, et que ça peut servir, pour une fois. Je ne suis pas revenue. Je suis prêtée.",
          ),
          say(
            "nyx",
            "Les ancrages tiennent le village. Si deux tombent, il tombe. Sel dort dans la maison du troisième.",
          ),
        ]),
        stage("Eva IV ouvre le registre de sa lignée sur ses genoux."),
        say(
          "eva",
          "Quatre siècles de tirs. Pas un raté. Tu sais pourquoi ? Parce qu'on ne tire que quand on sait. Angle, vent, distance, masse de la flèche. Tout se calcule. Le monde est une équation. Si on a les termes, on a le résultat.",
        ),
        say(
          "eva",
          "Les Déliés disent que tout est écrit, que ton Ghom l'écrit. Ma lignée disait la même chose sans le Ghom : tout est écrit, et nous, on lit vite.",
        ),
        say(
          "eva",
          "Ces choses-là, je ne peux pas les lire. Elles ne sont pas cachées. Elles ne sont pas encore quelque part.",
        ),
        stage("Le Carnet s'ouvre."),
        fx(set("carnet.Q22", "ouverte")),
        stage("Q22 : « Si tout est déterminé, viser est-il un choix ? » (Eva)"),
        choice("q22", [
          opt("pas-tirer", "« Alors ne tire pas sur elles. »", [
            say("eva", "C'est ce que je comptais faire."),
          ]),
          opt("de", "« Et si ton tir décidait où elles sont ? »", [
            fx(add("confiance.eva")),
            say(
              "eva",
              "Alors je ne tirerais pas sur une cible. Je jetterais un dé avec une flèche.",
            ),
          ]),
          opt("peur", "« Tu as peur de rater. »", [
            fx(add("confiance.eva")),
            say(
              "eva",
              "… J'ai peur de ne plus savoir ce que je suis si je rate. C'est différent. Un peu.",
            ),
          ]),
        ]),
        go("2"),
      ],
    },

    // ── 2 ──
    "2": {
      id: "2",
      title: "Les ancrages",
      kind: "combat",
      setting: "La cuvette sous Corde-Basse, 10 × 9",
      beats: [
        stage(
          "Trois ancrages de pierre, sur des rochers, tiennent le village au-dessus du vide. Entre eux, la cuvette de Lacune, et la nuée qui monte.",
        ),
        stage(
          "Plus bas, quelque chose de très grand clignote entre l'ancrage du puits et celui de Sel : le Lacunaire géant montera au quatrième tour.",
        ),
        say(
          "eva",
          "Cinquante-cinq. Quarante-cinq. Si je tire sur le côté de Sel et qu'il se fixe de l'autre côté, il casse l'autre ancrage. Si je ne tire pas…",
        ),
        // The pause of turn 4 in the doc, taken before the fight starts.
        choice("tir-sel", [
          opt("ordre", "« Tire. Sur celui de Sel. »", [
            say(
              "eva",
              "Soixante-quarante, ce n'est pas une cible. C'est une opinion.",
            ),
            choice("ordre-suite", [
              opt("respecter", "Respecter son refus.", []),
              opt("insister", "Insister.", [
                fx(
                  set("eva_forcee"),
                  add("confiance.eva", -2),
                  add("autonomie.insistances"),
                ),
                say("eva", "… Très bien. Mais ce ne sera pas mon tir."),
              ]),
            ]),
          ]),
          opt("choisis", "« C'est toi qui choisis ce que tu protèges. »", [
            fx(set("r4_eva_levee"), add("confiance.eva")),
            say("eva", "Alors je choisis."),
          ]),
          opt("personne", "« Personne ne peut savoir. Même pas le Ghom. »", [
            fx(set("r4_eva_levee")),
            say("eva", "Même pas lui. Bon. Alors on est à égalité."),
          ]),
          opt("rien", "Ne rien dire.", []),
        ]),
        { t: "fight", fight: ancrages },
        when(is("defaite"), [
          stage(
            "Deux ancrages cèdent. La maison de Sel penche ; les Guetteurs sortent la petite à temps, aucune Dispersion, mais le village pend de travers.",
          ),
          say(
            "nyx",
            "Elle est sauve. La maison, tant pis. On en tresse une autre.",
          ),
          fx(set("defaite", false)),
        ]),
        // The star only counts if Eva was free: neither forced, nor held by
        // her own rule.
        when(any(is("eva_forcee"), not(is("r4_eva_levee"))), [
          fx(set("tir_hasard_compris", false)),
          when(is("carnet.Q22", "repondue"), [
            fx(set("carnet.Q22", "ouverte")),
          ]),
        ]),
        go("3"),
      ],
    },

    // ── 3 ──
    "3": {
      id: "3",
      title: "La cible",
      kind: "veillee",
      setting: "Le soir, sur la plateforme d'ancrage",
      beats: [
        stage(
          "Le soir, sur la plateforme d'ancrage. Eva IV tient une flèche qu'elle n'a pas tirée, ou le bout de corde de la flèche qu'elle a tirée. Le registre est ouvert à une page blanche.",
        ),
        when(
          is("tir_hasard_compris"),
          [
            say(
              "eva",
              "Je l'ai touché, ou je l'ai fixé de l'autre côté : je ne le savais pas avant, et je ne pouvais pas le savoir. C'est la première flèche de ma vie que je n'ai pas lue avant. Elle est à moi quand même. Plus que les autres, peut-être.",
            ),
          ],
          [
            when(
              is("eva_forcee"),
              [
                say(
                  "eva",
                  "Ce n'était pas mon tir. C'était ton Ghom qui tirait avec mes mains. Je ne sais toujours pas ce que je ferais.",
                ),
              ],
              [
                say(
                  "eva",
                  "Je n'ai pas tiré. Le village a tenu sans moi. Je ne sais pas si j'ai bien fait. Je sais que je n'ai pas choisi : j'ai attendu de savoir, et on ne savait pas.",
                ),
              ],
            ),
          ],
        ),
        when(
          is("merlin_convaincu"),
          [
            say(
              "merlin",
              "Je vais te dire ce que mon ordre a mesuré, et pas un mot de plus. Il n'y a pas, dans ces créatures, de position cachée, toute prête, qui attendrait ta flèche. On a cherché, on a fait les expériences : les corrélations qu'on mesure sont plus fortes que ce que permettrait n'importe quelle valeur cachée de ce genre. Le résultat n'est écrit nulle part avant le contact. Personne, aucun calcul, aucun Ghom ne peut le prévoir d'ici.",
            ),
            say(
              "merlin",
              "Certains de mes confrères pensent que toutes les issues se réalisent, chacune dans une branche du monde, et que nous n'en vivons qu'une. Peut-être. Même s'ils ont raison, tu ne sauras jamais d'avance dans laquelle tu te trouveras.",
            ),
          ],
          [
            say(
              "tarn",
              "Je disais que tout est écrit. Pour ça, j'avais tort : là-dessous, il y a des choses que personne n'a écrites. Ça ne me rend pas plus libre. Un dé n'est pas libre.",
            ),
          ],
        ),
        when(
          is("tir_hasard_compris"),
          [
            say("eva", "Voilà. C'est ça."),
            say(
              "eva",
              "Si tout était écrit, mon tir ne serait pas à moi. Si tout était hasard, il ne serait pas à moi non plus : un dé ne choisit rien. Ce qui est à moi, c'est la cible. Pourquoi celle-là. Ce que je veux protéger, ce que je refuse de toucher. Le monde décide où la flèche arrive. Moi, je décide sur quoi je tire.",
            ),
            stage(
              "Q22 : « Si tout est déterminé, viser est-il un choix ? » Réponse trouvée. Tout n'est pas déterminé : le hasard du monde est réel, aucune valeur cachée ne l'écrit d'avance. Mais le hasard ne fait pas la liberté. C'est Eva qui choisit ce qu'elle vise.",
            ),
          ],
          [
            stage(
              "Q22 reste ouverte. Eva IV garde sa règle, et son arc se résoudra plus tard, face à son Double.",
            ),
          ],
        ),
        choice("reponse", [
          opt("moi", "« Et moi, est-ce que je choisis ? »", [
            say(
              "tarn",
              "Ça, c'est la question de Tarn, et elle n'est pas réglée. Ce qu'Eva a trouvé ne la règle pas. Ça la déplace.",
            ),
          ]),
          opt("archere", "« Tu es toujours une Archère. »", [
            fx(add("confiance.eva")),
            say(
              "eva",
              "Je suis une Archère qui ne lit pas tout. Il faudra une nouvelle page au registre.",
            ),
          ]),
          opt("carnet", "Lui tendre le Carnet, ouvert à Q22.", [
            fx(add("confiance.eva")),
            stage(
              "Eva IV écrit une ligne sous la question, de sa main. Elle n'efface rien.",
            ),
          ]),
        ]),
        hub("ecoutes", [
          topic(
            "lyra",
            "Écouter Lyra IV.",
            [
              say(
                "lyra",
                "Moi, je ne vise pas. Je choisis qui je soigne. C'est peut-être la même chose.",
              ),
              fx(add("confiance.lyra")),
            ],
            { if: stayed("lyra") },
          ),
          topic(
            "brutus",
            "Écouter Brutus IV.",
            [
              say(
                "brutus",
                "Je n'aime pas qu'on ne sache pas. Mais j'ai vu la petite dormir pendant tout le combat. Il fallait bien que quelqu'un tire.",
              ),
              fx(add("confiance.brutus")),
            ],
            { if: stayed("brutus") },
          ),
          topic(
            "gorr",
            "Rester près de Gorr.",
            [
              say(
                "gorr",
                "Gorr frappe toujours là où Gorr frappe. Gorr ne savait pas qu'on pouvait frapper sans savoir. Gorr ne veut pas. Gorr veut savoir pourquoi Gorr ne veut pas.",
              ),
              fx(add("confiance.gorr")),
            ],
            { if: all(is("gorr_question"), stayed("gorr")) },
          ),
          topic("feu", "Regarder la corde se balancer.", [
            stage(
              "Le village oscille, doucement, au bout de ses trois ancrages.",
            ),
          ]),
        ]),
        go("4"),
      ],
    },

    // ── 4 ──
    "4": {
      id: "4",
      title: "La huitième ardoise",
      kind: "fin",
      setting: "Haut-Pendant, la nuit",
      beats: [
        stage(
          "Un Guetteur qui l'a vue rapporte la phrase d'Eva à Haut-Pendant. La nuit même, une huitième ardoise est clouée au poteau du manifeste, d'une écriture plus serrée que les autres.",
        ),
        fx(give("habit:gant-de-l-archere")),
        stage(
          "Eva IV laisse au héros son gant d'arc, usé au pouce par quatre siècles de corde. Elle en a un autre.",
        ),
        when(is("carnet.Q22", "repondue"), [
          fx(give("objet:la-page-blanche")),
          stage("La ligne qu'Eva IV a écrite sous Q22 reste dans le Carnet."),
        ]),
        when(
          evaLent,
          [
            say("eva", "Je rentre chez les Déliés. Je l'avais dit : prêtée."),
            stage("Un temps."),
            say(
              "eva",
              "Mais je tirerai pour toi, si tu me le demandes. Pas si tu me l'ordonnes. Demande.",
            ),
            when(is("carnet.Q22", "repondue"), [fx(add("confiance.eva"))]),
          ],
          [
            say(
              "eva",
              "Demain, ils veulent te montrer quelque chose, dans les cristaux sous Haut-Pendant. Merlin dit que c'est plus grave que tout le reste. Il dit « grave » comme on dit « intéressant ».",
            ),
          ],
        ),
        go(END),
      ],
    },
  },
}
