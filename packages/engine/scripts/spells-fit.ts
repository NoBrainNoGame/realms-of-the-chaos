/**
 * Calibration of the spell cost model: `bun run spells:fit` (from the
 * repo root or the engine package). Prints, for every catalogue action the
 * model can price, its real timeCost against the derived one, then fits
 * the weights (`--fit`) and prints them ready to paste into SPELL_WEIGHTS.
 */
import {
  ACTIONS,
  actionFeatures,
  calibrationSet,
  featureCost,
  SPELL_COST,
  SPELL_WEIGHTS,
  type SpellWeights,
} from "../src"

const set = calibrationSet()

function errors(w: SpellWeights) {
  return set.map(({ action }) => {
    const derived = featureCost(actionFeatures(action, w), w)
    return { action, derived, error: derived / action.timeCost - 1 }
  })
}

function loss(w: SpellWeights, prior: SpellWeights) {
  const errs = errors(w).map((e) => Math.abs(e.error))
  const mean = errs.reduce((a, b) => a + b, 0) / errs.length
  const excess = errs.reduce((a, e) => a + Math.max(0, e - 0.25), 0)
  // keep weights near their designed meaning
  let ridge = 0
  for (const key of Object.keys(w) as (keyof SpellWeights)[]) {
    if (key === "base" || key === "slope" || key === "curve") continue
    ridge += Math.abs(Math.log((w[key] + 0.05) / (prior[key] + 0.05)))
  }
  return mean + excess + 0.004 * ridge
}

const fixCurve = process.argv.includes("--fix-curve")

function fit(start: SpellWeights): SpellWeights {
  let best = { ...start }
  let bestLoss = loss(best, start)
  const keys = Object.keys(start) as (keyof SpellWeights)[]
  for (let round = 0; round < 400; round++) {
    let improved = false
    for (const key of keys) {
      for (const factor of [1.15, 0.87, 1.04, 0.96]) {
        const candidate = { ...best, [key]: best[key] * factor }
        if (key === "base") candidate.base = best.base + (factor - 1) * 0.3
        if (key === "curve" && fixCurve) continue
        const l = loss(candidate, start)
        if (l < bestLoss - 1e-9) {
          best = candidate
          bestLoss = l
          improved = true
        }
      }
    }
    if (!improved) break
  }
  return best
}

function table(w: SpellWeights) {
  const rows = errors(w)
  console.log("id".padEnd(14), "real", "derived", "snapped", "error")
  for (const { action, derived, error } of rows) {
    const snapped = Math.round(derived / SPELL_COST.step) * SPELL_COST.step
    console.log(
      action.id.padEnd(14),
      action.timeCost.toFixed(2).padStart(4),
      derived.toFixed(2).padStart(7),
      snapped.toFixed(2).padStart(7),
      `${(error * 100).toFixed(0)}%`.padStart(6),
      Math.abs(error) > 0.25 ? "  <- outlier" : "",
    )
  }
  const abs = rows.map((r) => Math.abs(r.error))
  console.log(
    `mean abs error ${((abs.reduce((a, b) => a + b, 0) / abs.length) * 100).toFixed(1)}%, max ${(Math.max(...abs) * 100).toFixed(0)}%`,
  )
}

console.log(
  `catalogue: ${Object.keys(ACTIONS).length} actions, ${set.length} priced`,
)
if (process.argv.includes("--fit")) {
  const fitted = fit(SPELL_WEIGHTS)
  table(fitted)
  const round = (v: number) => Math.round(v * 1000) / 1000
  console.log(
    "\nSPELL_WEIGHTS = {\n" +
      Object.entries(fitted)
        .map(([k, v]) => `  ${k}: ${round(v)},`)
        .join("\n") +
      "\n}",
  )
} else {
  table(SPELL_WEIGHTS)
}
