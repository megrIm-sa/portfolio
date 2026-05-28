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
const newsSourceEl = document.getElementById("news-source");
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

async function fetchRssViaCodetabs(sources) {
  let lastError = "Не удалось получить RSS";

  for (const source of sources) {
    const requestUrl = `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(
      source
    )}`;
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
        lastError = `RSS не содержит постов: ${source}`;
        continue;
      }
      return text;
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Ошибка сети";
    }
  }

  throw new Error(lastError);
}

function parseRssItems(xmlText) {
  const xml = new DOMParser().parseFromString(xmlText, "text/xml");
  const itemNodes = Array.from(xml.querySelectorAll("item")).slice(0, 3);

  if (!itemNodes.length) {
    throw new Error("Лента новостей пуста");
  }

  return itemNodes.map((node) => {
    const title = node.querySelector("title")?.textContent?.trim() || "Пост";
    const link = node.querySelector("link")?.textContent?.trim() || "#";
    const pubDate = node.querySelector("pubDate")?.textContent?.trim() || "";
    const descriptionHtml =
      node.querySelector("description")?.textContent?.trim() || "";
    const mediaUrl = extractMediaUrl(node, descriptionHtml);
    const description = cleanHtml(descriptionHtml).slice(0, 180);

    return { title, link, pubDate, description, mediaUrl };
  });
}

function extractMediaUrl(itemNode, descriptionHtml) {
  const mediaNode =
    itemNode.querySelector("media\\:content") ||
    itemNode.querySelector("enclosure");
  const mediaUrlFromTag = mediaNode?.getAttribute("url");
  if (mediaUrlFromTag) {
    return mediaUrlFromTag;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(descriptionHtml, "text/html");
  const imgSrc = doc.querySelector("img")?.getAttribute("src");
  return imgSrc || "";
}

function renderNews(posts, sourceLabel) {
  newsListEl.innerHTML = "";
  if (newsSourceEl) {
    newsSourceEl.textContent = sourceLabel;
  }

  posts.forEach((post) => {
    const card = document.createElement("article");
    card.className = "card news-item";
    const media = post.mediaUrl
      ? `<img class="news-media" src="${post.mediaUrl}" alt="${post.title}" loading="lazy" />`
      : "";
    card.innerHTML = `
      <h3><a href="${post.link}" target="_blank" rel="noreferrer noopener">${post.title}</a></h3>
      <div class="news-meta">${formatDate(post.pubDate)}</div>
      ${media}
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

async function fetchNews() {
  const telegramRssSources = [
    "https://rsshub.rssforever.com/telegram/channel/megrIm_games",
    "https://rsshub.app/telegram/channel/megrIm_games",
  ];
  const xRssSources = [
    "https://rsshub.rssforever.com/twitter/user/megrImGames",
    "https://rsshub.app/twitter/user/megrImGames",
    "https://nitter.poast.org/megrImGames/rss",
  ];

  try {
    const xmlText = await fetchRssViaCodetabs(telegramRssSources);
    return { posts: parseRssItems(xmlText), sourceLabel: "Источник: Telegram" };
  } catch (telegramError) {
    try {
      const xmlText = await fetchRssViaCodetabs(xRssSources);
      return { posts: parseRssItems(xmlText), sourceLabel: "Источник: X (Twitter)" };
    } catch {
      throw telegramError;
    }
  }
}

fetchNews()
  .then(({ posts, sourceLabel }) => renderNews(posts, sourceLabel))
  .catch(renderNewsError);
