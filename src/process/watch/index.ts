import { watch } from "chokidar";
import { debouncePromise } from "../../utils";

import type { TsLoad } from "../../index";

export async function watchFiles(ctx: TsLoad) {
  const { config, logger } = ctx;

  if (!config.watch) return;

  let watchPaths: string | string[];
  if (config.srcDir) {
    if (Array.isArray(config.srcDir)) {
      watchPaths = config.srcDir.filter((path): path is string => typeof path === "string");
    } else {
      watchPaths = config.srcDir;
    }
  } else {
    watchPaths = ".";
  }

  const watcher = watch(watchPaths, {
    ignoreInitial: true,
    ignorePermissionErrors: true,
    ignored: config.watchIgnored
  });

  const debouncedBuild = debouncePromise(
    () => {
      return ctx.build();
    },
    100,
    (err) => {
      logger.error("ERROR", "");
    }
  );

  watcher.on("all", async (type, file) => {
    logger.info("CLI", `Change detected: ${type} ${file}`);

    debouncedBuild();
  });
}
