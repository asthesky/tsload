import fs from "fs";
import glob from "globby";
import kill from "tree-kill";

export async function removeFiles(patterns: string[], dir: string) {
  const files = await glob(patterns, {
    cwd: dir,
    absolute: true
  });
  await Promise.all(files.map((file) => fs.promises.unlink(file)));
}

export const killProcess = ({ pid, signal = "SIGTERM" }: { pid: number; signal?: string | number }) => {
  return new Promise<unknown>((resolve) => {
    kill(pid, signal, resolve);
  });
};

export function debouncePromise<T extends unknown[]>(fn: (...args: T) => Promise<void>, delay: number, onError: (err: unknown) => void) {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  let promiseInFly: Promise<void> | undefined;

  let callbackPending: (() => void) | undefined;

  return function debounced(...args: Parameters<typeof fn>) {
    if (promiseInFly) {
      callbackPending = () => {
        debounced(...args);
        callbackPending = undefined;
      };
    } else {
      if (timeout != null) clearTimeout(timeout);

      timeout = setTimeout(() => {
        timeout = undefined;
        promiseInFly = fn(...args)
          .catch(onError)
          .finally(() => {
            promiseInFly = undefined;
            if (callbackPending) callbackPending();
          });
      }, delay);
    }
  };
}
