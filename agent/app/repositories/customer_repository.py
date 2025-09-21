"""
Customer repository for database operations
"""

from typing import Optional, Dict, Any
from uuid import UUID

from .base_repository import BaseRepository


class CustomerRepository(BaseRepository):
    def __init__(self):
        super().__init__("customers")

    async def get_or_create_by_phone(self, phone_number: str, name: Optional[str] = None) -> Dict[str, Any]:
        """Get existing customer or create new one by phone number"""
        # First try to find existing customer
        existing = await self.find_by_field("phone_number", phone_number, limit=1)

        if existing:
            return existing[0]

        # Create new customer
        data = {"phone_number": phone_number}
        if name:
            data["name"] = name

        return await self.create(data)

    async def update_customer_info(self, customer_id: UUID, name: Optional[str] = None, email: Optional[str] = None, notes: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Update customer information"""
        data = {}
        if name is not None:
            data["name"] = name
        if email is not None:
            data["email"] = email
        if notes is not None:
            data["notes"] = notes

        if data:
            return await self.update(customer_id, data)
        return None

    async def get_customer_by_phone(self, phone_number: str) -> Optional[Dict[str, Any]]:
        """Get customer by phone number"""
        results = await self.find_by_field("phone_number", phone_number, limit=1)
        return results[0] if results else None