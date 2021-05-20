import path from "path";

import ts from "typescript";

import type { BuildOptions } from "esbuild";
import type { ParsedCommandLine } from "typescript";

const defPkgConfig = {
  type: "module",
};

// 获取packagejson配置
export function getPkgConfig(config: TsLoadConfig) {
  const pkgConfig = Object.assign({}, defPkgConfig);

  // 获取 tsl 文件配置
  try {
    const configPath = path.resolve(config.root, "./package.json");
    const fileConfig = require(configPath);

    if (typeof fileConfig == "object") {
      Object.assign(pkgConfig, fileConfig);
    }
  } catch (err) {
    console.error(err);
    console.log("Using default config");
  }

  return pkgConfig;
}

const defTsConfig = {};

// 获取tsconfig配置
export function getTsConfig(config: TsLoadConfig) {
  const tsConfigFile = ts.findConfigFile(
    config.root,
    ts.sys.fileExists,
    config.tsconfigName
  );

  if (!tsConfigFile) {
    throw new Error(
      `tsconfig.json not found in the current directory! ${config.root}`
    );
  }

  const configFile = ts.readConfigFile(tsConfigFile, ts.sys.readFile);
  const tsConfig: ParsedCommandLine = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    config.root
  );

  return {
    tsConfig,
    tsConfigFile,
  };
}

const defEsbuildOptions: BuildOptions = {
  outdir: "",
  entryPoints: [],
  sourcemap: "inline",
  target: "es6",
  minify: false,
  plugins: [],
  tsconfig: undefined,
};

// 获取esbuild配置
export function getEsbuildConfig(config: TsLoadConfig) {
  const { esbuildOptions, tsConfig, tsConfigFile } = config;
  const { sourceMap, inlineSources, inlineSourceMap } = tsConfig.options;

  //
  const esbc: BuildOptions = Object.assign({}, defEsbuildOptions);

  //
  const entryPoints = (esbuildOptions?.entryPoints as string[]) || [];
  esbc.entryPoints = [...tsConfig.fileNames, ...entryPoints];

  //
  esbc.target =
    esbuildOptions?.target || tsConfig?.raw?.compilerOptions?.target || "es6";

  //
  esbc.minify = esbuildOptions?.minify || false;
  esbc.plugins = esbuildOptions?.plugins || [];

  //
  esbc.tsconfig = tsConfigFile;

  //
  let _sourceMap: boolean | "inline" | "external" | "both" | undefined =
    sourceMap;
  if (inlineSources && !inlineSourceMap && !sourceMap) {
    _sourceMap = false;
  } else if (sourceMap && inlineSourceMap) {
    _sourceMap = false;
  } else if (inlineSourceMap) {
    _sourceMap = "inline";
  }
  esbc.sourcemap = _sourceMap;

  return esbc;
}

const defaultConfig = {
  root: "",
  srcDir: "",
  distDir: "",
  // cmd
  clean: true,
  build: true,
  watch: false,
  dts: false,
  // esbuild
  format: "esm" as string | string[],
  esbuildOptions: null as BuildOptions | null,
  esbuildConfig: null as BuildOptions | null,
  // ts
  pkgConfig: null,
  tsconfigName: "tsconfig.json",
  tsConfig: null as ParsedCommandLine | null,
  tsConfigFile: "",
  // tsload
  tsloadConfigName: "tsl.config.ts",
  tsloadConfigFile: "",
  //
  watchIgnored: "" as string | string[],
  //
  onSuccess: null,
};

export type TsLoadOptions = Partial<typeof defaultConfig>;
export type TsLoadConfig = typeof defaultConfig;

// 获取本项目配置
export function getConfig(options: TsLoadOptions) {
  const config: TsLoadConfig = Object.assign({}, defaultConfig, options);

  // 获取 tsl 文件配置
  try {
    const configPath = path.resolve(
      config.root as string,
      config.tsloadConfigName
    );
    const fileConfig = require(configPath);

    if (typeof fileConfig == "object") {
      Object.assign(config, fileConfig);
      config.tsloadConfigFile = configPath;
    }
  } catch (err) {
    console.error(err);
    console.log("Using default config");
  }

  const pkgConfig = getPkgConfig(config);
  config.pkgConfig = pkgConfig;

  const { tsConfig, tsConfigFile } = getTsConfig(config);
  config.tsConfig = tsConfig;
  config.tsConfigFile = tsConfigFile;

  const esbuildConfig = getEsbuildConfig(config);
  config.esbuildConfig = esbuildConfig;

  //
  if (typeof config.format == "string") {
    config.format = config.format.split(",");
  }

  //
  let _watchIgnored: string[] = [];
  if (config.watchIgnored) {
    if (Array.isArray(config.watchIgnored)) {
      _watchIgnored = config.watchIgnored;
    } else {
      _watchIgnored = [config.watchIgnored];
    }
  }
  config.watchIgnored = [
    "**/{.git,node_modules}/**",
    config.distDir,
    ..._watchIgnored,
  ];

  return config;
}
