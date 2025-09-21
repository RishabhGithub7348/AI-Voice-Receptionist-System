"""
Knowledge Base repository for database operations
"""

from typing import Optional, List, Dict, Any
from uuid import UUID

from .base_repository import BaseRepository


class KnowledgeBaseRepository(BaseRepository):
    def __init__(self):
        super().__init__("knowledge_base")

    async def create_knowledge_entry(self,
                                   question: str,
                                   answer: str,
                                   category: Optional[str] = None,
                                   source: str = "supervisor") -> Dict[str, Any]:
        """Create a new knowledge base entry"""
        data = {
            "question": question,
            "answer": answer,
            "category": category,
            "source": source,
            "confidence_score": 1.0,
            "usage_count": 0
        }

        return await self.create(data)

    async def search_by_question(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Search knowledge base by question text"""
        # Simplified search using ILIKE for now
        result = self.client.table(self.table_name).select("*").ilike("question", f"%{query}%").range(0, limit - 1).execute()
        return result.data

    async def get_best_match(self, question: str, confidence_threshold: float = 0.7) -> Optional[Dict[str, Any]]:
        """Get the best matching answer for a question"""
        results = await self.search_by_question(question, limit=1)

        if results and len(results) > 0:
            best_match = results[0]
            # For now, using a simple confidence score
            # In production, you'd use embeddings or more sophisticated matching
            confidence = self._calculate_confidence(question, best_match["question"])

            if confidence >= confidence_threshold:
                # Update usage count
                await self.increment_usage(UUID(best_match["id"]))
                best_match["confidence"] = confidence
                return best_match

        return None

    async def increment_usage(self, knowledge_id: UUID) -> None:
        """Increment usage count for a knowledge base entry"""
        current = await self.get_by_id(knowledge_id)
        if current:
            new_count = current.get("usage_count", 0) + 1
            await self.update(knowledge_id, {"usage_count": new_count})

    async def get_by_category(self, category: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Get knowledge base entries by category"""
        return await self.find_by_field("category", category, limit)

    async def get_most_used(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get most frequently used knowledge base entries"""
        result = self.client.table(self.table_name).select("*").order("usage_count", desc=True).range(0, limit - 1).execute()
        return result.data

    async def get_categories_stats(self) -> List[Dict[str, Any]]:
        """Get statistics by category"""
        result = self.client.table(self.table_name).select("category, count(*), sum(usage_count)").group_by("category").execute()
        return result.data

    def _calculate_confidence(self, question1: str, question2: str) -> float:
        """Simple confidence calculation based on word overlap"""
        words1 = set(question1.lower().split())
        words2 = set(question2.lower().split())

        if not words1 or not words2:
            return 0.0

        intersection = words1.intersection(words2)
        union = words1.union(words2)

        # Jaccard similarity
        confidence = len(intersection) / len(union) if union else 0.0

        # Boost confidence if there's a substantial overlap
        if len(intersection) >= 3:
            confidence *= 1.2

        return min(confidence, 1.0)