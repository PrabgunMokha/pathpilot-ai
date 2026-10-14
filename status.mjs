import { watsonConfig } from "../../lib/watson.mjs";

export async function handler() {
  return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify({ watsonConfigured: Boolean(watsonConfig()) }) };
}
