/**
 * Long balance report: `bun run balance [pairs]` (from the repo root).
 * Plays AI-vs-AI 3v3 tournaments with the presets, then with generated
 * characters, and prints win rates, a matchup matrix and the strongest
 * team compositions.
 */
import {
  CHARACTERS,
  generateCharacter,
  runTournament,
  type TournamentResult,
} from "../src"

const pairs = Number(process.argv[2] ?? 500)
const presets = Object.keys(CHARACTERS)
const pct = (v: number) => `${(v * 100).toFixed(0)}%`.padStart(4)

function report(title: string, result: TournamentResult) {
  console.log(`\n━━ ${title} ━━`)
  console.log(
    `${result.fights} combats, ${result.draws} nuls, premier camp ${pct(result.firstSideWinRate)}, ` +
      `${result.actionsPerFighter.toFixed(1)} actions/personnage, durée ${result.averageTime.toFixed(0)}`,
  )
  const rows = Object.entries(result.characters).sort(
    (a, b) => b[1].winRate - a[1].winRate,
  )
  for (const [id, r] of rows) {
    const flag = r.winRate < 0.4 || r.winRate > 0.6 ? "  ⚠" : ""
    console.log(
      `  ${id.padEnd(14)} ${pct(r.winRate)}  (${r.games} combats)${flag}`,
    )
  }
}

const start = performance.now()
const main = runTournament({ pool: presets, pairs, seed: 2024 })
report("Personnages de référence", main)

console.log(
  "\nMatrice : victoires des équipes avec la ligne contre celles avec la colonne",
)
console.log(
  " ".repeat(9) + presets.map((id) => id.slice(0, 6).padStart(7)).join(""),
)
for (const a of presets) {
  const cells = presets.map((b) => {
    const cell = main.matrix[a]?.[b]
    return cell && cell.games >= 10
      ? pct(cell.wins / cell.games).padStart(7)
      : "      ·"
  })
  console.log(a.padEnd(9) + cells.join(""))
}

console.log("\nUtilisation des actions")
for (const id of presets) {
  const uses = main.actionUses[id] ?? {}
  const total = Object.values(uses).reduce((s, v) => s + v, 0)
  console.log(
    `  ${id.padEnd(8)} ` +
      Object.entries(uses)
        .sort((a, b) => b[1] - a[1])
        .map(([a, n]) => `${a} ${pct(n / total).trim()}`)
        .join(", "),
  )
}

const comps = Object.entries(main.compositions)
  .filter(([, c]) => c.games >= 8)
  .map(([k, c]) => [k, c.wins / c.games, c.games] as const)
  .sort((a, b) => b[1] - a[1])
console.log("\nCompositions les plus fortes (≥ 8 combats)")
for (const [k, rate, games] of comps.slice(0, 8)) {
  console.log(
    `  ${k.padEnd(28)} ${pct(rate)} (${games})${rate > 0.75 ? "  ⚠" : ""}`,
  )
}

const generated = Array.from({ length: 24 }, (_, i) =>
  generateCharacter(1000 + i, presets[i % presets.length]),
)
report(
  "Personnages générés",
  runTournament({ pool: generated, pairs, seed: 77 }),
)
console.log(`\nTerminé en ${((performance.now() - start) / 1000).toFixed(0)} s`)
