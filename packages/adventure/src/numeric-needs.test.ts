import { describe, expect, test } from "bun:test"
import { resolveFight } from "./entries"

describe("numeric needs", () => {
  test("a flag compared with >= and <= picks the rules", () => {
    const spec = {
      rules: {},
      rulesIf: [{ needs: "z<=1", rules: { silentDamage: 9 } }],
      teams: [],
    } as never
    expect(resolveFight(spec, () => 1).rules.silentDamage).toBe(9)
    expect(resolveFight(spec, () => 3).rules.silentDamage).toBeUndefined()
  })
})
