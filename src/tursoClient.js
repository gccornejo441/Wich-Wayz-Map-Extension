import { createClient } from "@libsql/client";
import { TURSO_URL, TURSO_AUTH_TOKEN } from "./config";

const tursoClient = createClient({ url: TURSO_URL, authToken: TURSO_AUTH_TOKEN });

export async function executeQuery(sql, args = []) {
  const { rows } = await tursoClient.execute({ sql, args });
  return rows;
}
