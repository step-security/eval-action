import path from "path";
import * as core from "@actions/core";
import { spawn } from "child_process";

import { Params } from "./main";
import type { ExperimentSummary } from "braintrust";

export interface ExperimentFailure {
  evaluatorName: string;
  errors: string[];
}

type OnSummaryFn = (summary: (ExperimentSummary | ExperimentFailure)[]) => void;

function snakeToCamelCase(str: string) {
  return str.replace(/([-_][a-z])/g, group => group.charAt(1).toUpperCase());
}

async function runCommand(
  command: string,
  options: { env: Record<string, string | undefined>; cwd: string },
  onSummary: OnSummaryFn,
) {
  core.info(`> $ ${command}`);
  return new Promise((resolve, reject) => {
    const child = spawn(command, { shell: true, ...options });

    child.stdout?.on("data", (data: Buffer) => {
      onSummary(
        data
          .toString()
          .split("\n")
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .flatMap(line => {
            try {
              const parsedLine = JSON.parse(line);
              const camelCaseLine = Object.fromEntries(
                Object.entries(parsedLine).map(([key, value]) => [
                  snakeToCamelCase(key),
                  value,
                ]),
              );
              // TODO: This is hacky and we should be parsing what comes off the wire
              return [camelCaseLine as unknown as ExperimentSummary];
            } catch (e) {
              core.error(`Failed to parse jsonl data: ${e}`);
              return [];
            }
          }),
      );
    });

    child.stderr?.on("data", (data: Buffer) => {
      core.info(data.toString()); // Outputs the stderr of the command
    });

    child.on("close", code => {
      if (code === 0) {
        resolve(null);
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
  });
}

export async function runEval(args: Params, onSummary: OnSummaryFn) {
  const { api_key, root, paths, terminate_on_failure } = args;

  // Register the API key so it is masked in any log output.
  core.setSecret(api_key);

  // Scope credentials to the eval subprocess instead of exporting them with
  // core.exportVariable, which writes to $GITHUB_ENV and would leak the
  // secrets to every subsequent step in the job.
  const env: Record<string, string | undefined> = {
    ...process.env,
    BRAINTRUST_API_KEY: api_key,
  };

  if (!env.OPENAI_API_KEY) {
    env.OPENAI_API_KEY = api_key;
  }

  if (args.use_proxy) {
    env.OPENAI_BASE_URL = "https://braintrustproxy.com/v1";
  }

  // Run evals from the requested directory by setting the subprocess cwd,
  // without mutating this process's working directory.
  const cwd = path.resolve(root);

  const terminateFlag = terminate_on_failure ? "--terminate-on-failure" : "";

  const baseCommand = (() => {
    switch (args.runtime.toLowerCase().trim()) {
      case "node":
        switch (args.package_manager) {
          case "":
          case "npm":
            return "npx braintrust";
          case "pnpm":
            return "pnpm dlx braintrust";
          default:
            throw new Error(
              `Unsupported package manager: ${args.package_manager}`,
            );
        }
      case "python":
        switch ((args.package_manager || "").toLowerCase().trim()) {
          case "":
          case "pip":
            return `braintrust`;
          case "uv":
            return `uv run braintrust`;
          default:
            throw new Error(
              `Unsupported package manager: ${args.package_manager}`,
            );
        }
      default:
        throw new Error(`Unsupported runtime: ${args.runtime}`);
    }
  })();

  const command = `${baseCommand} eval --jsonl ${terminateFlag} ${paths}`;

  await runCommand(command, { env, cwd }, onSummary);
}
