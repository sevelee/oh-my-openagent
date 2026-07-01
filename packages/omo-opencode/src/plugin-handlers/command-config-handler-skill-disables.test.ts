import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import type { LoadedSkill } from "../features/opencode-skill-loader/types";
import { applyCommandConfig } from "./command-config-handler";
import {
  createCommandConfigTestHarness,
  createParsedPluginConfigFixture,
  createPluginComponentsFixture,
  createPluginConfigFixture,
  type CommandConfigTestHarness,
} from "./command-config-handler-test-support";

describe("applyCommandConfig skill disabling", () => {
  let harness: CommandConfigTestHarness;

  beforeEach(() => {
    harness = createCommandConfigTestHarness();
  });

  afterEach(() => {
    harness.restore();
  });

  test("#given disabled_commands contains remove-ai-slops #when applying command config #then the skill-backed command does not resurrect", async () => {
    // given
    const pluginConfig = {
      ...createPluginConfigFixture(),
      disabled_commands: ["remove-ai-slops"],
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
    expect(commandConfig["remove-ai-slops"]).toBeUndefined();

    const controlConfig: Record<string, unknown> = { command: {} };
    await applyCommandConfig({
      config: controlConfig,
      pluginConfig: createPluginConfigFixture(),
      ctx: { directory: "/tmp" },
      pluginComponents: createPluginComponentsFixture(),
    });
    const controlCommandConfig = controlConfig.command as Record<string, unknown>;
    expect(controlCommandConfig["remove-ai-slops"]).toBeDefined();
  });

  test("#given disabled_skills contains debugging #then no /debugging command registers", async () => {
    // given
    const pluginConfig = {
      ...createPluginConfigFixture(),
      disabled_skills: ["debugging"],
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
    expect(commandConfig["debugging"]).toBeUndefined();

    const controlConfig: Record<string, unknown> = { command: {} };
    await applyCommandConfig({
      config: controlConfig,
      pluginConfig: createPluginConfigFixture(),
      ctx: { directory: "/tmp" },
      pluginComponents: createPluginComponentsFixture(),
    });
    const controlCommandConfig = controlConfig.command as Record<string, unknown>;
    expect(controlCommandConfig["debugging"]).toBeDefined();
  });

  for (const [label, skills] of [
    ["skills.disable", { disable: ["debugging"] }],
    ["skills.<name>: false", { debugging: false }],
    ["skills.<name>.disable: true", { debugging: { disable: true } }],
  ] as const) {
    test(`#given ${label} disables debugging #then no /debugging command registers`, async () => {
      // given
      const pluginConfig = createParsedPluginConfigFixture({ skills });
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
      expect(commandConfig["debugging"]).toBeUndefined();
    });
  }

  test("#given mixed-case config-source skill disabled by skills.disable #then no hostile slash command registers", async () => {
    // given
    const poisonedSkill: LoadedSkill = {
      name: "Project-Poison",
      definition: {
        name: "Project-Poison",
        description: "HOSTILE DESCRIPTION TEXT should never reach command config",
        template: "poisoned template",
      },
      scope: "config",
    };
    harness.discoverConfigSourceSkillsSpy.mockResolvedValueOnce([poisonedSkill]).mockResolvedValueOnce([]);
    const pluginConfig = createParsedPluginConfigFixture({
      skills: { disable: ["project-poison"] },
    });
    const config: Record<string, unknown> = { command: {} };

    // when
    await applyCommandConfig({
      config,
      pluginConfig,
      ctx: { directory: "/tmp/project" },
      pluginComponents: createPluginComponentsFixture(),
    });

    // then
    const commandConfig = config.command as Record<string, unknown>;
    expect(commandConfig["Project-Poison"]).toBeUndefined();
    expect(JSON.stringify(commandConfig)).not.toContain("HOSTILE DESCRIPTION TEXT");
  });
});
