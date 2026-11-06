import { CHARACTERS, type CharacterPreset } from "@realms/engine"
import {
  add,
  all,
  any,
  around,
  choice,
  fx,
  give,
  go,
  gte,
  is,
  isnt,
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
  type FightReport,
  type FightSpec,
  type FightTeamSpec,
  type ObjectiveSpec,
} from "../types"

// ─── Presets ────────────────────────────────────────────────────────────────

function kitOf(base: string, id: string, name: string, title: string) {
  const preset = CHARACTERS[base]
  if (!preset) throw new Error(`Unknown preset "${base}"`)
  const copy: CharacterPreset = { ...preset, id, name, title, kit: base }
  return copy
}

/** The giant Lacunaire: 30 HP, speed 2, energetic attack 7, defences 5. */
const GIANT: CharacterPreset = {
  id: "lacunaire_geant",
  name: "Lacunaire géant",
  title: "Lacunaire",
  affinity: "shadow",
  stats: {
    health: 4.3,
    speed: 2,
    physicalAttack: 1,
    physicalDefense: 5,
    magicalAttack: 7,
    magicalDefense: 5,
    luck: 1,
  },
  actions: ["frost", "kick"],
}
const UNSTABLE: CharacterPreset = {
  id: "lacunaire_instable",
  name: "Lacunaire instable",
  title: "Lacunaire",
  affinity: "shadow",
  stats: {
    health: 1.6,
    speed: 5,
    physicalAttack: 3,
    physicalDefense: 2,
    magicalAttack: 4,
    magicalDefense: 2,
    luck: 1,
  },
  actions: ["kick"],
}
const OMBRE = kitOf("nyx", "ombre_derive", "Ombre de la Dérive", "Ombre")
const VESCE = kitOf("nyx", "vesce", "Vesce", "Ombre")
const ANCIENS = [
  kitOf("nyx", "ancien_nyx", "Écho d'autrefois", "Ombre"),
  kitOf("merlin", "ancien_merlin", "Écho d'autrefois", "Thermiste"),
  kitOf("brutus", "ancien_brutus", "Écho d'autrefois", "Guerrier"),
  kitOf("lyra", "ancien_lyra", "Écho d'autrefois", "Soigneuse"),
]

// ─── Archive : Le dernier pli (reconstitution) ──────────────────────────────

const zone = (id: string, x0: number, y0: number, x1: number, y1: number) => ({
  id,
  cells: Array.from({ length: (x1 - x0 + 1) * (y1 - y0 + 1) }, (_, i) => ({
    x: x0 + (i % (x1 - x0 + 1)),
    y: y0 + Math.floor(i / (x1 - x0 + 1)),
  })),
})

const lastFold: FightSpec = {
  id: "ch6-dernier-pli",
  title: "Le dernier pli",
  goal: "Ne pas réécrire : rester fidèle aux traces. Laisse les zones se taire, ne les retiens pas.",
  board: Array.from({ length: 9 }, () => "........."),
  teams: [
    {
      name: "Échos d'autrefois",
      side: "allies",
      fighters: ANCIENS.map(
        (p, i): FighterSpec => ({
          preset: p,
          at: [
            { x: 3, y: 4 },
            { x: 4, y: 3 },
            { x: 4, y: 5 },
            { x: 5, y: 4 },
          ][i],
        }),
      ),
    },
    {
      name: "Lacunaires instables",
      side: "enemies",
      // SIMPLIFIED: the unstable Lacunaires should be born in the silent zones
      // from turn 3; the engine cannot spawn, so two wait in the corners.
      fighters: [
        { preset: UNSTABLE, at: { x: 0, y: 0 } },
        { preset: UNSTABLE, at: { x: 8, y: 8 } },
      ],
    },
  ],
  rules: {
    // SIMPLIFIED: the Frange timeline (the "lentille" relaxing, the "pli" of
    // turn 1) is only a clock here; the zones are the three living places.
    clock: { period: 1, limit: 6, winner: 0 },
    zones: [
      zone("champ", 0, 0, 2, 2),
      zone("hameau", 6, 0, 8, 2),
      zone("source", 3, 6, 5, 8),
    ],
    zoneTeams: [0],
    announce: true,
  },
  influences: [],
  startEnergy: 0,
  defeat: [set("defaite"), add("confiance.nerea", -1)],
  objectives: [
    {
      id: "ne-pas-reecrire",
      mark: "★",
      label: "Ne pas réécrire : au moins deux zones silencieuses ou perdues",
      // SIMPLIFIED: only the zones are scored; "all four Echos on the east
      // edge at turn 6" and the "failure by excess" retry are CUT.
      check: (r: FightReport) =>
        r.result !== "defeat" &&
        Object.values(r.zoneStates).filter((s) => s !== "active").length >= 2,
      success: "Les traces concordent : tu n'as rien réécrit.",
      failure: "L'image se fissure : les couches ne disent pas ça.",
    },
  ],
  lines: [
    { when: "start", who: "nerea", text: "Un pli. Cent couches. Un pli." },
    { when: "tick:1", who: "nerea", text: "Ici, le pli manque." },
    {
      when: "tick:3",
      who: "nerea",
      text: "Laisse-les partir, ne les retiens pas : la vase dit qu'ils sont partis.",
    },
    {
      when: "end",
      who: "nerea",
      text: "Plus de pollen. Rien. Rien. … Là. Une graine.",
    },
  ],
}

// ─── Combat : La Lacune géante ──────────────────────────────────────────────

const BOARD = [
  "...........",
  "..1.....12.",
  ".~~..a..122",
  ".~..aaa..12",
  "....aba....",
  ".1..aaa..12",
  "....~a..122",
  "..1.....12.",
  "...........",
]
const LACUNE = [
  { x: 5, y: 2 },
  { x: 4, y: 3 },
  { x: 5, y: 3 },
  { x: 6, y: 3 },
  { x: 4, y: 4 },
  { x: 5, y: 4 },
  { x: 6, y: 4 },
  { x: 4, y: 5 },
  { x: 5, y: 5 },
  { x: 6, y: 5 },
  { x: 5, y: 6 },
]

type NyxMode = "none" | "refuse" | "accept"
type VesceMode = "none" | "fuie" | "rendue"

const giantOf = (r: FightReport) =>
  r.fighters.find((f) => f.preset === GIANT.id)
const giantGone = (r: FightReport) => (giantOf(r)?.hp ?? 1) <= 0

