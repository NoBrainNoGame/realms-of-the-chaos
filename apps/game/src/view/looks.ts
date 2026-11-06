/**
 * What a preset id looks like. A custom character (id "custom:name") looks
 * like the kit it was built from, unless it has a modular look (then `modularLookOf` gives it). Every
 * place that picks art from a preset id goes through `lookOf`.
 */
import {
  CHARACTERS,
  type CharacterPreset,
  type CustomLook,
  customPreset,
  scarredFighter,
} from "@realms/engine"
import { allowance, customById, isCustomId, scarCount } from "../storage"

const looks = new Map<string, string>()
const modular = new Map<string, CustomLook | undefined>()

/**
 * Remembers the look of a custom preset (called where it is used): the art
 * of its kit, and its modular look when it has one.
 */
export function registerLook(presetId: string, kit: string, look?: CustomLook) {
  looks.set(presetId, kit)
  modular.set(presetId, look)
}

/**
 * The modular look of a custom preset id, if it has one (the saved
 * character wins over what was registered, so an edit shows at once).
 */
export function modularLookOf(presetId: string): CustomLook | undefined {
  if (!isCustomId(presetId)) return undefined
  const stored = customById(presetId)
  if (stored) return stored.look
  return modular.get(presetId)
}

/** The art id (a reference character) of any preset id. */
export function lookOf(presetId: string): string {
  if (!isCustomId(presetId)) return presetId
  const known = looks.get(presetId)
  if (known) return known
  const stored = customById(presetId)
  if (stored) {
    looks.set(presetId, stored.kit)
    return stored.kit
  }
  return Object.keys(CHARACTERS)[0]
}

/**
 * Fighters of a team: the reference characters stay ids, the saved custom
 * characters become their preset (and their look is registered). A custom
 * character that no longer exists is skipped.
 */
export function resolveFighters(ids: string[]): (string | CharacterPreset)[] {
  const out: (string | CharacterPreset)[] = []
  for (const id of ids) {
    if (!isCustomId(id)) {
      // offline modes play the characters as the scars left them (online
      // play, one day, stays canonical)
      out.push(scarredFighter(id, scarCount()))
      continue
    }
    const stored = customById(id)
    if (!stored) continue
    registerLook(id, stored.kit, stored.look)
    out.push(customPreset(stored, allowance()))
  }
  return out
}
