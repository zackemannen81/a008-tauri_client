import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { transformSync } from "esbuild";

const TS_CANDIDATES = [".ts", ".tsx"];

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith(".") && specifier.endsWith(".css")) {
    return {
      url: new URL(specifier, context.parentURL).href,
      format: "module",
      shortCircuit: true,
    };
  }
  if (specifier.startsWith(".") && specifier.endsWith(".js")) {
    for (const extension of TS_CANDIDATES) {
      const candidate = specifier.replace(/\.js$/u, extension);
      const candidateUrl = new URL(candidate, context.parentURL);
      if (existsSync(fileURLToPath(candidateUrl))) {
        return nextResolve(candidate, context);
      }
    }
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.endsWith(".css")) {
    return { format: "module", source: "export default {};", shortCircuit: true };
  }
  if (url.endsWith(".tsx") || url.endsWith(".ts")) {
    const source = readFileSync(fileURLToPath(url), "utf8");
    const compiled = transformSync(source, {
      loader: url.endsWith(".tsx") ? "tsx" : "ts",
      jsx: "automatic",
      format: "esm",
      target: "es2023",
      sourcefile: url,
    });
    return { format: "module", source: compiled.code, shortCircuit: true };
  }
  return nextLoad(url, context);
}
