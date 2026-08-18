# 850-word data pipeline

`build_words.py` treats `tmp/pdfs/ogden-850-canonical.json` as the sole
authority for the 850 members, their source order, categories, and British
spellings. It enriches the list from open lexical sources and writes static JSON
to `public/data`, so the finished website does not need a database or live
dictionary API.

Run from the `site` directory:

```powershell
python scripts/build_words.py
python scripts/validate_words.py
```

After the first successful online build, source subsets are cached under
`scripts/cache`. A reproducible no-network build is then available:

```powershell
python scripts/build_words.py --offline
```

The structural validation report checks count, uniqueness, order, categories,
British source spelling, field presence, and the 0–3 related-term bound. A pass
does **not** mean the automatically selected meanings, senses, or examples have
completed human pedagogical review. Records using any deterministic fallback
are labelled `draft`; fully source-backed automatic selections are labelled
`mixed`, not `verified`.

The unlicensed reference repository named by the project owner is not ingested.
Its table content is intentionally absent from the pipeline.
