from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "FeedbackLoop"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "super-secret-feedbackloop-jwt-key-change-in-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database
    DATABASE_URL: str = "sqlite:///./feedbackloop.db"
    
    # Ollama AI Configuration
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.1:8b"
    OLLAMA_TIMEOUT: int = 120
    
    # Privacy & Thresholds
    MIN_RESPONSES_FOR_FACULTY_VIEW: int = 3
    EARLY_WARNING_DIFFICULTY_THRESHOLD: float = 30.0  # 30% difficulty reports trigger warning
    EARLY_WARNING_WOW_THRESHOLD: float = 15.0         # 15% WoW increase triggers watch/alert
    
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

settings = Settings()