function giantFight(nyx: NyxMode, vesce: VesceMode, fewer: boolean): FightSpec {
  const derive: FighterSpec[] = [
    { preset: "merlin", at: { x: 9, y: 4 } },
    { preset: OMBRE, at: { x: 9, y: 2 } },
    { preset: OMBRE, at: { x: 9, y: 6 } },
  ]
  if (vesce === "fuie") derive.push({ preset: VESCE, at: { x: 8, y: 4 } })
  // lacunaires.epargnes >= 4: only one unstable Lacunaire instead of two.
  const lacunaires: FighterSpec[] = [
    { preset: GIANT, at: { x: 5, y: 4 }, hp: 30 },
    { preset: UNSTABLE, at: { x: 4, y: 5 } },
  ]
  if (!fewer) lacunaires.push({ preset: UNSTABLE, at: { x: 6, y: 3 } })
  const neutral: FighterSpec[] = []
  if (nyx !== "none") neutral.push({ preset: "nyx", at: { x: 5, y: 2 } })
  if (vesce === "rendue") neutral.push({ preset: VESCE, at: { x: 8, y: 4 } })

  const teams: FightTeamSpec[] = [
    {
      name: "Alliés",
      side: "allies",
      fighters: [
        { preset: "@hero", at: { x: 1, y: 4 } },
        { preset: "lyra", at: { x: 1, y: 3 } },
        { preset: "brutus", at: { x: 2, y: 5 } },
        { preset: "nerea", at: { x: 2, y: 2 } },
      ],
    },
    { name: "La Dérive", side: "enemies", fighters: derive },
    { name: "Les Lacunaires", side: "enemies", fighters: lacunaires },
  ]
  if (neutral.length)
    teams.push({ name: "Neutres", side: "neutral", fighters: neutral })

  const objectives: ObjectiveSpec[] = [
    {
      // Hidden detector of the issue "Recousue" (listed first: A overrides it).
      id: "recoudre",
      mark: "◆",
      label: "Recoudre la Lacune",
      // SIMPLIFIED: the report has no cell data. "Held the heart for 3 turns
      // and Réparation twice" is read as Réparation x2 with the giant gone,
      // or the giant fixed into a rock.
      check: (r) => {
        const g = giantOf(r)
        return (
          giantGone(r) &&
          ((r.divineUsed.blessing ?? 0) >= 2 ||
            (g !== undefined && r.fixed.includes(g.id)))
        )
      },
      onSuccess: [set("lacune_issue", "recousue")],
    },
    {
      id: "habiter",
      mark: "★",
      label: "Habiter la Lacune à deux, au lieu de la combattre",
      // SIMPLIFIED: "two intricated allies held the heart a full turn" is read
      // as two Intrications once the giant has left the heart (it can only be
      // beaten and fixed; the engine has no giant sinking into the Clair).
      check: (r) => giantGone(r) && r.intrications >= 2,
      success: "Deux Échos sur la même case : le gris s'éclaircit.",
      onSuccess: [
        set("lacune_issue", "habitee"),
        set("lacune_geante_habitee"),
        add("confiance"),
      ],
    },
    {
      id: "ghom-ne-touche-pas",
      mark: "◆",
      label: "Le Ghom ne touche pas la Dérive",
      // SIMPLIFIED: no cell or target data in the report, so no Séisme and no
      // Distorsion at all.
      check: (r) =>
        (r.divineUsed.earthquake ?? 0) === 0 &&
        (r.divineUsed.timeWarp ?? 0) === 0,
      onSuccess: [add("confiance.nyx"), add("confiance.merlin")],
    },
  ]
  if (nyx === "accept")
    objectives.push({
      id: "habiter-nyx",
      mark: "◆",
      label: "Habiter avec Nyx",
      // SIMPLIFIED: "the hero joins Nyx's cell then walks to the heart" is read
      // as two Intrications with Nyx still on the map.
      check: (r) => {
        const n = r.fighters.find((f) => f.preset === "nyx")
        return r.intrications >= 2 && !!n && n.hp > 0 && !n.fled
      },
      onSuccess: [
        set("intrication_nyx"),
        add("confiance.nyx", 2),
        set("premier_cristal.paire", "heros+nyx"),
      ],
    })

  return {
    id: `ch6-lacune-geante-${nyx}-${vesce}-${fewer ? "1" : "2"}`,
    title: "La Lacune géante",
    defeat: [set("defaite"), add("usure"), add("confiance", -1)],
    goal: "Tenir jusqu'à midi : faire reculer les Échos de la Dérive, ou tenir une case de la Lacune. Le Lacunaire géant attaque tout ce qui est chaud.",
    board: BOARD,
    teams,
    rules: {
      clock: { period: 1, limit: 8, winner: 0 },
      silent: LACUNE,
      silentDamage: 3,
      flee: {
        team: 1,
        below: 0.3,
        exits: [
          { x: 10, y: 2 },
          { x: 10, y: 4 },
          { x: 10, y: 6 },
        ],
      },
      fixOnDeath: [2],
      ...(neutral.length ? { neutral: [3] } : {}),
      announce: true,
    },
    influences: ["earthquake", "timeWarp", "blessing"],
    startEnergy: 4,
    objectives,
    lines: [
      { when: "start", who: "brutus", text: "Derrière moi." },
      {
        when: "start",
        who: "lyra",
        text: "Non, à côté de toi. On a dit : à deux.",
      },
      {
        when: "tick:3",
        who: "merlin",
        text: "Il ne fait pas de différence, lui.",
      },
      {
        when: "end",
        who: "merlin",
        text: "Midi. Bon. Voyons qui a raison.",
      },
    ],
  }
}

