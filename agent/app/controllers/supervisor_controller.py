"""
Supervisor Controller - Handles API requests for supervisor operations
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
import logging

from ..models.schemas import (
    SupervisorDashboardResponse,
    HelpRequestResponse,
    HelpRequestUpdate,
    KnowledgeBaseResponse,
    KnowledgeBaseCreate,
    AnalyticsResponse,
    BaseResponse
)
from ..services.supervisor_service import SupervisorService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/supervisor", tags=["supervisor"])


def get_supervisor_service() -> SupervisorService:
    """Dependency injection for supervisor service"""
    return SupervisorService()


@router.get("/dashboard", response_model=List[SupervisorDashboardResponse])
async def get_dashboard(
    supervisor_service: SupervisorService = Depends(get_supervisor_service)
) -> List[SupervisorDashboardResponse]:
    """
    Get all pending help requests for supervisor dashboard
    """
    try:
        return await supervisor_service.get_dashboard_data()

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting dashboard data: {str(e)}")


@router.patch("/requests/{request_id}/resolve", response_model=HelpRequestResponse)
async def resolve_help_request(
    request_id: str,
    update: HelpRequestUpdate,
    supervisor_id: str = Query(..., description="ID of the supervisor resolving the request"),
    add_to_kb: bool = Query(True, description="Whether to add this Q&A to knowledge base"),
    supervisor_service: SupervisorService = Depends(get_supervisor_service)
) -> HelpRequestResponse:
    """
    Resolve a help request with supervisor response

    - Updates the help request status to resolved
    - Optionally adds the Q&A to knowledge base
    - Triggers follow-up communication to customer
    """
    try:
        from uuid import UUID

        if not update.supervisor_response:
            raise HTTPException(status_code=400, detail="Supervisor response is required")

        result = await supervisor_service.resolve_help_request(
            request_id=UUID(request_id),
            supervisor_response=update.supervisor_response,
            supervisor_id=supervisor_id,
            add_to_knowledge_base=add_to_kb
        )

        if not result:
            raise HTTPException(status_code=404, detail="Help request not found")

        return result

    except ValueError as ve:
        logger.error(f"ValueError in resolve_help_request: {str(ve)}")
        raise HTTPException(status_code=400, detail=f"Validation error: {str(ve)}")
    except Exception as e:
        logger.error(f"Exception in resolve_help_request: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error resolving help request: {str(e)}")


@router.get("/knowledge-base", response_model=List[KnowledgeBaseResponse])
async def get_knowledge_base(
    category: Optional[str] = Query(None, description="Filter by category"),
    limit: int = Query(100, ge=1, le=500, description="Number of entries to return"),
    supervisor_service: SupervisorService = Depends(get_supervisor_service)
) -> List[KnowledgeBaseResponse]:
    """
    Get knowledge base entries, optionally filtered by category
    """
    try:
        return await supervisor_service.get_knowledge_base(category=category, limit=limit)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting knowledge base: {str(e)}")


@router.post("/knowledge-base", response_model=KnowledgeBaseResponse)
async def add_knowledge_entry(
    entry: KnowledgeBaseCreate,
    supervisor_service: SupervisorService = Depends(get_supervisor_service)
) -> KnowledgeBaseResponse:
    """
    Manually add entry to knowledge base
    """
    try:
        return await supervisor_service.add_knowledge_entry(
            question=entry.question,
            answer=entry.answer,
            category=entry.category
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding knowledge entry: {str(e)}")


@router.get("/analytics", response_model=AnalyticsResponse)
async def get_analytics(
    supervisor_service: SupervisorService = Depends(get_supervisor_service)
) -> AnalyticsResponse:
    """
    Get analytics data for supervisor dashboard
    """
    try:
        return await supervisor_service.get_analytics()

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting analytics: {str(e)}")


@router.post("/cleanup-timeouts")
async def cleanup_timeout_requests(
    supervisor_service: SupervisorService = Depends(get_supervisor_service)
) -> BaseResponse:
    """
    Clean up old pending requests by marking them as timeout
    """
    try:
        count = await supervisor_service.cleanup_timeout_requests()

        return BaseResponse(
            success=True,
            message=f"Marked {count} old requests as timeout",
            data={"timeout_count": count}
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error cleaning up timeouts: {str(e)}")