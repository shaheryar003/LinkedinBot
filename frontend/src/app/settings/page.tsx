'use client';

import { useEffect, useState } from 'react';
import { settingsApi } from '@/lib/api';
import Modal from '@/components/Modal';

interface Settings {
  linkedinEmail: string | null;
  linkedinPassword: string | null;
  linkedinApiToken: string | null;
  linkedinApiSecret: string | null;
  postingMethod: string;
  postingTimes: string[];
  openaiApiKey: string | null;
  isActive: boolean;
  pageUrl: string;
  organizationId: string | null;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    linkedinEmail: '',
    linkedinPassword: '',
    linkedinApiToken: '',
    linkedinApiSecret: '',
    postingMethod: 'puppeteer',
    postingTimes: ['09:00', '15:00'],
    openaiApiKey: '',
    isActive: true,
    pageUrl: 'DigitalKarvan',
    organizationId: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', message: '', type: 'success' });
  const [testingConnection, setTestingConnection] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await settingsApi.get();
      setSettings(res.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setError('Failed to load settings. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      await settingsApi.update(settings);
      setModalContent({
        title: 'Success',
        message: 'Settings saved successfully',
        type: 'success'
      });
      setModalOpen(true);
    } catch (error) {
      setModalContent({
        title: 'Error',
        message: 'Failed to save settings',
        type: 'error'
      });
      setModalOpen(true);
    } finally {
      setSaving(false);
    }
  };

  const handleTestLinkedIn = async () => {
    try {
      setTestingConnection(true);
      setError(null);
      setSuccess(null);
      const res = await settingsApi.testLinkedIn(settings.postingMethod as 'puppeteer' | 'api');
      setModalContent({
        title: res.data.success ? 'Success' : 'Error',
        message: res.data.success ? 'LinkedIn connection successful' : 'LinkedIn connection failed',
        type: res.data.success ? 'success' : 'error'
      });
      setModalOpen(true);
    } catch (error) {
      setModalContent({
        title: 'Error',
        message: 'Failed to test LinkedIn connection',
        type: 'error'
      });
      setModalOpen(true);
    } finally {
      setTestingConnection(false);
    }
  };

  const handleTestOpenAI = async () => {
    try {
      setTestingConnection(true);
      setError(null);
      setSuccess(null);
      const res = await settingsApi.testOpenAI();
      setModalContent({
        title: res.data.success ? 'Success' : 'Error',
        message: res.data.success ? 'OpenAI connection successful' : 'OpenAI connection failed',
        type: res.data.success ? 'success' : 'error'
      });
      setModalOpen(true);
    } catch (error) {
      setModalContent({
        title: 'Error',
        message: 'Failed to test OpenAI connection',
        type: 'error'
      });
      setModalOpen(true);
    } finally {
      setTestingConnection(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-0">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <div className="space-y-6">
        {/* LinkedIn Settings */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">LinkedIn Configuration</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Posting Method
              </label>
              <select
                value={settings.postingMethod}
                onChange={(e) => setSettings({ ...settings, postingMethod: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="puppeteer">Browser Automation (Puppeteer)</option>
                <option value="api">LinkedIn API</option>
              </select>
            </div>

            {settings.postingMethod === 'puppeteer' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LinkedIn Email
                  </label>
                  <input
                    type="email"
                    value={settings.linkedinEmail || ''}
                    onChange={(e) => setSettings({ ...settings, linkedinEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="your-email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LinkedIn Password
                  </label>
                  <input
                    type="password"
                    value={settings.linkedinPassword || ''}
                    onChange={(e) => setSettings({ ...settings, linkedinPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter password"
                  />
                </div>
              </>
            )}

            {settings.postingMethod === 'api' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Access Token
                  </label>
                  <input
                    type="password"
                    value={settings.linkedinApiToken || ''}
                    onChange={(e) => setSettings({ ...settings, linkedinApiToken: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter LinkedIn API access token"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization ID
                  </label>
                  <input
                    type="text"
                    value={settings.organizationId || ''}
                    onChange={(e) => setSettings({ ...settings, organizationId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter organization ID"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Page URL
              </label>
              <input
                type="text"
                value={settings.pageUrl}
                onChange={(e) => setSettings({ ...settings, pageUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="DigitalKarvan"
              />
            </div>

            <button
              onClick={handleTestLinkedIn}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              Test LinkedIn Connection
            </button>
          </div>
        </div>

        {/* OpenAI Settings */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">OpenAI Configuration</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OpenAI API Key
              </label>
              <input
                type="password"
                value={settings.openaiApiKey || ''}
                onChange={(e) => setSettings({ ...settings, openaiApiKey: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="sk-..."
              />
            </div>

            <button
              onClick={handleTestOpenAI}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              Test OpenAI Connection
            </button>
          </div>
        </div>

        {/* Schedule Settings */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Posting Schedule</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Posting Times (24-hour format)
              </label>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="time"
                  value={settings.postingTimes[0] || '09:00'}
                  onChange={(e) => {
                    const newTimes = [...settings.postingTimes];
                    newTimes[0] = e.target.value;
                    setSettings({ ...settings, postingTimes: newTimes });
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="time"
                  value={settings.postingTimes[1] || '15:00'}
                  onChange={(e) => {
                    const newTimes = [...settings.postingTimes];
                    newTimes[1] = e.target.value;
                    setSettings({ ...settings, postingTimes: newTimes });
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Posts will be published at these times daily
              </p>
            </div>
          </div>
        </div>

        {/* System Settings */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">System Settings</h3>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={settings.isActive}
              onChange={(e) => setSettings({ ...settings, isActive: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">
              System Active (Enable automatic posting)
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Success/Error Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={modalContent.title}>
        <div className={`p-4 rounded-md ${modalContent.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {modalContent.message}
        </div>
      </Modal>

      {/* Testing Connection Modal */}
      <Modal isOpen={testingConnection} onClose={() => {}} title="Testing Connection" showCloseButton={false}>
        <div className="flex flex-col items-center justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Testing connection...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait</p>
        </div>
      </Modal>
    </div>
  );
}


interface Settings {
  linkedinEmail: string | null;
  linkedinPassword: string | null;
  linkedinApiToken: string | null;
  linkedinApiSecret: string | null;
  postingMethod: string;
  postingTimes: string[];
  openaiApiKey: string | null;
  isActive: boolean;
  pageUrl: string;
  organizationId: string | null;
}
