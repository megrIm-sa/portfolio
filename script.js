const projects = [
  {
    title: "Echoes of Steel",
    description: "2D экшен-платформер с упором на динамичный бой и парирования.",
    tags: ["Unity", "C#", "PC"],
  },
  {
    title: "Midnight Courier",
    description: "Короткая narrative-игра про доставку в киберпанк-городе.",
    tags: ["Unreal", "Blueprints", "Narrative"],
  },
  {
    title: "Prototype Lab",
    description: "Сборник игровых прототипов и тестов механик.",
    tags: ["Godot", "GDScript", "R&D"],
  },
];

const projectsListEl = document.getElementById("projects-list");
const newsListEl = document.getElementById("news-list");
const yearEl = document.getElementById("year");

yearEl.textContent = String(new Date().getFullYear());

projects.forEach((project) => {
  const card = document.createElement("article");
  card.className = "card project-card";

  const tags = project.tags
    .map((tag) => `<span class="tag">${tag}</span>`)
    .join("");

  card.innerHTML = `
    <h3 class="project-title">${project.title}</h3>
    <p class="project-desc">${project.description}</p>
    <div class="project-tags">${tags}</div>
  `;

  projectsListEl.appendChild(card);
});

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Дата не указана";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function cleanHtml(htmlString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");
  return (doc.body.textContent || "").trim();
}

async function fetchTelegramNews() {
  const channel = "megrIm_games";
  const rssSources = [
    `https://rsshub.app/telegram/channel/${channel}`,
    `https://rsshub.rssforever.com/telegram/channel/${channel}`,
  ];

  let xmlText = "";
  let lastError = "";

  for (const source of rssSources) {
    const requestUrl = `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(source)}`;
    try {
      const response = await fetch(requestUrl, {
        headers: {
          Accept:
            "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
        },
      });

      if (!response.ok) {
        lastError = `HTTP ${response.status}`;
        continue;
      }

      const text = await response.text();
      if (!text.includes("<item")) {
        lastError = "RSS не содержит постов";
        continue;
      }

      xmlText = text;
      break;
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Ошибка сети";
    }
  }

  if (xmlText) {
    return parseRssItems(xmlText);
  }

  if (!xmlText) {
    throw new Error(lastError || "Не удалось получить RSS");
  }
}

function parseRssItems(xmlText) {
  const xml = new DOMParser().parseFromString(xmlText, "text/xml");
  const itemNodes = Array.from(xml.querySelectorAll("item")).slice(0, 6);

  if (!itemNodes.length) {
    throw new Error("Лента новостей пуста");
  }

  return itemNodes.map((node) => {
    const title = node.querySelector("title")?.textContent?.trim() || "Пост";
    const link = node.querySelector("link")?.textContent?.trim() || "#";
    const pubDate = node.querySelector("pubDate")?.textContent?.trim() || "";
    const description = cleanHtml(
      node.querySelector("description")?.textContent?.trim() || ""
    ).slice(0, 180);

    return { title, link, pubDate, description };
  });
}

function renderNews(posts) {
  newsListEl.innerHTML = "";

  posts.forEach((post) => {
    const card = document.createElement("article");
    card.className = "card news-item";
    card.innerHTML = `
      <h3><a href="${post.link}" target="_blank" rel="noreferrer noopener">${post.title}</a></h3>
      <div class="news-meta">${formatDate(post.pubDate)}</div>
      <p>${post.description || "Откройте пост, чтобы узнать подробности."}</p>
    `;
    newsListEl.appendChild(card);
  });
}

function renderNewsError() {
  newsListEl.innerHTML = `
    <article class="card news-item">
      <h3>Не удалось загрузить новости автоматически</h3>
      <p>
        Откройте канал напрямую:
        <a href="https://t.me/megrIm_games" target="_blank" rel="noreferrer noopener">t.me/megrIm_games</a>
      </p>
    </article>
  `;
}

fetchTelegramNews().then(renderNews).catch(renderNewsError);
