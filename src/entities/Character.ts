import * as utils from "../utils"

import ContainerChip from "../parents/ContainerChip"

enum CharacterClass {
  WARRIOR = "warrior",
  ARCHER = "archer",
  MAGE = "mage",
  THIEF = "thief",
  HEALER = "healer",
  TANK = "tank",
  ENGINEER = "engineer",
  ASSASSIN = "assassin",
  SCOUT = "scout",
  HUNTER = "hunter",
  SCIENTIST = "scientist",
  PIRATE = "pirate",
  BARD = "bard",
}

enum CharacterRace {
  RESILIENT_HUMAN = "resilientHuman",
  FALLEN_ELEMENTAL = "fallenElemental",
  REBEL_NEPHILIM = "rebelNephilim",
  MUTANT_GHOUL = "mutantGhoul",
  ENHANCED_CYBORG = "enhancedCyborg",
  EMERGING_MAGICAL_CREATURE = "emergingMagicalCreature",
  AVENGER_GHOST = "avengerGhost",
  TRANSFORMED_ANTHROPOMORPHIC = "transformedAnthropomorphic",
  RELEASED_DEMON = "releasedDemon",
  MECHANICAL_GNOME = "mechanicalGnome",
}

enum CharacterSkill {
  /**
   * Strength is the ability to exert force, lift heavy objects, and break things. <br>
   * Used for melee attacks and buildings.
   */
  STRENGTH = "strength",

  /**
   * Power is the ability to cast spells, use magical items <br>
   * Used for magical attacks.
   */
  POWER = "power",

  /**
   * Dexterity is the ability to move quickly, dodge attacks <br>
   */
  DEXTERITY = "dexterity",

  /**
   * Constitution is the ability to resist damage, heal wounds <br>
   */
  CONSTITUTION = "constitution",

  /**
   * Intelligence is the ability to learn, remember, and solve problems <br>
   * Used for building, knowledge and logic.
   */
  INTELLIGENCE = "intelligence",

  /**
   * Wisdom is the ability to perceive and understand <br>
   * Used for perception and insight.
   */
  WISDOM = "wisdom",

  /**
   * Charisma is the ability to influence others <br>
   * Used for social interactions.
   */
  CHARISMA = "charisma",

  /**
   * Luck is the ability to get lucky <br>
   * Used for random events like critical hits.
   */
  LUCK = "luck",

  /**
   * Magical Resistance is the ability to resist magical attacks <br>
   * Used for magical defense.
   */
  MAGICAL_RESISTANCE = "magicalResistance",

  /**
   * Physical Resistance is the ability to resist physical attacks <br>
   * Used for physical defense.
   */
  PHYSICAL_RESISTANCE = "physicalResistance",

  /**
   * Speed is the ability to move quickly <br>
   * Used for movement and action durations in timeline.
   */
  SPEED = "speed",

  /**
   * Stealth is the ability to hide and move silently <br>
   * Used for stealth actions.
   */
  STEALTH = "stealth",

  /**
   * Perception is the ability to notice things <br>
   * Used for perception actions.
   */
  PERCEPTION = "perception",
}

interface CharacterProperties {
  name: string
  class: CharacterClass
  race: CharacterRace
  level: number
  distribution: Partial<Record<CharacterSkill, number>>
}

export default class Character extends ContainerChip {
  private _fightProperties: CharacterProperties

  constructor(private _baseProperties: CharacterProperties) {
    super()

    this._fightProperties = utils.clone(this._baseProperties)
  }
}
