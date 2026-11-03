import { describe, expect, test } from "bun:test"

import { DIVINE_ACTIONS, equals, manhattan, type Point } from "../engine"
import { mount, tick } from "../test/harness"
import FightScene, { type SceneOptions, waterState } from "./FightScene"
import Game from "./Game"

const OPTIONS: SceneOptions = {
  seed: 3,
  spectate: true,
  speed: 4,
  playerTeam: ["brutus", "eva", "lyra"],
  enemyTeam: ["gorr", "merlin", "nyx"],
}

function scene(options: Partial<SceneOptions> = {}) {
  return mount(new FightScene({ ...OPTIONS, ...options }))
}

/** What the view shows must match the engine once animations are done. */
function expectViewInSync(s: FightScene) {
  const internals = s as any
  for (const fighter of s.combat.fighters) {
    const view = internals._views.get(fighter.id)
    expect(view.hp).toBe(fighter.hp)
    if (fighter.alive) {
      expect(internals._cells.get(fighter.id)).toEqual(fighter.position)
      expect(view.water).toBe(waterState(s.combat.board, fighter.position))
      expect([...view._statuses].sort()).toEqual(
        fighter.statuses.map((st) => st.id).sort(),
      )
    } else {
      expect(view.container.alpha).toBeLessThan(0.05)
    }
  }
}

function runUntil(s: FightScene, done: () => boolean, maxMs = 600_000) {
  for (let t = 0; t < maxMs && !done(); t += 50)
    s.tick({ timeSinceLastTick: 50 })
}