// CUT: the giant's behaviour (targets the hottest Echo of any camp, sinks into
// the Clair under 50 %, ice block that melts), the unstable Lacunaires born on
// the Lacune at turns 2 and 5, Nyx untargetable, Vesce allied AI that never
// attacks the Dérive, Merlin that cannot be dispersed, the energy damage
// exemption of Nyx and of intricated Echos, the moving crystals and the
// "Laisser le géant partir" / "Protéger ceux d'en face" objectives, and the
// Réparation line of Lyra/Merlin: the engine has no such rules or triggers.
function giantFightBeat(): Beat {
  const entries: { cond: Cond; fight: FightSpec }[] = []
  const nyxCond: Record<NyxMode, Cond> = {
    none: not(is("nyx_epargnee")),
    refuse: all(is("nyx_epargnee"), lt("confiance.nyx", 3)),
    accept: all(is("nyx_epargnee"), gte("confiance.nyx", 3)),
  }
  const vesceCond: Record<VesceMode, Cond> = {
    fuie: is("vesce_fuie"),
    rendue: is("vesce_rendue"),
    none: all(not(is("vesce_fuie")), not(is("vesce_rendue"))),
  }
  for (const nyx of ["none", "refuse", "accept"] as const)
    for (const vesce of ["none", "fuie", "rendue"] as const)
      for (const fewer of [false, true])
        entries.push({
          cond: all(
            nyxCond[nyx],
            vesceCond[vesce],
            fewer
              ? gte("lacunaires.epargnes", 4)
              : lt("lacunaires.epargnes", 4),
          ),
          fight: giantFight(nyx, vesce, fewer),
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

// ─── Last words (by Confiance) ──────────────────────────────────────────────

const TRUST = ["lyra", "brutus", "nerea", "nyx", "merlin"] as const

/** `who` has trust >= 4 and at least as much as every rival. */
function highest(who: (typeof TRUST)[number]): Cond {
  const rivals = TRUST.filter((t) => t !== who)
  const above = (rival: string): Cond =>
    any(
      ...Array.from({ length: 11 }, (_, i) => i - 5).map((v) =>
        all(is(`confiance.${who}`, v), lt(`confiance.${rival}`, v + 1)),
      ),
    )
  return all(gte(`confiance.${who}`, 4), ...rivals.map(above))
}

// ─── Chapter ────────────────────────────────────────────────────────────────

// ─── The island (the Lisière and its Lacune, walked) ────────────────────────

// The fight's Lacune (the dry pit in the middle, its heart the deepest cell)
// between the native island (west) and the Dérive (east), with the Lac Sourd.
const ISLAND = [
  "...........",
  "..1.....12.",
  ".~~..a..122",
  ".~..aaa..12",
  "....aba..~~",
  ".1..aaa..12",
  "....~a..122",
  "..1.....12.",
  "...........",
]
const nearby = (x: number, y: number) => around(ISLAND, x, y)

export const ch06: Chapter = {
  id: "6",
  era: 1,
  number: 6,
  title: "Le Premier Cristal",
  quote: {
    who: "heros",
    text: "Ici commence le repos, disait la pierre. Ce n'est pas un repos. Tout continue, là-haut. Plus vite que moi.",
  },
  place: "La Lisière et sa Lacune géante ; le Lac Sourd ; le Puits",
  question: { id: "Q06", text: "Pourquoi quelque chose plutôt que rien ?" },
  start: "1",
  exploration: {
    island: ISLAND,
    start: { x: 0, y: 4 },
    companions: ["lyra", "brutus", "nerea"],
    influences: ["earthquake", "timeWarp", "blessing"],
    encounters: [
      {
        id: "e1",
        label: "L'aube sur le trou",
        scene: "1",
        at: { x: 2, y: 4 },
        zone: nearby(2, 4),
      },
      {
        id: "e2",
        label: "Le Lac Sourd",
        scene: "2",
        at: { x: 8, y: 4 },
        zone: nearby(8, 4),
      },
      {
        id: "e3",
        label: "La rive, au bord de la Lacune",
        scene: "3",
        at: { x: 3, y: 4 },
        zone: nearby(3, 4),
      },
      {
        id: "e4",
        label: "La Lacune géante",
        scene: "4",
        at: { x: 3, y: 4 },
        auto: true,
      },
      {
        id: "e5",
        label: "Ce que devient le trou",
        scene: "5",
        at: { x: 5, y: 3 },
        zone: nearby(5, 3),
      },
      {
        id: "e5b",
        label: "Le trou recousu",
        scene: "5b",
        at: { x: 5, y: 3 },
        zone: nearby(5, 3),
      },
      {
        id: "e5c",
        label: "Le trou élargi",
        scene: "5c",
        at: { x: 5, y: 3 },
        zone: nearby(5, 3),
      },
      {
        id: "e6",
        label: "Le Premier Cristal",
        scene: "6",
        at: { x: 5, y: 4 },
        zone: nearby(5, 4),
      },
      {
        id: "e7",
        label: "La Lisière, la nuit",
        scene: "7",
        at: { x: 2, y: 6 },
        zone: nearby(2, 6),
      },
      {
        id: "e8",
        label: "Le Puits",
        scene: "8",
        at: { x: 5, y: 4 },
        zone: nearby(5, 4),
      },
      {
        id: "cristaux",
        label: "Des cristaux au bord du trou",
        at: { x: 7, y: 2 },
        examine: {
          lines: [
            {
              text: "Sur les bords de la Lacune, les cristaux sont posés par paires, à demi enfoncés dans le sol. Ils luisent un peu plus fort que ceux de la veille, et un peu plus près du centre.",
            },
          ],
          effects: [{ add: "ecoute", by: 1 }],
        },
      },
      {
        id: "gris",
        label: "Le gris du trou",
        at: { x: 3, y: 2 },
        examine: {
          lines: [
            {
              style: "stage",
              text: "Le gris n'a pas de profondeur : on ne sait pas si le fond est à un pas ou à mille. Le sol des deux îles s'y effiloche et s'y mêle, brin par brin.",
            },
          ],
          effects: [{ add: "ecoute", by: 1 }],
        },
      },
      {
        id: "silence",
        label: "Le silence de la Lisière",
        at: { x: 1, y: 0 },
        examine: {
          lines: [
            {
              text: "Plus d'insectes, plus de vent. Ce n'est pas le calme : c'est ce qui reste quand plus rien n'échange avec rien.",
            },
          ],
          effects: [{ add: "ecoute", by: 1 }],
        },
      },
      {
        id: "cristal_pose",
        label: "Un cristal de la rive",
        at: { x: 7, y: 6 },
        obstacle: {
          influence: "earthquake",
          before: [
            {
              style: "stage",
              text: "Un cristal planté au bord du trou, lourd et tranquille. Il ne bouge pas, mais le sol, autour de lui, penche vers le centre.",
            },
          ],
          after: [
            {
              style: "stage",
              text: "Le sol tressaille. Le cristal glisse d'une case vers le cœur du trou, et sa jumelle, là-bas, a glissé en même temps.",
            },
          ],
          effects: [{ add: "ecoute", by: 1 }],
        },
      },
      {
        id: "cristal_fele",
        label: "Un cristal fêlé",
        at: { x: 6, y: 7 },
        obstacle: {
          influence: "blessing",
          before: [
            {
              style: "stage",
              text: "Un cristal fêlé en son milieu, une ligne claire dans le gris. Chaque fois qu'il luit, la fêlure s'allonge d'un cheveu.",
            },
          ],
          after: [
            {
              style: "stage",
              text: "La fêlure se referme sans bruit. Le cristal luit plus net, mais le sol, autour, est un peu plus froid.",
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
      title: "L'aube sur le trou",
      kind: "rencontre",
      setting: "La Lisière, à l'aube",
      beats: [
        stage(
          "La Lacune a grandi pendant la nuit. Elle fait maintenant trois cents pas de large. Au centre, rien de net : un gris sans profondeur, où le sol des deux îles s'effiloche et se mêle. Sur ses bords, les cristaux de la Dérive scintillent par paires, très vite. Dans le gris, une forme énorme et lente se déplace, comme une colline qui hésiterait à être une colline.",
        ),
        stage(
          "Sur l'autre rive, Merlin, et derrière lui quelques Échos de la Dérive, emmitouflés de gris.",
        ),
        when(is("vesce_fuie"), [
          stage("Vesce est là, et elle évite le regard du héros."),
        ]),
        say(
          "merlin",
          "Bonjour, bonjour. Mauvaise nouvelle : il a grandi exactement comme je l'avais prévu. Bonne nouvelle : il a grandi exactement comme je l'avais prévu.",
        ),
        say("brutus", "On va le refermer."),
        say(
          "merlin",
          "Ou on va le laisser faire. Réfléchissez une seconde. S'il s'ouvre, nos îles se séparent. Chacune repart dans le Clair, à son rythme. Vous gardez votre Ghom, qui touche tout. Nous gardons le nôtre, qui ne touche rien. Tout le monde est content.",
        ),
        say("lyra", "Et tout ce qui est sur la Lisière tombe dans le trou."),
        say("merlin", "Il n'y a rien sur la Lisière."),
        stage("Un temps."),
        say("merlin", "Presque rien."),
        when(is("nyx_epargnee"), [
          stage(
            "Dans le gris de la Lacune, à quelques pas du bord, une silhouette accroupie, à peine nette, comme une feuille trop lavée. Nyx. Elle est dedans. Elle ne bouge pas.",
          ),
        ]),
        choice("aube", [
          opt("habiter", "On ne peut pas l'habiter ? Comme Nyx ?", [
            say("lyra", "Seul, tu t'y défais."),
            say("nerea", "À deux, peut-être pas."),
            stage("Elle regarde le héros et Lyra, puis Brutus."),
            say(
              "nerea",
              "Quand vous êtes sur la même case, vous tenez le monde autour de vous. Un peu. Peut-être assez.",
            ),
            // unlocks the announcement of the ★ objective "Habiter la Lacune"
            fx({ unlock: "objective:habiter_lacune" }),
          ]),
          opt("merlin", "Merlin a peut-être raison.", [
            fx(add("confiance.merlin"), add("confiance.brutus", -1)),
            say(
              "brutus",
              "Il a peut-être raison. Et ce qui tombe dans le trou n'a pas son mot à dire.",
            ),
          ]),
        ]),
        say(
          "merlin",
          "Je vous propose ceci : nous nous mettons entre vous et le trou, et nous laissons faire le temps. Vous essayez de passer. Celui qui tient le milieu à midi a raison. C'est peu scientifique, je vous l'accorde, mais c'est rapide.",
        ),
        when(is("archive_derive", "disponible"), [
          say(
            "nerea",
            "Avant midi, je veux lire vos fonds. Vous avez des lacs, dit la petite. Gelés.",
          ),
          say(
            "merlin",
            "Le Lac Sourd, derrière la crête. Gelé depuis toujours.",
          ),
          stage("Il hausse les épaules."),
          say(
            "merlin",
            "Allez-y. Je suis curieux de ce que vous y lirez. Je n'ai jamais su lire la vase.",
          ),
          go("2"),
        ]),
        go("3"),
      ],
    },

    // ── 2 ──
    "2": {
      id: "2",
      title: "Les plis qui s'arrêtent",
      kind: "scene",
      setting: "Le Lac Sourd, sur la Dérive (Archive facultative)",
      beats: [
        stage(
          "Le Lac Sourd, sur la Dérive : une cuvette de glace grise, épaisse, très ancienne.",
        ),
        choice("archive", [
          opt("plonger", "Plonger avec Néréa.", [
            stage(
              "Néréa perce la glace avec son trident. Elle plonge. Le héros l'accompagne, une corde à la taille, dans l'eau la plus froide qu'il ait jamais connue.",
            ),
            fx(
              add("usure"),
              add("archives.lues"),
              set("archive_derive", "lue"),
            ),
            narr(
              "Le froid n'est pas une douleur. C'est un silence qui entre. Mes doigts gris deviennent un peu plus gris. Je le sais déjà, avant de remonter.",
            ),
            stage(
              "Au fond, Néréa gratte la vase, en lève une carotte avec un tube de roseau, la remonte. Sur la berge, à genoux, elle la lit à voix haute, couche après couche, du bas vers le haut.",
            ),
            say(
              "nerea",
              "En bas, comme chez nous : pollen, sable, coquilles. Une île vivante. Mais regarde…",
            ),
            stage("Elle montre de fines lignes ondulées dans la vase."),
            say(
              "nerea",
              "Des plis. Toute la carotte est plissée, régulièrement. Un pli, cent couches, un pli, cent couches. Quelque chose secouait cette île tous les cent ans. Pas un tremblement au hasard : une poussée, régulière, comme on retourne une terre pour qu'elle ne s'endorme pas.",
            ),
            say("nerea", "Et là…"),
            stage("Son doigt s'arrête."),
            say(
              "nerea",
              "Plus de plis. D'un coup. Plus rien ne pousse la terre. Au-dessus : moins de pollen, puis plus du tout. Du gel. De la poussière noire, la même que chez nous. Des centaines de couches de rien.",
            ),
            say(
              "nerea",
              "Et là-haut, tout près de la glace… du pollen. Un peu. Puis plus. Des graines d'herbes que je ne connais pas. Personne n'a recommencé à pousser la terre. Mais la vie est revenue quand même. Toute seule.",
            ),
            stage(
              "Reconstitution jouable : Le dernier pli. Le héros et Néréa rejouent, avec les traces pour seule règle, les dernières saisons de la Dérive avant que les plis s'arrêtent : quatre Échos d'alors, des zones qui se taisent, et dans le ciel, au-dessus de l'île, une lentille d'air courbé qui se relâche peu à peu, puis s'efface.",
            ),
            { t: "fight", fight: lastFold },
            when(is("defaite"), [
              stage(
                "L'image se fissure. Les quatre Échos d'alors vacillent, puis se défont dans la vase. Le héros a voulu retenir un pli qui s'en allait : il a réécrit, et les couches ne disent plus la même chose. Néréa le tire vers la surface par la corde.",
              ),
              say(
                "nerea",
                "Ce n'est pas grave. La carotte, elle, n'a pas bougé. Ce que tu as perdu, c'est ta lecture, pas la vase.",
              ),
              fx(set("defaite", false)),
            ]),
            say(
              "nerea",
              "Je n'ai pas vu de lentille, dans la vase. J'ai vu des plis qui s'arrêtent. La lentille, c'est ce que j'en déduis. Ce qui poussait la terre a arrêté de la pousser. Ce n'est pas un accident : un accident, ça fait un pli de travers. Là, c'est un geste. Quelqu'un a arrêté.",
            ),
            fx(add("ghom_dechu.verite"), give("carotte_lac_sourd")),
            choice("archive_lecture", [
              opt("ghom", "Le Ghom de la Dérive.", [
                say(
                  "nerea",
                  "Peut-être. Les couches ne disent pas de nom. Elles disent : avant, quelqu'un entretenait ; après, personne. Et ensuite, la vie est revenue sans lui.",
                ),
              ]),
              opt("pourquoi", "Pourquoi il aurait arrêté ?", [
                say(
                  "nerea",
                  "Ça, la vase ne le dit pas. Une couche, c'est une trace, pas une raison. Je te l'ai déjà dit.",
                ),
                stage("Un temps."),
                say("nerea", "Mais je voudrais bien le savoir."),
              ]),
            ]),
            go("3"),
          ]),
          opt("refuser", "Pas le temps.", [
            // no effect: the Archive is lost
            go("3"),
          ]),
        ]),
      ],
      next: "3",
    },

    // ── 3 ──
    "3": {
      id: "3",
      title: "Avant",
      kind: "veillee",
      setting: "La rive de l'île natale, au bord de la Lacune",
      beats: [
        stage(
          "Sur la rive de l'île natale, au bord de la Lacune. Pas de feu : il n'y a pas le temps. Chacun vérifie ses armes. Le héros peut parler à un seul compagnon : c'est un moment, pas une soirée.",
        ),
        choice("avant", [
          opt("lyra", "Parler à Lyra.", [
            say(
              "lyra",
              "Si on l'habite, il faudra qu'on soit deux, sur la même case, au milieu, et qu'on y reste. Tu sais ce que ça veut dire ? Qu'on ne pourra pas se sauver l'un sans l'autre.",
            ),
            stage("Un temps."),
            say("lyra", "Ça me va."),
            fx(add("confiance.lyra")),
          ]),
          opt("brutus", "Parler à Brutus.", [
            say(
              "brutus",
              "Hier, j'ai dit qu'il fallait refermer. Aujourd'hui, je ne sais plus. Nyx est dedans. La fille a dormi là. Si on referme, on les enferme ou on les écrase.",
            ),
            stage("Il serre son bouclier."),
            say(
              "brutus",
              "Garder, ce n'est pas rester assis. Mais ce n'est pas tout boucher non plus.",
            ),
            fx(add("confiance.brutus")),
          ]),
          opt("nerea", "Parler à Néréa.", [
            when(
              is("archive_derive", "lue"),
              [
                say(
                  "nerea",
                  "La vie est revenue toute seule sur la Dérive. Sans personne pour pousser la terre. Je ne sais pas si ça me rassure ou si ça me fait peur.",
                ),
              ],
              [
                say(
                  "nerea",
                  "Les cristaux clignotent par deux, comme s'ils se répondaient. Je n'aime pas ce que je ne sais pas lire.",
                ),
              ],
            ),
            fx(add("confiance.nerea")),
          ]),
        ]),
        narr(
          "Ils clignotent par deux, oui. Et quand Lyra s'est tenue près de moi, à l'instant, le plus proche a clignoté plus fort.",
        ),
      ],
      next: "4",
    },

    // ── 4 ──
    "4": {
      id: "4",
      title: "La Lacune géante",
      kind: "combat",
      setting: "La Lisière, de l'aube à midi",
      beats: [
        // default outcome; the objectives overwrite it (Recousue, then Habitée)
        fx(set("lacune_issue", "elargie")),
        giantFightBeat(),
        when(all(is("nyx_epargnee"), lt("confiance.nyx", 3)), [
          stage("Le héros tend la main vers Nyx ; elle recule d'une case."),
          say("nyx", "Non. Pas encore."),
        ]),
        when(is("defaite"), [
          stage(
            "Le Lacunaire géant prend toute la chaleur du cœur. Les Échos tombent, des deux rives, l'un après l'autre : ce n'est pas un ennemi, c'est une faim sans visage, et elle ne choisit pas son camp. Quand elle se détourne enfin, le gris a gagné jusqu'au bord de la rive, et chacun est vivant, mais vidé.",
          ),
          say(
            "lyra",
            "Ça n'a pas voulu nous tuer. Ça a juste eu besoin de nous plus que nous.",
          ),
          fx(set("defaite", false)),
        ]),
      ],
      next: "5",
    },

    // ── 5 : the issue is read from `lacune_issue` ──
    "5": {
      id: "5",
      title: "Ce que devient le trou",
      kind: "lacune",
      setting: "La Lisière, midi",
      beats: [
        stage(
          "Midi. Le combat est fini. Le sort de la Lacune dépend de ce qui s'est passé au cœur.",
        ),
        when(is("lacune_issue", "recousue"), [go("5b")]),
        when(is("lacune_issue", "elargie"), [go("5c")]),
        // Issue A: habited
        fx(
          add("lacunes.habitees"),
          set("lacune_geante_habitee"),
          set("fragments", "fusion"),
          give("fil_couture"),
        ),
        stage(
          "Au cœur, deux Échos sur la même case. Autour d'eux, le gris ne disparaît pas : il s'éclaircit. Le sol redevient un sol sur quelques pas, puis s'arrête de reculer. Ce n'est ni une Lacune ni un pré : une clairière étrange, aux contours flous, où l'on peut tenir à deux et pas seul. Les deux îles, de part et d'autre, ne se séparent pas : elles tiennent l'une à l'autre par cette clairière.",
        ),
        say("lyra", "Ça ne se referme pas. Mais ça tient."),
        stage("Merlin, à genoux au bord, son bâton planté, fasciné."),
        say(
          "merlin",
          "Ça tient à deux. Seul, on s'y défait. À deux, on y tient. Je n'avais jamais mesuré ça. Je… Il faut que je revienne avec des instruments. Beaucoup d'instruments.",
        ),
        when(is("intrication_nyx"), [
          say("nyx", "Une fois. Pour voir."),
          stage("Elle ne lâche pas le bras du héros tout de suite."),
          say("nyx", "C'est lourd, d'être deux."),
          stage("Un temps."),
          say("nyx", "C'est pas désagréable. Ne le répète à personne."),
        ]),
        say(
          "nerea",
          "Une Couture. Pas une cicatrice : une couture. On voit le fil.",
        ),
        stage("Le nom reste : la Lisière devient la Couture."),
        go("6"),
      ],
    },
    "5b": {
      id: "5b",
      title: "Recousue",
      kind: "lacune",
      beats: [
        fx(
          add("lacunes.recousues"),
          set("fragments", "fusion"),
          give("fil_couture"),
        ),
        stage(
          "Le gris recule jusqu'au dernier pas. À sa place, une bande de roche nouvelle, lisse et dure, ni noire ni grise, où rien ne pousse encore. Les deux îles sont soudées.",
        ),
        say("brutus", "Fermé."),
        say("merlin", "Fermé."),
        stage("Il regarde l'autre côté, sa Dérive, qui ne repartira plus."),
        say(
          "merlin",
          "Nous voilà voisins pour toujours. C'est très long, toujours. J'ai mesuré.",
        ),
        when(is("nyx_epargnee"), [
          stage(
            "Nyx est sortie du gris juste avant la fin. Elle regarde la roche neuve, la touche du bout de la botte.",
          ),
          say("nyx", "Il n'y a plus d'endroit où personne ne me touche."),
          stage("Elle s'en va vers la Dérive sans se retourner."),
        ]),
        stage(
          "La Lisière devient la Couture ; ceux de la Dérive disent la Soudure.",
        ),
        go("6"),
      ],
    },
    "5c": {
      id: "5c",
      title: "Élargie",
      kind: "lacune",
      beats: [
        stage(
          "Le gris gagne. Lentement, sans bruit, la Lacune s'étend jusqu'aux deux rives, puis au-delà. Un seul geste est encore possible, avant que les îles ne s'écartent trop.",
        ),
        choice("rattrapage", [
          opt("maintenant", "Lyra. Brutus. Maintenant.", [
            stage(
              "Lyra, Brutus et le héros se jettent au bord de la Lacune et y donnent tout ce qu'ils ont, de la chaleur, du mouvement, des coups de bouclier dans la roche, comme Lyra au bois du nord, en dix fois plus grand.",
            ),
            fx(
              set("lacune_issue", "recousue"),
              add("usure"),
              set("lyra_usure"),
              add("confiance.lyra"),
              add("confiance.brutus"),
            ),
            stage("Lyra garde les deux mains grises."),
            go("5b"),
          ]),
          opt("laisser", "Laisser faire.", [
            fx(
              add("lacunes.elargies"),
              set("fragments", "separation"),
              give("fil_dechirure"),
            ),
            stage(
              "Les deux îles, qui se touchaient, ne se touchent plus : entre elles, il y a de nouveau du Clair, très mince, puis un peu moins mince. Elles s'écartent au pas d'un homme.",
            ),
            say("merlin", "Voilà. Chacun chez soi."),
            stage("Il ne sourit pas."),
            say("merlin", "C'était la chose raisonnable."),
            say(
              "lyra",
              "Ce n'était pas la chose raisonnable. C'était la chose facile.",
            ),
            when(is("nyx_epargnee"), [
              stage(
                "Nyx est restée dans le gris. Elle s'éloigne avec la Dérive, minuscule, accroupie au bord du vide.",
              ),
              say("nyx", "Je préfère comme ça !"),
              stage("Personne ne sait si c'est vrai."),
            ]),
            stage("Le nom reste : la Lisière devient la Déchirure."),
          ]),
        ]),
      ],
      next: "6",
    },

    // ── 6 ──
    "6": {
      id: "6",
      title: "Le Premier Cristal",
      kind: "rencontre",
      setting: "Au cœur de ce qui était la Lacune",
      beats: [
        stage(
          "Au cœur de ce qui était la Lacune (ou, si elle s'est élargie, au bord de la rive de l'île natale), les cristaux de la Dérive qui clignotaient par paires se sont rapprochés pendant le combat, comme des gouttes qui roulent l'une vers l'autre. Ils ont fini par se fondre en un seul cristal, gros comme une tête, d'un bleu très pâle. Il pulse. Pas régulièrement : par paires de battements, comme deux cœurs qui ne sont pas tout à fait à la même vitesse et qui se rattrapent.",
        ),
        say(
          "merlin",
          "Il garde des paires. Les cristaux de chez nous font ça : quand deux choses ont été très liées près d'eux, ils en gardent une trace. Deux par deux. On ne sait pas pourquoi. On sait que si on les brise, il en sort une chaleur folle.",
        ),
        stage("Il regarde le Cristal avec une envie qu'il ne cache pas."),
        say(
          "merlin",
          "Celui-là est énorme. Vous avez été très liés, vous autres.",
        ),

        // Q05 : the answer
        stage(
          "Pendant le combat, le Lacunaire géant a pris sa chaleur à tout le monde, des deux camps. Un Écho de la Dérive est assis contre un rocher, grelottant ; Lyra le soigne sans demander de quel côté il est. Merlin a une brûlure de givre sur le bras ; Brutus, en silence, lui tend sa cape.",
        ),
        say(
          "brutus",
          "Ton carnet. La question d'hier. Ils ont froid comme nous. Ils ont peur comme nous. Quand ils se dispersent, ça fait la même lumière.",
        ),
        stage("Le héros ouvre le Carnet à la page de Q05."),
        when(is("dispersion_ere1"), [
          say("brutus", "Je l'ai vue."),
          stage("Un temps."),
        ]),
        say("brutus", "Écris : oui. Pareil. Pas un peu moins."),
        choice("q05", [
          opt("ecrire", "Écrire « oui ».", [
            fx(set("carnet.Q05", "repondue"), add("confiance.brutus")),
          ]),
          opt("guider", "Écris-le toi-même. Je te montre.", [
            stage(
              "Le héros guide sa main. Brutus trace trois lettres, énormes, de travers.",
            ),
            fx(set("carnet.Q05", "repondue"), add("confiance.brutus", 2)),
          ]),
        ]),
        // CUT: Merlin's extra line if "Protéger ceux d'en face" was met (the
        // objective itself is cut: no per-target damage data in the report).

        // Q06 : the question
        stage(
          "Le soir tombe. Une part de gris demeure, quelque part. Le héros s'en approche. Il regarde dedans, longtemps.",
        ),
        narr(
          "Là-dedans, il n'y a pas de noir. Il n'y a pas de rien. Il y a moins que tout le reste, c'est tout. Et pourtant, je me demande pourquoi il y a du reste.",
        ),
        when(any(is("vesce_rendue"), is("vesce_fuie")), [
          say(
            "vesce",
            "Pourquoi il y a des choses, au lieu de rien du tout ? C'est ça que tu vas écrire ? Je me le demande tout le temps. Merlin dit que c'est une question idiote.",
          ),
        ]),
        say(
          "merlin",
          "Je n'ai jamais dit idiote. J'ai dit : résolue. Le rien est impossible. Il ne peut pas tenir : il y a toujours quelque chose qui tremble, même dans le vide. Donc il y a quelque chose. C'est démontré.",
        ),
        say("brutus", "À Demeure, on dit : parce qu'un Ghom l'a voulu."),
        when(
          is("nyx_epargnee"),
          [
            say("nyx", "Personne ne sait."),
            stage("Elle hausse les épaules."),
            say(
              "nyx",
              "C'est ce qui est bien, avec cette question-là. Personne ne peut te la prendre.",
            ),
          ],
          [
            say(
              "nerea",
              "Je n'ai jamais trouvé de couche qui réponde à ça. Je ne crois pas qu'il y en ait.",
            ),
          ],
        ),
        stage(
          "La question s'écrit dans tous les cas : Pourquoi quelque chose plutôt que rien ? Puis :",
        ),
        choice("q06", [
          opt("rien", "Parce que le rien est impossible.", [
            fx(set("carnet.Q06", "fausse")),
            say("merlin", "Merci. Enfin quelqu'un de raisonnable."),
            narr(
              "C'est écrit. Ça a l'air solide. Je ne sais pas d'où il le sait.",
            ),
          ]),
          opt("ghom", "Parce qu'un Ghom l'a voulu.", [
            fx(set("carnet.Q06", "fausse")),
            say("brutus", "… Je ne sais pas si j'y crois, moi."),
            stage("Un temps."),
            say("brutus", "C'est ce qu'on dit, c'est tout."),
          ]),
          opt("blanc", "Ne rien écrire sous la question.", [
            fx(set("carnet.Q06", "ouverte")),
            narr(
              "Merlin a une réponse, Brutus en a une autre. Ils ont l'air aussi sûrs l'un que l'autre. Je laisse la page blanche. Elle restera blanche tant que personne ne saura.",
            ),
          ]),
        ]),

        // the fate of the Crystal
        say(
          "lyra",
          "On ne peut pas le laisser comme ça. Merlin le regarde comme un affamé regarde une miche.",
        ),
        say(
          "merlin",
          "Comme un savant regarde une source d'énergie sans égale. C'est très différent. Un peu différent.",
        ),
        choice("cristal", [
          opt("cairn", "Le garder là, sous un cairn.", [
            say(
              "heros",
              "Il est à tout le monde. Qu'il reste là où on s'est liés.",
            ),
            fx(add("cristaux.gardes"), set("premier_cristal.lieu", "cairn")),
            stage(
              "Brutus empile des pierres, une à une, avec ce soin d'horloger qu'il avait pour son mur. Lyra coince entre deux pierres un piquet de mesure. Néréa y dépose un peu de vase du Lent.",
            ),
            say(
              "brutus",
              "Ça, je veux bien le garder. Ça ne m'empêchera pas de partir.",
            ),
          ]),
          opt(
            "lacune",
            "Le donner à la Couture : l'enfoncer au cœur, dans le sol neuf.",
            [
              say("heros", "Qu'il tienne le fil."),
              fx(
                add("cristaux.donnes"),
                add("lacunes.recousues"),
                set("premier_cristal.lieu", "lacune"),
              ),
              stage(
                "Le héros enfonce le Cristal dans le sol meuble. Il pulse une dernière fois à la surface, puis s'enfonce, et la terre se referme sur lui. Autour, le sol devient plus net, plus dense.",
              ),
              say(
                "merlin",
                "Vous venez d'enterrer la plus grande réserve d'énergie que j'aie jamais vue.",
              ),
              stage("Un temps."),
              say("merlin", "Pour faire tenir de la terre."),
              stage("Encore un temps."),
              say(
                "merlin",
                "… Je n'arrive pas à dire si c'est stupide ou très beau. Je vais le noter dans les deux colonnes.",
              ),
            ],
            not(is("lacune_issue", "elargie")),
          ),
        ]),
      ],
      next: "7",
    },

    // ── 7 ──
    "7": {
      id: "7",
      title: "Le dernier geste",
      kind: "rencontre",
      setting: "La Lisière, la nuit",
      beats: [
        stage(
          "La nuit. Le sol de la Lisière gronde, très bas, comme il grondait au matin de la Collision, mais par en dessous. Néréa pose la main à plat sur la roche.",
        ),
        say(
          "nerea",
          "Ça s'enfonce. La Collision a écrasé tout ce qui était sous la Lisière. Deux îles qui se poussent, ça fait un tas. Très lourd. Très serré. Plus serré que tout ce que j'ai jamais lu.",
        ),
        stage(
          "Le sol se creuse lentement, sous le héros, en un entonnoir doux. Le héros est au centre. Il pourrait courir. Il ne court pas encore. Il a un geste à faire, un seul, avant.",
        ),
        choice("transformation", [
          opt("gris", "Regarder dans le gris jusqu'au bout.", [
            stage(
              "Le héros se tourne vers ce qui reste de la Lacune, et ne détourne plus les yeux. Le gris, la nuit, le peu de lumière qui vient des Fragments lointains et du Clair, cette lueur très faible qui baigne tout depuis toujours et que personne ne remarque.",
            ),
            fx(set("transformation.1", "A"), give("yeux_aube")),
            narr(
              "Mes yeux me brûlent, puis ils cessent de brûler. Ils s'ouvrent plus grand que je ne savais qu'ils pouvaient s'ouvrir. Je vois les fils du gris. Je vois, très loin, des îles que personne n'a jamais vues d'ici. Il y a de la lumière partout, même dans le noir. Il y en a toujours eu. Elle vient de très loin en arrière. De l'aube.",
            ),
          ]),
          opt("cristal", "Garder la main sur le Cristal.", [
            stage(
              "Sur le cairn, ou sur le sol où il est enfoui, le héros pose la paume à plat. Le Cristal pulse sous sa main, par paires. Quelque chose remonte dans sa peau, froid et lent, comme un givre qui pousse.",
            ),
            fx(
              set("transformation.1", "B"),
              add("cristaux.portes"),
              give("peau_cristal"),
            ),
            narr(
              "Ma peau se couvre de minuscules facettes, d'abord sur la main, puis le long du bras. Ça ne fait pas mal. Ça pousse, simplement, comme pousse un cristal dans l'eau. Une partie de moi est en train de devenir quelque chose qui dure.",
            ),
          ]),
        ]),
      ],
      next: "8",
    },

    // ── 8 ──
    "8": {
      id: "8",
      title: "Le Puits",
      kind: "fin",
      setting: "Le fond du Puits",
      beats: [
        stage(
          "Le sol s'enfonce plus vite. Ce n'est pas une chute : l'entonnoir s'approfondit sous le héros comme si la terre le déposait, doucement, de plus en plus bas. Au-dessus de lui, l'air se courbe, une lentille de lumière déformée que l'équipe voit aussi, et qui l'accompagne. La pression du Ghom est là, sur lui, sur le sol, sur tout.",
        ),
        stage("Lyra, courant jusqu'au bord de l'entonnoir."),
        say("lyra", "Remonte ! Donne-moi ta main !"),
        stage(
          "Le héros tend la main. Elle est lourde. Si lourde qu'il ne peut pas la lever plus haut que son épaule.",
        ),
        say("lyra", "Ce n'est pas une chute."),
        stage("Elle le dit lentement, comme si elle venait de le comprendre."),
        say("lyra", "Le sol t'a posé."),

        // last words, by Confiance (fixed order)
        say("brutus", "Je garde l'endroit."),
        stage("Un temps."),
        say("brutus", "Pas assis."),
        say(
          "nerea",
          "Tout ce qui tombe finit par se déposer. Toi aussi. Je lirai ta couche. Ou celle qui viendra après moi la lira.",
        ),
        when(is("intrication_nyx"), [
          say(
            "nyx",
            "Je reste là. C'est chez moi, maintenant, ce trou. Et puis tu me dois une encoche.",
          ),
        ]),
        stage(
          "Merlin, depuis la rive, son bâton tendu au-dessus de l'entonnoir, les yeux sur son horloge à eau.",
        ),
        fx(set("merlin_mesure")),
        say(
          "merlin",
          "Ne bougez pas, tous, ne bougez pas ! Il ralentit. Son temps ralentit, je le mesure, là, maintenant. Un battement sur cent. Sur dix.",
        ),
        stage("Sa voix monte."),
        say("merlin", "C'est la chose la plus belle que j'aie jamais mesurée."),
        // Lyra last: the promise of the name goes to the highest Confiance
        when(
          highest("lyra"),
          [
            say(
              "lyra",
              "Si tu remontes… quand tu remonteras… je t'aurai trouvé un nom. Ou celle qui viendra après moi. On le gardera pour toi.",
            ),
            fx(set("nom.promesse", "lyra")),
          ],
          [
            when(
              all(highest("nerea"), isnt("nom.promesse", "lyra")),
              [
                say(
                  "nerea",
                  "On te gardera un nom, au fond. Comme une couche qui attend.",
                ),
                fx(set("nom.promesse", "nerea")),
              ],
              [
                say("lyra", "Reviens. C'est tout. Reviens."),
                fx(set("nom.promesse", "aucune")),
              ],
            ),
          ],
        ),
        // no flag: the Chronicle of the mermaids (era II) quotes it, distorted
        choice("dernier_mot", [
          opt("reviendrai", "Je reviendrai."),
          opt("attendez", "Attendez-moi."),
          opt("main", "Ne rien dire. Lever la main."),
        ]),

        stage(
          "Le fond de l'entonnoir. Une cuvette de roche lisse, sombre, très dense, à peine plus large que le héros couché. Au-dessus, loin, le rond du ciel, et des têtes penchées au bord. Le héros s'assoit. Il est lourd, tellement lourd que respirer demande un effort. Mais rien ne lui fait mal.",
        ),
        narr(
          "Je suis lourd. C'est tout. Je ne peux pas remonter. Ça me pèse sur les épaules comme une couverture mouillée.",
        ),
        narr(
          "Là-haut, la voix de Lyra. Elle parle, mais sa voix est bizarre : plus aiguë, plus rapide, comme un oiseau. Je ne comprends pas les mots.",
        ),
        narr("Lyra parle trop vite. Non. C'est moi qui écoute trop lentement."),
        stage(
          "Le rond du ciel change. Les têtes au bord bougent vite, puis très vite, comme des feuilles dans le vent. La lumière qui descend jusqu'au héros devient plus bleue, plus vive. Le ciel s'assombrit, s'éclaire, s'assombrit : la nuit, le jour, la nuit, en quelques battements de son cœur.",
        ),
        narr(
          "Il fait nuit. Il fait jour. Il fait nuit. Je respire une fois, et là-haut, une journée passe.",
        ),
        stage(
          "Une silhouette revient au bord, régulièrement, entre deux clignements du ciel. Elle s'assoit, reste un moment, repart. Le héros reconnaît la cape : c'est Lyra. Ses cheveux, d'une fois à l'autre, sont plus clairs.",
        ),
        narr(
          "Elle revient. Elle repart. Elle revient. Pour moi, c'est une minute. Pour elle… Je ne veux pas compter.",
        ),
        when(is("premier_cristal.lieu", "cairn"), [
          stage(
            "À côté de la silhouette de Lyra, une autre, massive, de pierre grise et lisse, empile des pierres sur le cairn, pierre après pierre, très vite : le cairn grandit à vue d'œil.",
          ),
          // Gorr, long before his first question: nobody names him here.
        ]),
        stage(
          "Puis la silhouette de Lyra ne revient plus. Le ciel clignote si vite qu'il devient gris. La lumière est violette, puis d'un blanc bleuté, et elle baigne le fond du Puits d'une clarté douce.",
        ),
        narr(
          "Ici commence le repos, disait la pierre de Demeure. Ce n'est pas un repos. Tout continue, là-haut. Plus vite que moi. Ici, le temps est lourd. Il coule quand même, mais il coule comme du miel froid.",
        ),
        narr(
          "Je ne suis pas mort. Je ne suis pas endormi. Je suis juste au fond, là où chaque instant pèse plus qu'ailleurs. Quelques heures, peut-être. Je ne sais pas ce qu'elles valent, là-haut.",
        ),
        stage(
          "Le héros ouvre le Carnet sur ses genoux. Il est si lourd qu'il faut deux mains pour tourner une page. Il relit les questions, une à une. Il s'arrête sur la première.",
        ),
        narr("Pourquoi suis-je là ?"),
        when(is("carnet.Q00", "ouverte"), [
          narr(
            "Je ne sais toujours pas. Mais il y a, en dessous, une liste de gens qui y sont avec moi.",
          ),
        ]),
        when(is("carnet.Q00", "fausse"), [
          narr(
            "« Parce que le Ghom t'a voulu », a dit la Doyenne. Je l'ai écrit. Je le relis. Ici, au fond, ça ne pèse pas grand-chose.",
          ),
        ]),
        stage(
          "Le héros ferme les yeux. La lumière bleue traverse ses paupières.",
        ),
        when(is("transformation.1", "A"), [
          stage("Même les yeux fermés, il voit la lueur du ciel qui clignote."),
        ]),
        when(is("transformation.1", "B"), [
          stage(
            "Sur sa main, les facettes pulsent par paires, au rythme du Puits, pas au rythme du monde.",
          ),
        ]),
        stage(
          "Fondu au blanc, puis au noir. Titre : Ère II — Le Temps des Marées.",
        ),
        go(END),
      ],
    },
  },
}
