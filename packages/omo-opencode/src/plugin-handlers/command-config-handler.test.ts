import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import type { OhMyOpenCodeConfig } from "../config";
import { applyCommandConfig } from "./command-config-handler";
import {
  getAgentDisplayName,
  getAgentListDisplayName,
} from "../shared/agent-display-names";
import {
  createCommandConfigTestHarness,
  createPluginComponentsFixture,
  createPluginConfigFixture,
  type CommandConfigTestHarness,
} from "./command-config-handler-test-support";

describe("applyCommandConfig", () => {
  let harness: CommandConfigTestHarness;

  beforeEach(() => {
    harness = createCommandConfigTestHarness();
  });

  afterEach(() => {
    harness.restore();
  });

  test("includes .agents skills in command config", async () => {
    // given
    harness.loadProjectAgentsSkillsSpy.mockResolvedValue({
      "agents-project-skill": {
        description: "(project - Skill) Agents project skill",
        template: "template",
      },
    });
    harness.loadGlobalAgentsSkillsSpy.mockResolvedValue({
      "agents-global-skill": {
        description: "(user - Skill) Agents global skill",
        template: "template",
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
    expect(commandConfig["agents-project-skill"]?.description).toContain("Agents project skill");
    expect(commandConfig["agents-global-skill"]?.description).toContain("Agents global skill");
  });

  test("normalizes Atlas command agents to the runtime list name used by opencode command routing", async () => {
    // given
    harness.loadBuiltinCommandsSpy.mockReturnValue({
      "start-work": {
        name: "start-work",
        description: "(builtin) Start work",
        template: "template",
        agent: "atlas",
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
    const commandConfig = config.command as Record<string, { agent?: string }>;
    expect(commandConfig["start-work"]?.agent).toBe(getAgentListDisplayName("atlas"));
  });

  test("normalizes legacy display-name command agents to the runtime list name", async () => {
    // given
    harness.loadBuiltinCommandsSpy.mockReturnValue({
      "start-work": {
        name: "start-work",
        description: "(builtin) Start work",
        template: "template",
        agent: getAgentDisplayName("atlas"),
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
    const commandConfig = config.command as Record<string, { agent?: string }>;
    expect(commandConfig["start-work"]?.agent).toBe(getAgentListDisplayName("atlas"));
  });

  test("registers builtin skills like init-deep and security-review as opencode commands", async () => {
    // given
    const config: Record<string, unknown> = { command: {} };

    // when
    await applyCommandConfig({
      config,
      pluginConfig: createPluginConfigFixture(),
      ctx: { directory: "/tmp" },
      pluginComponents: createPluginComponentsFixture(),
    });

    // then
    const commandConfig = config.command as Record<string, { description?: string; template?: string }>;
    expect(commandConfig["init-deep"]?.description).toContain("Initialize hierarchical AGENTS.md");
    expect(commandConfig["init-deep"]?.template).toContain("<skill-instruction>");
    expect(commandConfig["init-deep"]?.template).toContain("$ARGUMENTS");
    expect(commandConfig["security-review"]?.template).toContain("<skill-instruction>");
    expect(commandConfig["team-mode"]).toBeUndefined();
  });

  test("keeps the builtin command definition when a builtin skill shares its name", async () => {
    // given
    harness.loadBuiltinCommandsSpy.mockReturnValue({
      "remove-ai-slops": {
        name: "remove-ai-slops",
        description: "(builtin) Remove AI-generated code smells from branch changes and critically review the results",
        template: "builtin command template",
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
    expect(commandConfig["remove-ai-slops"]?.template).toBe("builtin command template");
  });

  test("excludes builtin skills disabled via disabled_skills from the command config", async () => {
    // given
    const pluginConfig: OhMyOpenCodeConfig = {
      ...createPluginConfigFixture(),
      disabled_skills: ["init-deep"],
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
    const commandConfig = config.command as Record<string, { template?: string }>;
    expect(commandConfig["init-deep"]).toBeUndefined();
    expect(commandConfig["security-review"]?.template).toContain("<skill-instruction>");
  });

  test("excludes builtin skills whose MCP servers already exist in the system MCP config", async () => {
    // given
    harness.getSystemMcpServerNamesSpy.mockReturnValue(new Set(["playwright"]));
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
    expect(commandConfig["playwright"]).toBeUndefined();
    expect(commandConfig["init-deep"]?.template).toContain("<skill-instruction>");
  });

});
