"""
Backend client for AI agent to communicate with FastAPI backend
"""

import os
import httpx
import logging
import uuid
from typing import Optional, Dict, Any
from uuid import UUID

logger = logging.getLogger(__name__)


class BackendClient:
    def __init__(self):
        self.base_url = os.getenv("FASTAPI_BASE_URL", "http://localhost:8001")
        self.timeout = 30.0

    async def process_query(self,
                          question: str,
                          customer_phone: str,
                          customer_name: Optional[str] = None,
                          call_session_id: Optional[UUID] = None,
                          context: Optional[str] = None) -> Dict[str, Any]:
        """Create ticket directly when AI needs to escalate"""

        # Go directly to create-ticket endpoint
        logger.info(f"Creating ticket for question: {question}")

        try:
            return await self.create_ticket_via_api(
                question=question,
                customer_phone=customer_phone,
                context=context
            )
        except Exception as e:
            logger.error(f"Ticket creation failed: {e}")

            # Final fallback response
            return {
                "has_answer": False,
                "answer": "Let me check with my supervisor and get back to you shortly.",
                "confidence": 0.0,
                "escalated": True,
                "help_request_id": "fallback",
                "error": str(e)
            }

    async def create_help_request_direct(self,
                                       question: str,
                                       customer_phone: str,
                                       context: Optional[str] = None) -> Dict[str, Any]:
        """Direct help request creation bypassing complex queries"""

        help_request_id = str(uuid.uuid4())

        # Log the help request for supervisor attention
        logger.info(f"""
        🚨 DIRECT HELP REQUEST CREATED 🚨
        Request ID: {help_request_id}
        Customer: {customer_phone}
        Question: {question}
        Context: {context or 'None'}
        """)

        # Print to console for supervisor notification
        print(f"\n{'='*50}")
        print("🎫 HELP REQUEST CREATED")
        print(f"{'='*50}")
        print(f"ID: {help_request_id}")
        print(f"Customer: {customer_phone}")
        print(f"Question: {question}")
        if context:
            print(f"Context: {context[:100]}...")
        print(f"{'='*50}\n")

        return {
            "has_answer": False,
            "answer": "Let me check with my supervisor and get back to you shortly.",
            "confidence": 0.0,
            "escalated": True,
            "help_request_id": help_request_id
        }

    async def create_ticket_via_api(self,
                                  question: str,
                                  customer_phone: str,
                                  context: Optional[str] = None) -> Dict[str, Any]:
        """Create ticket via direct API endpoint"""

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/ai/create-ticket",
                    params={
                        "question": question,
                        "customer_phone": customer_phone,
                        "context": context or ""
                    }
                )
                response.raise_for_status()

                result = response.json()
                help_request_id = result.get("help_request_id")

                logger.info(f"✅ Ticket created via API: {help_request_id}")

                return {
                    "has_answer": False,
                    "answer": "Let me check with my supervisor and get back to you shortly.",
                    "confidence": 0.0,
                    "escalated": True,
                    "help_request_id": help_request_id
                }

            except Exception as e:
                logger.error(f"❌ API ticket creation failed: {e}")
                # Fall back to console logging
                return await self.create_help_request_direct(question, customer_phone, context)

    async def get_salon_context(self) -> str:
        """Get salon business context for agent prompting"""

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(f"{self.base_url}/ai/context")
                response.raise_for_status()

                result = response.json()
                return result.get("context", "")

            except httpx.HTTPError as e:
                logger.error(f"Failed to get salon context: {e}")
                # Return fallback context
                return """
                You are an AI receptionist for Bella's Hair & Beauty Salon.

                If you don't know the answer to a question, politely say:
                "Let me check with my supervisor and get back to you shortly."

                Always be helpful, professional, and friendly.
                """

    async def notify_resolution(self, help_request_id: UUID, supervisor_response: str) -> bool:
        """Notify backend when a help request is resolved (for learning)"""

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.post(
                    f"{self.base_url}/ai/learn/{help_request_id}",
                    params={"supervisor_response": supervisor_response}
                )
                response.raise_for_status()

                logger.info(f"Successfully notified backend of resolution: {help_request_id}")
                return True

            except httpx.HTTPError as e:
                logger.error(f"Failed to notify resolution: {e}")
                return False


# Global backend client instance
backend_client = BackendClient()