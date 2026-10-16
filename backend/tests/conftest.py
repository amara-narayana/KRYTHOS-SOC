import pytest
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

# Use an isolated test database
os.environ["DATABASE_URL"] = "sqlite:///./data/test_krythos.db"

from backend.app.database import Base, get_db
from backend.app.main import app
from backend.app.models.user import User, UserRole
from backend.app.core.security import hash_password, create_access_token
from backend.app.services.detection_service import initialize_default_rules

test_engine = create_engine("sqlite:///./data/test_krythos.db", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)
    test_db_file = os.path.join(".", "data", "test_krythos.db")
    if os.path.exists(test_db_file):
        try:
            os.remove(test_db_file)
        except Exception:
            pass

@pytest.fixture
def db_session():
    session = TestingSessionLocal()
    initialize_default_rules(session)
    try:
        yield session
    finally:
        session.close()

@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def admin_token(db_session):
    admin = db_session.query(User).filter(User.username == "testadmin").first()
    if not admin:
        admin = User(
            username="testadmin",
            email="admin@krythos.local",
            full_name="Krythos Admin",
            hashed_password=hash_password("SuperSecret123!"),
            role=UserRole.ADMINISTRATOR,
            is_active=True
        )
        db_session.add(admin)
        db_session.commit()
        db_session.refresh(admin)

    token = create_access_token({"sub": admin.username, "user_id": admin.id, "role": admin.role.value})
    return token
