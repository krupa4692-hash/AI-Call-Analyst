"""Application settings loaded from environment variables."""

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central configuration for the Call Intelligence API."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    openai_api_key: str = "your_openai_api_key_here"
    mongodb_uri: str = "mongodb://localhost:27017"
    db_name: str = "call_intelligence"
    recordings_path: str = "./call_recordings"

    @property
    def recordings_path_resolved(self) -> Path:
        """Absolute path to the recordings directory."""
        try:
            p = Path(self.recordings_path)
            return p.resolve()
        except Exception:
            return Path(self.recordings_path).absolute()


settings = Settings()
