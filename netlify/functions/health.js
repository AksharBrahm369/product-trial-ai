import { checkHealth } from "../../shared/tryonCore.js";

export async function handler() {
  const data = await checkHealth();
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  };
}
