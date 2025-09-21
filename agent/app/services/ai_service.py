"""
AI Service - Core business logic for AI agent interactions
"""

import logging
from typing import Optional, Tuple
from uuid import UUID

from ..repositories.knowledge_base_repository import KnowledgeBaseRepository
from ..repositories.help_request_repository import HelpRequestRepository
from ..repositories.customer_repository import CustomerRepository
from ..repositories.call_session_repository import CallSessionRepository
from ..models.schemas import Priority, AIQueryResponse

logger = logging.getLogger(__name__)


class AIService:
    def __init__(self):
        self.knowledge_repo = KnowledgeBaseRepository()
        self.help_request_repo = HelpRequestRepository()
        self.customer_repo = CustomerRepository()
        self.call_session_repo = CallSessionRepository()

    async def process_customer_query(self,
                                   question: str,
                                   customer_phone: str,
                                   customer_name: Optional[str] = None,
                                   call_session_id: Optional[UUID] = None,
                                   context: Optional[str] = None) -> AIQueryResponse:
        """
        Main method to process customer queries

        1. Try to find answer in knowledge base
        2. If no good answer found, escalate to human supervisor
        3. Return appropriate response
        """
        logger.info(f"Processing query from {customer_phone}: {question}")

        # Ensure customer exists
        customer = await self.customer_repo.get_or_create_by_phone(customer_phone, customer_name)

        # Since AI already has knowledge base in system instructions,
        # we don't search database. AI will answer if it knows, or we escalate.
        # This is just for escalation when AI can't answer.

        logger.info(f"AI couldn't answer question: {question}")
        logger.info(f"Creating help request for supervisor")
        priority = self._determine_priority(question, context)

        help_request = await self.help_request_repo.create_help_request(
            customer_phone=customer_phone,
            question=question,
            context=context,
            priority=priority,
            call_session_id=call_session_id
        )

        # Simulate notifying supervisor (in real implementation, this would send SMS/email)
        await self._notify_supervisor(help_request)

        return AIQueryResponse(
            has_answer=False,
            answer="Let me check with my supervisor and get back to you shortly.",
            confidence=0.0,
            help_request_id=UUID(help_request["id"]),
            escalated=True
        )

    async def get_salon_context(self) -> str:
        """Get salon business context for AI agent prompting - includes dynamic knowledge base"""

        # Base context (could also be stored in DB later)
        base_context = """
        You are an AI receptionist for Bella's Hair & Beauty Salon, a premium salon in downtown.

        BUSINESS INFORMATION:
        - Hours: Monday-Friday 9 AM to 7 PM, Saturday 9 AM to 5 PM, Closed Sundays
        - Services: Haircuts, Hair Coloring, Highlights, Blowouts, Hair Styling, Manicures, Pedicures, Facials, Eyebrow Services
        - Pricing: Basic haircuts start at $45, Cut and style packages start at $65
        - Location: 123 Main Street, Downtown
        - Phone: (555) 123-4567
        - Appointments: Preferred but walk-ins accepted when possible
        - Cancellation: 24-hour notice required, same-day cancellations may incur fees
        - Gift Certificates: Available for any amount or specific services
        - Parking: Street parking and paid lot behind building

        IMPORTANT INSTRUCTIONS:
        - Always be friendly, professional, and helpful
        - Answer questions about our basic services, hours, location, and general pricing confidently
        - For specific availability, detailed pricing, or special requests, offer to check or schedule an appointment
        - ONLY escalate to supervisor for: complex complaints, special accommodations, pricing disputes, or truly unknown questions
        - Never make up specific information you don't have
        - Always offer to schedule appointments when appropriate
        """

        # Fetch dynamic knowledge base from database
        try:
            # Get all knowledge entries ordered by usage
            knowledge_entries = await self.knowledge_repo.get_most_used(limit=50)

            if knowledge_entries:
                knowledge_section = "\n\nKNOWLEDGE BASE ANSWERS:\n"
                knowledge_section += "Use these pre-approved answers when customers ask related questions:\n\n"

                for entry in knowledge_entries:
                    # Only include high-confidence entries
                    # Include all active knowledge entries
                    if entry.get("confidence_score", 1.0) >= 0.7:
                        question = entry.get("question", "")
                        answer = entry.get("answer", "")
                        category = entry.get("category", "general")

                        knowledge_section += f"Q: {question}\n"
                        knowledge_section += f"A: {answer}\n"
                        knowledge_section += f"Category: {category}\n\n"

                return base_context + knowledge_section
            else:
                logger.info("No knowledge base entries found, using base context only")
                return base_context

        except Exception as e:
            logger.error(f"Failed to fetch knowledge base: {e}")
            return base_context

    def _determine_priority(self, question: str, context: Optional[str] = None) -> Priority:
        """Determine priority level for help requests"""
        urgent_keywords = ["emergency", "urgent", "complaint", "angry", "cancel all", "refund"]
        high_keywords = ["manager", "supervisor", "problem", "issue", "wrong", "mistake"]

        question_lower = question.lower()
        context_lower = (context or "").lower()

        combined_text = f"{question_lower} {context_lower}"

        if any(keyword in combined_text for keyword in urgent_keywords):
            return Priority.URGENT
        elif any(keyword in combined_text for keyword in high_keywords):
            return Priority.HIGH
        else:
            return Priority.NORMAL

    async def _notify_supervisor(self, help_request: dict) -> None:
        """Simulate notifying supervisor about new help request"""
        # In a real implementation, this would:
        # 1. Send SMS to supervisor
        # 2. Send email notification
        # 3. Push notification to supervisor app
        # 4. Log to monitoring system

        logger.info(f"""
        🚨 NEW SUPERVISOR REQUEST 🚨
        Request ID: {help_request['id']}
        Customer: {help_request['customer_phone']}
        Priority: {help_request['priority']}
        Question: {help_request['question']}
        Context: {help_request.get('context', 'None')}

        Please respond via the supervisor dashboard.
        """)

        print(f"\n{'='*50}")
        print("📱 SUPERVISOR NOTIFICATION")
        print(f"{'='*50}")
        print(f"Customer {help_request['customer_phone']} needs help!")
        print(f"Priority: {help_request['priority'].upper()}")
        print(f"Question: {help_request['question']}")
        if help_request.get('context'):
            print(f"Context: {help_request['context'][:100]}...")
        print(f"Request ID: {help_request['id']}")
        print(f"{'='*50}\n")

    async def learn_from_resolution(self, help_request_id: UUID, supervisor_response: str) -> None:
        """Learn from supervisor resolution and add to knowledge base"""
        help_request = await self.help_request_repo.get_by_id(help_request_id)

        if help_request and help_request.get("status") == "resolved":
            # Extract category from the question
            category = self._extract_category(help_request["question"])

            # Add to knowledge base
            await self.knowledge_repo.create_knowledge_entry(
                question=help_request["question"],
                answer=supervisor_response,
                category=category,
                source="supervisor"
            )

            logger.info(f"Added new knowledge from resolved request {help_request_id}")

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