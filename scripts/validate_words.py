#!/usr/bin/env python3
"""Re-check the committed 850-word dataset without network access."""

from __future__ import annotations

import json
import sys
from collections import Counter
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parent
SITE_DIR = SCRIPT_DIR.parent
PROJECT_DIR = SITE_DIR.parent
DATASET_PATH = SITE_DIR / "public" / "data" / "words.json"
CANONICAL_PATH = PROJECT_DIR / "tmp" / "pdfs" / "ogden-850-canonical.json"
EXPECTED = {
    "operations": 100,
    "things_general": 400,
    "things_picturable": 200,
    "qualities_general": 100,
    "qualities_opposites": 50,
}


def load(path: Path):
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def main() -> int:
    dataset = load(DATASET_PATH)
    canonical = load(CANONICAL_PATH)
    words = dataset.get("words", [])
    canonical_entries = canonical.get("entries", [])
    checks = {
        "total": len(words) == 850,
        "unique_ids": len({item.get("id") for item in words}) == 850,
        "unique_words": len({str(item.get("word", "")).casefold() for item in words}) == 850,
        "orders": [item.get("order") for item in words] == list(range(1, 851)),
        "category_counts": dict(Counter(item.get("category_id") for item in words)) == EXPECTED,
        "canonical_sequence": [item.get("word") for item in words]
        == [item.get("lemma") for item in canonical_entries],
        "required_content": all(
            item.get("word")
            and item.get("pos")
            and item.get("pronunciation", {}).get("uk", {}).get("ipa")
            and item.get("pronunciation", {}).get("us", {}).get("ipa")
            and item.get("meaning_zh")
            and item.get("definition_en")
            and item.get("example", {}).get("en")
            and item.get("example", {}).get("zh")
            and 0 <= len(item.get("related", [])) <= 3
            for item in words
        ),
    }
    print(json.dumps({"passed": all(checks.values()), "checks": checks}, ensure_ascii=False, indent=2))
    return 0 if all(checks.values()) else 1


if __name__ == "__main__":
    sys.exit(main())
