import argparse
import json
import pathlib
import re
import subprocess
from datetime import datetime, timezone
from urllib.parse import quote_plus

ROOT = pathlib.Path(__file__).resolve().parents[1]
QUEUE_PATH = ROOT / "src" / "data" / "blogEditorialQueue.generated.json"
SELECTION_PATH = ROOT / "src" / "data" / "blogUnsplashSelection.json"
COLLECTION_PATH = ROOT / "unsplash-collection-yU-ii4hFjlg.json"

IMG_RE = re.compile(r'https://images\.unsplash\.com/photo-[^\"\s]+')
NON_WORD_RE = re.compile(r"[^a-z0-9\s]")
MULTI_SPACE_RE = re.compile(r"\s+")

SEMANTIC_FALLBACKS = {
    "casa-cor-2026-mente-coracao": [
        "interior design color palette living room",
        "colorful luxury living room interior",
    ],
    "acapulco-club-house-residencia-luxo": [
        "luxury contemporary house exterior",
        "modern residence facade architecture",
    ],
    "harman-kardon-som-ambientes": [
        "premium speaker interior living room",
        "home audio setup modern interior",
    ],
    "evf-estudo-viabilidade-financeira": [
        "construction budget planning desk",
        "architecture planning documents office",
    ],
    "obraeasy-como-funciona-para-clientes-finais": [
        "residential construction project planning",
        "architect and client meeting modern office",
    ],
}


def read_json(path: pathlib.Path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: pathlib.Path, payload):
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def extract_id_from_url(base_url: str) -> str:
    return base_url.rsplit("/photo-", 1)[-1]


def normalize_text(value: str) -> str:
    lowered = (value or "").strip().lower()
    lowered = NON_WORD_RE.sub(" ", lowered)
    return MULTI_SPACE_RE.sub(" ", lowered).strip()


def slug_to_query(slug: str) -> str:
    text = normalize_text((slug or "").replace("-", " "))
    tokens = [t for t in text.split() if len(t) > 2 and not t.isdigit()]
    return " ".join(tokens[:7]).strip()


def build_query_pool(row: dict, slot_index: int) -> list[str]:
    slug = row.get("slug", "")
    title = row.get("title", "")
    slots = row.get("slots") or []
    slot = slots[slot_index] if slot_index < len(slots) else {}

    base_candidates = [
        slot.get("mainQuery") or "",
        slot.get("searchQuery") or "",
        normalize_text(title),
        slug_to_query(slug),
    ]

    semantic = SEMANTIC_FALLBACKS.get(slug, [])
    all_candidates = base_candidates + semantic

    deduped = []
    for query in all_candidates:
        query = normalize_text(query)
        if not query:
            continue
        if query not in deduped:
            deduped.append(query)
    return deduped


def fetch_unsplash_candidates(query: str, cache: dict[str, list[str]]) -> list[str]:
    if query in cache:
        return cache[query]

    target = f"https://unsplash.com/s/photos/{quote_plus(query)}"
    proc = subprocess.run(
        ["curl", "-L", target],
        cwd=ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="ignore",
        check=False,
    )

    if proc.returncode != 0:
        cache[query] = []
        return []

    html = proc.stdout or ""
    seen = []
    for match in IMG_RE.findall(html):
        base = match.split("?")[0]
        if base not in seen:
            seen.append(base)

    cache[query] = seen
    return seen


def build_alt(title: str, slot: str) -> str:
    cleaned = title.replace("\n", " ").strip()
    if slot == "hero":
        return f"Imagem editorial para {cleaned}, com leitura contemporanea e composicao premium"
    return f"Recorte visual para {cleaned}, reforcando detalhe material e atmosfera do tema"


def ensure_photo_in_collection(collection: dict, photo_id: str, base_url: str):
    photos = collection.setdefault("photos", [])
    existing = next((p for p in photos if p.get("id") == photo_id), None)
    if existing:
        return

    photos.append(
        {
            "id": photo_id,
            "slug": photo_id,
            "alt": "",
            "photographer": "",
            "profile": "",
            "page": f"https://images.unsplash.com/photo-{photo_id}",
            "downloadLocation": "",
            "urls": {
                "raw": base_url,
                "full": f"{base_url}?auto=format&fit=crop&q=90&w=2000",
                "regular": f"{base_url}?auto=format&fit=crop&q=80&w=1600",
                "small": f"{base_url}?auto=format&fit=crop&q=80&w=800",
                "thumb": f"{base_url}?auto=format&fit=crop&q=70&w=400",
            },
        }
    )


