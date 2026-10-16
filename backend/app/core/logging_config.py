import logging
import sys
from pathlib import Path
from backend.app.config import settings

def setup_logging():
    log_level = logging.DEBUG if settings.DEBUG else logging.INFO
    log_format = "%(asctime)s [%(levelname)s] [%(name)s]: %(message)s"
    
    handlers = [logging.StreamHandler(sys.stdout)]
    try:
        settings.LOGS_DIR.mkdir(parents=True, exist_ok=True)
        log_file = settings.LOGS_DIR / "krythos.log"
        handlers.append(logging.FileHandler(log_file, encoding="utf-8"))
    except Exception as e:
        sys.stderr.write(f"[KRYTHOS] Notice: File logging disabled due to filesystem permissions ({e}). Streaming to journald/stdout.\n")

    logging.basicConfig(
        level=log_level,
        format=log_format,
        handlers=handlers
    )
    return logging.getLogger("krythos")

logger = setup_logging()
