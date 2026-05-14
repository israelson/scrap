from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str

    # Evolution API — opcional, ativa verificação de WhatsApp
    evolution_api_url: Optional[str] = None
    evolution_api_key: Optional[str] = None
    evolution_instance: Optional[str] = None
    whatsapp_check_timeout_seconds: int = 300  # 5 minutos
    whatsapp_test_message: str = "Olá! Tudo bem?"

    model_config = {"env_file": ".env"}

    @property
    def whatsapp_enabled(self) -> bool:
        return bool(self.evolution_api_url and self.evolution_api_key and self.evolution_instance)


settings = Settings()
