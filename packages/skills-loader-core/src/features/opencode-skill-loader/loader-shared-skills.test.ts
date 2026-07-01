import { describe, it, expect } from "bun:test"
import { loadSharedSkills } from "./loader"

describe("loadSharedSkills", () => {
  it("returns command definitions for shared skills with bare and shared/ alias names", async () => {
    // when
    const commands = await loadSharedSkills()

    // then
    expect(commands["ulw-research"]).toBeDefined()
    expect(commands["ulw-research"].description).toContain("Maximum-saturation")
    expect(commands["ulw-research"].template).toContain("<skill-instruction>")
    expect(commands["ulw-research"].template).toContain("$ARGUMENTS")

    expect(commands["shared/ulw-research"]).toBeDefined()
    expect(commands["shared/ulw-research"].description).toContain("Maximum-saturation")
    expect(commands["shared/ulw-research"].template).toContain("<skill-instruction>")

    expect(commands["ulw-research"].name).toBeUndefined()
    expect(commands["ulw-research"].argumentHint).toBeUndefined()
  })

  it("includes a stable set of pure shared skills", async () => {
    // when
    const commands = await loadSharedSkills()

    // then
    expect(commands["ulw-plan"]).toBeDefined()
    expect(commands["ultimate-browsing"]).toBeDefined()
    expect(commands["programming"]).toBeDefined()
    expect(commands["ast-grep"]).toBeDefined()
    expect(commands["debugging"]).toBeDefined()
    expect(commands["frontend"]).toBeDefined()
    expect(commands["git-master"]).toBeDefined()
    expect(commands["init-deep"]).toBeDefined()
    expect(commands["review-work"]).toBeDefined()
    expect(commands["coding-agent-sessions"]).toBeDefined()
    expect(commands["visual-qa"]).toBeDefined()
  })
})
