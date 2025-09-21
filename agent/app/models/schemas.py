"""
Pydantic models for request/response validation and serialization
"""

from datetime import datetime
from typing import Optional, List
from uuid import UUID
from enum import Enum

from pydantic import BaseModel, Field, validator


class RequestStatus(str, Enum):
    PENDING = "pending"
    RESOLVED = "resolved"
    UNRESOLVED = "unresolved"
    TIMEOUT = "timeout"


class Priority(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class FollowUpType(str, Enum):
    SMS = "sms"
    CALL = "call"
    EMAIL = "email"


# Base models
class BaseResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None


class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    error_code: Optional[str] = None


# Customer models
class CustomerCreate(BaseModel):
    phone_number: str = Field(..., pattern=r'^\+?[1-9]\d{1,14}$', description="Valid phone number")
    name: Optional[str] = Field(None, max_length=100)
    email: Optional[str] = Field(None, pattern=r'^[^@]+@[^@]+\.[^@]+$')
    notes: Optional[str] = None


class CustomerResponse(BaseModel):
    id: UUID
    phone_number: str
    name: Optional[str]
    email: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Call Session models
class CallSessionCreate(BaseModel):
    customer_phone: str = Field(..., pattern=r'^\+?[1-9]\d{1,14}$')
    customer_name: Optional[str] = None


class CallSessionResponse(BaseModel):
    id: UUID
    customer_id: Optional[UUID]
    phone_number: str
    session_start: datetime
    session_end: Optional[datetime]
    status: str
    transcript: Optional[str]

    class Config:
        from_attributes = True


# Knowledge Base models
class KnowledgeBaseCreate(BaseModel):
    question: str = Field(..., min_length=10, max_length=500)
    answer: str = Field(..., min_length=10, max_length=2000)
    category: Optional[str] = Field(None, max_length=50)


class KnowledgeBaseUpdate(BaseModel):
    question: Optional[str] = Field(None, min_length=10, max_length=500)
    answer: Optional[str] = Field(None, min_length=10, max_length=2000)
    category: Optional[str] = Field(None, max_length=50)
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0)


class KnowledgeBaseResponse(BaseModel):
    id: UUID
    question: str
    answer: str
    category: Optional[str]
    source: str
    confidence_score: float
    usage_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Help Request models
class HelpRequestCreate(BaseModel):
    customer_phone: str = Field(..., pattern=r'^\+?[1-9]\d{1,14}$')
    question: str = Field(..., min_length=10, max_length=1000)
    context: Optional[str] = Field(None, max_length=5000)
    priority: Priority = Priority.NORMAL
    call_session_id: Optional[UUID] = None


class HelpRequestUpdate(BaseModel):
    status: Optional[RequestStatus] = None
    supervisor_response: Optional[str] = Field(None, min_length=10, max_length=2000)
    supervisor_id: Optional[str] = Field(None, max_length=100)


class HelpRequestResponse(BaseModel):
    id: UUID
    call_session_id: Optional[UUID]
    customer_phone: str
    question: str
    context: Optional[str]
    status: RequestStatus
    priority: Priority
    supervisor_response: Optional[str]
    supervisor_id: Optional[str]
    resolved_at: Optional[datetime]
    timeout_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Supervisor Dashboard models
class SupervisorDashboardResponse(BaseModel):
    id: UUID
    question: str
    context: Optional[str]
    status: RequestStatus
    priority: Priority
    customer_phone: str
    customer_name: Optional[str]
    created_at: datetime
    timeout_at: Optional[datetime]
    hours_waiting: float

    class Config:
        from_attributes = True


# AI Agent models
class AIQueryRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=1000)
    customer_phone: str = Field(..., pattern=r'^\+?[1-9]\d{1,14}$')
    call_session_id: Optional[UUID] = None
    context: Optional[str] = Field(None, max_length=5000)


class AIQueryResponse(BaseModel):
    has_answer: bool
    answer: Optional[str] = None
    confidence: float
    help_request_id: Optional[UUID] = None
    escalated: bool = False


# Follow-up models
class FollowUpCreate(BaseModel):
    help_request_id: UUID
    message: str = Field(..., min_length=10, max_length=1000)
    follow_up_type: FollowUpType


class FollowUpResponse(BaseModel):
    id: UUID
    help_request_id: UUID
    message: str
    follow_up_type: FollowUpType
    status: str
    sent_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


# Analytics models
class AnalyticsResponse(BaseModel):
    total_requests: int
    pending_requests: int
    resolved_requests: int
    timeout_requests: int
    avg_resolution_time_hours: float
    knowledge_base_entries: int
    top_categories: List[dict]


# Validation helpers
class PhoneNumberValidator:
    @staticmethod
    def validate_phone(phone: str) -> str:
        # Remove any whitespace and standardize format
        phone = phone.strip().replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
        if not phone.startswith("+"):
            if phone.startswith("1") and len(phone) == 11:
                phone = "+" + phone
            elif len(phone) == 10:
                phone = "+1" + phone
        return phone