import Redis from 'ioredis';

let redisClient = null;

export default async function handler(req, res) {
  const REDIS_URL = process.env.REDIS_URL || process.env.KV_URL;
  const KV_REST_API_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!REDIS_URL && (!KV_REST_API_URL || !KV_REST_API_TOKEN)) {
    return res.status(500).json({ error: 'DB is not linked in Vercel.' });
  }

  const { method, body, query } = req;
  const { key } = query || {};

  if (!key) return res.status(400).json({ error: 'Key is required' });
  const csmKey = `csm17_${key}`;

  try {
    // 1. Generic Redis TCP Support
    if (REDIS_URL) {
      if (!redisClient) redisClient = new Redis(REDIS_URL);
      
      if (method === 'GET') {
        const val = await redisClient.get(csmKey);
        let parsed = null;
        if (val) {
          try { parsed = JSON.parse(val); } catch(e) { parsed = val; }
        }
        return res.status(200).json({ data: parsed });
      }
      
      if (method === 'POST') {
        const { data } = body;
        await redisClient.set(csmKey, JSON.stringify(data));
        return res.status(200).json({ success: true });
      }
    }

    // 2. Upstash/KV REST API Support
    if (method === 'GET') {
      const response = await fetch(`${KV_REST_API_URL}/get/${csmKey}`, {
        headers: { Authorization: `Bearer ${KV_REST_API_TOKEN}` }
      });
      const resultData = await response.json();
      let parsed = null;
      if (resultData.result) {
        try { parsed = JSON.parse(resultData.result); } catch(e) { parsed = resultData.result; }
        if (typeof parsed === 'string') {
          try { parsed = JSON.parse(parsed); } catch(e) {}
        }
      }
      return res.status(200).json({ data: parsed });
    }

    if (method === 'POST') {
      const { data } = body;
      const response = await fetch(`${KV_REST_API_URL}/set/${csmKey}`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${KV_REST_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(JSON.stringify(data))
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
