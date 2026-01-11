from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Asterisk Admin"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://asterisk:asterisk@localhost:5432/asterisk_admin"
    DATABASE_SYNC_URL: str = "postgresql://asterisk:asterisk@localhost:5432/asterisk_admin"
    
    # Security
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    
    # Asterisk AMI
    AMI_HOST: str = "127.0.0.1"
    AMI_PORT: int = 5038
    AMI_USERNAME: str = "admin"
    AMI_SECRET: str = "admin"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Asterisk Paths
    ASTERISK_CONFIG_PATH: str = "/etc/asterisk"
    ASTERISK_SPOOL_PATH: str = "/var/spool/asterisk/outgoing"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
