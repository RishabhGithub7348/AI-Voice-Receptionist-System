"""
Call Session repository for database operations
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID

from .base_repository import BaseRepository


class CallSessionRepository(BaseRepository):
    def __init__(self):
        super().__init__("call_sessions")

    async def create_session(self, customer_id: UUID, phone_number: str) -> Dict[str, Any]:
        """Create a new call session"""
        data = {
            "customer_id": str(customer_id),
            "phone_number": phone_number,
            "status": "active"
        }

        return await self.create(data)

    async def end_session(self, session_id: UUID, transcript: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """End a call session"""
        data = {
            "status": "completed",
            "session_end": datetime.utcnow().isoformat(),
            "transcript": transcript
        }

        return await self.update(session_id, data)

    async def get_active_sessions(self) -> List[Dict[str, Any]]:
        """Get all active call sessions"""
        return await self.find_by_field("status", "active")

    async def get_customer_sessions(self, customer_id: UUID, limit: int = 10) -> List[Dict[str, Any]]:
        """Get call sessions for a specific customer"""
        return await self.find_by_field("customer_id", str(customer_id), limit)

    async def update_transcript(self, session_id: UUID, transcript: str) -> Optional[Dict[str, Any]]:
        """Update session transcript"""
        return await self.update(session_id, {"transcript": transcript})