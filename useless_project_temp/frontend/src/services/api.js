const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function checkHealth() {
  try {
    const res = await fetch(`${API_URL}/health`);
    if (!res.ok) throw new Error('Backend health check failed');
    return await res.json();
  } catch (err) {
    console.warn('Health check error:', err);
    return null;
  }
}

export async function sendChatMessage(message, mode = 'normal', whyCount = 0) {
  try {
    const res = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, mode, why_count: whyCount })
    });
    if (!res.ok) throw new Error('API chat error');
    return await res.json();
  } catch (err) {
    console.error('Chat API error:', err);
    throw err;
  }
}

export async function translateText(text, targetLanguage = 'ml') {
  try {
    const res = await fetch(`${API_URL}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, target_language: targetLanguage })
    });
    if (!res.ok) throw new Error('Translation API error');
    return await res.json();
  } catch (err) {
    console.error('Translation error:', err);
    throw err;
  }
}

export function getVoiceWebSocketUrl() {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = API_URL.replace(/^https?:\/\//, '');
  return `${wsProtocol}//${host}/ws/voice`;
}
