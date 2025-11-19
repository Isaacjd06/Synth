export async function callN8N(path: string, body: any = {}) {
    const res = await fetch(`${process.env.N8N_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-N8N-API-KEY": process.env.N8N_API_KEY!
      },
      body: JSON.stringify(body),
    });
  
    return res.json().catch(() => null);
  }
  