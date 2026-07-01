import { spyOn } from "bun:test";

import { OhMyOpenCodeConfigSchema, type OhMyOpenCodeConfig } from "../config";
import * as builtinCommands from "../features/builtin-commands";
import * as commandLoader from "../features/claude-code-command-loader";
import * as mcpLoader from "../features/claude-code-mcp-loader";
import * as skillLoader from "../features/opencode-skill-loader";
import type { PluginComponents } from "./plugin-components-loader";

export function createPluginComponentsFixture(): PluginComponents {
  return {
    commands: {},
    skills: {},
    agents: {},
    mcpServers: {},
    hooksConfigs: [],
    plugins: [],
    errors: [],
  };
}

export function createPluginConfigFixture(): OhMyOpenCodeConfig {
  return {
    git_master: {
      commit_footer: true,
      include_co_authored_by: true,
      git_env_prefix: "GIT_MASTER=1",
    },
  };
}

export function createParsedPluginConfigFixture(overrides: Record<string, unknown>): OhMyOpenCodeConfig {
  return OhMyOpenCodeConfigSchema.parse({
    ...createPluginConfigFixture(),
    ...overrides,
  });
}

export function createCommandConfigTestHarness() {
  const getSystemMcpServerNamesSpy = spyOn(mcpLoader, "getSystemMcpServerNames").mockReturnValue(new Set());
  const loadBuiltinCommandsSpy = spyOn(builtinCommands, "loadBuiltinCommands").mockReturnValue({});
  const loadUserCommandsSpy = spyOn(commandLoader, "loadUserCommands").mockResolvedValue({});
  const loadProjectCommandsSpy = spyOn(commandLoader, "loadProjectCommands").mockResolvedValue({});
  const loadOpencodeGlobalCommandsSpy = spyOn(commandLoader, "loadOpencodeGlobalCommands").mockResolvedValue({});
  const loadOpencodeProjectCommandsSpy = spyOn(commandLoader, "loadOpencodeProjectCommands").mockResolvedValue({});
  const discoverConfigSourceSkillsSpy = spyOn(skillLoader, "discoverConfigSourceSkills").mockResolvedValue([]);
  const loadUserSkillsSpy = spyOn(skillLoader, "loadUserSkills").mockResolvedValue({});
  const loadProjectSkillsSpy = spyOn(skillLoader, "loadProjectSkills").mockResolvedValue({});
  const loadOpencodeGlobalSkillsSpy = spyOn(skillLoader, "loadOpencodeGlobalSkills").mockResolvedValue({});
  const loadOpencodeProjectSkillsSpy = spyOn(skillLoader, "loadOpencodeProjectSkills").mockResolvedValue({});
  const loadProjectAgentsSkillsSpy = spyOn(skillLoader, "loadProjectAgentsSkills").mockResolvedValue({});
  const loadGlobalAgentsSkillsSpy = spyOn(skillLoader, "loadGlobalAgentsSkills").mockResolvedValue({});
  const loadSharedSkillsSpy = spyOn(skillLoader, "loadSharedSkills").mockResolvedValue({});

  return {
    getSystemMcpServerNamesSpy,
    loadBuiltinCommandsSpy,
    discoverConfigSourceSkillsSpy,
    loadProjectAgentsSkillsSpy,
    loadGlobalAgentsSkillsSpy,
    loadSharedSkillsSpy,
    restore(): void {
      getSystemMcpServerNamesSpy.mockRestore();
      loadBuiltinCommandsSpy.mockRestore();
      loadUserCommandsSpy.mockRestore();
      loadProjectCommandsSpy.mockRestore();
      loadOpencodeGlobalCommandsSpy.mockRestore();
      loadOpencodeProjectCommandsSpy.mockRestore();
      discoverConfigSourceSkillsSpy.mockRestore();
      loadUserSkillsSpy.mockRestore();
      loadProjectSkillsSpy.mockRestore();
      loadOpencodeGlobalSkillsSpy.mockRestore();
      loadOpencodeProjectSkillsSpy.mockRestore();
      loadProjectAgentsSkillsSpy.mockRestore();
      loadGlobalAgentsSkillsSpy.mockRestore();
      loadSharedSkillsSpy.mockRestore();
    },
  };
}

export type CommandConfigTestHarness = ReturnType<typeof createCommandConfigTestHarness>;
