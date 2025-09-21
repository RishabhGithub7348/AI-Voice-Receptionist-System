"""
Base repository class with common database operations
"""

import os
from typing import Optional, List, Dict, Any
from uuid import UUID

from supabase import create_client, Client


class BaseRepository:
    _client: Optional[Client] = None

    @classmethod
    def get_client(cls) -> Client:
        """Get or create Supabase client"""
        if cls._client is None:
            url = os.getenv("SUPABASE_URL")
            key = os.getenv("SUPABASE_KEY")
            if not url or not key:
                raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment")
            cls._client = create_client(url, key)
        return cls._client

    def __init__(self, table_name: str):
        self.table_name = table_name
        self.client = self.get_client()

    async def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new record"""
        result = self.client.table(self.table_name).insert(data).execute()
        if not result.data:
            raise Exception(f"Failed to create record in {self.table_name}")
        return result.data[0]

    async def get_by_id(self, record_id: UUID) -> Optional[Dict[str, Any]]:
        """Get record by ID"""
        result = self.client.table(self.table_name).select("*").eq("id", str(record_id)).execute()
        return result.data[0] if result.data else None

    async def get_all(self, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Get all records with pagination"""
        result = self.client.table(self.table_name).select("*").range(offset, offset + limit - 1).execute()
        return result.data

    async def update(self, record_id: UUID, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update record by ID"""
        result = self.client.table(self.table_name).update(data).eq("id", str(record_id)).execute()
        return result.data[0] if result.data else None

    async def delete(self, record_id: UUID) -> bool:
        """Delete record by ID"""
        result = self.client.table(self.table_name).delete().eq("id", str(record_id)).execute()
        return len(result.data) > 0

    async def find_by_field(self, field: str, value: Any, limit: int = 10) -> List[Dict[str, Any]]:
        """Find records by field value"""
        result = self.client.table(self.table_name).select("*").eq(field, value).range(0, limit - 1).execute()
        return result.data

    async def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """Count records with optional filters"""
        query = self.client.table(self.table_name).select("*", count="exact")
        if filters:
            for field, value in filters.items():
                query = query.eq(field, value)
        result = query.execute()
        return result.count if result.count is not None else 0