import { beforeEach, describe, expect, test } from "bun:test"
import {
  choose,
  type FightReport,
  finishFight,
  frame,
  next,
  OUVERTES,
  type Run,
} from "@realms/adventure"
import { ENDING_BASCULE } from "../endings"
import {
  adventureSave,
  clearStorage,
  markEnding,
  secondEndingAvailable,
  writeAdventureSave,
} from "../storage"
import { beginChapter, endingOf } from "./progress"

const report: FightReport = {
  result: "victory",
  ticks: 12,
  divineUsed: {},
  divineNearAlly: [],
  intrications: 0,
  fled: [],
  timeUp: false,
  zonesLost: [],
  zoneStates: {},
  fixed: [],
  fighters: [],
}

/** Plays chapter 28 as the game starts it; `gesture` answers the choices. */
function play(gesture: (id: string) => string | undefined) {
  const save = adventureSave()
  save.starts["28"] = {
    flags: Object.fromEntries(
      OUVERTES.filter((q) => q !== "Q28").map((q) => [
        `carnet.${q}`,
        "ouverte",
      ]),
    ),
    items: [],
    team: ["lyra", "brutus", "gorr"],
    unlocks: [],
  }
  writeAdventureSave(save)
  let run: Run = beginChapter("28", 5)
  const offered: string[] = []
  for (let i = 0; i < 3000; i++) {
    const f = frame(run)
    if (f.kind === "done") return { run, offered }
    if (f.kind === "choice") {
      const ids = f.options.map((o) => o.id)
      if (f.id === "geste") offered.push(...ids)
      const want =
        gesture(f.id) ??
        (f.id === "q28" ? "3" : f.id === "nomination" ? "aucun" : undefined)
      run = choose(run, want && ids.includes(want) ? want : ids[0])
    } else if (f.kind === "hub") run = choose(run, f.topics[0].id)
    else if (f.kind === "fight") run = finishFight(run, report).run
    else run = next(run)
  }
  throw new Error("chapter 28 did not end")
}

const negotiate = (id: string) =>
  id === "geste" ? "negocier" : id.startsWith("g-") ? "v" : undefined

describe("the negotiation of chapter 28", () => {
  beforeEach(() => clearStorage())

  test("not offered while La Bascule was never seen", () => {
    expect(secondEndingAvailable()).toBe(false)
    const { run, offered } = play(negotiate)
    expect(offered).not.toContain("negocier")
    expect(run.flags.fin).not.toBe("gratuite")
  })

  test("offered after La Bascule; the right gestures lead to La Gratuité", () => {
    markEnding(ENDING_BASCULE)
    expect(secondEndingAvailable()).toBe(true)
    const { run, offered } = play(negotiate)
    expect(offered).toContain("negocier")
    expect(run.flags.fin).toBe("gratuite")
    expect(endingOf(run).fin).toBe("gratuite")
  })

  test("two wrong gestures close it even when offered", () => {
    markEnding(ENDING_BASCULE)
    const { run } = play((id) =>
      id === "geste" ? "negocier" : id.startsWith("g-") ? "f1" : undefined,
    )
    expect(run.flags.fin ?? "aucune").not.toBe("gratuite")
  })
})
