import { beforeEach, describe, expect, test } from "bun:test"
import { CHARACTERS, verifyArcadeRun } from "@realms/engine"
import type { Container } from "pixi.js"
import { parseParams } from "../params"
import { resetSettings, settings, updateSettings } from "../settings"
import { arcadeBest, clearStorage, submitArcadeScore } from "../storage"
import { mount, tick } from "../test/harness"
import { playLocally, tickUntil } from "../test/play"
import ArcadeRun from "./ArcadeRun"
import FightScene from "./FightScene"
import Gallery from "./Gallery"
import Game, { initialScreen, pickedFight } from "./Game"
import MessageScreen from "./MessageScreen"
import SettingsScreen from "./SettingsScreen"
import TeamPicker, { DIFFICULTIES, MAX_TEAM, randomTeam } from "./TeamPicker"
import TitleScreen, {
  TITLE_MENU,
  TITLE_TILT,
  TITLE_TURN_EVERY,
} from "./TitleScreen"
import Tutorial from "./Tutorial"
import { camera, ISO, ISO_PITCH, toScreen } from "./theme"
import { Menu } from "./ui"

const key = (k: string) =>
  window.dispatchEvent(new KeyboardEvent("keydown", { key: k }))

const game = (query = "") =>
  mount(new Game(parseParams(new URLSearchParams(query))))

beforeEach(() => {
  clearStorage()
  resetSettings()
})

describe("Menu", () => {
  test("arrows skip disabled items and wrap, Enter selects", () => {
    const chosen: string[] = []
    const menu = new Menu(
      [
        { id: "a", label: "A" },
        { id: "b", label: "B", enabled: false },
        { id: "c", label: "C" },
      ],
      { width: 100, onSelect: (id) => chosen.push(id) },
    )
    expect(menu.focused.id).toBe("a")
    menu.handleKey("ArrowDown")
    expect(menu.focused.id).toBe("c") // b is disabled
    menu.handleKey("ArrowDown")
    expect(menu.focused.id).toBe("a") // wraps
    menu.handleKey("ArrowUp")
    menu.handleKey("Enter")
    expect(chosen).toEqual(["c"])
    menu.select(1) // disabled: ignored
    expect(chosen).toEqual(["c"])
    menu.setEnabled("b", true)
    menu.select(1)
    expect(chosen).toEqual(["c", "b"])
    expect(menu.handleKey("x")).toBe(false)
  })
})

describe("title screen", () => {
  test("offers every mode; online is announced but locked", () => {
    const title = mount(new TitleScreen(4))
    const items = title.menu.items
    expect(items.map((i) => i.id)).toEqual(TITLE_MENU.map((i) => i.id))
    expect(items.find((i) => i.id === "online")!.enabled).toBe(false)
    expect(items.find((i) => i.id === "codex")!.enabled).not.toBe(false)
    const chosen: string[] = []
    title.on("choose", (c: string) => chosen.push(c))
    key("ArrowDown")
    key("ArrowDown")
    key("Enter")
    expect(chosen).toEqual(["arcade"])
    tick(title, 500) // the island bobs
  })

  test("the island turns a quarter every 7 s and leans towards the mouse", () => {
    const title = mount(new TitleScreen(4))
    try {
      expect(camera.quarter).toBe(0)
      const first = title.islandSeed
      const firstBoard = (title as any)._board
      tick(title, TITLE_TURN_EVERY - 100)
      expect(camera.quarter).toBe(0)
      // the island fades out completely, and is replaced while invisible
      let alphaAtSwap = -1
      for (let i = 0; i < 40 && alphaAtSwap < 0; i++) {
        const before = (title as any)._island.alpha
        tick(title, 16)
        if (title.islandSeed !== first) alphaAtSwap = before
      }
      expect(alphaAtSwap).toBeGreaterThanOrEqual(0)
      expect(alphaAtSwap).toBeLessThan(0.1)
      expect(camera.quarter).toBe(1)
      expect((title as any)._board).not.toBe(firstBoard)
      expect(firstBoard.state).not.toBe("active")
      tick(title, 400)
      expect((title as any)._island.alpha).toBe(1)
      tick(title, TITLE_TURN_EVERY)
      expect(camera.quarter).toBe(2)

      // mouse in the top right corner: seen a bit less from above, turned left
      window.dispatchEvent(
        new PointerEvent("pointermove", {
          clientX: window.innerWidth,
          clientY: 0,
        }),
      )
      expect(title.aim.yaw).toBeCloseTo(-TITLE_TILT.yaw)
      expect(title.aim.pitch).toBeCloseTo(ISO_PITCH - TITLE_TILT.pitch)
      tick(title, 2000)
      expect(camera.yaw).toBeCloseTo(-TITLE_TILT.yaw, 1)
      expect(camera.pitch).toBeCloseTo(ISO_PITCH - TITLE_TILT.pitch, 1)
      // the board's middle stays where it is in the classic view
      const stage = (title as any)._stage as Container
      const center = (title as any)._boardCenter
      const at = toScreen(center, 0, camera)
      const iso = toScreen(center, 0, ISO)
      expect(Math.abs(stage.x + at.x - iso.x)).toBeLessThan(1)
      expect(Math.abs(stage.y + at.y - iso.y)).toBeLessThan(1)
    } finally {
      title.terminate()
    }
    expect(camera).toEqual({ ...ISO })
  })

  test("shows the arcade record when there is one", () => {
    submitArcadeScore({ score: 1234, waves: 5, team: ["eva"], date: "x" })
    const title = mount(new TitleScreen(1))
    const texts = collectTexts(title.container)
    expect(texts.some((t) => t.includes("1234"))).toBe(true)
  })
})

