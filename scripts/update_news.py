import json
import re
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime
from email.utils import parsedate_to_datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT_FILE = ROOT / "news.json"
POST_LIMIT = 3
USER_AGENT = "megrIm-portfolio-news-updater/1.0"

FEEDS = [
    (
        "Telegram",
        [
            "https://rsshub.rssforever.com/telegram/channel/megrIm_games",
            "https://rsshub.app/telegram/channel/megrIm_games",
        ],
    ),
    (
        "X (Twitter)",
        [
            "https://rsshub.rssforever.com/twitter/user/megrImGames",
            "https://rsshub.app/twitter/user/megrImGames",
            "https://nitter.poast.org/megrImGames/rss",
        ],
    ),
]

MEDIA_NS = {"media": "http://search.yahoo.com/mrss/"}


def fetch_text(url: str) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=30) as response:
        status = getattr(response, "status", 200)
        if status >= 400:
            raise RuntimeError(f"HTTP {status} for {url}")
        return response.read().decode("utf-8", errors="replace")


def clean_html(value: str) -> str:
    if not value:
        return ""
    text = re.sub(r"<[^>]+>", " ", value)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def extract_img_from_html(value: str) -> str:
    if not value:
        return ""
    match = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', value, re.IGNORECASE)
    return match.group(1) if match else ""


def parse_rss(xml_text: str) -> list[dict]:
    root = ET.fromstring(xml_text)
    items = root.findall("./channel/item")
    posts = []

    for item in items[:POST_LIMIT]:
        title = (item.findtext("title") or "Пост").strip()
        link = (item.findtext("link") or "#").strip()
        pub_date_raw = (item.findtext("pubDate") or "").strip()
        description_raw = (item.findtext("description") or "").strip()
        description = clean_html(description_raw)[:180]

        media_url = ""
        media_node = item.find("media:content", MEDIA_NS)
        if media_node is not None:
            media_url = (media_node.attrib.get("url") or "").strip()
        if not media_url:
            enclosure = item.find("enclosure")
            if enclosure is not None:
                media_url = (enclosure.attrib.get("url") or "").strip()
        if not media_url:
            media_url = extract_img_from_html(description_raw)

        pub_date = pub_date_raw
        if pub_date_raw:
            try:
                pub_date = parsedate_to_datetime(pub_date_raw).isoformat()
            except Exception:
                pub_date = pub_date_raw

        posts.append(
            {
                "title": title,
                "link": link,
                "pubDate": pub_date,
                "description": description,
                "mediaUrl": media_url,
            }
        )

    return posts


def collect_news() -> tuple[str, list[dict]]:
    errors = []
    for source_label, urls in FEEDS:
        for url in urls:
            try:
                xml_text = fetch_text(url)
                posts = parse_rss(xml_text)
                if posts:
                    return source_label, posts
                errors.append(f"{source_label} empty feed: {url}")
            except Exception as error:
                errors.append(f"{source_label} failed ({url}): {error}")

    error_msg = "\n".join(errors)
    raise RuntimeError(f"Unable to collect news:\n{error_msg}")


def main() -> None:
    source_label, posts = collect_news()
    payload = {
        "sourceLabel": f"Источник: {source_label}",
        "updatedAt": datetime.utcnow().isoformat() + "Z",
        "posts": posts,
    }
    OUT_FILE.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"Updated {OUT_FILE} with {len(posts)} posts from {source_label}")


if __name__ == "__main__":
    main()
