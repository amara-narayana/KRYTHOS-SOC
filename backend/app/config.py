import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    APP_NAME: str = "KRYTHOS SOC"
    APP_VERSION: str = "0.1.0"
    APP_ENV: str = "production"
    DEBUG: bool = False
    HOST: str = "127.0.0.1"
    PORT: int = 8000

    # Security & Tokens
    SECRET_KEY: str = "krythos-super-secret-key-change-in-production-random32chars"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    ALGORITHM: str = "HS256"

    # Database
    DATABASE_URL: str = f"sqlite:///{BASE_DIR / 'data' / 'krythos.db'}"

    # Storage paths
    DATA_DIR: Path = BASE_DIR / "data"
    REPORTS_DIR: Path = BASE_DIR / "data" / "reports"
    LOGS_DIR: Path = BASE_DIR / "data" / "logs"
    BACKUPS_DIR: Path = BASE_DIR / "data" / "backups"

    # Policies
    REGISTRATION_POLICY: str = "open"  # "open", "approval", "disabled"
    LOG_RETENTION_DAYS: int = 90
    MAX_EVENT_BATCH_SIZE: int = 1000
    LOW_MEMORY_MODE: bool = False

    # Local AI
    AI_ENABLED: bool = True
    AI_PROVIDER: str = "local_ollama"
    AI_ENDPOINT: str = "http://127.0.0.1:11434"
    AI_MODEL: str = "llama3:latest"
    AI_TIMEOUT_SECONDS: int = 15

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Ensure runtime directories exist
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
settings.REPORTS_DIR.mkdir(parents=True, exist_ok=True)
settings.LOGS_DIR.mkdir(parents=True, exist_ok=True)
settings.BACKUPS_DIR.mkdir(parents=True, exist_ok=True)
