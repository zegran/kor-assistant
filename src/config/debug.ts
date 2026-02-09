export const DEBUG = true;

export const dlog = (...args: unknown[]) => {
  if (DEBUG) {
    console.log("[kor]", ...args);
  }
};

export const derr = (...args: unknown[]) => {
  if (DEBUG) {
    console.error("[kor]", ...args);
  }
};
