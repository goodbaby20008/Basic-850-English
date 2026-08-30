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

## Chinese classics pinyin pipeline

`extract-classics-docx.py` reads `../中华智慧启蒙经典诵读1.docx` and writes
the original non-empty paragraphs, with Word paragraph indexes, to
`content/classics-source.json`. `build-classics-data.mjs` then groups complete
passages, applies the pinyin-pro complete dictionary plus contextual classical
phrase overrides, and writes `public/data/classics.json`.

Run from the `site` directory:

```powershell
python scripts/extract-classics-docx.py
npm run generate:classics
npm run validate:data
```

The ignored `work/classics-pinyin-audit.json` lists every generated passage
that contains a polyphonic candidate. Contextual decisions belong in
`CLASSICAL_PINYIN_OVERRIDES`; add a regression assertion for important changes.
