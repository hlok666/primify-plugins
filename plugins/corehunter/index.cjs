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
      "distance-measure": value(input, "distance_measure", "MR"),
      "weight-cv": value(input, "weight_cv", 1),
      "weight-he": value(input, "weight_he", 1),
      "weight-sh": value(input, "weight_sh", 1),
      "weight-en": value(input, "weight_en", 0),
      "weight-an": value(input, "weight_an", 0),
      "weight-ee": value(input, "weight_ee", 0),
      "search-mode": value(input, "search_mode", "auto"),
      "max-steps": value(input, "max_steps", -1),
      "fast-time-limit": value(input, "fast_time_limit", 12),
      "fast-improvement-time": value(input, "fast_improvement_time", 2),
      "accurate-time-limit": value(input, "accurate_time_limit", 60),
      "accurate-improvement-time": value(input, "accurate_improvement_time", 10),
      replicates: value(input, "replicates", 3),
      "scan-replicates": value(input, "scan_replicates", 1),
      seed: value(input, "seed", 42),
      "always-selected": value(input, "always_selected"),
      "never-selected": value(input, "never_selected"),
    };
    const args = ["-Xms128m", "-Xmx2g", "-Dfile.encoding=UTF-8", "-cp", classpath, "org.primify.corehunter.CoreHunterPlugin"];
    for (const [key, optionValue] of Object.entries(options)) args.push(`--${key}`, optionValue);
    javaChild = spawn(javaCommand, args, { cwd: __dirname, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let stderrPending = "";
    const consumeStderr = (flush = false) => {
      const lines = stderrPending.split(/\r?\n/);
      stderrPending = flush ? "" : lines.pop() || "";
      for (const line of lines) {
        if (!line) continue;
        if (line.startsWith("@@PRIMIFY_PROGRESS@@")) process.stderr.write(`${line}\n`);
        else stderr += `${line}\n`;
      }
      if (flush && stderrPending) {
        if (stderrPending.startsWith("@@PRIMIFY_PROGRESS@@")) process.stderr.write(`${stderrPending}\n`);
        else stderr += stderrPending;
        stderrPending = "";
      }
    };
    javaChild.stdout.on("data", (chunk) => { stdout += chunk.toString("utf8"); });
    javaChild.stderr.on("data", (chunk) => {
      stderrPending += chunk.toString("utf8");
      consumeStderr(false);
    });
    javaChild.on("error", (error) => {
      process.stderr.write(`${error.message}\n`);
      process.exitCode = 1;
    });
    javaChild.on("exit", (code) => {
      consumeStderr(true);
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
