import fs from "fs";
import path from "path";
import module from "module";
import { spawnSync } from "child_process";
import { transformSync } from "esbuild";
import sourceMapSupport from "source-map-support";
import { addHook } from "pirates";

import type { TransformOptions, TransformResult } from "esbuild";
import type { TsLoad } from "../../index";

export const EXEC_EXTS: string[] = [".js", ".jsx", ".ts", ".tsx"];
export const EXEC_EXT_MAP = {
  ".js": "js",
  ".jsx": "jsx",
  ".ts": "ts",
  ".tsx": "tsx",
  ".mjs": "js",
} as const;
export const EXEC_EXT_LIST = Object.keys(EXEC_EXT_MAP);

export type ExecLoader = "js" | "jsx" | "ts" | "tsx";
export type ExecExtensions = keyof typeof EXEC_EXT_MAP;

export async function execFiles(ctx: TsLoad) {
  const { config, logger } = ctx;
  const { pkgConfig } = config;

  let defFormat = "";
  if (pkgConfig && pkgConfig.type) {
    defFormat = pkgConfig.type === "module" ? "esm" : "cjs";
  }

  const cacheMap: { [file: string]: string } = {};

  //
  function compile(
    code: string,
    filename: string,
    format?: "cjs" | "esm"
  ): string {
    const fileDir = path.dirname(filename);
    const fileExt = path.dirname(filename);

    let format = "";
    if (filename.endsWith(".mjs")) {
      format = "esm";
    } else if (filename.endsWith(".cjs")) {
      format = "cjs";
    }

    const results: TransformResult = transformSync(code, {
      sourcefile: filename,
      sourcemap: "both",
      loader: EXEC_EXT_MAP[fileExt],
      target: options.target,
      jsxFactory: options.jsxFactory,
      jsxFragment: options.jsxFragment,
      format,
    });

    const { code: js, warnings, map: jsSourceMap } = results;

    cacheMap[filename] = jsSourceMap;
    if (warnings && warnings.length > 0) {
      for (const warning of warnings) {
        console.log(warning.location);
        console.log(warning.text);
      }
    }

    return js;
  }

  //
  sourceMapSupport.install({
    handleUncaughtExceptions: false,
    environment: "node",
    retrieveSourceMap(file: string) {
      if (cacheMap[file]) {
        return {
          url: file,
          map: cacheMap[file],
        };
      }
      return null;
    },
  });

  /**
   * Patch the Node CJS loader to suppress the ESM error
   * https://github.com/nodejs/node/blob/069b5df/lib/internal/modules/cjs/loader.js#L1125
   *
   * As per https://github.com/standard-things/esm/issues/868#issuecomment-594480715
   */
  // @ts-expect-error
  const extensions = module.Module._extensions;
  const jsHandler = extensions[".js"];

  extensions[".js"] = function (module: any, filename: string) {
    try {
      return jsHandler.call(this, module, filename);
    } catch (error) {
      if (error.code !== "ERR_REQUIRE_ESM") {
        throw error;
      }

      let content = fs.readFileSync(filename, "utf8");
      content = compile(content, filename, "cjs");
      module._compile(content, filename);
    }
  };


  addHook(compile, {
    exts: extensions,
  })
}
