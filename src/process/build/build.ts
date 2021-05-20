import fs from "fs";
import path from "path";

import { build as esbuild, formatMessages } from "esbuild";

import { externalPlugin } from "../../plugin/esbuild/external";

import type { BuildResult, Plugin as EsbuildPlugin } from "esbuild";
import type { TsLoad } from "../../index";

const getOutputExtensionMap = (pkgTypeField: string | undefined, format: string) => {
  const isModule = pkgTypeField === "module";
  const map: any = {};
  if (isModule && format === "cjs") {
    map[".js"] = ".cjs";
  }
  if (!isModule && format === "esm") {
    map[".js"] = ".mjs";
  }
  if (format === "iife") {
    map[".js"] = ".global.js";
  }
  return map;
};

export async function buildFiles(ctx: TsLoad, options: { format: string }) {
  const { config, logger } = ctx;
  const { esbuildConfig, pkgConfig } = config;
  const { format = "esm" } = options;

  const startTime = Date.now();

  const outdir = esbuildConfig.legacyOutput && format !== "cjs" ? path.join(esbuildConfig.outdir, format) : esbuildConfig.outdir;
  const splitting = esbuildConfig.splitting !== false;
  const external = [new RegExp("/node_modules/"), ...(esbuildConfig.external || [])];
  const defineEnv = [];
  //    Object.keys(env).reduce((res, key) => {
  //     return {
  //       [`process.env.${key}`]: JSON.stringify(env[key])
  //     };
  //   });
  const outExtension = getOutputExtensionMap(pkgConfig.type, format);

  let result: BuildResult | undefined;

  try {
    result = await esbuild({
      entryPoints: esbuildConfig.entryPoints,
      format: splitting && format === "cjs" ? "esm" : format,
      target: esbuildConfig.target === "es5" ? "es2016" : esbuildConfig.target,
      outdir,
      bundle: true,
      platform: "node",
      globalName: esbuildConfig.globalName,
      jsxFactory: esbuildConfig.jsxFactory,
      jsxFragment: esbuildConfig.jsxFragment,
      sourcemap: esbuildConfig.sourcemap,

      define: {
        ...esbuildConfig.define,
        ...defineEnv
      },

      plugins: [
        // esbuild's `external` option doesn't support RegExp
        // So here we use a custom plugin to implement it
        externalPlugin({
          patterns: external,
          skipNodeModulesBundle: esbuildConfig.skipNodeModulesBundle
        }),

        ...(esbuildConfig.plugins || [])
      ],

      outExtension: esbuildConfig.legacyOutput ? undefined : outExtension,
      write: false,
      splitting: splitting && (format === "cjs" || format === "esm"),
      logLevel: "error",
      minify: esbuildConfig.minify,
      minifyWhitespace: esbuildConfig.minifyWhitespace,
      minifyIdentifiers: esbuildConfig.minifyIdentifiers,
      minifySyntax: esbuildConfig.minifySyntax,
      keepNames: esbuildConfig.keepNames,
      incremental: !!esbuildConfig.watch
    });
  } catch (error) {
    logger.error(format, "Build failed");
    throw error;
  }

  if (result && result.warnings) {
    const messages = result.warnings.filter((warning) => {
      if (warning.text.includes(`This call to "require" will not be bundled because`) || warning.text.includes(`Indirect calls to "require" will not be bundled`)) {
        return false;
      } else {
        return true;
      }
    });

    const formatted = await formatMessages(messages, {
      kind: "warning",
      color: true
    });
    formatted.forEach((message) => {
      console.warn(message);
    });
  }

  // Manually write files
  if (result && result.outputFiles) {
    const timeInMs = Date.now() - startTime;
    logger.success(format, `Build success in ${Math.floor(timeInMs)}ms`);
  }

  return result;
}
