export default async function handler(req, res) {
  const KV_REST_API_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  // 1. Check if Vercel KV is configured
  if (!KV_REST_API_URL || !KV_REST_API_TOKEN) {
    return res.status(500).json({ error: 'KV database is not linked in Vercel.' });
  }

  const { method, body, query } = req;
  const { key } = query || {};

  if (!key) {
    return res.status(400).json({ error: 'Data Key is required' });
  }

  const csmKey = `csm17_${key}`;

  try {
    // 2. Fetch Data (GET)
    if (method === 'GET') {
      const response = await fetch(`${KV_REST_API_URL}/get/${csmKey}`, {
        headers: { Authorization: `Bearer ${KV_REST_API_TOKEN}` }
      });
      const resultData = await response.json();
      
      let parsed = null;
      if (resultData.result) {
        parsed = JSON.parse(resultData.result);
      }
      return res.status(200).json({ data: parsed });
    }

    // 3. Save Data (POST)
    if (method === 'POST') {
      const { data } = body;
      const response = await fetch(`${KV_REST_API_URL}/set/${csmKey}`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${KV_REST_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(JSON.stringify(data)) // KV requires strings
      });
      const saveResult = await response.json();
      return res.status(200).json({ success: true, result: saveResult });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('KV API Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
