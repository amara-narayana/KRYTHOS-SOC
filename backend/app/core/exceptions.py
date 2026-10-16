from fastapi import HTTPException, status

class KrythosException(Exception):
    """Base exception for all KRYTHOS domain errors."""
    def __init__(self, message: str, code: str = "GENERIC_ERROR"):
        super().__init__(message)
        self.message = message
        self.code = code

class EntityNotFoundError(KrythosException):
    def __init__(self, entity: str, identifier: str):
        super().__init__(f"{entity} with ID '{identifier}' not found.", code="NOT_FOUND")

class AuthenticationError(KrythosException):
    def __init__(self, message: str = "Invalid username or password."):
        super().__init__(message, code="AUTH_FAILED")

class PermissionDeniedError(KrythosException):
    def __init__(self, message: str = "Access denied: insufficient permissions."):
        super().__init__(message, code="FORBIDDEN")

class DuplicateEntityError(KrythosException):
    def __init__(self, message: str = "An entity with these attributes already exists."):
        super().__init__(message, code="CONFLICT")

class ValidationError(KrythosException):
    def __init__(self, message: str):
        super().__init__(message, code="VALIDATION_ERROR")
