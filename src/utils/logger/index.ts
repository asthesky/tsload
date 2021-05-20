import chalk from "chalk";

const isObject = function (obj: unknown) {
  return obj !== null && typeof obj === "object";
};

export const getLogger = ({ log } = { log: console.log }) => {
  return {
    info: (label: string, message: any) => {
      log(`
        ℹ️ : ${chalk.bgYellow(chalk.black(label))} ${chalk.yellow.bold(
        isObject(message) ? JSON.stringify(message, null, 2) : message
      )}
        `);
    },
    success: (label: string, message: any) => {
      log(`
        ✅ : ${chalk.bgGreen(chalk.black(label))} ${chalk.green.bold(
        isObject(message) ? JSON.stringify(message, null, 2) : message
      )}
        `);
    },
    error: (label: string, message: any) => {
      log(`
        🔥 : ${chalk.bgRed(chalk.black(label))} ${chalk.red.bold(
        isObject(message) ? JSON.stringify(message, null, 2) : message
      )}
        `);
    },
  };
};

export type Logger = ReturnType<typeof getLogger>;
