export function watsonConfig(env = process.env) {
  const url = env.WATSON_ASSISTANT_URL?.replace(/\/$/, "");
  const assistantId = env.WATSON_ASSISTANT_ID;
  const apiKey = env.WATSON_API_KEY;
  return url && assistantId && apiKey ? { url, assistantId, apiKey } : null;
}

export async function watsonMessage(text, env = process.env) {
  const config = watsonConfig(env);
  if (!config) throw new Error("Watson is not configured on this deployment.");
  const version = "2024-08-25";
  const auth = `Basic ${Buffer.from(`apikey:${config.apiKey}`).toString("base64")}`;
  const sessionResponse = await fetch(
    `${config.url}/v2/assistants/${config.assistantId}/sessions?version=${version}`,
    { method: "POST", headers: { authorization: auth } }
  );
  if (!sessionResponse.ok) throw new Error(`Watson session failed (${sessionResponse.status}).`);
  const { session_id: sessionId } = await sessionResponse.json();

  try {
    const response = await fetch(
      `${config.url}/v2/assistants/${config.assistantId}/sessions/${sessionId}/message?version=${version}`,
      {
        method: "POST",
        headers: { authorization: auth, "content-type": "application/json" },
        body: JSON.stringify({ input: { message_type: "text", text } })
      }
    );
    if (!response.ok) throw new Error(`Watson message failed (${response.status}).`);
    const payload = await response.json();
    return payload.output?.generic?.filter(item => item.response_type === "text").map(item => item.text).join("\n") || "I understood your message, but no text response was returned.";
  } finally {
    fetch(`${config.url}/v2/assistants/${config.assistantId}/sessions/${sessionId}?version=${version}`, {
      method: "DELETE",
      headers: { authorization: auth }
    }).catch(() => {});
  }
}