describe("team picker", () => {
  test("1 to 3 characters, duplicates allowed, removable", () => {
    const picker = mount(new TeamPicker("skirmish", { seed: 7 }))
    expect(picker.canConfirm).toBe(false)
    picker.toggle("eva")
    expect(picker.picks[0]).toEqual(["eva"])
    picker.toggle("eva") // removes
    expect(picker.picks[0]).toEqual([])
    picker.add("eva")
    picker.add("eva")
    picker.add("gorr")
    picker.add("nyx") // full: ignored
    expect(picker.picks[0]).toEqual(["eva", "eva", "gorr"])
    expect(picker.picks[0]).toHaveLength(MAX_TEAM)
    picker.removeAt(0)
    expect(picker.picks[0]).toEqual(["eva", "gorr"])
    expect(picker.canConfirm).toBe(true)
  })

  test("keyboard: arrows, space, D, R, Enter", () => {
    const picker = mount(new TeamPicker("skirmish", { seed: 7 }))
    const results: unknown[] = []
    picker.on("confirm", (r: unknown) => results.push(r))
    key("Enter") // nothing picked: refused
    expect(results).toHaveLength(0)
    const first = picker.focusedId
    key(" ")
    key("ArrowRight")
    key(" ")
    key("ArrowDown")
    key(" ")
    expect(picker.picks[0]).toHaveLength(3)
    expect(picker.picks[0][0]).toBe(first)
    key("d")
    expect(picker.difficulty.id).toBe("hard")
    const seed = picker.seed
    key("r")
    expect(picker.seed).not.toBe(seed)
    key("Enter")
    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({
      mode: "skirmish",
      teams: [picker.picks[0]],
      difficulty: DIFFICULTIES[2],
      seed: picker.seed,
    })
    tick(picker, 300) // puppets animate
  })

  test("local duel: blue picks, then red; Escape goes back a step", () => {
    const picker = mount(new TeamPicker("local", { seed: 3 }))
    const results: any[] = []
    picker.on("confirm", (r: unknown) => results.push(r))
    expect(picker.steps).toBe(2)
    picker.toggle("eva")
    picker.confirm()
    expect(picker.step).toBe(1)
    expect(results).toHaveLength(0)
    key("Escape")
    expect(picker.step).toBe(0)
    picker.confirm()
    picker.toggle("gorr")
    picker.toggle("nyx")
    picker.confirm()
    expect(results[0].teams).toEqual([["eva"], ["gorr", "nyx"]])
  })

  test("skirmish enemies can be redrawn; random teams are valid", () => {
    const picker = mount(new TeamPicker("skirmish", { seed: 3 }))
    expect(picker.enemies).toHaveLength(3)
    picker.rerollEnemies()
    for (const id of picker.enemies) expect(CHARACTERS[id]).toBeDefined()
    expect(randomTeam(5)).toEqual(randomTeam(5))
    picker.cycleDifficulty()
    picker.cycleDifficulty()
    expect(picker.difficulty.id).toBe("easy")
    const backs: number[] = []
    picker.on("back", () => backs.push(1))
    picker.back()
    expect(backs).toEqual([1])
  })
})

