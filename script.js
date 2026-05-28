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
      <h3>Не удалось загрузить news.json</h3>
      <p>
        Проверьте выполнение workflow в GitHub Actions и наличие файла
        <code>news.json</code> в корне репозитория.
      </p>
    </article>
  `;
}

async function fetchNewsFromJson() {
  const response = await fetch(`./news.json?v=${Date.now()}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const payload = await response.json();
  const posts = Array.isArray(payload.posts) ? payload.posts : [];
  if (!posts.length) {
    throw new Error("Нет постов в news.json");
  }

  return {
    posts: posts.slice(0, 3).map((post) => ({
      title: post.title || "Пост",
      link: post.link || "#",
      pubDate: post.pubDate || "",
      description: cleanHtml(post.description || "").slice(0, 180),
      mediaUrl: post.mediaUrl || "",
    })),
    sourceLabel: payload.sourceLabel || "Источник: Новости",
  };
}

fetchNewsFromJson()
  .then(({ posts, sourceLabel }) => renderNews(posts, sourceLabel))
  .catch((error) => {
    if (newsSourceEl) {
      newsSourceEl.textContent = "Источник: недоступен";
    }
    console.error("news.json error:", error);
    renderNewsError();
  });
