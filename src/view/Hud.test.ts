import { describe, expect, test } from "bun:test"
import { Container, Text } from "pixi.js"

import { ACTIONS, Board, Combat, comboAction, CHARACTERS } from "../engine"
import { mount, tick } from "../test/harness"
import Hud, { describeAction } from "./Hud"
import Backdrop from "./Backdrop"
import Gallery from "./Gallery"

function combat() {
  return new Combat({
    seed: 1,
    board: new Board(9, 9),
    teams: [
      { controller: "human", fighters: ["eva", "merlin"] },
      { controller: "ai", fighters: ["gorr"] },
    ],
    positions: [
      [
        { x: 0, y: 0 },
        { x: 0, y: 0 },
      ],
      [{ x: 8, y: 8 }],
    ],
  })
}

/** All texts displayed under a container. */
function texts(node: Container): string[] {
  const out: string[] = []
  const visit = (n: Container) => {
    if (n instanceof Text) out.push(n.text)
    for (const child of n.children) visit(child as Container)
  }
  visit(node)
  return out
}

/** Interactive children (buttons). */
function buttons(node: Container): Container[] {
  return node.children.filter((c) => c.eventMode === "static") as Container[]
}

function activeHud() {
  const c = combat()
  const [eva] = c.fighters
  for (const f of c.fighters) f.nextActionAt = f === eva ? 0 : 500
  c.run()
  const hud = mount(new Hud())
  return { hud, c, eva }
}

describe("Hud", () => {
  test("timeline shows every alive fighter in turn order", () => {
    const { hud, c } = activeHud()
    hud.setTimeline(c)
    const timeline = hud.container.children[0] as Container
    // panel + label + one slot per fighter
    expect(timeline.children.length).toBe(2 + c.aliveFighters.length)
  })

  test("action bar: actions, combos with the partner, and pass", () => {
    const { hud, c, eva } = activeHud()
    const events: string[] = []
    hud.on("action", (id) => events.push(id))
    hud.on("pass", () => events.push("pass"))
    hud.setActions(eva, c, null)
    const bar = hud.container.children[3] as Container
    const all = buttons(bar)
    // 3 actions + 1 combo (Merlin on her cell) + pass
    expect(all).toHaveLength(eva.actions.length + 2)
    for (const b of all) b.emit("pointertap", {} as any)
    expect(events).toEqual([
      ...eva.actions.map((a) => a.id),
      "combo:arrow:merlin",
      "pass",
    ])
  })

  test("action bar while someone else plays", () => {
    const { hud, c } = activeHud()
    hud.setActions(null, c, null)
    const bar = hud.container.children[3] as Container
    expect(texts(bar).join()).toContain("réfléchit")
  })

  test("character card lists stats and statuses", () => {
    const { hud, c, eva } = activeHud()
    eva.statuses.push({ id: "poisoned", turns: 2, value: 4 })
    hud.setCard(eva, c)
    const card = texts(hud.container.children[1] as Container).join(" ")
    expect(card).toContain("Eva")
    expect(card).toContain("Empoisonné")
    hud.setCard(null, c)
    expect((hud.container.children[1] as Container).children).toHaveLength(0)
  })

  test("character card shows water traits and swimming fatigue", () => {
    const c = new Combat({
      seed: 1,
      board: Board.fromAscii([".www.", "....."]),
      teams: [
        { controller: "human", fighters: ["nerea", "eva", "brutus"] },
        { controller: "ai", fighters: ["gorr"] },
      ],
      positions: [
        [
          { x: 0, y: 1 },
          { x: 2, y: 0 },
          { x: 0, y: 0 },
        ],
        [{ x: 4, y: 1 }],
      ],
    })
    const [nerea, eva, brutus] = c.fighters
    const hud = mount(new Hud())
    const card = () => texts(hud.container.children[1] as Container).join(" ")
    hud.setCard(nerea, c)
    expect(card()).toContain("Aquatique")
    hud.setCard(eva, c)
    expect(card()).toContain("Nageur")
    expect(card()).toContain("+50 %")
    hud.setCard(brutus, c)
    expect(card()).not.toContain("Nage")
  })

  test("divine panel: buttons enabled only with enough energy", () => {
    const { hud, c } = activeHud()
    const events: string[] = []
    hud.on("divine", (id) => events.push(id))
    c.teams[0].energy = 3
    hud.setDivine(c, 0, true, null)
    const panel = hud.container.children[2] as Container
    for (const b of buttons(panel)) b.emit("pointertap", {} as any)
    expect(events).toEqual(["timeWarp"]) // only 3 energy
  })

  test("tooltips, log, banner, speed and end screen", () => {
    const { hud } = activeHud()
    hud.showTooltip("Bonjour", { x: 10, y: 10 })
    hud.showTooltipAt("Salut", { x: 10, y: 10 })
    hud.hideTooltip()
    for (let i = 0; i < 10; i++) hud.log(`ligne ${i}`)
    const log = texts(hud.container).find((t) => t.startsWith("ligne"))!
    expect(log.split("\n")).toHaveLength(7)
    hud.banner("Coucou")
    tick(hud, 2000)
    hud.setSpeed(2)
    expect(texts(hud.container)).toContain("Vitesse x2")
    const events: string[] = []
    hud.on("restart", () => events.push("restart"))
    hud.showEnd("Victoire !", 0xffe066)
    const end = hud.container.children.at(-1) as Container
    for (const b of buttons(end)) b.emit("pointertap", {} as any)
    expect(events).toEqual(["restart"])
  })

  test("action descriptions mention height, line of sight, cost and combos", () => {
    const c = combat()
    const [eva] = c.fighters
    const arrow = describeAction(ACTIONS.arrow, c, eva)
    expect(arrow).toContain("par niveau")
    expect(arrow).toContain("ligne de vue")
    expect(arrow).toContain("coût")
    expect(describeAction(ACTIONS.warCry, c, eva)).toContain("Sur soi")
    const combo = describeAction(
      comboAction(CHARACTERS.eva, CHARACTERS.merlin),
      c,
      eva,
    )
    expect(combo).toContain("Action combinée")
  })
})

