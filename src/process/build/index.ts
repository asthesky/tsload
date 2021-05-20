import { killProcess, removeFiles } from "../../utils";

import type { ChildProcess } from "child_process";
import type { TsLoad } from "../../index";

let existingOnSuccess: ChildProcess | undefined;
export async function killPreProcess(ctx: TsLoad) {
  const { config, logger } = ctx;

  if (existingOnSuccess) {
    await killProcess({
      pid: existingOnSuccess.pid,
    });
    existingOnSuccess = undefined;

    logger.info("CLI", "Cleaning process");
  }
}

export async function cleanDist(ctx: TsLoad) {
  const { config, logger } = ctx;

  await removeFiles(["**/*", "!**/*.d.ts"], config.distDir);

  logger.info("CLI", "Cleaning output folder");
}
