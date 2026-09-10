from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Single source of truth for data-worker env vars, mirroring .env.example."""

    model_config = SettingsConfigDict(env_file="../../.env", extra="ignore")

    database_url: str = "postgres://plated:plated_dev@localhost:5432/plated"
    redis_url: str = "redis://localhost:6379/0"
    opensearch_url: str = "http://localhost:9200"
    s3_endpoint: str = "http://localhost:9000"
    s3_region: str = "me-central-1"
    s3_access_key: str = "plated"
    s3_secret_key: str = "plated_dev_secret"
    s3_bucket: str = "plated-artefacts"
    data_workers_port: int = 8000

    # PDF section 5.3's user-chosen vision LLM provider for extraction
    # (OpenAI). Model name is configurable since a "current best" model
    # name is likely to drift over the project's lifetime.
    openai_api_key: str = ""
    openai_vision_model: str = "gpt-4o"


settings = Settings()
