"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus,
  Search,
  Brain,
  TrendingUp,
  Clock,
  Edit,
  Trash2,
  BookOpen,
  Target,
  Eye
} from 'lucide-react';
import { useKnowledgeBase, useAddKnowledgeEntry } from '@/hooks/useApi';
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface KnowledgeEntry {
  id: string;
  question: string;
  answer: string;
  category?: string;
  usage_count: number;
  confidence_score: number;
  source: string;
  created_at: string;
  updated_at: string;
}

function KnowledgeEntryModal({
  entry,
  isOpen,
  onClose,
  onSave
}: {
  entry: KnowledgeEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (entry: Partial<KnowledgeEntry>) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedEntry, setEditedEntry] = useState<Partial<KnowledgeEntry>>({});

  const handleStartEdit = () => {
    if (entry) {
      setEditedEntry({
        question: entry.question,
        answer: entry.answer,
        category: entry.category
      });
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(editedEntry);
    }
    setIsEditing(false);
    onClose();
  };

  if (!entry) return null;

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

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <ModalHeader>
          <ModalTitle>Knowledge Base Entry</ModalTitle>
          <ModalDescription>
            {isEditing ? 'Edit this knowledge base entry' : 'View knowledge base entry details'}
          </ModalDescription>
        </ModalHeader>

        <div className="space-y-4">
          {/* Entry Info */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm text-gray-500">Category</p>
              {isEditing ? (
                <Select
                  value={editedEntry.category}
                  onValueChange={(value) => setEditedEntry({...editedEntry, category: value})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['hours', 'pricing', 'services', 'appointments', 'policies', 'location', 'general'].map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Badge className={getCategoryColor(entry.category || 'general')}>
                  {entry.category || 'general'}
                </Badge>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Usage & Confidence</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {entry.usage_count} uses
                </Badge>
                <Badge variant="outline">
                  {Math.round(entry.confidence_score * 100)}% confidence
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Source</p>
              <p className="font-medium">{entry.source}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Last Updated</p>
              <p className="font-medium">{new Date(entry.updated_at).toLocaleString()}</p>
            </div>
          </div>

          {/* Question */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4" />
              Question
            </Label>
            {isEditing ? (
              <Textarea
                value={editedEntry.question}
                onChange={(e) => setEditedEntry({...editedEntry, question: e.target.value})}
                className="w-full"
                rows={2}
              />
            ) : (
              <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <p className="text-gray-700">{entry.question}</p>
              </div>
            )}
          </div>

          {/* Answer */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4" />
              Answer
            </Label>
            {isEditing ? (
              <Textarea
                value={editedEntry.answer}
                onChange={(e) => setEditedEntry({...editedEntry, answer: e.target.value})}
                className="w-full"
                rows={4}
              />
            ) : (
              <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                <p className="text-gray-700">{entry.answer}</p>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className="text-sm text-gray-500 border-t pt-4">
            <p>Created: {new Date(entry.created_at).toLocaleString()}</p>
            <p>ID: {entry.id}</p>
          </div>
        </div>

        <ModalFooter>
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleStartEdit}>
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
              <Button onClick={onClose}>Close</Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

function AddKnowledgeModal({
  isOpen,
  onClose
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [newEntry, setNewEntry] = useState({
    question: '',
    answer: '',
    category: 'general'
  });
  const addKnowledgeEntry = useAddKnowledgeEntry();

  const handleAdd = async () => {
    if (!newEntry.question.trim() || !newEntry.answer.trim()) return;

    try {
      await addKnowledgeEntry.mutateAsync({
        question: newEntry.question,
        answer: newEntry.answer,
        category: newEntry.category
      });

      setNewEntry({ question: '', answer: '', category: 'general' });
      onClose();
    } catch (error) {
      console.error('Failed to add knowledge entry:', error);
    }
  };

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent className="max-w-2xl">
        <ModalHeader>
          <ModalTitle>Add Knowledge Entry</ModalTitle>
          <ModalDescription>
            Add a new question and answer to the knowledge base
          </ModalDescription>
        </ModalHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="new-question">Question</Label>
            <Textarea
              id="new-question"
              value={newEntry.question}
              onChange={(e) => setNewEntry(prev => ({ ...prev, question: e.target.value }))}
              placeholder="What question should this answer?"
              className="mt-1"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="new-answer">Answer</Label>
            <Textarea
              id="new-answer"
              value={newEntry.answer}
              onChange={(e) => setNewEntry(prev => ({ ...prev, answer: e.target.value }))}
              placeholder="Provide the answer the AI should give..."
              className="mt-1"
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="new-category">Category</Label>
            <Select
              value={newEntry.category}
              onValueChange={(value) => setNewEntry(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['hours', 'pricing', 'services', 'appointments', 'policies', 'location', 'general'].map(category => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <ModalFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={!newEntry.question.trim() || !newEntry.answer.trim() || addKnowledgeEntry.isPending}
          >
            {addKnowledgeEntry.isPending ? 'Adding...' : 'Add Entry'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export function KnowledgeBaseTable() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<KnowledgeEntry | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { data: knowledgeBase, isLoading } = useKnowledgeBase(
    selectedCategory === 'all' ? undefined : selectedCategory
  );

  const categories = [
    'all', 'hours', 'pricing', 'services', 'appointments', 'policies', 'location', 'general'
  ];

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

  const handleViewEntry = (entry: KnowledgeEntry) => {
    setSelectedEntry(entry);
    setIsViewModalOpen(true);
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
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
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
            <Target className="w-5 h-5 text-orange-600" />
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
            <Label htmlFor="search" className="text-sm font-medium text-gray-700 mb-1">Search Knowledge Base</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions and answers..."
                className="pl-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-1">Category Filter</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48 mt-1 bg-white border-gray-300 focus:border-blue-500">
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

      {/* Knowledge Base Table */}
      {filteredEntries.length === 0 ? (
        <Card className="p-8 text-center">
          <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-gray-500">
            {searchQuery ? 'No entries match your search.' : 'No knowledge base entries found.'}
          </p>
        </Card>
      ) : (
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Category</TableHead>
                <TableHead className="max-w-md">Question</TableHead>
                <TableHead className="max-w-md">Answer</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <Badge className={getCategoryColor(entry.category || 'general')}>
                      {entry.category || 'general'}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <p className="truncate">{entry.question}</p>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <p className="truncate">{entry.answer}</p>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{entry.source}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewEntry(entry)}
                        className="bg-white hover:bg-gray-50 border-gray-300"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-gray-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* View/Edit Modal */}
      <KnowledgeEntryModal
        entry={selectedEntry}
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setTimeout(() => setSelectedEntry(null), 200);
        }}
      />

      {/* Add Modal */}
      <AddKnowledgeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}