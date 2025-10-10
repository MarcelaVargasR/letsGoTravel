import "../style/ourEvents.css";

let evState = {
  location: "Austin, Texas",
  q: "events",
  htichips: "",
  start: 0,
  limit: 12,
};

async function fetchEvents({ q, location, htichips, start = 0, limit = 12 }) {
  const url = `/.netlify/functions/get-events?q=${encodeURIComponent(
    q
  )}&location=${encodeURIComponent(location)}&htichips=${encodeURIComponent(
    htichips || ""
  )}&start=${start}&limit=${limit}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    throw new Error(`Events request failed: ${resp.status} ${t}`);
  }
  return resp.json();
}

function adaptEventsToCards(items = []) {
  return items.map((ev) => {
    const title = ev.title || "Untitled event";
    const when = ev.date?.when || ev.when || ""; // ← 3) date: when
    const address = Array.isArray(ev.address)
      ? ev.address.join(", ")
      : ev.address || ""; // ← 5) address
    const description = ev.description || ev.snippet || ""; // ← 4) description
    const thumbnail =
      ev.thumbnail ||
      ev.image ||
      "https://via.placeholder.com/640x400?text=Event"; // ← 1) thumbnail

    // 6) event_location_map: link
    const event_location_map_link = ev.event_location_map?.link || "";

    // 7) venue: rating
    const venue_rating =
      typeof ev.venue?.rating === "number" ? ev.venue.rating : null;

    // 8) ticket_info: link (primer link disponible)
    const ticket_link =
      Array.isArray(ev.ticket_info) && ev.ticket_info[0]?.link
        ? ev.ticket_info[0].link
        : "";

    return {
      // 8 atributos solicitados
      thumbnail, // 1
      title, // 2
      when, // 3
      description, // 4
      address, // 5
      event_location_map_link, // 6
      venue_rating, // 7
      ticket_link, // 8
    };
  });
}

function renderEventCards(cards = []) {
  const list = document.getElementById("events-list");
  const empty = document.getElementById("events-empty");
  if (!list) return;

  if (!cards.length) {
    list.innerHTML = "";
    if (empty) empty.hidden = false;
    return;
  }
  if (empty) empty.hidden = true;

  list.innerHTML = cards
    .map(
      (c) => `
  <li class="dest-card">
    <div class="dest-card__image">
      <img src="${c.thumbnail}" alt="${c.title}" loading="lazy">
    </div>
    <div class="dest-card__content">
      <h3 class="dest-card__title">${c.title}</h3>

      <div class="dest-card__meta">When: ${c.when || "—"}</div>
      <div class="dest-card__meta">Address: ${c.address || "—"}</div>
      ${
        typeof c.venue_rating === "number"
          ? `<div class="dest-card__meta">⭐ ${c.venue_rating.toFixed(1)}</div>`
          : ""
      }

      ${c.description ? `<p class="dest-card__desc">${c.description}</p>` : ""}

      <div class="dest-card__meta">
  ${
    c.event_location_map_link
      ? `<a href="${c.event_location_map_link}" target="_blank" rel="noopener">Open map</a>`
      : ""
  }
</div>
<div class="dest-card__meta">
  ${
    c.ticket_link
      ? `<a href="${c.ticket_link}" target="_blank" rel="noopener">Tickets / More info</a>`
      : ""
  }
</div>

    </div>
  </li>
`
    )
    .join("");
}

async function loadAndRenderEvents() {
  const data = await fetchEvents(evState);
  const items = Array.isArray(data?.events) ? data.events : [];
  const cards = adaptEventsToCards(items);
  renderEventCards(cards);

  document
    .getElementById("events-prev")
    ?.toggleAttribute("disabled", evState.start <= 0);
  document
    .getElementById("events-next")
    ?.toggleAttribute("disabled", items.length < evState.limit);
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadAndRenderEvents().catch((err) => {
    console.error("[events init]", err);
    renderEventCards([]);
  });

  const form = document.getElementById("events-form");
  const input = document.getElementById("events-location");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const loc = input?.value?.trim();
    if (!loc) return;
    evState.location = loc;
    evState.start = 0;
    await loadAndRenderEvents().catch(console.error);
  });

  document
    .querySelector(".events-filters")
    ?.addEventListener("click", async (e) => {
      const btn = e.target.closest("button[data-htichips]");
      if (!btn) return;
      document
        .querySelectorAll(".events-filters button")
        .forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      evState.htichips = btn.dataset.htichips || "";
      evState.start = 0;
      await loadAndRenderEvents().catch(console.error);
    });

  document
    .getElementById("events-prev")
    ?.addEventListener("click", async () => {
      evState.start = Math.max(0, evState.start - evState.limit);
      await loadAndRenderEvents().catch(console.error);
    });
  document
    .getElementById("events-next")
    ?.addEventListener("click", async () => {
      evState.start += evState.limit;
      await loadAndRenderEvents().catch(console.error);
    });
});
