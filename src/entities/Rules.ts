import { CharacterActionOptions } from "./CharacterAction"

import * as enums from "../enums"

export default interface Rules {
  actions: CharacterActionOptions[]
  advantagedSkills?: enums.CharacterSkill[]
  disadvantagedSkills?: enums.CharacterSkill[]
  expCurve: (x: number) => number
}
