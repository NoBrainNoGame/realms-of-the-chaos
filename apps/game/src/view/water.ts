import type { Board, Point } from "@realms/engine"
import { Graphics } from "pixi.js"
import type { Puppet } from "./Puppet"

export type WaterState = "dry" | "wading" | "swimming"

/** How far the puppet sinks under the water surface (local pixels). */
export const WATER_DEPTH: Record<WaterState, number> = {
  dry: 0,
  wading: 5,
  swimming: 20,
}

/** Water state of a character standing on a cell (fights and exploration). */
export function waterState(board: Board, cell: Point): WaterState {
  if (board.get(cell)?.terrain !== "water") return "dry"
  return board.isDeepWater(cell) ? "swimming" : "wading"
}

/**
 * How a puppet is drawn in the water: its y offset, whether the lower body is
 * masked at the waterline, and whether it swims. Swimmers and aquatics with a
 * swim form handle their own waterline.
 */
export function waterPose(state: WaterState, hasSwimForm: boolean) {
  const ownShape = state === "swimming" && hasSwimForm
  return {
    y: ownShape ? 0 : WATER_DEPTH[state],
    masked: state !== "dry" && !ownShape,
    swimming: state === "swimming",
    ripple: state !== "dry",
    rippleScale: state === "swimming" ? 1.4 : 1,
    shadow: state === "dry",
  }
}

/** Applies the pose to a puppet and its mask (shared by fights and walks). */
export function applyWaterPose(
  puppet: Puppet,
  state: WaterState,
  mask: Graphics,
  ripple: Graphics,
) {
  const pose = waterPose(state, puppet.hasSwimForm)
  puppet.y = pose.y
  puppet.mask = pose.masked ? mask : null
  mask.visible = pose.masked
  ripple.visible = pose.ripple
  ripple.scale.set(pose.rippleScale)
  puppet.setSwimming(pose.swimming)
  return pose
}

/** The ripple ring drawn at the waterline. */
export const makeRipple = () =>
  new Graphics()
    .ellipse(0, 0, 10, 4)
    .fill({ color: 0x74c0fc, alpha: 0.55 })
    .ellipse(0, 0, 10, 4)
    .stroke({ width: 1, color: 0xe7f5ff, alpha: 0.8 })

/** Everything below the waterline is hidden by this mask. */
export const makeWaterMask = () =>
  new Graphics().rect(-60, -200, 120, 201).fill(0xffffff)
