import * as booyah from "@ghom/booyah"
import { Application, CanvasTextMetrics, TextureStyle } from "pixi.js"
import { ENDING_BASCULE, ENDING_GRATUITE } from "./endings"
import { params } from "./params"
import {
  congratulateNext,
  grantHeroSpell,
  markEnding,
  scarCount,
  secondEndingAvailable,
  vacuumDecayWipe,
} from "./storage"
import Game from "./view/Game"
import { Quality } from "./view/quality"
import { applyScars, COLORS, FONT } from "./view/theme"

// dev: the Adventure reaching a secret ending (it does not exist yet)
if (params.ending === ENDING_BASCULE)
  vacuumDecayWipe({ ending: ENDING_BASCULE })
else if (params.ending === ENDING_GRATUITE && secondEndingAvailable()) {
  markEnding(ENDING_GRATUITE)
  congratulateNext(ENDING_GRATUITE)
}

// the scars of past vacuum decays drift the colours (before anything draws)
applyScars(scarCount())
for (const id of params.grant) grantHeroSpell(id)

// the canvas's own letter spacing: Pixi's fallback draws letter by letter,
// which still ran the font's "fi" ligature into an "A" in small texts
CanvasTextMetrics.experimentalLetterSpacing = true

// crisp pixel art everywhere
TextureStyle.defaultOptions.scaleMode = "nearest"

document.addEventListener("contextmenu", (e) => e.preventDefault())

const app = new Application()
await app.init({
  resizeTo: window,
  background: COLORS.background,
  antialias: false,
  autoDensity: true,
  // capped: past 2, the pixels cost more than they show
  resolution: Math.min(2, window.devicePixelRatio || 1),
})
document.body.appendChild(app.canvas)

// small configurations: fewer pixels when the frames stay slow
const quality = new Quality(app.renderer.resolution)
app.ticker.add((ticker) => {
  const resolution = quality.frame(ticker.deltaMS)
  if (resolution !== null) app.renderer.resolution = resolution
})

// wait for the pixel font so texts are measured correctly
try {
  await document.fonts.load(`16px ${FONT.split(",")[0]}`)
} catch {
  // the monospace fallback is fine
}

const game = new Game(params)

const runner = new booyah.Runner(game, {
  rootContext: { container: app.stage },
})
if (params.debug) Object.assign(window, { game, runner, app })
runner.start()
