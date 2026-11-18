from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
DEFAULT_DB_FILE = (BACKEND_DIR / "feedbackloop.db").as_posix()
ENV_FILE = (BACKEND_DIR / ".env").as_posix()

class Settings(BaseSettings):
    PROJECT_NAME: str = "FeedbackLoop"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "super-secret-feedbackloop-jwt-key-change-in-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database - Anchored to backend/feedbackloop.db
    DATABASE_URL: str = f"sqlite:///{DEFAULT_DB_FILE}"
    
    # Ollama Cloud / API Configuration
    OLLAMA_BASE_URL: str = "https://ollama.com"
    OLLAMA_MODEL: str = "glm-5.3-flash"
    OLLAMA_TIMEOUT: int = 120
    OLLAMA_API_KEY: Optional[str] = None
    
    # Privacy & Thresholds
    MIN_RESPONSES_FOR_FACULTY_VIEW: int = 3
    EARLY_WARNING_DIFFICULTY_THRESHOLD: float = 30.0  # 30% difficulty reports trigger warning
    EARLY_WARNING_WOW_THRESHOLD: float = 15.0         # 15% WoW increase triggers watch/alert
    
    model_config = SettingsConfigDict(env_file=ENV_FILE, case_sensitive=True, extra="ignore")

settings = Settings()
