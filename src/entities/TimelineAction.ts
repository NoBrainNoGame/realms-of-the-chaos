import * as booyah from "@ghom/booyah"

interface TimelineActionEvents extends booyah.BaseCompositeEvents {}

/**
 * Represent an action in game, such as moving, attacking, etc.
 * Represent any action effect too.
 * IT is terminated only if all its effects are terminated.
 */
export default class TimelineAction extends booyah.Composite<TimelineActionEvents> {
  protected _onActivate() {}
}
