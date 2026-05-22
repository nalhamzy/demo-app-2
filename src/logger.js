function ts() {
  return new Date().toISOString();
}

function fmt(level, mod, msg, extra) {
  const base = `${ts()} ${level.padEnd(5)} [${mod}] ${msg}`;
  if (extra === undefined) return base;
  if (typeof extra === "string") return `${base} ${extra}`;
  try {
    return `${base} ${JSON.stringify(extra)}`;
  } catch {
    return `${base} [unserializable]`;
  }
}

export function makeLogger(mod) {
  return {
    info: (msg, extra) => console.log(fmt("INFO", mod, msg, extra)),
    warn: (msg, extra) => console.warn(fmt("WARN", mod, msg, extra)),
    error: (msg, extra) => console.error(fmt("ERROR", mod, msg, extra)),
    debug: (msg, extra) => {
      if (process.env.DEBUG) console.log(fmt("DEBUG", mod, msg, extra));
    },
  };
}
