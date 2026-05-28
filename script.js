const projects = [
  {
    id: "death-warrant",
    title: "Death Warrant",
    link: "https://megrim.itch.io/death-warrant",
    description:
      "Мегаполис. 2047 год. Судьи — закон, суд и приговор в одном лице. Ты получаешь дело, находишь виновного и выносишь приговор. Но чем глубже копаешь — тем больше вопросов к тем, кто отдаёт приказы. Короткий нарративный детектив, где каждое решение имеет цену.",
    tags: ["Narrative Detective", "Cyberpunk", "Short Game"],
  },
  {
    id: "symbionts",
    title: "Symbionts",
    link: "https://megrim.itch.io/symbionts",
    description:
      "You are a brain symbiont that has escaped from preservation. Collect other symbionts to escape from the lab.",
    tags: ["Arcade", "Lab Escape", "Fast Gameplay"],
  },
  {
    id: "hack-the-hacker",
    title: "Hack the Hacker",
    link: "https://megrim.itch.io/hack-the-hacker",
    description:
      "You’re a hacker playing a game about a hacker: control objects through a second monitor, toggle platforms, disable traps, open barriers, and solve mini-games to hack the system.",
    tags: ["Puzzle", "Second Screen", "Mini-games"],
  },
];

const projectsListEl = document.getElementById("projects-list");
const newsListEl = document.getElementById("news-list");
const newsSourceEl = document.getElementById("news-source");
const yearEl = document.getElementById("year");
const screenshotExtensions = ["jpg", "jpeg", "png", "webp"];
const screenshotSlots = [1, 2, 3, 4, 5, 6];

yearEl.textContent = String(new Date().getFullYear());

function checkImageExists(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = () => resolve("");
    img.src = url;
  });
}

async function getProjectScreenshots(projectId) {
  const images = [];
  for (const slot of screenshotSlots) {
    let found = "";
    for (const ext of screenshotExtensions) {
      const path = `./assets/projects/${projectId}/${slot}.${ext}`;
      // eslint-disable-next-line no-await-in-loop
      found = await checkImageExists(path);
      if (found) {
        break;
      }
    }
    if (found) {
      images.push(found);
    }
  }
  return images;
}

function createProjectCard(project, screenshots) {
  const card = document.createElement("article");
  card.className = "card project-card";

  const tags = project.tags.map((tag) => `<span class="tag">${tag}</span>`).join("");
  const hasImages = screenshots.length > 0;
  const slideItems = hasImages
    ? screenshots
        .map(
          (url, idx) => `
            <img
              class="project-slide ${idx === 0 ? "is-active" : ""}"
              src="${url}"
              alt="${project.title} screenshot ${idx + 1}"
              loading="lazy"
            />
          `
        )
        .join("")
    : `<div class="project-placeholder">Добавь скриншоты в папку assets/projects/${project.id}/</div>`;

  const dots = hasImages
    ? screenshots
        .map(
          (_, idx) =>
            `<button class="project-dot ${idx === 0 ? "is-active" : ""}" type="button" aria-label="Слайд ${
              idx + 1
            }" data-slide-index="${idx}"></button>`
        )
        .join("")
    : "";

  const controls =
    screenshots.length > 1
      ? `
      <button class="project-nav prev" type="button" aria-label="Предыдущий слайд">‹</button>
      <button class="project-nav next" type="button" aria-label="Следующий слайд">›</button>
    `
      : "";

  card.innerHTML = `
    <div class="project-carousel" data-project-carousel>
      <div class="project-track">
        ${slideItems}
      </div>
      ${controls}
      <div class="project-dots">${dots}</div>
    </div>
    <h3 class="project-title">
      <a href="${project.link}" target="_blank" rel="noreferrer noopener">${project.title}</a>
    </h3>
    <p class="project-desc">${project.description}</p>
    <a class="project-link" href="${project.link}" target="_blank" rel="noreferrer noopener">Открыть на itch.io</a>
    <div class="project-tags">${tags}</div>
  `;

  if (screenshots.length > 1) {
    initCarousel(card);
  }

  return card;
}

function initCarousel(card) {
  const slides = Array.from(card.querySelectorAll(".project-slide"));
  const dots = Array.from(card.querySelectorAll(".project-dot"));
  const prevBtn = card.querySelector(".project-nav.prev");
  const nextBtn = card.querySelector(".project-nav.next");
  let current = 0;

  const setActive = (nextIndex) => {
    slides[current].classList.remove("is-active");
    dots[current].classList.remove("is-active");
    current = (nextIndex + slides.length) % slides.length;
    slides[current].classList.add("is-active");
    dots[current].classList.add("is-active");
  };

  prevBtn.addEventListener("click", () => setActive(current - 1));
  nextBtn.addEventListener("click", () => setActive(current + 1));
  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      const nextIndex = Number(dot.dataset.slideIndex);
      setActive(nextIndex);
    });
  });
}

async function renderProjects() {
  for (const project of projects) {
    // eslint-disable-next-line no-await-in-loop
    const screenshots = await getProjectScreenshots(project.id);
    const card = createProjectCard(project, screenshots);
    projectsListEl.appendChild(card);
  }
}

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

renderProjects().catch((error) => {
  console.error("projects render error:", error);
});
