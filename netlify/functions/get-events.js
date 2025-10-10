// netlify/functions/get-events.js
import { getJson } from "serpapi";

export async function handler(event) {
  try {
    const {
      q = "events",              
      location = "Austin, Texas",
      hl = "en",
      gl = "us",
      htichips = "",            
      start = "0",               
      limit = "12",             
      no_cache = "false",
    } = event.queryStringParameters || {};

    const params = {
      engine: "google_events",
      q: `${q} ${location}`,    
      hl,
      gl,
      start,                    
      api_key: process.env.SERPAPI_KEY,
    };
    if (htichips) params.htichips = htichips;
    if (no_cache === "true") params.no_cache = "true";

    const data = await getJson(params);
    const events = Array.isArray(data?.events_results) ? data.events_results : [];


    const lim = Math.max(1, Math.min(parseInt(limit, 12) || 12, 50));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        meta: { q, location, hl, gl, htichips, start: Number(start), limit: lim },
        events: events.slice(0, lim),
        serpapi_pagination: data?.serpapi_pagination || null,
      }),
    };
  } catch (err) {
    console.error("[get-events] error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error fetching events", error: err?.message }),
    };
  }
}
