export enum CharacterClass {
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

export enum CharacterRace {
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

export enum CharacterSkill {
  /**
   * Speed is the ability to move quickly <br>
   * Used for movement and action durations in timeline.
   */
  SPEED = "speed",

  /**
   * Scope is the ability to see far <br>
   * Used for vision and range of character base-attack.
   */
  SCOPE = "scope",

  /**
   * Health is the vitality of the character
   */
  HEALTH = "health",

  PHYSICAL_DAMAGE = "physicalDamage",
  MAGICAL_DAMAGE = "magicalDamage",
  PHYSICAL_RESISTANCE = "physicalResistance",
  MAGICAL_RESISTANCE = "magicalResistance",

  /**
   * Luck is the ability to get lucky <br>
   * Used for random events like critical hits.
   */
  LUCK = "luck",

  /**
   * Charisma is the ability to influence others <br>
   * Used for social interactions.
   */
  CHARISMA = "charisma",

  /**
   * Intelligence is the ability to learn, remember, and solve problems <br>
   * Used for building, knowledge and logic.
   */
  INTELLIGENCE = "intelligence",
}

export enum CharacterBehavior {
  STANDARD = "standard",
}

export enum Direction {
  N = 0,
  E = 1,
  S = 2,
  W = 3,
}
