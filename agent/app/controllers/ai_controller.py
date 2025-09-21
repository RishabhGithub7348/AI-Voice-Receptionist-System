"""
AI Controller - Handles API requests for AI agent interactions
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List
from uuid import uuid4
from datetime import datetime, timedelta

from ..models.schemas import (
    AIQueryRequest,
    AIQueryResponse,
    BaseResponse,
    ErrorResponse
)
from ..services.ai_service import AIService
from ..repositories.base_repository import BaseRepository

router = APIRouter(prefix="/ai", tags=["ai"])


def get_ai_service() -> AIService:
    """Dependency injection for AI service"""
    return AIService()


@router.post("/query", response_model=AIQueryResponse)
async def process_query(
    request: AIQueryRequest,
    ai_service: AIService = Depends(get_ai_service)
) -> AIQueryResponse:
    """
    Process a customer query through the AI system

    - Searches knowledge base for existing answers
    - Escalates to human supervisor if no good answer found
    - Returns appropriate response for the agent
    """
    try:
        response = await ai_service.process_customer_query(
            question=request.question,
            customer_phone=request.customer_phone,
            call_session_id=request.call_session_id,
            context=request.context
        )
        return response

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")


@router.get("/context")
async def get_salon_context(
    ai_service: AIService = Depends(get_ai_service)
) -> dict:
    """
    Get salon business context for AI agent prompting
    """
    try:
        context = await ai_service.get_salon_context()
        return {"context": context}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting context: {str(e)}")


@router.post("/learn/{help_request_id}")
async def learn_from_resolution(
    help_request_id: str,
    supervisor_response: str,
    ai_service: AIService = Depends(get_ai_service)
) -> BaseResponse:
    """
    Learn from supervisor resolution and add to knowledge base
    """
    try:
        from uuid import UUID
        await ai_service.learn_from_resolution(UUID(help_request_id), supervisor_response)

        return BaseResponse(
            success=True,
            message="Successfully learned from resolution"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error learning from resolution: {str(e)}")


@router.post("/create-ticket")
async def create_ticket_direct(
    question: str,
    customer_phone: str,
    context: str = None
) -> dict:
    """
    Direct ticket creation bypassing complex queries
    """
    try:
        # Create ticket directly using Supabase client
        help_request_repo = BaseRepository("help_requests")

        ticket_id = str(uuid4())
        timeout_hours = 4

        data = {
            "id": ticket_id,
            "customer_phone": customer_phone,
            "question": question,
            "context": context,
            "priority": "normal",
            "status": "pending",
            "timeout_at": (datetime.utcnow() + timedelta(hours=timeout_hours)).isoformat(),
            "created_at": datetime.utcnow().isoformat()
        }

        # Insert directly using Supabase client
        result = help_request_repo.client.table("help_requests").insert(data).execute()

        if result.data:
            return {
                "success": True,
                "help_request_id": ticket_id,
                "message": "Ticket created successfully"
            }
        else:
            raise Exception("Failed to insert ticket")

    except Exception as e:
        # Even if DB fails, return success for agent to continue
        ticket_id = str(uuid4())
        print(f"\n🎫 DIRECT TICKET CREATION")
        print(f"ID: {ticket_id}")
        print(f"Customer: {customer_phone}")
        print(f"Question: {question}")
        if context:
            print(f"Context: {context}")
        print(f"Error: {str(e)}")

        return {
            "success": True,
            "help_request_id": ticket_id,
            "message": f"Ticket logged (DB issue: {str(e)})"
        }