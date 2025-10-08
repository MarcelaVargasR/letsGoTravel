// netlify/functions/get-destinations.js
import { getJson } from "serpapi";

export async function handler(event) {
  try {
    const qp = event.queryStringParameters || {};

    const q = qp.q ?? "things to do";
    const location = qp.location ?? "Austin, Texas";

    const page = Math.max(1, parseInt(qp.page ?? "1", 10) || 1);
    const limit = Math.max(1, Math.min(parseInt(qp.limit ?? "12", 10) || 12, 100));
    const offset = (page - 1) * limit;

    const ssrc = qp.ssrc ?? "A";
    const lat = qp.lat;
    const lon = qp.lon;

    const domain = qp.tripadvisor_domain ?? "www.tripadvisor.com";

    const params = {
      engine: "tripadvisor",
      q: `${q} ${location}`,
      ssrc,
      limit: String(limit),
      offset: String(offset),
      tripadvisor_domain: domain,
      api_key: process.env.SERPAPI_KEY,
    };

    if (lat && lon) {
      params.lat = lat;
      params.lon = lon;
    }

    const data = await getJson(params);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meta: { page, limit, offset, domain }, ...data }),
    };
  } catch (error) {
    console.error("get-destinations (tripadvisor) error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error fetching destinations",
        error: error?.message || String(error),
      }),
    };
  }
}
