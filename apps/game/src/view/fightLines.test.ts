import { describe, expect, test } from "bun:test"
import { FightVoice } from "./fightLines"

const lines = [
  { when: "start", who: "lyra", text: "a" },
  { when: "tick:3", who: "lyra", text: "b" },
  { when: "zone:feu", who: "lyra", text: "c" },
  { when: "lost", who: "lyra", text: "d" },
  { when: "heal", who: "lyra", text: "e" },
  { when: "cast:earthquake", who: "lyra", text: "f" },
  { when: "end", who: "lyra", text: "g" },
] as const

const texts = (l: { text: string }[]) => l.map((x) => x.text)

describe("fight lines", () => {
  test("each line is read once, on its trigger", () => {
    const v = new FightVoice(lines)
    expect(texts(v.on("start"))).toEqual(["a"])
    expect(texts(v.on("start"))).toEqual([])
    expect(texts(v.onEvent({ type: "clockTick", tick: 3 }))).toEqual(["b"])
    expect(
      texts(v.onEvent({ type: "zoneChanged", zoneId: "feu", state: "silent" })),
    ).toEqual(["c"])
    expect(
      texts(v.onEvent({ type: "zoneChanged", zoneId: "feu", state: "lost" })),
    ).toEqual(["d"])
    expect(
      texts(v.onEvent({ type: "healed", fighterId: "x", amount: 2 })),
    ).toEqual(["e"])
    expect(
      texts(
        v.onEvent({
          type: "divineUsed",
          team: 0,
          divineId: "earthquake",
          target: null,
        }),
      ),
    ).toEqual(["f"])
    expect(texts(v.onEvent({ type: "ended", winnerTeam: 0 }))).toEqual(["g"])
  })
})
