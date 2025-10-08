import "../style/destination.css";


let currentPage = 1;
const PAGE_SIZE = 9;

async function fetchDestinations({ q = "things to do", location, page = 1, limit = PAGE_SIZE } = {}) {
  const url = `/.netlify/functions/get-destinations?q=${encodeURIComponent(q)}&location=${encodeURIComponent(location)}&page=${page}&limit=${limit}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Request failed: ${resp.status} ${resp.statusText} ${text}`);
  }
  return resp.json();
}

function pickItemsFromResponse(data) {
  return Array.isArray(data?.locations) ? data.locations : [];
}

function adaptPlacesToCards(items = []) {
  return items.map((it) => {
    const thumbnail =
      it.thumbnail ||
      it.image?.url ||
      (Array.isArray(it.images) && it.images[0]?.url) ||
      it.thumbnail ||
      it.image ||
      "https://via.placeholder.com/740x400?text=No+Image";

    const title = it.title || it.name || "Untitled";

    const location_type = it.location_type || it.category || it.type || "";

    const descriptions =
      it.description ||
      it.snippet ||
      it.about ||
      "";

    const rating =
      (typeof it.rating === "number" ? it.rating : (it.rating?.value ?? null)) ?? null;

    const locations = it.location || it.address || [it.city, it.country].filter(Boolean).join(", ");
    const highlighted_review = it.highlighted_review?.text || it.review_snippet || "";

    const link = it.link || it.url || "#";

    return { thumbnail, title, location_type, descriptions, rating, locations, highlighted_review, link };
  });
}

function renderCards(cards = []) {
  const list = document.getElementById("destinations-list");
  const empty = document.getElementById("destinations-empty");
  if (!list) return;
  if (!cards.length) {
    list.innerHTML = "";
    if (empty) empty.hidden = false;
    return;
  }
  if (empty) empty.hidden = true;

  list.innerHTML = cards.slice(0, PAGE_SIZE).map((c) => `
    <li class="dest-card">
      <div class="dest-card__image">
        <img src="${c.thumbnail}" alt="${c.title}" loading="lazy">
      </div>
      <div class="dest-card__content">
        <h3 class="dest-card__title">${c.title}</h3>
        <div class="dest-card__meta">
          ${c.location_type ? c.location_type + " · " : ""}${c.locations || ""}
        </div>
        ${c.rating ? `<div class="dest-card__meta">⭐ ${Number(c.rating).toFixed(1)}</div>` : ""}
        ${c.descriptions ? `<p class="dest-card__desc">${c.descriptions}</p>` : ""}
        ${c.highlighted_review ? `<p class="dest-card__review">“${c.highlighted_review}”</p>` : ""}
      </div>
    </li>
  `).join("");
}

async function loadAndRender({ q, location, page }) {
  const data = await fetchDestinations({ q, location, page, limit: PAGE_SIZE });
  const items = pickItemsFromResponse(data);
  const cards = adaptPlacesToCards(items);
  renderCards(cards);
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await loadAndRender({ q: "things to do", location: "Austin, Texas", page: currentPage });
  } catch (e) {
    console.error("[init] error:", e);
    renderCards([]);
  }

  const form = document.getElementById("dest-search-form");
  const input = document.getElementById("dest-location");

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const loc = input?.value?.trim();
    if (!loc) return;
    currentPage = 1;
    await loadAndRender({ q: "things to do", location: loc, page: currentPage });
  });
});

