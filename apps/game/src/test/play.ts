/**
 * Drive a FightScene's local teams like a player would: the AI brain picks
 * the moves, and they are sent as commands through the scene's input path.
 */
import { decide, type Command } from "@realms/engine"
import type FightScene from "../view/FightScene"

/** Tick the scene until `done` (or a time limit, in simulated ms). */
export function tickUntil(
  scene: FightScene,
  done: () => boolean,
  maxMs = 900_000,
) {
  for (let t = 0; t < maxMs && !done(); t += 50) {
    scene.tick({ timeSinceLastTick: 50 })
  }
}

/** Play every local turn with the AI until the fight is over. */
export function playLocally(scene: FightScene, maxTurns = 3000) {
  const internals = scene as any
  const over = () => scene.combat.state === "ended"
  for (let turn = 0; turn < maxTurns && !over(); turn++) {
    tickUntil(scene, () => internals._inputReady || over())
    if (over()) break
    const me = scene.combat.activeFighter!
    let ended = false
    for (const step of decide(scene.combat, me)) {
      const command: Command =
        step.type === "move"
          ? { type: "moveTo", fighterId: me.id, destination: step.destination }
          : step.type === "action"
            ? {
                type: "useAction",
                fighterId: me.id,
                actionId: step.actionId,
                target: step.target,
              }
            : { type: "pass", fighterId: me.id }
      internals._command(command)
      tickUntil(scene, () => !internals._playing && !internals._pending)
      if (command.type !== "moveTo") ended = true
      if (over() || scene.combat.activeFighter !== me) break
    }
    if (!ended && !over() && scene.combat.activeFighter === me) {
      internals._command({ type: "pass", fighterId: me.id })
    }
  }
  tickUntil(scene, () => internals._endShown && !internals._playing)
}
