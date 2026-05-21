'use client';

import { useEffect, useState } from 'react';
import { draftsApi } from '@/lib/api';
import { formatDate, truncateText } from '@/lib/utils';
import Modal from '@/components/Modal';

interface Draft {
  id: string;
  content: string;
  status: string;
  createdAt: string;
  article: {
    title: string;
    url: string;
    source: string;
  };
}

const isManualSource = (url?: string) => !!url && url.startsWith('manual://');

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('PENDING');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', message: '', type: 'success' });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [topicValue, setTopicValue] = useState('');
  const [topicContext, setTopicContext] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchDrafts();
  }, [filter]);

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await draftsApi.getAll({ status: filter, limit: 50 });
      setDrafts(res.data.drafts);
    } catch (error) {
      console.error('Error fetching drafts:', error);
      setError('Failed to load drafts. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setError(null);
      await draftsApi.approve(id);
      setModalContent({
        title: 'Success',
        message: 'Draft approved successfully',
        type: 'success'
      });
      setModalOpen(true);
      fetchDrafts();
    } catch (error) {
      setModalContent({
        title: 'Error',
        message: 'Failed to approve draft',
        type: 'error'
      });
      setModalOpen(true);
    }
  };

  const handleReject = async (id: string) => {
    try {
      setError(null);
      await draftsApi.reject(id);
      setModalContent({
        title: 'Success',
        message: 'Draft rejected successfully',
        type: 'success'
      });
      setModalOpen(true);
      fetchDrafts();
    } catch (error) {
      setModalContent({
        title: 'Error',
        message: 'Failed to reject draft',
        type: 'error'
      });
      setModalOpen(true);
    }
  };

  const handleEdit = (draft: Draft) => {
    setEditingId(draft.id);
    setEditContent(draft.content);
  };

  const handleSaveEdit = async (id: string) => {
    try {
      setError(null);
      await draftsApi.edit(id, editContent);
      setModalContent({
        title: 'Success',
        message: 'Draft updated successfully',
        type: 'success'
      });
      setModalOpen(true);
      setEditingId(null);
      fetchDrafts();
    } catch (error) {
      setModalContent({
        title: 'Error',
        message: 'Failed to update draft',
        type: 'error'
      });
      setModalOpen(true);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteId(id);
    setDeleteConfirmOpen(true);
  };

  const handleGenerateFromTopic = async () => {
    const topic = topicValue.trim();
    if (!topic) {
      setModalContent({
        title: 'Topic required',
        message: 'Enter a topic before generating drafts.',
        type: 'error',
      });
      setModalOpen(true);
      return;
    }

    try {
      setGenerating(true);
      setError(null);
      const res = await draftsApi.generateFromTopic(topic, topicContext.trim() || undefined);
      const count = res.data?.count ?? 0;
      setTopicModalOpen(false);
      setTopicValue('');
      setTopicContext('');
      setFilter('PENDING');
      setModalContent({
        title: 'Success',
        message: `Generated ${count} draft${count === 1 ? '' : 's'} from your topic.`,
        type: 'success',
      });
      setModalOpen(true);
      fetchDrafts();
    } catch (err) {
      setModalContent({
        title: 'Error',
        message: 'Failed to generate drafts from topic. Check the backend logs.',
        type: 'error',
      });
      setModalOpen(true);
    } finally {
      setGenerating(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      setError(null);
      await draftsApi.delete(deleteId);
      setModalContent({
        title: 'Success',
        message: 'Draft deleted successfully',
        type: 'success'
      });
      setModalOpen(true);
      setDeleteConfirmOpen(false);
      setDeleteId(null);
      fetchDrafts();
    } catch (error) {
      setModalContent({
        title: 'Error',
        message: 'Failed to delete draft',
        type: 'error'
      });
      setModalOpen(true);
      setDeleteConfirmOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading drafts...</div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Drafts</h2>
        <div className="flex flex-wrap space-x-2 gap-y-2 items-center">
          <button
            onClick={() => setTopicModalOpen(true)}
            className="px-4 py-2 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            + New from topic
          </button>
          <button
            onClick={() => setFilter('PENDING')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === 'PENDING'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('APPROVED')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === 'APPROVED'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Approved
          </button>
          <button
            onClick={() => setFilter('REJECTED')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === 'REJECTED'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Rejected
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {drafts.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <p className="text-gray-500">No {filter.toLowerCase()} drafts found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {drafts.map((draft) => (
            <div key={draft.id} className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {draft.article.source}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatDate(draft.createdAt)}
                    </span>
                  </div>
                  {isManualSource(draft.article.url) ? (
                    <span className="text-sm font-medium text-gray-700">
                      {draft.article.title}
                    </span>
                  ) : (
                    <a
                      href={draft.article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      {draft.article.title}
                    </a>
                  )}
                </div>
              </div>

              {editingId === draft.id ? (
                <div className="mb-4">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full h-48 p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="mt-2 flex space-x-2">
                    <button
                      onClick={() => handleSaveEdit(draft.id)}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{draft.content}</p>
                </div>
              )}

              {draft.status === 'PENDING' && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleApprove(draft.id)}
                    className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(draft.id)}
                    className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleEdit(draft)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(draft.id)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Success/Error Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={modalContent.title}>
        <div className={`p-4 rounded-md ${modalContent.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {modalContent.message}
        </div>
      </Modal>

      {/* New from Topic Modal */}
      <Modal
        isOpen={topicModalOpen}
        onClose={() => (generating ? undefined : setTopicModalOpen(false))}
        title="Create post from a topic"
        showCloseButton={false}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
            <input
              type="text"
              value={topicValue}
              onChange={(e) => setTopicValue(e.target.value)}
              placeholder="e.g. Why most SaaS landing pages convert poorly"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              disabled={generating}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Extra context <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={topicContext}
              onChange={(e) => setTopicContext(e.target.value)}
              rows={5}
              placeholder="Angle, examples, stats, audience nuance, do/don'ts. Anything that should shape the post."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              disabled={generating}
            />
          </div>
          <div className="flex space-x-3 justify-end pt-2">
            <button
              onClick={() => setTopicModalOpen(false)}
              disabled={generating}
              className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerateFromTopic}
              disabled={generating || !topicValue.trim()}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {generating ? 'Generating…' : 'Generate drafts'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} title="Confirm Delete" showCloseButton={false}>
        <div className="p-4">
          <p className="text-gray-700 mb-6">Are you sure you want to delete this draft? This action cannot be undone.</p>
          <div className="flex space-x-3 justify-end">
            <button
              onClick={() => setDeleteConfirmOpen(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