describe("game routing", () => {
  test("starts on the title screen, or where the URL says", () => {
    expect(initialScreen(parseParams(new URLSearchParams(""))).type).toBe(
      "title",
    )
    expect(
      initialScreen(parseParams(new URLSearchParams("?mode=local"))),
    ).toEqual({ type: "picker", mode: "local" })
    const fight = initialScreen(
      parseParams(new URLSearchParams("?seed=9&spectate")),
    )
    expect(fight.type).toBe("fight")
    if (fight.type === "fight") {
      expect(fight.options.seed).toBe(9)
      expect(fight.options.teams.every((t) => t.controller === "ai")).toBe(true)
    }
  })

  test("title → skirmish picker → fight → replay / change team / title", () => {
    const g = game()
    const title = g.current as TitleScreen
    title.emit("choose", "skirmish")
    expect(g.screen).toMatchObject({ type: "picker", mode: "skirmish" })

    const picker = g.current as TeamPicker
    picker.toggle("brutus")
    picker.toggle("lyra")
    picker.cycleDifficulty() // hard
    picker.confirm()
    expect(g.screen.type).toBe("fight")
    const scene = g.current as FightScene
    expect(scene.options.teams[0]).toMatchObject({
      controller: "local",
      fighters: ["brutus", "lyra"],
    })
    expect(scene.options.teams[1].statMultiplier).toBe(1.2)
    expect(scene.options.teams[1].fighters).toEqual([...picker.enemies])
    tick(g, 200)

    const seed = scene.options.seed
    scene.emit("endAction", "restart")
    const replay = g.current as FightScene
    expect(replay).not.toBe(scene)
    expect(replay.options.teams[0].fighters).toEqual(["brutus", "lyra"])
    expect(replay.options.seed).not.toBe(seed)

    replay.emit("endAction", "picker")
    expect(g.screen).toMatchObject({
      type: "picker",
      mode: "skirmish",
      teams: [["brutus", "lyra"]],
    })
    expect((g.current as TeamPicker).picks[0]).toEqual(["brutus", "lyra"])
    ;(g.current as TeamPicker).confirm()
    ;(g.current as FightScene).emit("endAction", "title")
    expect(g.screen.type).toBe("title")
  })

  test("title → tutorial → replay / title (?mode=tutorial)", () => {
    const g = game()
    ;(g.current as TitleScreen).emit("choose", "tutorial")
    expect(g.current).toBeInstanceOf(Tutorial)
    const first = g.current as Tutorial
    first.scene.emit("endAction", "again")
    expect(g.current).toBeInstanceOf(Tutorial)
    expect(g.current).not.toBe(first)
    ;(g.current as Tutorial).scene.emit("quit")
    expect(g.screen.type).toBe("title")
    expect(game("?mode=tutorial").current).toBeInstanceOf(Tutorial)
  })

  test("title → settings: arrows change the sizes, Escape goes back (?mode=settings)", () => {
    const g = game()
    expect(TITLE_MENU.at(-2)?.id).toBe("settings")
    ;(g.current as TitleScreen).emit("choose", "settings")
    const screen = g.current as SettingsScreen
    expect(screen).toBeInstanceOf(SettingsScreen)
    key("ArrowRight") // text size: Normal → Grand
    expect(settings().textSize).toBe(1.15)
    key("ArrowDown")
    key("ArrowLeft") // interface: 100 % → 90 %
    key("ArrowLeft")
    expect(settings().uiSize).toBe(0.8)
    tick(g, 50) // rebuilt at the new sizes
    expect(screen.container.children.at(-1)?.scale.x).toBe(0.8)
    key("ArrowDown")
    key("Enter") // "Retour"
    expect(g.screen.type).toBe("title")
    expect(game("?mode=settings").current).toBeInstanceOf(SettingsScreen)
    key("Escape")
  })

  test("the interface size scales the HUD, laid out for the smaller screen", () => {
    resetSettings()
    const normal = game("?seed=3").current as FightScene
    const bar = normal.hud.actionBarBounds
    updateSettings({ uiSize: 1.3 })
    const big = game("?seed=3").current as FightScene
    expect(big.hud.container.scale.x).toBe(1.3)
    const bigBar = big.hud.actionBarBounds
    expect(bigBar.width).toBeCloseTo(bar.width * 1.3, 0)
    // still centered at the bottom of the screen
    expect(bigBar.x + bigBar.width / 2).toBeCloseTo(bar.x + bar.width / 2, -1)
    expect(bigBar.y + bigBar.height).toBeLessThanOrEqual(window.innerHeight)
  })

  test("the settings open during a fight: it waits, then takes the new sizes", () => {
    resetSettings()
    const g = game("?seed=3")
    const scene = g.current as FightScene
    const hud = (scene as any)._hud
    hud.emit("settings")
    expect(scene.settingsOpen).toBe(true)
    // the fight waits and the board takes no key while they are open
    const turn = scene.combat.time
    const mode = (scene as any)._mode
    tick(g, 60)
    key("2")
    expect(scene.combat.time).toBe(turn)
    expect((scene as any)._mode).toBe(mode)
    // the interface and text sizes apply at once, in the fight
    key("ArrowDown")
    key("ArrowRight")
    key("ArrowUp")
    key("ArrowRight")
    expect(settings()).toEqual({ textSize: 1.15, uiSize: 1.15 })
    expect(hud.container.scale.x).toBe(1.15)
    const help = hud.container.children.find(
      (c: Container) => c.label === "help",
    )
    expect(help.style.fontSize).toBe(Math.round(12 * 1.15))
    // Échap closes them, the fight goes on (still there, not left)
    key("Escape")
    expect(scene.settingsOpen).toBe(false)
    expect(g.current).toBe(scene)
    expect(g.screen.type).not.toBe("title")
    resetSettings()
  })

  test("texts are drawn at the interface size: never stretched", () => {
    resetSettings()
    const small = game("?seed=3").current as FightScene
    const at1 = (small as any)._hud._settings.resolution
    updateSettings({ uiSize: 1.3 })
    const big = game("?seed=3").current as FightScene
    const at13 = (big as any)._hud._settings.resolution
    expect(at13).toBeCloseTo(at1 * 1.3, 5)
    // the drawn resolution covers the scale it is shown at
    expect(at13).toBeGreaterThanOrEqual(1.3)
    resetSettings()
  })

  test("the Menu button leaves a fight; Escape leaves the gallery (?gallery)", () => {
    const g = game("?seed=3")
    const scene = g.current as FightScene
    expect(scene.options.quittable).toBe(true)
    ;(scene as any)._hud.emit("quit")
    expect(g.screen.type).toBe("title")
    expect(TITLE_MENU.map((i) => i.id)).not.toContain("gallery")
    expect(TITLE_MENU.at(-1)?.id).toBe("tutorial")
    g.show({ type: "gallery" })
    expect(g.current).toBeInstanceOf(Gallery)
    tick(g, 100)
    key("Escape")
    expect(g.screen.type).toBe("title")
  })

  test("local duel picks build a fight between two local teams", () => {
    const options = pickedFight(
      {
        mode: "local",
        teams: [["eva"], ["gorr"]],
        enemies: [],
        difficulty: DIFFICULTIES[1],
        seed: 5,
      },
      4,
    )
    expect(options.teams.map((t) => t.controller)).toEqual(["local", "local"])
    expect(options.seed).toBe(5)
  })

  test("arcade picks start an arcade run; it can be left", () => {
    const g = game("?mode=arcade")
    const picker = g.current as TeamPicker
    picker.toggle("eva")
    picker.confirm()
    expect(g.screen).toEqual({ type: "arcade", team: ["eva"] })
    const run = g.current as ArcadeRun
    expect(run.screen).toBeInstanceOf(FightScene)
    ;(run.screen as any)._hud.emit("quit")
    expect(g.screen.type).toBe("title")
  })
})

