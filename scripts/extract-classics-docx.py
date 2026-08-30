"""Extract the Chinese classics source document without altering its text.

The generated JSON is the reviewable bridge between the Word document and the
website data builder. Paragraph indexes are retained so every practice item can
be traced back to the DOCX source.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from docx import Document


def parse_args() -> argparse.Namespace:
    project_root = Path(__file__).resolve().parents[2]
    site_root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description="Extract classics paragraphs from DOCX")
    parser.add_argument(
        "--input",
        type=Path,
        default=project_root / "中华智慧启蒙经典诵读1.docx",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=site_root / "content" / "classics-source.json",
    )
    return parser.parse_args()


def normalize_paragraph(text: str) -> str:
    return " ".join(text.replace("\u00a0", " ").split()).strip()


def main() -> None:
    args = parse_args()
    input_path = args.input.resolve()
    output_path = args.output.resolve()
    if not input_path.is_file():
        raise FileNotFoundError(f"Source DOCX not found: {input_path}")

    document = Document(input_path)
    paragraphs = [
        {"index": index, "text": text}
        for index, paragraph in enumerate(document.paragraphs, start=1)
        if (text := normalize_paragraph(paragraph.text))
    ]
    if not paragraphs:
        raise ValueError("The source DOCX contains no non-empty paragraphs")

    payload = {
        "schemaVersion": 1,
        "sourceFile": input_path.name,
        "title": paragraphs[0]["text"],
        "paragraphCount": len(paragraphs),
        "paragraphs": paragraphs,
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        json.dumps(
            {
                "ok": True,
                "source": str(input_path),
                "output": str(output_path),
                "paragraphs": len(paragraphs),
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
