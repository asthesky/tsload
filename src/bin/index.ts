#!/usr/bin/env node

import path from "path";
import fs from "fs-extra";
import program from "commander";

import { TsLoad } from "../index";

const pkg = fs.readJsonSync(path.join(__dirname, "../../package.json"));

program
  .version(pkg.version)
  .option("-v", "--version", () => {
    console.log(pkg.version);
  })
  .option("--debug [feat]", `[string | boolean]  show debug logs`)
  .usage("<command> [options]");

program
  .command("clean") //
  .description("nemos-cli clean")
  .option("-f, --config [config]", "输入文件")
  .action(() => {
    new TsLoad({
      clean: true
    });
  });

program
  .command("build") //
  .description("nemos-cli build")
  .option("-f, --config [config]", "输入文件")
  .action(() => {
    new TsLoad({
      build: true
    });
  });

program
  .command("watch") //
  .description("nemos-cli watch")
  .option("-f, --config [config]", "输入文件")
  .action(() => {
    new TsLoad({
      watch: true
    });
  });

program
  .command("build-dts") //
  .description("nemos-cli build-dts")
  .option("-f, --config [config]", "输入文件")
  .action(() => {
    new TsLoad({
      buildDts: true
    });
  });

program.parse(process.argv);
