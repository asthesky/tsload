import { isMainThread, parentPort } from "worker_threads";
import chalk from "chalk";

export class PrettyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error(message).stack;
    }
  }
}

export function handleError(error: any) {
  if (error.loc) {
    console.error(
      chalk.bold(
        chalk.red(
          `Error parsing: ${error.loc.file}:${error.loc.line}:${error.loc.column}`
        )
      )
    );
  }
  if (error.frame) {
    console.error(chalk.red(error.message));
    console.error(chalk.dim(error.frame));
  } else {
    if (error instanceof PrettyError) {
      console.error(chalk.red(error.message));
    } else {
      console.error(chalk.red(error.stack));
    }
  }
  process.exitCode = 1;
  if (!isMainThread && parentPort) {
    parentPort.postMessage("has-error");
  }
}
