import aioboto3

from app.config import settings

_session = aioboto3.Session()


def _client_kwargs() -> dict[str, str]:
    return {
        "endpoint_url": settings.s3_endpoint,
        "aws_access_key_id": settings.s3_access_key,
        "aws_secret_access_key": settings.s3_secret_key,
        "region_name": settings.s3_region,
    }


async def get_object_bytes(key: str) -> bytes:
    async with _session.client("s3", **_client_kwargs()) as s3:
        response = await s3.get_object(Bucket=settings.s3_bucket, Key=key)
        async with response["Body"] as stream:
            data: bytes = await stream.read()
            return data


async def upload_bytes(key: str, data: bytes, content_type: str) -> None:
    """Dev/test convenience — the real capture stage (still a stub, see
    tasks/ingestion.py) is what would normally put artefacts here."""
    async with _session.client("s3", **_client_kwargs()) as s3:
        await s3.put_object(Bucket=settings.s3_bucket, Key=key, Body=data, ContentType=content_type)
