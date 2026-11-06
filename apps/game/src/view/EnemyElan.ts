import { type Combat, MAX_ENERGY } from "@realms/engine"
import { Graphics } from "pixi.js"
import { settings } from "../settings"
import { COLORS, TEAM_COLORS } from "./theme"
import { panel, text } from "./ui"
import ViewChip from "./ViewChip"

/**
 * The Élan of the enemy Ghom (docs/aventure, ch. 5 and 6: the Ghom du Chaos,
 * gauge full, never used). Shown only for the teams whose Ghom is mute
 * (`rules.mute`); a quiet pip bar under the speed and menu buttons.
 */
export default class EnemyElan extends ViewChip {
  private _width = 0

  constructor(private readonly _combat: Combat) {
    super()
  }

  /** The teams whose Ghom is mute in this fight. */
  static teamsOf(combat: Combat): number[] {
    return combat.adventure?.rules.mute ?? []
  }

  protected _onActivate() {
    this._container.eventMode = "none"
    this.refresh()
  }

  /** Draws the gauge again (the Élan of the teams). */
  refresh() {
    for (const c of this._container.removeChildren())
      c.destroy({ children: true })
    const teams = EnemyElan.teamsOf(this._combat)
    let y = 0
    for (const t of teams) {
      const energy = this._combat.teams[t]?.energy ?? 0
      const title = text("Ghom du Chaos", 13, TEAM_COLORS[t] ?? COLORS.energy, {
        fontWeight: "700",
      })
      title.position.set(10, 6 + y)
      const pips = new Graphics()
      for (let i = 0; i < MAX_ENERGY; i++)
        pips
          .roundRect(10 + i * 26, 28 + y, 20, 7, 3)
          .fill(i < energy ? (TEAM_COLORS[t] ?? COLORS.energy) : 0x3a3150)
      const width = Math.ceil(Math.max(title.width + 20, 10 + MAX_ENERGY * 26))
      const box = panel(width, 44, TEAM_COLORS[t])
      box.y = y
      this._container.addChild(box, title, pips)
      this._width = Math.max(this._width, width)
      y += 50
    }
  }

  protected _onResize(width: number, _height: number) {
    const scale = settings().uiSize
    this._container.scale.set(scale)
    this._container.position.set(width - (this._width + 12) * scale, 46 * scale)
  }
}
