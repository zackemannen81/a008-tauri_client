import {
  executeShellCommand as executeShellFromHost,
  formatShellHostResult,
  ShellCommandError,
  type ShellHostResult,
} from "../host/v1-http.js";

export { formatShellHostResult, ShellCommandError, type ShellHostResult };

export const SHELL_ENDPOINT = "/v1/shell";

export interface RunShellCommandOptions {
  readonly fetch?: typeof globalThis.fetch;
}

export async function executeShellCommand(
  command: string,
  options: RunShellCommandOptions = {},
): Promise<ShellHostResult> {
  return executeShellFromHost(command, options.fetch);
}

export async function runShellCommand(
  command: string,
  options: RunShellCommandOptions = {},
): Promise<string> {
  const result = await executeShellCommand(command, options);
  return formatShellHostResult(result);
}
