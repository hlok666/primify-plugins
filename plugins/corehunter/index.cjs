const path = require("path");
const { spawn } = require("child_process");

const chunks = [];
let javaChild = null;

function value(input, key, fallback = "") {
  const raw = input?.[key];
  return raw === undefined || raw === null || raw === "" ? String(fallback) : String(raw);
}

function stopChild() {
  if (javaChild && !javaChild.killed) javaChild.kill();
}

process.once("exit", stopChild);
process.once("SIGTERM", () => {
  stopChild();
  process.exit(143);
});
process.once("SIGINT", () => {
  stopChild();
  process.exit(130);
});

process.stdin.on("data", (chunk) => chunks.push(chunk));
process.stdin.on("end", () => {
  try {
    const request = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
    const input = request.input || {};
    const javaCommand = String(request.runtime?.javaCommand || "");
    if (!javaCommand) throw new Error("Primify 内置 Java 运行环境不可用，请在资源管理中修复运行组件。");
    const cliJar = path.join(__dirname, "corehunter-plugin.jar");
    const engineJar = path.join(__dirname, "corehunter-base-3.2.0-shaded.jar");
    const classpath = `${cliJar}${path.delimiter}${engineJar}`;
    const options = {
      file: value(input, "file"),
      format: value(input, "format", "default"),
      "size-mode": value(input, "size_mode", "scan"),
      "min-rate": value(input, "min_rate", 0.05),
      "max-rate": value(input, "max_rate", 0.30),
      "rate-step": value(input, "rate_step", 0.01),
      "fixed-rate": value(input, "fixed_rate", 0.20),
      "fixed-count": value(input, "fixed_count", 20),
      objective: value(input, "objective", "CV"),
      "weight-cv": value(input, "weight_cv", 1),
      "weight-he": value(input, "weight_he", 1),
      "weight-sh": value(input, "weight_sh", 1),
      "search-mode": value(input, "search_mode", "fast"),
      "max-steps": value(input, "max_steps", 5000),
      replicates: value(input, "replicates", 1),
      seed: value(input, "seed", 42),
      "always-selected": value(input, "always_selected"),
      "never-selected": value(input, "never_selected"),
    };
    const args = ["-Xms128m", "-Xmx2g", "-Dfile.encoding=UTF-8", "-cp", classpath, "org.primify.corehunter.CoreHunterPlugin"];
    for (const [key, optionValue] of Object.entries(options)) args.push(`--${key}`, optionValue);
    javaChild = spawn(javaCommand, args, { cwd: __dirname, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    javaChild.stdout.on("data", (chunk) => { stdout += chunk.toString("utf8"); });
    javaChild.stderr.on("data", (chunk) => { stderr += chunk.toString("utf8"); });
    javaChild.on("error", (error) => {
      process.stderr.write(`${error.message}\n`);
      process.exitCode = 1;
    });
    javaChild.on("exit", (code) => {
      javaChild = null;
      if (code !== 0) {
        process.stderr.write(`${stderr.trim() || `Core Hunter 退出码 ${code}`}\n`);
        process.exitCode = 1;
        return;
      }
      process.stdout.write(stdout.trim());
    });
  } catch (error) {
    process.stderr.write(`${error?.message || String(error)}\n`);
    process.exitCode = 1;
  }
});
