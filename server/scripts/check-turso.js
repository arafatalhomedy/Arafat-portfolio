import { turso } from "../src/config/turso.js";

try {
  const result = await turso.execute("SELECT 1 AS connected");

  if (Number(result.rows[0]?.connected) !== 1) {
    throw new Error("Unexpected database response.");
  }

  console.log("Turso connection successful.");
} catch (error) {
  console.error("Turso connection failed.");
  console.error("Error code:", error.code || "UNKNOWN");
  process.exitCode = 1;
} finally {
  turso.close();
}
