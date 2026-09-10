import pymupdf


def sniff_content_type(data: bytes) -> str:
    if data[:4] == b"%PDF":
        return "application/pdf"
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    if data[:3] == b"\xff\xd8\xff":
        return "image/jpeg"
    raise ValueError("Unrecognised artefact format (expected PDF, PNG, or JPEG).")


def pdf_to_page_images(pdf_bytes: bytes, dpi: int = 150) -> list[bytes]:
    """One PNG per page, rendered at `dpi`. No system dependency (unlike
    poppler-based tools) — PyMuPDF bundles its own renderer."""
    doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")  # type: ignore[no-untyped-call]
    try:
        return [page.get_pixmap(dpi=dpi).tobytes("png") for page in doc]  # type: ignore[attr-defined]
    finally:
        doc.close()  # type: ignore[no-untyped-call]


def to_page_images(artefact_bytes: bytes) -> list[tuple[bytes, str]]:
    """Normalises any supported artefact into (page_bytes, mime_type) pairs
    ready to send to the vision model. Mislabelling a JPEG photo as PNG (or
    vice versa) in the eventual data URI breaks image decoding on the API
    side, so the real content type travels with each page rather than being
    assumed."""
    content_type = sniff_content_type(artefact_bytes)
    if content_type == "application/pdf":
        return [(page, "image/png") for page in pdf_to_page_images(artefact_bytes)]
    return [(artefact_bytes, content_type)]