test("hovering buttons and timeline slots shows tooltips", () => {
  const { hud, c, eva } = activeHud()
  hud.setTimeline(c)
  hud.setActions(eva, c, null)
  hud.setDivine(c, 0, true, null)
  const tooltip = () => hud.container.children.at(-2) as Container
  for (const index of [0, 2, 3]) {
    const zone = hud.container.children[index] as Container
    for (const node of zone.children.filter((n) => n.eventMode === "static")) {
      node.emit("pointerover", {} as any)
      expect(tooltip().visible).toBe(true)
      node.emit("pointerout", {} as any)
      expect(tooltip().visible).toBe(false)
    }
  }
  // the speed label is clickable
  const events: string[] = []
  hud.on("speed", () => events.push("speed"))
  const speed = hud.container.children.find(
    (n) => n instanceof Text && n.eventMode === "static",
  )!
  speed.emit("pointertap", {} as any)
  expect(events).toEqual(["speed"])
})

describe("Backdrop and Gallery", () => {
  test("backdrop fills the screen and its motes loop", () => {
    const backdrop = mount(new Backdrop())
    tick(backdrop, 60_000, 100)
    expect(backdrop.container.children.length).toBeGreaterThan(40)
  })

  test("gallery shows every puppet in 4 facings and cycles animations", () => {
    const gallery = mount(new Gallery())
    tick(gallery, 12_000, 50)
    const puppets = gallery.container.children.filter(
      (c) => c.constructor.name === "Puppet",
    )
    expect(puppets).toHaveLength(Object.keys(CHARACTERS).length * 4)
  })
})
