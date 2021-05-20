import { EventEmitter } from "events";
import glob from "globby";

import { cleanDist, killPreProcess } from "./process/build";
import { buildFiles } from "./process/build/build";
import { watchFiles } from "./process/watch";
import { buildDts } from "./process/buildDts";
import { execFiles } from "./process/exec";

import { getConfig } from "./config/index";
import { getLogger } from "./utils/logger";

import type { BuildOptions, BuildResult } from "esbuild";
import type { TsLoadOptions, TsLoadConfig } from "./config";
import type { Logger } from "./utils/logger";

//
export class TsLoad extends EventEmitter {
  logger: Logger;
  //
  config: TsLoadConfig;
  result: BuildResult | undefined;
  //
  constructor(options: TsLoadOptions = {}) {
    super();

    const config: TsLoadOptions = options || {};
    config.root = process.cwd();

    this.config = getConfig(options);
    this.logger = getLogger();
  }

  async build() {
    const { config, logger } = this;
    const { pkgConfig } = config;

    logger.info("CLI", `tsl v${pkgConfig.version}`);

    if (config.tsloadConfigFile) {
      logger.info("CLI", `Using tsl config: ${config.tsloadConfigFile}`);
    }
    if (config.watch) {
      logger.info("CLI", "Running in watch mode");
    }

    await this.resolveEntry();

    if (config.clean) {
      await cleanDist(this);
    } else if (config.build) {
      await this.execBuild();
    } else if (config.watch) {
      await watchFiles(this);
    } else if (config.dts) {
      await buildDts(this);
    } else {
      await execFiles(this);
    }
  }

  //
  async resolveEntry() {
    const { config } = this;
    const { esbuildConfig } = config;

    const input = esbuildConfig.entryPoints;
    if (input) {
      esbuildConfig.entryPoints = await glob(input);
    } else {
      throw new Error(`No input files, try "<your-file>" instead`);
    }
  }

  //
  async execBuild() {
    const { config, logger } = this;
    const killPromise = killPreProcess(this);

    await cleanDist(this);

    await Promise.all(
      (config.format as string[]).map((format, index) =>
        buildFiles(this, { format })
      )
    );

    await killPromise;

    if (typeof config.onSuccess == "function") {
      config.onSuccess.call(this);
    }
  }
}
