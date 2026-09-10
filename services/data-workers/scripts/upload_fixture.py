"""Uploads a local file to the dev object store (MinIO) under a given key —
a manual convenience for testing the extraction pipeline (see README's
"Testing extraction end-to-end") without needing a real capture/upload
flow, which doesn't exist yet (see tasks/ingestion.py).

    python -m scripts.upload_fixture tests/fixtures/sample_menu.pdf test/sample-menu.pdf
"""

import asyncio
import mimetypes
import sys

from app.storage import upload_bytes


async def main(data: bytes, key: str, content_type: str) -> None:
    await upload_bytes(key, data, content_type)
    print(f"uploaded -> s3://{key} ({content_type}, {len(data)} bytes)")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("usage: python -m scripts.upload_fixture <local_path> <s3_key>")
        sys.exit(1)
    local_path, s3_key = sys.argv[1], sys.argv[2]
    with open(local_path, "rb") as f:
        file_data = f.read()
    guessed_type = mimetypes.guess_type(local_path)[0] or "application/octet-stream"
    asyncio.run(main(file_data, s3_key, guessed_type))
