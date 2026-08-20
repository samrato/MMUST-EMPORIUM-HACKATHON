/**
 * Orchestrator API Responder Client
 * Forwards SMS messages to the main MKFR AI Orchestrator service.
 */

export function createOrchestratorResponder({ backendUrl }) {
  const primaryUrl = `${backendUrl || 'http://localhost:5000'}/api/conversations/message`;
  const fallbackUrl = 'http://127.0.0.1:5000/api/conversations/message';

  async function callEndpoint(url, payload) {
    return await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(25000)
    });
  }

  async function respondToSms({ from, text }) {
    console.log(`[Orchestrator Client] Sending message from ${from} to ${primaryUrl}`);

    const payload = {
      text,
      phoneNumber: from,
      channel: 'SMS'
    };

    let res;
    try {
      res = await callEndpoint(primaryUrl, payload);
    } catch (err) {
      if (primaryUrl !== fallbackUrl) {
        console.warn(`[Orchestrator Client] Failed connecting to ${primaryUrl} (${err.message}). Trying fallback ${fallbackUrl}...`);
        res = await callEndpoint(fallbackUrl, payload);
      } else {
        throw err;
      }
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Orchestrator API returned error status ${res.status}: ${errText}`);
    }

    const responseData = await res.json();
    if (!responseData.success || !responseData.data || !responseData.data.message) {
      throw new Error("Invalid response schema from Orchestrator API");
    }

    const message = responseData.data.message;
    return {
      message_id: message.id,
      category: message.classification?.category || 'general',
      urgency: message.classification?.urgency || 'low',
      reply: message.message
    };
  }

  return { respondToSms };
}
