import fs from "fs";
import path from "path";
import childProcess from "child_process";

import type { TsLoad } from "../../index";

export async function buildDts(ctx: TsLoad, results = []) {
  // ...
  results.forEach((result) => {
    const targetPath = path.join(__dirname, "packages", result);

    try {
      // 因为只需要d.ts，因此加上--emitDeclarationOnly
      childProcess.execSync("tsc --emitDeclarationOnly", {
        cwd: targetPath
      });
    } catch (error) {
        console.log(error)
    }
  });
}
