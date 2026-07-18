/**
 * Orchestrator API Responder Client
 * Forwards SMS messages to the main MKFR AI Orchestrator service.
 */

export function createOrchestratorResponder({ backendUrl }) {
  const url = `${backendUrl || 'http://localhost:5000'}/api/conversations/message`;

  async function respondToSms({ from, text }) {
    console.log(`[Orchestrator Client] Sending message from ${from} to ${url}`);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        phoneNumber: from,
        channel: 'SMS'
      })
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Orchestrator API returned error status ${res.status}: ${errText}`);
    }

    const payload = await res.json();
    if (!payload.success || !payload.data || !payload.data.message) {
      throw new Error("Invalid response schema from Orchestrator API");
    }

    const message = payload.data.message;
    return {
      message_id: message.id,
      category: message.classification?.category || 'general',
      urgency: message.classification?.urgency || 'low',
      reply: message.message
    };
  }

  return { respondToSms };
}