def unsplash_ready(slug: str, selection: dict) -> bool:
    entry = (selection.get("slugs") or {}).get(slug) or {}
    if not isinstance(entry, dict):
        return False
    hero = entry.get("hero") if isinstance(entry.get("hero"), dict) else {}
    card = entry.get("card") if isinstance(entry.get("card"), dict) else {}
    return bool(hero.get("id") and card.get("id"))


def get_priority_pending(queue: list[dict], selection: dict) -> list[dict]:
    pending = []
    for row in queue:
        status = row.get("status") or {}
        cloud_ready = bool(status.get("hasCloudinaryHero") and status.get("hasCloudinaryCard"))
        ready = cloud_ready or unsplash_ready(row.get("slug", ""), selection)
        if (not ready) and row.get("needsCopyNormalization"):
            pending.append(row)

    pending.sort(key=lambda x: x.get("boldCount", 0), reverse=True)
    return pending


def gather_used_ids(selection: dict) -> set[str]:
    used = set()
    for entry in (selection.get("slugs") or {}).values():
        if not isinstance(entry, dict):
            continue
        for key, value in entry.items():
            if key == "context" and isinstance(value, list):
                for item in value:
                    if isinstance(item, dict) and item.get("id"):
                        used.add(item.get("id"))
                continue
            if isinstance(value, dict) and value.get("id"):
                used.add(value.get("id"))
    return used


def pick_candidate(query_pool: list[str], used_ids: set[str], blocked_ids: set[str], cache: dict[str, list[str]]):
    for query in query_pool:
        candidates = fetch_unsplash_candidates(query, cache)
        for base_url in candidates:
            pid = extract_id_from_url(base_url)
            if not pid or pid in used_ids or pid in blocked_ids:
                continue
            return pid, base_url, query
    return None, None, None


def main():
    parser = argparse.ArgumentParser(description="Fill Unsplash hero/card for priority pending blog slugs.")
    parser.add_argument("--batch-size", type=int, default=10)
    parser.add_argument("--report", type=str, default="temp_unsplash_priority_batch_report.json")
    args = parser.parse_args()

    queue = read_json(QUEUE_PATH)
    selection = read_json(SELECTION_PATH)
    collection = read_json(COLLECTION_PATH)

    selection.setdefault("slugs", {})

    pending = get_priority_pending(queue, selection)
    target_batch = pending[: max(1, args.batch_size)]
    used_ids = gather_used_ids(selection)
    query_cache: dict[str, list[str]] = {}

    report = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "batchSize": args.batch_size,
        "updatedSlugs": [],
        "failed": [],
    }

    for row in target_batch:
        slug = row.get("slug")
        title = row.get("title") or slug

        hero_pool = build_query_pool(row, 0)
        card_pool = build_query_pool(row, 1)

        hero_id, hero_url, hero_query_used = pick_candidate(hero_pool, used_ids, set(), query_cache)
        if hero_id:
            used_ids.add(hero_id)

        blocked = {hero_id} if hero_id else set()
        card_id, card_url, card_query_used = pick_candidate(card_pool, used_ids, blocked, query_cache)
        if card_id:
            used_ids.add(card_id)
        elif hero_id:
            card_id = hero_id
            card_url = hero_url
            card_query_used = hero_query_used

        if not hero_id or not card_id:
            report["failed"].append(
                {
                    "slug": slug,
                    "heroQueries": hero_pool,
                    "cardQueries": card_pool,
                    "heroFound": bool(hero_id),
                    "cardFound": bool(card_id),
                }
            )
            continue

        ensure_photo_in_collection(collection, hero_id, hero_url)
        ensure_photo_in_collection(collection, card_id, card_url)

        slug_entry = selection["slugs"].setdefault(slug, {})
        slug_entry["hero"] = {
            "id": hero_id,
            "alt": build_alt(title, "hero"),
        }
        slug_entry["card"] = {
            "id": card_id,
            "alt": build_alt(title, "card"),
        }

        report["updatedSlugs"].append(
            {
                "slug": slug,
                "hero": hero_id,
                "card": card_id,
                "heroQueryUsed": hero_query_used,
                "cardQueryUsed": card_query_used,
            }
        )

    report_path = ROOT / args.report
    write_json(SELECTION_PATH, selection)
    write_json(COLLECTION_PATH, collection)
    write_json(report_path, report)

    print(f"updated={len(report['updatedSlugs'])}")
    print(f"failed={len(report['failed'])}")
    print(str(report_path))


if __name__ == "__main__":
    main()
