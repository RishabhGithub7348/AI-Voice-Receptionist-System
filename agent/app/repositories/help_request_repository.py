"""
Help Request repository for database operations
"""

from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from uuid import UUID

from .base_repository import BaseRepository
from ..models.schemas import RequestStatus, Priority


class HelpRequestRepository(BaseRepository):
    def __init__(self):
        super().__init__("help_requests")

    async def create_help_request(self,
                                customer_phone: str,
                                question: str,
                                context: Optional[str] = None,
                                priority: Priority = Priority.NORMAL,
                                call_session_id: Optional[UUID] = None) -> Dict[str, Any]:
        """Create a new help request"""
        timeout_hours = 1 if priority == Priority.URGENT else 4

        data = {
            "customer_phone": customer_phone,
            "question": question,
            "context": context,
            "priority": priority.value,
            "timeout_at": (datetime.utcnow() + timedelta(hours=timeout_hours)).isoformat(),
            "call_session_id": str(call_session_id) if call_session_id else None
        }

        return await self.create(data)

    async def get_pending_requests(self) -> List[Dict[str, Any]]:
        """Get all pending help requests"""
        result = self.client.from_("supervisor_dashboard").select("*").eq("status", "pending").order("created_at", desc=False).execute()
        return result.data

    async def resolve_request(self,
                            request_id: UUID,
                            supervisor_response: str,
                            supervisor_id: str) -> Optional[Dict[str, Any]]:
        """Resolve a help request"""
        data = {
            "status": RequestStatus.RESOLVED.value,
            "supervisor_response": supervisor_response,
            "supervisor_id": supervisor_id,
            "resolved_at": datetime.utcnow().isoformat()
        }

        return await self.update(request_id, data)

    async def timeout_old_requests(self) -> int:
        """Mark old pending requests as timeout"""
        result = self.client.table(self.table_name).update({
            "status": RequestStatus.TIMEOUT.value
        }).lt("timeout_at", datetime.utcnow().isoformat()).eq("status", "pending").execute()

        return len(result.data) if result.data else 0

    async def get_requests_by_phone(self, phone_number: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Get help requests for a specific phone number"""
        return await self.find_by_field("customer_phone", phone_number, limit)

    async def get_requests_by_status(self, status: RequestStatus, limit: int = 50) -> List[Dict[str, Any]]:
        """Get help requests by status"""
        return await self.find_by_field("status", status.value, limit)

    async def get_analytics(self) -> Dict[str, Any]:
        """Get help request analytics"""
        # Total requests
        total = await self.count()

        # By status
        pending = await self.count({"status": RequestStatus.PENDING.value})
        resolved = await self.count({"status": RequestStatus.RESOLVED.value})
        timeout = await self.count({"status": RequestStatus.TIMEOUT.value})

        # Average resolution time for resolved requests
        resolved_requests = self.client.table(self.table_name).select("created_at, resolved_at").eq("status", "resolved").execute()

        avg_resolution_hours = 0.0
        if resolved_requests.data:
            total_hours = 0
            count = 0
            for req in resolved_requests.data:
                if req.get("resolved_at") and req.get("created_at"):
                    created = datetime.fromisoformat(req["created_at"].replace("Z", "+00:00"))
                    resolved = datetime.fromisoformat(req["resolved_at"].replace("Z", "+00:00"))
                    hours = (resolved - created).total_seconds() / 3600
                    total_hours += hours
                    count += 1

            if count > 0:
                avg_resolution_hours = total_hours / count

        return {
            "total_requests": total,
            "pending_requests": pending,
            "resolved_requests": resolved,
            "timeout_requests": timeout,
            "avg_resolution_time_hours": round(avg_resolution_hours, 2)
        }