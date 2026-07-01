import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { applyCommandConfig } from "./command-config-handler";
import {
  createCommandConfigTestHarness,
  createPluginComponentsFixture,
  createPluginConfigFixture,
  type CommandConfigTestHarness,
} from "./command-config-handler-test-support";

describe("applyCommandConfig shared skills", () => {
  let harness: CommandConfigTestHarness;

  beforeEach(() => {
    harness = createCommandConfigTestHarness();
  });

  afterEach(() => {
    harness.restore();
  });

  test("includes host config skills declared in config.skills.paths by other plugins", async () => {
    // given
    harness.discoverConfigSourceSkillsSpy
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          name: "host-config-skill",
          definition: {
            name: "host-config-skill",
            description: "Host config skill",
            template: "template",
          },
          scope: "config",
        },
      ]);
    const config: Record<string, unknown> = {
      command: {},
      skills: { paths: ["/host/skills"] },
    };

    // when
    await applyCommandConfig({
      config,
      pluginConfig: createPluginConfigFixture(),
      ctx: { directory: "/tmp" },
      pluginComponents: createPluginComponentsFixture(),
    });

    // then
    const commandConfig = config.command as Record<string, { description?: string }>;
    expect(commandConfig["host-config-skill"]?.description).toContain("Host config skill");
  });

  test("includes shared skills as slash commands", async () => {
    // given
    harness.loadSharedSkillsSpy.mockResolvedValue({
      "ulw-research": {
        description: "(shared - Skill) Ultra research",
        template: "<skill-instruction>Research</skill-instruction>\n\n<user-request>\n$ARGUMENTS\n</user-request>",
      },
    });
    const config: Record<string, unknown> = { command: {} };

    // when
    await applyCommandConfig({
      config,
      pluginConfig: createPluginConfigFixture(),
      ctx: { directory: "/tmp" },
      pluginComponents: createPluginComponentsFixture(),
    });

    // then
    const commandConfig = config.command as Record<string, { description?: string }>;
    expect(commandConfig["ulw-research"]?.description).toContain("Ultra research");
  });


  test("builtin skills override shared skills with the same name", async () => {
    // given
    harness.loadBuiltinCommandsSpy.mockReturnValue({
      "init-deep": {
        name: "init-deep",
        description: "(builtin) Initialize hierarchical AGENTS.md",
        template: "builtin command template",
      },
    });
    harness.loadSharedSkillsSpy.mockResolvedValue({
      "init-deep": {
        description: "(shared - Skill) Shared init-deep",
        template: "shared template",
      },
    });
    const config: Record<string, unknown> = { command: {} };

    // when
    await applyCommandConfig({
      config,
      pluginConfig: createPluginConfigFixture(),
      ctx: { directory: "/tmp" },
      pluginComponents: createPluginComponentsFixture(),
    });

    // then
    const commandConfig = config.command as Record<string, { template?: string }>;
    expect(commandConfig["init-deep"]?.template).toBe("builtin command template");
  });

  test("disabled shared skills are not registered as commands", async () => {
    // given
    harness.loadSharedSkillsSpy.mockResolvedValue({
      "ulw-research": {
        description: "(shared - Skill) Ultra research",
        template: "<skill-instruction>Research</skill-instruction>",
      },
      "shared/ulw-research": {
        description: "(shared - Skill) Ultra research",
        template: "<skill-instruction>Research</skill-instruction>",
      },
    });
    const pluginConfig = {
      ...createPluginConfigFixture(),
      disabled_skills: ["shared/ulw-research"],
    };
    const config: Record<string, unknown> = { command: {} };

    // when
    await applyCommandConfig({
      config,
      pluginConfig,
      ctx: { directory: "/tmp" },
      pluginComponents: createPluginComponentsFixture(),
    });

    // then
    const commandConfig = config.command as Record<string, unknown>;
    expect(commandConfig["ulw-research"]).toBeUndefined();
    expect(commandConfig["shared/ulw-research"]).toBeUndefined();

    const controlConfig: Record<string, unknown> = { command: {} };
    await applyCommandConfig({
      config: controlConfig,
      pluginConfig: createPluginConfigFixture(),
      ctx: { directory: "/tmp" },
      pluginComponents: createPluginComponentsFixture(),
    });
    const controlCommandConfig = controlConfig.command as Record<string, unknown>;
    expect(controlCommandConfig["ulw-research"]).toBeDefined();
    expect(controlCommandConfig["shared/ulw-research"]).toBeDefined();
  });
});
