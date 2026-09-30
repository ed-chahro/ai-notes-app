import os
import sys
import logging
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Setup clean logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("database")

# Load environment variables from .env
load_dotenv()

# MySQL Database connection parameters
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "notes_db")

# Optional explicit toggle: USE_SQLITE_FALLBACK=true
FORCE_SQLITE = os.getenv("USE_SQLITE_FALLBACK", "").lower() in ("true", "1", "yes")

# Database URL from env or constructed from parameters
ENV_DATABASE_URL = os.getenv("DATABASE_URL", "").strip()

SQLITE_URL = "sqlite:///./notes.db"

def init_database_engine():
    """
    Initializes SQLAlchemy engine with robust SQLite fallback.
    If MySQL credentials are missing, default placeholders, or if the MySQL
    server is unreachable, it seamlessly falls back to local SQLite file storage (notes.db).
    """
    global DB_TYPE, DB_LOCATION

    # Case 1: Explicit SQLite request or direct sqlite database url
    if FORCE_SQLITE or ENV_DATABASE_URL.startswith("sqlite"):
        logger.info("[Database] Using SQLite database: notes.db (zero setup mode)")
        DB_TYPE = "sqlite"
        DB_LOCATION = "./notes.db"
        return create_engine(SQLITE_URL, connect_args={"check_same_thread": False})

    # Case 2: Check if MySQL credentials are unset or default placeholders
    is_placeholder = (
        not MYSQL_PASSWORD or 
        MYSQL_PASSWORD in ("password", "your_password", "your_mysql_password", "")
    ) and not ENV_DATABASE_URL

    if is_placeholder:
        logger.info(
            "[Database] No MySQL instance configured or password is placeholder. "
            "Automatically activating SQLite fallback: sqlite:///./notes.db"
        )
        DB_TYPE = "sqlite"
        DB_LOCATION = "./notes.db"
        return create_engine(SQLITE_URL, connect_args={"check_same_thread": False})

    # Case 3: Attempt real MySQL connection
    mysql_target_url = ENV_DATABASE_URL or (
        f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}?charset=utf8mb4"
    )

    try:
        logger.info(f"[Database] Attempting connection to MySQL at {MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}...")
        test_engine = create_engine(
            mysql_target_url,
            connect_args={"connect_timeout": 3},
            pool_pre_ping=True,
            pool_recycle=3600
        )
        with test_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        
        logger.info("[Database] Successfully connected to MySQL database!")
        DB_TYPE = "mysql"
        DB_LOCATION = f"{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DATABASE}"
        return test_engine

    except Exception as exc:
        logger.warning(
            f"[Database] Could not connect to MySQL server ({exc}). "
            "Automatically falling back to local SQLite database (notes.db). "
            "Zero manual setup required to run and test all CRUD endpoints!"
        )
        DB_TYPE = "sqlite"
        DB_LOCATION = "./notes.db (fallback)"
        return create_engine(SQLITE_URL, connect_args={"check_same_thread": False})

DB_TYPE = "sqlite"
DB_LOCATION = "./notes.db"
engine = init_database_engine()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Dependency yielding a database session per request and closing it safely."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
