/**
 * Helpers to drive booyah chips in tests, without a Runner.
 */
import * as booyah from "@ghom/booyah"
import { Container } from "pixi.js"

/** Activate a chip with a fresh pixi container as context. */
export function mount<T extends booyah.Chip>(
  chip: T,
  container = new Container(),
): T {
  chip.activate({ timeSinceLastTick: 0 }, { container }, new booyah.Signal())
  return chip
}

/** Tick an active chip for `ms` milliseconds (stops if it terminates). */
export function tick(chip: booyah.Chip, ms: number, step = 16) {
  for (let t = 0; t < ms && chip.state === "active"; t += step) {
    chip.tick({ timeSinceLastTick: step })
  }
}

/** Mount a chip and tick it until it terminates; returns the elapsed time. */
export function runToEnd(chip: booyah.Chip, max = 20_000, step = 16) {
  mount(chip)
  let elapsed = 0
  while (chip.state === "active" && elapsed < max) {
    chip.tick({ timeSinceLastTick: step })
    elapsed += step
  }
  return elapsed
}
