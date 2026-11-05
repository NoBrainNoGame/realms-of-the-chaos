import { describe, expect, test } from "bun:test"
import { ACTIONS, Board, CHARACTERS, Combat, comboAction } from "@realms/engine"
import { Container, Text } from "pixi.js"
import { mount, tick } from "../test/harness"
import Backdrop from "./Backdrop"
import { describeStats } from "./describe"
import Gallery from "./Gallery"
import Hud, { describeAction } from "./Hud"
import { MEANING } from "./theme"
import { markup, plain, richText } from "./ui"

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

  test("action bar: the suggested buttons glow; with a walk, Passer is Avancer", () => {
    const { hud, c, eva } = activeHud()
    const bar = () => hud.container.children[3] as Container
    const halo = (b: Container) => b.children[0] as Container
    const first = eva.actions[0].id
    hud.setActions(eva, c, null, { actions: [first], pass: false })
    let all = buttons(bar())
    expect(halo(all[0]).visible).toBe(true)
    expect(all.slice(1).map((b) => halo(b).visible)).not.toContain(true)
    expect(texts(bar()).join()).toContain("Passer")

    eva.path = [{ x: 1, y: 0 }]
    hud.setActions(eva, c, null, { actions: [], pass: true })
    all = buttons(bar())
    const pass = all.find((b) => b.label === "pass")!
    expect(halo(pass).visible).toBe(true)
    expect(texts(pass).join()).toContain("Avancer")
    expect(all.filter((b) => halo(b).visible)).toHaveLength(1)
    // it breathes
    const before = halo(pass).alpha
    tick(hud, 300)
    expect(halo(pass).alpha).not.toBe(before)
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
    const log = texts(hud.container).filter((t) => t.startsWith("ligne"))
    expect(log).toHaveLength(7)
    hud.banner("Coucou")
    tick(hud, 2000)
    hud.setSpeed(2)
    expect(texts(hud.container)).toContain("Vitesse x2")
    const events: string[] = []
    hud.on("endAction", (id: string) => events.push(id))
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
    expect(plain(arrow)).toContain("Coût : ")
    expect(describeAction(ACTIONS.warCry, c, eva)).toContain("Sur soi")
    const combo = describeAction(
      comboAction(CHARACTERS.eva, CHARACTERS.merlin),
      c,
      eva,
    )
    expect(combo).toContain("Intrication")
  })

  test("every number of a description wears its meaning color", () => {
    const c = combat()
    const [eva] = c.fighters
    const kinds = (source: string) =>
      markup(source)
        .filter((s) => s.color !== undefined)
        .map((s) => [s.color, s.text] as const)
    const has = (source: string, color: number, pattern: RegExp) =>
      kinds(source).some(([k, t]) => k === color && pattern.test(t))
    const arrow = describeAction(ACTIONS.arrow, c, eva)
    expect(has(arrow, MEANING.damage, /^\d+ dégâts$/)).toBe(true)
    expect(has(arrow, MEANING.range, /Portée 2-6/)).toBe(true)
    expect(has(arrow, MEANING.time, /^\d+ temps$/)).toBe(true)
    const heal = describeAction(ACTIONS.heal, c, eva)
    expect(has(heal, MEANING.heal, /^\+\d+ PV$/)).toBe(true)
    const poison = describeAction(ACTIONS.poisonArrow, c, eva)
    expect(has(poison, MEANING.poison, /-4 PV/)).toBe(true)
    expect(has(poison, MEANING.time, /3 tours/)).toBe(true)
    const bubble = describeAction(ACTIONS.bubble, c, eva)
    expect(has(bubble, MEANING.shield, /12 dégâts/)).toBe(true)
    const bash = describeAction(ACTIONS.shieldBash, c, eva)
    expect(has(bash, MEANING.move, /2 cases/)).toBe(true)
    // the stats of the card
    const stats = describeStats(eva)
    expect(has(stats, MEANING.time, /^\d+$/)).toBe(true) // speed
    expect(has(stats, MEANING.damage, /^\d+$/)).toBe(true) // attacks
    expect(has(stats, MEANING.shield, /^\d+$/)).toBe(true) // defenses
    expect(has(stats, MEANING.luck, /^\d+$/)).toBe(true)
    // no tag is left visible
    for (const text of [arrow, heal, poison, bubble, bash, stats])
      expect(plain(text)).not.toMatch(/\{\w+:/)
  })

  test("rich text: colored parts, lines and wrapping", () => {
    const line = richText("a {damage:12} b\n{heal:+3 PV}", 13)
    const parts = line.children as Text[]
    expect(parts.map((p) => p.text)).toEqual(["a ", "12", " b", "+3 PV"])
    expect(parts[1].style.fill).toBe(MEANING.damage)
    expect(parts[3].y).toBeGreaterThan(parts[0].y)
    // unknown tags stay as they are
    expect(plain("{nope:1}")).toBe("{nope:1}")
    const wrapped = richText("un deux trois quatre cinq six sept", 13, {
      wrap: 60,
    })
    const ys = new Set(wrapped.children.map((c) => c.y))
    expect(ys.size).toBeGreaterThan(1)
    expect(wrapped).toBeInstanceOf(Container)
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
    ;(backdrop as any)._onResize(1280, 720)
    tick(backdrop, 60_000, 100)
    expect(backdrop.motes.length).toBeGreaterThan(40)
    // after a minute, each is still in the void around the board
    for (const mote of backdrop.motes) {
      expect(Math.abs(mote.height)).toBeLessThanOrEqual(40)
      expect(Number.isFinite(mote.sprite.x)).toBe(true)
    }
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

describe("timeline: real durations", () => {
  const setup = () => {
    try {
      localStorage.removeItem("realms.timeline.expanded")
    } catch {}
    const hud = mount(new Hud())
    const c = combat()
    c.run()
    const [eva, merlin, gorr] = c.fighters
    eva.nextActionAt = c.time + 10
    merlin.nextActionAt = c.time + 12 // close to eva: stacked on another row
    gorr.nextActionAt = c.time + 80
    hud.setTimeline(c)
    const timeline = (hud as any)._timeline as Container
    const slots = () =>
      timeline.children.filter(
        (child) => child.eventMode === "static",
      ) as Container[]
    return { hud, c, timeline, slots }
  }

  test("hovering expands it: portraits at their real wait, on a time axis", () => {
    const { hud, timeline, slots } = setup()
    const compact = timeline.width
    expect(hud.timelineExpanded).toBe(false)
    expect(texts(timeline).some((t) => t.includes("durées réelles"))).toBe(true)

    timeline.emit("pointerenter", {} as any)
    expect(hud.timelineExpanded).toBe(true)
    // it grows over half a second, eased
    tick(hud, 100)
    const growing = timeline.width
    expect(growing).toBeGreaterThan(compact)
    expect(hud.timelineExpansion).toBeGreaterThan(0)
    expect(hud.timelineExpansion).toBeLessThan(0.5) // eased: slow start
    tick(hud, 500)
    expect(hud.timelineExpansion).toBe(1)
    expect(timeline.width).toBeGreaterThan(growing)
    const [first, second, third] = slots()
    // spacing follows the waits, not the order
    const gapSmall = second.x - first.x
    const gapBig = third.x - second.x
    expect(gapBig).toBeGreaterThan(gapSmall * 2)
    // a single row, twice as wide as the compact view at least; close
    // turns are pushed apart so portraits never overlap
    expect(second.y).toBe(first.y)
    expect(third.y).toBe(first.y)
    expect(second.x - first.x).toBeGreaterThanOrEqual(44)
    expect(timeline.width).toBeGreaterThanOrEqual(compact * 2 - 4) // borders
    // the axis spans exactly from the first portrait to the last one
    const labels = texts(timeline)
    expect(labels).toContain("10")
    expect(labels).toContain("80")
    expect(labels).not.toContain("maintenant")
    const span = third.x - first.x
    expect(timeline.width).toBeLessThan(span + 44 + 16 + 30)
    expect(third.x - first.x).toBeGreaterThan(timeline.width - 16 - 44 - 4)

    timeline.emit("pointerleave", {} as any)
    expect(hud.timelineExpanded).toBe(false)
    tick(hud, 250)
    expect(timeline.width).toBeGreaterThan(compact)
    tick(hud, 400)
    expect(timeline.width).toBe(compact)
  })

  test("the planned steps: piled per fighter, the farthest not shown", () => {
    const { hud, c, timeline } = setup()
    const [eva, , gorr] = c.fighters
    // eva: a step every few temps, far past the last turn
    eva.position = { x: 0, y: 0 }
    eva.path = Array.from({ length: 14 }, (_, i) => ({ x: i + 1, y: 0 }))
    eva.nextMoveAt = c.time + 10
    gorr.path = [{ x: 7, y: 8 }]
    gorr.nextMoveAt = c.time + 40
    const steps = c.stepTimes(eva)
    expect(steps).toHaveLength(14)
    hud.toggleTimeline()
    tick(hud, 600)
    hud.setTimeline(c)
    const piles = timeline.children.filter((m) => m.label === "step")
    // eva's steps in a row pile up; merlin's turn, gorr's step split them
    expect(piles.length).toBeGreaterThan(2)
    expect(piles.length).toBeLessThan(6)
    expect(texts(timeline).some((t) => /^[2-9]$/.test(t))).toBe(true)
    // her steps after the last turn: not shown, no (+) either
    expect(steps.some((at) => at - c.time > 80)).toBe(true)
    expect(timeline.children.some((m) => m.label === "moreSteps")).toBe(false)
    hud.toggleTimeline()
  })

  test("a fighter pointed at: the rest of the timeline fades to half", () => {
    const { hud, c, timeline, slots } = setup()
    const [eva, merlin] = c.fighters
    eva.position = { x: 0, y: 0 }
    eva.path = [{ x: 1, y: 0 }]
    eva.nextMoveAt = c.time + 20
    hud.toggleTimeline()
    tick(hud, 600)
    hud.setTimeline(c)
    const step = () => timeline.children.find((m) => m.label === "step")!
    const alphas = () =>
      slots()
        .filter((s) => s.label !== "step")
        .map((s) => s.alpha)
    expect(alphas().every((a) => a === 1)).toBe(true)
    hud.setFocus(merlin)
    // merlin's portrait stays, eva's and gorr's (and eva's step) fade
    expect(alphas().filter((a) => a === 1)).toHaveLength(1)
    expect(alphas().filter((a) => a === 0.5)).toHaveLength(2)
    expect(step().alpha).toBeCloseTo(0.5)
    hud.setFocus(eva)
    expect(step().alpha).toBe(1)
    // redrawn: still faded
    hud.setTimeline(c)
    expect(alphas().filter((a) => a === 0.5)).toHaveLength(2)
    hud.setFocus(null)
    expect(alphas().every((a) => a === 1)).toBe(true)
    hud.toggleTimeline()
  })

  test("its tooltips go under it, never over the axis", () => {
    const { hud, timeline, slots } = setup()
    hud.toggleTimeline()
    tick(hud, 600)
    slots()[0].emit("pointerover", {} as any)
    const tooltip = (hud as any)._tooltip as Container
    expect(tooltip.visible).toBe(true)
    const t = timeline.getBounds()
    expect(tooltip.getBounds().y).toBeGreaterThanOrEqual(t.y + t.height)
    hud.toggleTimeline()
  })

  test("a click keeps the expanded view, another one collapses it", () => {
    const { hud, timeline } = setup()
    const lock = () => timeline.children.find((c) => c.label === "lock")
    timeline.emit("pointerenter", {} as any)
    expect(lock()).toBeUndefined() // hovered only: not locked
    timeline.emit("pointertap", {} as any)
    timeline.emit("pointerleave", {} as any)
    expect(hud.timelineExpanded).toBe(true)
    expect(lock()).toBeDefined() // a padlock shows it is locked
    expect(localStorage.getItem("realms.timeline.expanded")).toBe("1")
    // remembered by a new HUD
    const again = mount(new Hud())
    expect(again.timelineExpanded).toBe(true)
    hud.toggleTimeline()
    expect(hud.timelineExpanded).toBe(false)
    expect(lock()).toBeUndefined()
    expect(localStorage.getItem("realms.timeline.expanded")).toBe("0")
  })
})

describe("timeline: where the active fighter lands", () => {
  test("a ghost of the fighter at the wait of the hovered choice", () => {
    const hud = mount(new Hud())
    const c = combat()
    c.run()
    const me = c.activeFighter!
    const others = c.fighters.filter((f) => f !== me)
    others[0].nextActionAt = c.time + 10
    others[1].nextActionAt = c.time + 50
    hud.setTimeline(c)
    expect(hud.landingGhost).toBeNull()

    hud.setLanding({ fighter: me, delay: 30 })
    const ghost = hud.landingGhost!
    expect(ghost).not.toBeNull()
    expect(texts(ghost)).toContain("◌30")
    // between the fighter due at 10 and the one due at 50
    const timeline = (hud as any)._timeline as Container
    const slots = timeline.children.filter(
      (child) => child.eventMode === "static" || child.label === "landing",
    )
    const order = slots.map((slot) => texts(slot as Container).at(-1))
    expect(order).toEqual(["▶", "10", "◌30", "50"])

    hud.setLanding(null)
    expect(hud.landingGhost).toBeNull()
  })
})
