const chunks = [];

process.stdin.on("data", (chunk) => chunks.push(chunk));
process.stdin.on("end", async () => {
  try {
    const request = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
    const baseUrl = String(request.runtime?.primerBaseUrl || "").replace(/\/+$/, "");
    if (!baseUrl) throw new Error("Primify 本地算法服务地址不可用。");
    const response = await fetch(`${baseUrl}/api/plugins/blast/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request.input || {}),
    });
    const data = await response.json();
    if (!response.ok || data?.error) throw new Error(String(data?.error || `HTTP ${response.status}`));
    process.stdout.write(JSON.stringify(data));
  } catch (error) {
    process.stderr.write(`${error?.message || String(error)}\n`);
    process.exitCode = 1;
  }
});
