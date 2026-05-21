'use client';

import { useEffect, useState } from 'react';
import { draftsApi, postsApi, newsApi } from '@/lib/api';
import Modal from '@/components/Modal';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    pendingDrafts: 0,
    approvedDrafts: 0,
    totalPosts: 0,
    unusedArticles: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchingNews, setFetchingNews] = useState(false);
  const [generatingDrafts, setGeneratingDrafts] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', message: '', type: 'success' });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const [draftsRes, postsRes, newsRes] = await Promise.all([
        draftsApi.getAll({ status: 'PENDING', limit: 1 }),
        postsApi.getAll({ limit: 1 }),
        newsApi.getAll({ used: false, limit: 1 }),
      ]);

      setStats({
        pendingDrafts: draftsRes.data.total || 0,
        approvedDrafts: 0,
        totalPosts: postsRes.data.total || 0,
        unusedArticles: newsRes.data.total || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Failed to load dashboard stats. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchNews = async () => {
    try {
      setFetchingNews(true);
      setError(null);
      const res = await newsApi.fetch();
      setModalContent({
        title: 'Success',
        message: `Successfully fetched ${res.data.count} articles`,
        type: 'success'
      });
      setModalOpen(true);
      fetchStats();
    } catch (error) {
      setModalContent({
        title: 'Error',
        message: 'Failed to fetch news',
        type: 'error'
      });
      setModalOpen(true);
    } finally {
      setFetchingNews(false);
    }
  };

  const handleGenerateDrafts = async () => {
    try {
      setGeneratingDrafts(true);
      setError(null);
      const res = await draftsApi.generate();
      setModalContent({
        title: 'Success',
        message: `Successfully generated ${res.data.count} drafts`,
        type: 'success'
      });
      setModalOpen(true);
      fetchStats();
    } catch (error) {
      setModalContent({
        title: 'Error',
        message: 'Failed to generate drafts',
        type: 'error'
      });
      setModalOpen(true);
    } finally {
      setGeneratingDrafts(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-0">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Drafts</dt>
                  <dd className="text-3xl font-semibold text-gray-900">{stats.pendingDrafts}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Posts</dt>
                  <dd className="text-3xl font-semibold text-gray-900">{stats.totalPosts}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Unused Articles</dt>
                  <dd className="text-3xl font-semibold text-gray-900">{stats.unusedArticles}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">System Status</dt>
                  <dd className="text-lg font-semibold text-green-600">Active</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <button
            onClick={handleFetchNews}
            disabled={fetchingNews}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {fetchingNews ? 'Fetching...' : 'Fetch News'}
          </button>
          <button
            onClick={handleGenerateDrafts}
            disabled={generatingDrafts}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {generatingDrafts ? 'Generating...' : 'Generate Drafts'}
          </button>
          <a
            href="/drafts"
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Review Drafts
          </a>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={modalContent.title}>
        <div className={`p-4 rounded-md ${modalContent.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {modalContent.message}
        </div>
      </Modal>

      {/* Loading Modal */}
      <Modal isOpen={fetchingNews || generatingDrafts} onClose={() => {}} title={fetchingNews ? 'Fetching News' : 'Generating Drafts'} showCloseButton={false}>
        <div className="flex flex-col items-center justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">{fetchingNews ? 'Fetching news articles...' : 'Generating drafts...'}</p>
          <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
        </div>
      </Modal>

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-2">How it works</h3>
        <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
          <li>Marketing news is pulled daily at 6:00 AM from a single configured source (default: HubSpot Marketing). Change it under Settings.</li>
          <li>At 6:30 AM the AI writes 3 distinct drafts per article in DigitalKarvan&apos;s agency voice — no emoji spam, no hashtag spam, no fake hooks.</li>
          <li>Review and approve drafts in the Drafts page.</li>
          <li>Approved posts publish at 9:00 AM and 3:00 PM.</li>
          <li>Every Monday at 7:00 AM the bot reviews recent post performance and updates the writing playbook so new drafts learn from what actually got engagement.</li>
        </ul>
      </div>
    </div>
  );
}
