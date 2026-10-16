import logging
import sys
from backend.app.config import settings

def setup_logging():
    log_level = logging.DEBUG if settings.DEBUG else logging.INFO
    log_format = "%(asctime)s [%(levelname)s] [%(name)s]: %(message)s"
    
    logging.basicConfig(
        level=log_level,
        format=log_format,
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler(settings.LOGS_DIR / "krythos.log", encoding="utf-8")
        ]
    )
    return logging.getLogger("krythos")

logger = setup_logging()
