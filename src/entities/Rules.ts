import { CharacterActionOptions } from "./CharacterAction"

import * as enums from "../enums"

export default interface Rules {
  actions: Omit<CharacterActionOptions, "launcher">[]
  advantagedSkills?: enums.CharacterSkill[]
  disadvantagedSkills?: enums.CharacterSkill[]
  expCurve: (x: number) => number
}