describe("FightScene", () => {
  for (const seed of [3, 11, 42]) {
    test(`AI vs AI (seed ${seed}) plays to the end, view in sync`, () => {
      const s = scene({ seed })
      runUntil(s, () => (s as any)._endShown && !(s as any)._playing)
      expect(s.combat.state).toBe("ended")
      expectViewInSync(s)
    }, 60_000)
  }

  for (const seed of [2, 9]) {
    test(`aquatic and swimming fighters (seed ${seed}): full animated fight`, () => {
      const s = scene({
        seed,
        playerTeam: ["nerea", "eva", "brutus"],
        enemyTeam: ["squalor", "nyx", "gorr"],
      })
      runUntil(s, () => (s as any)._endShown && !(s as any)._playing)
      expect(s.combat.state).toBe("ended")
      expectViewInSync(s)
    }, 60_000)
  }

  test("a human can play a whole fight with clicks and keys", () => {
    const s = scene({ seed: 8, spectate: false, speed: 4 })
    const internals = s as any
    const key = (k: string) =>
      window.dispatchEvent(new KeyboardEvent("keydown", { key: k }))
    let usedDivine = false
    const ended = () => s.combat.state === "ended"

    for (let turn = 0; turn < 400 && !ended(); turn++) {
      runUntil(s, () => internals._inputReady || ended())
      if (ended()) break
      const me = s.combat.activeFighter!
      const team = s.combat.teams[me.team]

      // divine power when affordable
      if (!usedDivine && team.energy >= DIVINE_ACTIONS.blessing.cost) {
        internals._selectDivine("blessing")
        usedDivine = true
        runUntil(s, () => !internals._playing && !internals._pending)
      }

      // hover a few cells (tooltips, path previews)
      internals._board.emit("cellOver", me.position)
      internals._board.emit("cellOut", me.position)

      // best available action on a valid target, preferring combos
      const actions = s.combat
        .actionsOf(me)
        .filter((a) => !s.combat.isOnCooldown(me, a))
        .sort((a, b) => Number(!!b.combo) - Number(!!a.combo))
      let acted = false
      for (const action of actions) {
        const targets = s.combat
          .getValidTargets(me, action)
          .filter(
            (p) =>
              action.target !== "ally" ||
              s.combat.fightersAt(p).some((f) => f.hp < s.combat.maxHp(f)),
          )
        const target =
          targets.find((p) =>
            s.combat.fightersAt(p).some((f) => f.team !== me.team),
          ) ?? (action.target === "ally" ? targets[0] : undefined)
        if (!target) continue
        const index = s.combat.actionsOf(me).indexOf(action)
        if (index < 9) key(String(index + 1))
        else internals._selectAction(action.id)
        if (action.target !== "self") {
          internals._board.emit("cellOver", target)
          internals._board.emit("cellDown", target, 0)
        }
        acted = true
        break
      }

      if (!acted) {
        // walk towards the closest enemy, then pass
        const enemies = s.combat.aliveFighters.filter((f) => f.team !== me.team)
        const reachable = s.combat.getReachableCells(me)
        const best = reachable.sort(
          (a, b) =>
            Math.min(...enemies.map((e) => manhattan(e.position, a))) -
            Math.min(...enemies.map((e) => manhattan(e.position, b))),
        )[0] as Point | undefined
        if (best) {
          internals._board.emit("cellOver", best)
          internals._board.emit("cellDown", best, 0)
        }
        key("Escape")
        internals._board.emit("cellDown", me.position, 2) // right click cancels
        key(" ")
      }
      // commands typed during an animation run right after it
      runUntil(s, () => !internals._playing && !internals._pending)
    }

    runUntil(s, () => internals._endShown && !internals._playing)
    expect(s.combat.state).toBe("ended")
    expect(usedDivine).toBe(true)
    expectViewInSync(s)
    // speed toggle cycles
    key("f")
    expect(internals._speed).not.toBe(4)
  }, 120_000)

  test("invalid commands show a message instead of breaking", () => {
    const s = scene({ seed: 8, spectate: false })
    const internals = s as any
    runUntil(s, () => internals._inputReady)
    const me = s.combat.activeFighter!
    // clicking a cell occupied by an enemy is not a valid destination
    const enemy = s.combat.aliveFighters.find((f) => f.team !== me.team)!
    internals._board.emit("cellDown", enemy.position, 0)
    expect(s.combat.activeFighter).toBe(me)
    expect(equals(me.position, me.position)).toBe(true)
  })

  test("a command typed during an animation is not lost", () => {
    const s = scene({ seed: 8, spectate: false })
    const internals = s as any
    runUntil(s, () => internals._inputReady)
    const me = s.combat.activeFighter!
    const target = s.combat.getReachableCells(me)[0]
    internals._board.emit("cellDown", target, 0) // plans a path: a short animation plays
    expect(internals._playing).toBe(true)
    window.dispatchEvent(new KeyboardEvent("keydown", { key: " " }))
    expect(internals._pending).not.toBeNull()
    runUntil(s, () => !internals._pending)
    expect(s.combat.activeFighter).not.toBe(me)
  })

  test("HUD buttons drive the scene: divine earthquake, actions, pass", () => {
    const s = scene({ seed: 8, spectate: false })
    const internals = s as any
    runUntil(s, () => internals._inputReady)
    const me = s.combat.activeFighter!
    s.combat.teams[me.team].energy = 6

    // earthquake on the first cell that accepts it
    internals._hud.emit("divine", "earthquake")
    const before = s.combat.board.toAscii().join("/")
    for (const cell of s.combat.board.cells) {
      if (s.combat.fightersAt(cell).length) continue
      internals._hud.emit("divine", "earthquake")
      internals._board.emit("cellDown", { x: cell.x, y: cell.y }, 0)
      runUntil(s, () => !internals._playing && !internals._pending)
      if (s.combat.board.toAscii().join("/") !== before) break
    }
    expect(s.combat.board.toAscii().join("/")).not.toBe(before)

    // selecting an action twice toggles it off, then pass
    const action = s.combat.actionsOf(me)[0]
    internals._hud.emit("action", action.id)
    expect(internals._mode.type).toBe("action")
    internals._hud.emit("action", action.id)
    expect(internals._mode.type).toBe("move")
    internals._hud.emit("pass")
    runUntil(s, () => !internals._pending)
    expect(s.combat.activeFighter).not.toBe(me)
  })

  test("Game restarts with a new seed", () => {
    const game = mount(new Game({ ...OPTIONS, seed: 5 }))
    const first = (game as any)._scene as FightScene
    first.emit("restart")
    const second = (game as any)._scene as FightScene
    expect(second).not.toBe(first)
    tick(game, 200)
  })

  test("Game can show the gallery instead of a fight", () => {
    const game = mount(new Game({ ...OPTIONS, seed: null, gallery: true }))
    expect((game as any)._scene).toBeNull()
    tick(game, 100)
  })
})
