"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Brain, TrendingUp, Clock, Edit, Trash2 } from 'lucide-react';
import { useKnowledgeBase, useAddKnowledgeEntry } from '@/hooks/useApi';

// Export the table version
export { KnowledgeBaseTable as KnowledgeBaseManager } from './knowledge-base-table';

// Keep the old card-based version as a fallback
function KnowledgeBaseManagerCards() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [newEntry, setNewEntry] = useState({
    question: '',
    answer: '',
    category: ''
  });

  const { data: knowledgeBase, isLoading } = useKnowledgeBase(
    selectedCategory === 'all' ? undefined : selectedCategory
  );
  const addKnowledgeEntry = useAddKnowledgeEntry();

  const categories = [
    'all', 'hours', 'pricing', 'services', 'appointments', 'policies', 'location', 'general'
  ];

  const handleAddEntry = async () => {
    if (!newEntry.question.trim() || !newEntry.answer.trim()) return;

    try {
      await addKnowledgeEntry.mutateAsync({
        question: newEntry.question,
        answer: newEntry.answer,
        category: newEntry.category || 'general'
      });

      setNewEntry({ question: '', answer: '', category: '' });
      setIsAddingEntry(false);
    } catch (error) {
      console.error('Failed to add knowledge entry:', error);
    }
  };

  const filteredEntries = knowledgeBase?.filter(entry =>
    entry.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.answer.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      hours: 'bg-blue-100 text-blue-800',
      pricing: 'bg-green-100 text-green-800',
      services: 'bg-purple-100 text-purple-800',
      appointments: 'bg-orange-100 text-orange-800',
      policies: 'bg-red-100 text-red-800',
      location: 'bg-yellow-100 text-yellow-800',
      general: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.general;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Loading knowledge base...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Knowledge Base Manager</h2>
          <p className="text-gray-600">Manage the AI's learned knowledge and responses</p>
        </div>
        <Button onClick={() => setIsAddingEntry(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Knowledge
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Entries</p>
              <p className="text-2xl font-bold">{knowledgeBase?.length || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Most Used</p>
              <p className="text-2xl font-bold">
                {Math.max(...(knowledgeBase?.map(e => e.usage_count) || [0]))}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Categories</p>
              <p className="text-2xl font-bold">
                {new Set(knowledgeBase?.map(e => e.category)).size || 0}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">Avg Confidence</p>
              <p className="text-2xl font-bold">
                {knowledgeBase?.length
                  ? Math.round((knowledgeBase.reduce((sum, e) => sum + e.confidence_score, 0) / knowledgeBase.length) * 100)
                  : 0}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Label htmlFor="search">Search Knowledge Base</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions and answers..."
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <Label>Category Filter</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Add New Entry Form */}
      {isAddingEntry && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Add New Knowledge Entry</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="question">Question</Label>
              <Input
                id="question"
                value={newEntry.question}
                onChange={(e) => setNewEntry(prev => ({ ...prev, question: e.target.value }))}
                placeholder="What question should this answer?"
              />
            </div>
            <div>
              <Label htmlFor="answer">Answer</Label>
              <Textarea
                id="answer"
                value={newEntry.answer}
                onChange={(e) => setNewEntry(prev => ({ ...prev, answer: e.target.value }))}
                placeholder="Provide the answer the AI should give..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={newEntry.category}
                onValueChange={(value) => setNewEntry(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.slice(1).map(category => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleAddEntry}
                disabled={!newEntry.question.trim() || !newEntry.answer.trim() || addKnowledgeEntry.isPending}
              >
                {addKnowledgeEntry.isPending ? 'Adding...' : 'Add Entry'}
              </Button>
              <Button variant="outline" onClick={() => setIsAddingEntry(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Knowledge Base Entries */}
      <div className="space-y-4">
        {filteredEntries.length === 0 ? (
          <Card className="p-8 text-center">
            <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-gray-500">
              {searchQuery ? 'No entries match your search.' : 'No knowledge base entries found.'}
            </p>
          </Card>
        ) : (
          filteredEntries.map((entry) => (
            <Card key={entry.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Badge className={getCategoryColor(entry.category || 'general')}>
                    {entry.category || 'general'}
                  </Badge>
                  <Badge variant="outline">
                    Used {entry.usage_count} times
                  </Badge>
                  <Badge variant="outline">
                    {Math.round(entry.confidence_score * 100)}% confidence
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Question:</h4>
                  <p className="text-gray-700 bg-blue-50 p-3 rounded border-l-4 border-blue-500">
                    {entry.question}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Answer:</h4>
                  <p className="text-gray-700 bg-green-50 p-3 rounded border-l-4 border-green-500">
                    {entry.answer}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>Source: {entry.source}</span>
                  <span>Added: {new Date(entry.created_at).toLocaleDateString()}</span>
                  <span>Updated: {new Date(entry.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}