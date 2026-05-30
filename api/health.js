import { checkHealth } from "../shared/tryonCore.js";

export default async function handler(_req, res) {
  const data = await checkHealth();
  return res.status(200).json(data);
}
