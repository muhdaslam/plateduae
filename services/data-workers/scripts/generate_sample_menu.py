"""Regenerates tests/fixtures/sample_menu.pdf: a simple one-page menu for
"Al Reef Grill" (matching the PDF's own Appendix B worked example and the
seed data's demo restaurant) used to manually verify the extraction
pipeline end-to-end against a real vision LLM call. Not run automatically —
calling a real API in CI costs money and is non-deterministic; this is a
manual verification aid, documented in the README's "Testing extraction
end-to-end" section.

    python -m scripts.generate_sample_menu
"""

import pymupdf

OUTPUT_PATH = "tests/fixtures/sample_menu.pdf"


def main() -> None:
    doc = pymupdf.open()  # type: ignore[no-untyped-call]
    page = doc.new_page(width=595, height=842)  # A4

    y = 60
    page.insert_text((60, y), "Al Reef Grill", fontsize=24, fontname="helv")
    y += 40
    page.insert_text((60, y), "Business Bay, Dubai", fontsize=12, fontname="helv")
    y += 50
    page.insert_text((60, y), "GRILLS", fontsize=16, fontname="helv")
    y += 30
    page.insert_text((60, y), "Chicken Shawarma Sandwich ... AED 14.00", fontsize=12, fontname="helv")
    y += 20
    page.insert_text(
        (80, y),
        "Marinated chicken, garlic sauce, pickles, saj bread. Contains: gluten, milk.",
        fontsize=10,
        fontname="helv",
    )
    y += 30
    page.insert_text((60, y), "Beef Kofta Grill ... AED 22.00", fontsize=12, fontname="helv")
    y += 20
    page.insert_text((80, y), "Grilled beef and lamb kofta skewers with rice.", fontsize=10, fontname="helv")
    y += 40
    page.insert_text((60, y), "BEVERAGES", fontsize=16, fontname="helv")
    y += 30
    page.insert_text((60, y), "Fresh Orange Juice ... AED 12.00", fontsize=12, fontname="helv")

    doc.save(OUTPUT_PATH)  # type: ignore[no-untyped-call]
    doc.close()  # type: ignore[no-untyped-call]
    print(f"wrote {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
