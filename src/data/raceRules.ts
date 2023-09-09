/**
 * Contains all the race rules like race-based actions, race-based stat modifiers, etc.
 */
import * as booyah from "@ghom/booyah"
import * as enums from "../enums"

import Rules from "../entities/Rules"

interface RaceRules extends Rules {
  race: enums.CharacterRace
}

const raceRules = {
  [enums.CharacterRace.RESILIENT_HUMAN]: {
    race: enums.CharacterRace.RESILIENT_HUMAN,
    actions: [],
    advantagedSkills: [],
    disadvantagedSkills: [],
    expCurve: booyah.linear,
  },
  [enums.CharacterRace.REBEL_NEPHILIM]: {
    race: enums.CharacterRace.REBEL_NEPHILIM,
    actions: [],
    advantagedSkills: [],
    disadvantagedSkills: [],
    expCurve: booyah.linear,
  },
  [enums.CharacterRace.AVENGER_GHOST]: {
    race: enums.CharacterRace.AVENGER_GHOST,
    actions: [],
    advantagedSkills: [],
    disadvantagedSkills: [],
    expCurve: booyah.linear,
  },
  [enums.CharacterRace.EMERGING_MAGICAL_CREATURE]: {
    race: enums.CharacterRace.EMERGING_MAGICAL_CREATURE,
    actions: [],
    advantagedSkills: [],
    disadvantagedSkills: [],
    expCurve: booyah.linear,
  },
  [enums.CharacterRace.ENHANCED_CYBORG]: {
    race: enums.CharacterRace.ENHANCED_CYBORG,
    actions: [],
    advantagedSkills: [],
    disadvantagedSkills: [],
    expCurve: booyah.linear,
  },
  [enums.CharacterRace.FALLEN_ELEMENTAL]: {
    race: enums.CharacterRace.FALLEN_ELEMENTAL,
    actions: [],
    advantagedSkills: [],
    disadvantagedSkills: [],
    expCurve: booyah.linear,
  },
  [enums.CharacterRace.MECHANICAL_GNOME]: {
    race: enums.CharacterRace.MECHANICAL_GNOME,
    actions: [],
    advantagedSkills: [],
    disadvantagedSkills: [],
    expCurve: booyah.linear,
  },
  [enums.CharacterRace.MUTANT_GHOUL]: {
    race: enums.CharacterRace.MUTANT_GHOUL,
    actions: [],
    advantagedSkills: [],
    disadvantagedSkills: [],
    expCurve: booyah.linear,
  },
  [enums.CharacterRace.RELEASED_DEMON]: {
    race: enums.CharacterRace.RELEASED_DEMON,
    actions: [],
    advantagedSkills: [],
    disadvantagedSkills: [],
    expCurve: booyah.linear,
  },
  [enums.CharacterRace.TRANSFORMED_ANTHROPOMORPHIC]: {
    race: enums.CharacterRace.TRANSFORMED_ANTHROPOMORPHIC,
    actions: [],
    advantagedSkills: [],
    disadvantagedSkills: [],
    expCurve: booyah.linear,
  },
} satisfies Record<enums.CharacterRace, RaceRules>
