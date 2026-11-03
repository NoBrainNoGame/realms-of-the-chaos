import * as booyah from "@ghom/booyah"
import { Graphics, Text } from "pixi.js"

import { CHARACTERS } from "@realms/engine"
import ViewChip from "./ViewChip"
import { Puppet, type Facing, type PuppetAction } from "./Puppet"
import { FONT } from "./theme"

const FACINGS: Facing[] = ["SE", "SW", "NE", "NW"]
const ACTIONS: (PuppetAction | "walk" | "idle")[] = [
  "idle",
  "walk",
  "melee",
  "shoot",
  "cast",
  "roar",
  "hit",
]

/**
 * Dev page (`?gallery`): every puppet in its 4 facings, cycling through
 * its animations, to check the art without playing.
 */
interface GalleryEvents extends booyah.BaseCompositeEvents {
  back: []
}

export default class Gallery extends ViewChip<GalleryEvents> {
  private _puppets: Puppet[] = []
  private _time = 0
  private _label!: Text

  protected _onActivate() {
    const ids = Object.keys(CHARACTERS)
    const scale = 1.7
    ids.forEach((id, row) => {
      FACINGS.forEach((facing, col) => {
        const x = 160 + col * 130
        const y = 120 + row * 112
        const shadow = new Graphics()
          .ellipse(x, y, 15 * scale, 6.5 * scale)
          .fill({ color: 0x000000, alpha: 0.35 })
        const puppet = new Puppet(id)
        puppet.setFacing(facing)
        puppet.scale.set(scale)
        puppet.position.set(x, y)
        this._container.addChild(shadow, puppet)
        this._puppets.push(puppet)
      })
      const name = new Text({
        text: CHARACTERS[id].name,
        style: { fontFamily: FONT, fontSize: 18, fill: 0xffffff },
      })
      name.position.set(10, 90 + row * 112)
      this._container.addChild(name)
    })
    this._label = new Text({
      text: "",
      style: { fontFamily: FONT, fontSize: 22, fill: 0xffe066 },
    })
    this._label.position.set(10, 10)
    const back = new Text({
      text: "← Retour (Échap)",
      style: { fontFamily: FONT, fontSize: 16, fill: 0x9d92b8 },
    })
    back.position.set(320, 14)
    back.eventMode = "static"
    back.cursor = "pointer"
    back.on("pointertap", () => this.emit("back"))
    this._container.addChild(this._label, back)
    this._subscribe(window, "keydown", (e: KeyboardEvent) => {
      if (e.key === "Escape") this.emit("back")
    })
  }

  protected _onTick() {
    const dt = this._lastTickInfo.timeSinceLastTick
    const previous = Math.floor(this._time / 1500)
    this._time += dt
    const index = Math.floor(this._time / 1500)
    const action = ACTIONS[index % ACTIONS.length]
    this._label.text = `Animation : ${action}`
    if (index !== previous) {
      for (const p of this._puppets) {
        if (action === "walk") p.walk(1500)
        else if (action !== "idle") p.act(action, 900)
      }
    }
    for (const p of this._puppets) p.update(dt)
  }
}