describe("local duel", () => {
  test("both teams are played on this device, turns are announced", () => {
    const scene = mount(
      new FightScene(
        pickedFight(
          {
            mode: "local",
            teams: [
              ["brutus", "eva"],
              ["gorr", "nyx"],
            ],
            enemies: [],
            difficulty: DIFFICULTIES[1],
            seed: 11,
          },
          4,
        ),
      ),
    )
    const internals = scene as any
    const banners: string[] = []
    const banner = internals._hud.banner.bind(internals._hud)
    internals._hud.banner = (m: string, c: number) => {
      banners.push(m)
      banner(m, c)
    }
    const teamsPlayed = new Set<number>()
    const divineTeams = new Set<number>()
    const original = internals._enterInput.bind(internals)
    internals._enterInput = () => {
      original()
      teamsPlayed.add(scene.combat.activeFighter!.team)
      divineTeams.add(scene.playerTeam)
    }

    playLocally(scene)
    expect(scene.combat.state).toBe("ended")
    expect(teamsPlayed).toEqual(new Set([0, 1]))
    // the divine panel follows the team that plays
    expect(divineTeams).toEqual(new Set([0, 1]))
    expect(banners.some((b) => b.startsWith("Au tour de l'équipe"))).toBe(true)
    // the commands of both players are in the engine's log
    const logged = new Set(
      scene.combat.log.map((c) => scene.combat.getFighter(c.fighterId)!.team),
    )
    expect(logged).toEqual(new Set([0, 1]))
    // the end screen names the winner and offers the duel's choices
    const texts = collectTexts(internals._hud.container)
    expect(texts.some((t) => /l'équipe (bleue|rouge) gagne/.test(t))).toBe(true)
  }, 120_000)
})

describe("arcade", () => {
  test("waves, bonuses, a verifiable record, then the score", () => {
    const run = mount(
      new ArcadeRun(["brutus", "lyra", "eva"], { speed: 4, seed: 99 }),
    )
    let waves = 0
    // play two waves for real, through the scene's commands
    while (waves < 2 && run.run.alive) {
      const scene = run.screen as FightScene
      expect(scene).toBeInstanceOf(FightScene)
      expect(scene.options.teams[1].name).toBe(`Marée ${run.run.wave}`)
      playLocally(scene)
      ;(scene as any)._hud.emit("endAction", "continue")
      waves++
      if (!run.run.alive) break
      const summary = run.screen as MessageScreen
      expect(summary).toBeInstanceOf(MessageScreen)
      expect(summary.options.title).toContain("repoussée")
      const choice = summary.menu.items.find((i) => i.id !== "recruit")!.id
      summary.emit("choose", choice)
    }

    // the recorded run replays to the same score in the engine
    const verified = verifyArcadeRun(run.record)
    expect(verified.score).toBe(run.run.score)
    expect(run.record.waves.length).toBe(waves)
    expect(run.record.waves[0].log.length).toBeGreaterThan(0)
  }, 300_000)

  test("losing ends the run, keeps the record and offers to play again", () => {
    // the AI plays a lone, weak team: it loses quickly
    const run = mount(
      new ArcadeRun(["lyra"], { speed: 4, seed: 5, autoplay: true }),
    )
    for (let i = 0; i < 20 && run.run.alive; i++) {
      const scene = run.screen as FightScene
      tickUntil(
        scene,
        () => (scene as any)._endShown && !(scene as any)._playing,
      )
      ;(scene as any)._hud.emit("endAction", "continue")
      if (run.run.alive) (run.screen as MessageScreen).emit("choose", "heal")
    }
    expect(run.run.alive).toBe(false)
    const over = run.screen as MessageScreen
    expect(over.options.choices.map((c) => c.id)).toEqual(["again", "exit"])
    expect(run.newRecord).toBe(run.run.score > 0)
    if (run.newRecord) expect(arcadeBest()!.score).toBe(run.run.score)
    const events: string[] = []
    run.on("again", () => events.push("again"))
    over.emit("choose", "again")
    expect(events).toEqual(["again"])
  }, 300_000)

  test("records: only a better score replaces the best one", () => {
    expect(arcadeBest()).toBeNull()
    expect(submitArcadeScore({ score: 50, waves: 1, team: [], date: "" })).toBe(
      true,
    )
    expect(submitArcadeScore({ score: 40, waves: 1, team: [], date: "" })).toBe(
      false,
    )
    expect(arcadeBest()!.score).toBe(50)
  })
})

function collectTexts(root: Container): string[] {
  const out: string[] = []
  const walk = (c: Container) => {
    if ("text" in c && typeof (c as any).text === "string")
      out.push((c as any).text)
    for (const child of c.children) walk(child as Container)
  }
  walk(root)
  return out
}
