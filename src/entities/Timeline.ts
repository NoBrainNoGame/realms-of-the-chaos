import * as booyah from "@ghom/booyah"

/**
 * Represents the turn timeline.
 * Includes all actions of all characters or players.
 * Includes all effects and animations of all actions.
 * Includes waitForPlayerAction too.
 * It is terminated only if all actions are terminated.
 */
export default class Timeline extends booyah.Composite {
  protected _onActivate() {}
}
