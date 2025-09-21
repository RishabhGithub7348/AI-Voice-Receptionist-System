"""
Supervisor Service - Business logic for supervisor operations
"""

import logging
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from ..repositories.help_request_repository import HelpRequestRepository
from ..repositories.knowledge_base_repository import KnowledgeBaseRepository
from ..models.schemas import (
    SupervisorDashboardResponse,
    HelpRequestResponse,
    KnowledgeBaseResponse,
    AnalyticsResponse
)

logger = logging.getLogger(__name__)


class SupervisorService:
    def __init__(self):
        self.help_request_repo = HelpRequestRepository()
        self.knowledge_repo = KnowledgeBaseRepository()

    async def get_dashboard_data(self) -> List[SupervisorDashboardResponse]:
        """Get all pending help requests for supervisor dashboard"""
        requests = await self.help_request_repo.get_pending_requests()
        return [SupervisorDashboardResponse(**req) for req in requests]

    async def resolve_help_request(self,
                                 request_id: UUID,
                                 supervisor_response: str,
                                 supervisor_id: str,
                                 add_to_knowledge_base: bool = True) -> Optional[HelpRequestResponse]:
        """
        Resolve a help request with supervisor response

        1. Update the help request as resolved
        2. Optionally add the Q&A to knowledge base
        3. Trigger follow-up to customer
        4. Return updated help request
        """
        logger.info(f"Resolving help request {request_id} by supervisor {supervisor_id}")

        # Resolve the request
        updated_request = await self.help_request_repo.resolve_request(
            request_id, supervisor_response, supervisor_id
        )

        if not updated_request:
            logger.error(f"Failed to resolve help request {request_id}")
            return None

        # Get the full updated request record
        full_request = await self.help_request_repo.get_by_id(request_id)
        if not full_request:
            logger.error(f"Could not fetch resolved request {request_id}")
            return None

        # Debug logging - log each field and its type
        logger.info(f"Full request data retrieved: {full_request}")
        logger.info(f"Full request keys: {list(full_request.keys())}")
        for key, value in full_request.items():
            logger.info(f"Field '{key}': {value} (type: {type(value)})")

        # Add to knowledge base if requested
        if add_to_knowledge_base:
            await self._add_to_knowledge_base(full_request)

        # Trigger follow-up to customer
        await self._trigger_customer_followup(full_request)

        # Try to create response with detailed error logging
        try:
            response = HelpRequestResponse(**full_request)
            logger.info(f"Successfully created HelpRequestResponse")
            return response
        except Exception as e:
            logger.error(f"Failed to create HelpRequestResponse: {str(e)}")
            logger.error(f"Error type: {type(e)}")
            logger.error(f"Full request data causing error: {full_request}")
            raise

    async def get_knowledge_base(self, category: Optional[str] = None, limit: int = 100) -> List[KnowledgeBaseResponse]:
        """Get knowledge base entries, optionally filtered by category"""
        if category:
            entries = await self.knowledge_repo.get_by_category(category, limit)
        else:
            entries = await self.knowledge_repo.get_all(limit)

        return [KnowledgeBaseResponse(**entry) for entry in entries]

    async def add_knowledge_entry(self,
                                question: str,
                                answer: str,
                                category: Optional[str] = None) -> KnowledgeBaseResponse:
        """Manually add entry to knowledge base"""
        entry = await self.knowledge_repo.create_knowledge_entry(
            question=question,
            answer=answer,
            category=category,
            source="manual"
        )

        logger.info(f"Manually added knowledge entry: {entry['id']}")
        return KnowledgeBaseResponse(**entry)

    async def get_analytics(self) -> AnalyticsResponse:
        """Get analytics data for supervisor dashboard"""
        # Help request analytics
        help_analytics = await self.help_request_repo.get_analytics()

        # Knowledge base count
        kb_count = await self.knowledge_repo.count()

        # Top categories
        category_stats = await self.knowledge_repo.get_categories_stats()

        return AnalyticsResponse(
            total_requests=help_analytics["total_requests"],
            pending_requests=help_analytics["pending_requests"],
            resolved_requests=help_analytics["resolved_requests"],
            timeout_requests=help_analytics["timeout_requests"],
            avg_resolution_time_hours=help_analytics["avg_resolution_time_hours"],
            knowledge_base_entries=kb_count,
            top_categories=category_stats
        )

    async def cleanup_timeout_requests(self) -> int:
        """Clean up old pending requests by marking them as timeout"""
        count = await self.help_request_repo.timeout_old_requests()
        if count > 0:
            logger.info(f"Marked {count} old requests as timeout")
        return count

    async def _add_to_knowledge_base(self, help_request: dict) -> None:
        """Add resolved help request to knowledge base"""
        category = self._extract_category(help_request["question"])

        await self.knowledge_repo.create_knowledge_entry(
            question=help_request["question"],
            answer=help_request["supervisor_response"],
            category=category,
            source="supervisor"
        )

        logger.info(f"Added resolved request {help_request['id']} to knowledge base")

    async def _trigger_customer_followup(self, help_request: dict) -> None:
        """Trigger follow-up communication to customer"""
        # In a real implementation, this would:
        # 1. Send SMS to customer with the answer
        # 2. Make automated call
        # 3. Send email if available
        # 4. Log the follow-up attempt

        customer_phone = help_request["customer_phone"]
        response = help_request["supervisor_response"]

        logger.info(f"Following up with customer {customer_phone}")

        # Simulate SMS follow-up
        print(f"\n{'='*50}")
        print("📱 CUSTOMER FOLLOW-UP")
        print(f"{'='*50}")
        print(f"To: {customer_phone}")
        print(f"Message: Hi! I got your answer: {response[:100]}...")
        print("This follow-up would be sent via SMS/call in production.")
        print(f"{'='*50}\n")

    def _extract_category(self, question: str) -> str:
        """Extract category from question for knowledge base organization"""
        question_lower = question.lower()

        if any(word in question_lower for word in ["hour", "time", "open", "close"]):
            return "hours"
        elif any(word in question_lower for word in ["price", "cost", "how much", "fee"]):
            return "pricing"
        elif any(word in question_lower for word in ["service", "offer", "do you", "available"]):
            return "services"
        elif any(word in question_lower for word in ["appointment", "book", "schedule", "available"]):
            return "appointments"
        elif any(word in question_lower for word in ["cancel", "policy", "refund"]):
            return "policies"
        elif any(word in question_lower for word in ["location", "address", "where", "parking"]):
            return "location"
        else:
            return "general"