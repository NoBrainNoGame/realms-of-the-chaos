import { beforeEach, describe, expect, test } from "bun:test"
import {
  chapterById,
  compile,
  frame,
  type Run,
  startChapter,
} from "@realms/adventure"
import { resetSettings } from "../settings"
import { clearStorage } from "../storage"
import { mount } from "../test/harness"
import StoryScene from "./StoryScene"

/** A run of chapter 20 standing on the Nasses puzzle. */
function onNasses(): Run {
  const run = startChapter("20")
  const ops = compile(chapterById("20").scenes["3"])
  return {
    ...run,
    node: "3",
    pc: ops.findIndex((o) => o.op === "puzzle"),
    entry: undefined,
  }
}

beforeEach(() => {
  clearStorage()
  resetSettings()
})

describe("puzzle on the island", () => {
  test("clicks move the Déliés and the pairs found are read by the story", () => {
    const story = mount(new StoryScene({ run: onNasses(), sandbox: true }))
    expect(story.frame.kind).toBe("puzzle")
    const board = story.board!
    expect(board).not.toBeNull()
    // the old fisher (0,0) goes to the weaver's cell (3,1)
    board.clickCell(0, 0)
    board.clickCell(3, 1)
    board.finish()
    expect(story.board === null || story.frame.kind !== "puzzle").toBe(true)
    expect(story.run.puzzles?.["3:nasses"]).toEqual(["a"])
    expect(story.run.flags.nasse_a).toBe(true)
    expect(story.run.flags.nasse_b).toBeUndefined()
  })

  test("finishing without a move plays the 'none' beats", () => {
    const story = mount(new StoryScene({ run: onNasses(), sandbox: true }))
    story.board!.finish()
    expect(story.run.puzzles?.["3:nasses"]).toEqual([])
    expect(frame(story.run)).toMatchObject({ kind: "line" })
  })
})
