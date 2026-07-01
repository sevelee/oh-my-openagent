import { describe, it, expect } from "bun:test"
import { loadSharedSkills } from "./loader"

const PURE_SHARED_SKILL_NAMES = [
  "ulw-plan",
  "ultimate-browsing",
  "programming",
  "ast-grep",
  "debugging",
  "frontend",
  "git-master",
  "init-deep",
  "review-work",
  "coding-agent-sessions",
  "visual-qa",
] as const

describe("loadSharedSkills", () => {
  it("returns command definitions for shared skills with bare names only", async () => {
    // when
    const commands = await loadSharedSkills()
    const ulwResearchCommand = commands["ulw-research"]

    // then
    expect(ulwResearchCommand).toBeDefined()
    expect(ulwResearchCommand.description).toContain("Maximum-saturation")
    expect(ulwResearchCommand.template).toContain("<skill-instruction>")
    expect(ulwResearchCommand.template).toContain("$ARGUMENTS")

    expect(commands["shared/ulw-research"]).toBeUndefined()

    expect(ulwResearchCommand.name).toBeUndefined()
    expect(ulwResearchCommand.argumentHint).toBeUndefined()
  })

  it("includes a stable set of pure shared skills", async () => {
    // when
    const commands = await loadSharedSkills()

    // then
    for (const skillName of PURE_SHARED_SKILL_NAMES) {
      expect(commands[skillName]).toBeDefined()
    }
  })
})
