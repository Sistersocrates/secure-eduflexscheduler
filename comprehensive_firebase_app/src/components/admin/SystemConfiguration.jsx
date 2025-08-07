import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthProvider';
import { 
  getSystemSettings,
  updateSystemSettings,
  getAcademicTerms,
  createAcademicTerm,
  updateAcademicTerm,
  getCreditTypes,
  createCreditType
} from '../../lib/adminFirebase';
import { 
  Settings,
  Calendar,
  Award,
  Bell,
  Palette,
  Globe,
  Shield,
  Database,
  Plus,
  Edit,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Loader
} from 'lucide-react';

const SystemConfiguration = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({});
  const [academicTerms, setAcademicTerms] = useState([]);
  const [creditTypes, setCreditTypes] = useState([]);
  const [showTermModal, setShowTermModal] = useState(false);
  const [showCreditTypeModal, setShowCreditTypeModal] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadConfigurationData();
  }, [userProfile]);

  const loadConfigurationData = async () => {
    try {
      setLoading(true);
      const [settingsData, termsData, creditTypesData] = await Promise.all([
        getSystemSettings(null, userProfile?.tenantId),
        getAcademicTerms(userProfile?.tenantId),
        getCreditTypes(userProfile?.tenantId)
      ]);
      
      setSettings(settingsData);
      setAcademicTerms(termsData);
      setCreditTypes(creditTypesData);
    } catch (error) {
      console.error('Error loading configuration data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSaveSettings = async () => {
    try {
      await updateSystemSettings(settings, userProfile?.tenantId);
      setHasChanges(false);
      alert('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings: ' + error.message);
    }
  };

  const handleCreateTerm = async (termData) => {
    try {
      await createAcademicTerm({
        ...termData,
        tenantId: userProfile?.tenantId
      });
      setShowTermModal(false);
      loadConfigurationData();
    } catch (error) {
      console.error('Error creating academic term:', error);
      alert('Error creating academic term: ' + error.message);
    }
  };

  const handleUpdateTerm = async (termId, updates) => {
    try {
      await updateAcademicTerm(termId, updates);
      setShowTermModal(false);
      setSelectedTerm(null);
      loadConfigurationData();
    } catch (error) {
      console.error('Error updating academic term:', error);
      alert('Error updating academic term: ' + error.message);
    }
  };

  const handleCreateCreditType = async (creditTypeData) => {
    try {
      await createCreditType({
        ...creditTypeData,
        tenantId: userProfile?.tenantId
      });
      setShowCreditTypeModal(false);
      loadConfigurationData();
    } catch (error) {
      console.error('Error creating credit type:', error);
      alert('Error creating credit type: ' + error.message);
    }
  };

  const SettingCard = ({ title, description, children }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      {children}
    </div>
  );

  const GeneralSettingsTab = () => (
    <div className="space-y-6">
      <SettingCard
        title="System Information"
        description="Basic system configuration and branding"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              System Name
            </label>
            <input
              type="text"
              value={settings.general?.systemName || ''}
              onChange={(e) => handleSettingsChange('general', 'systemName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="EduFlex Scheduler"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Organization Name
            </label>
            <input
              type="text"
              value={settings.general?.organizationName || ''}
              onChange={(e) => handleSettingsChange('general', 'organizationName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your School District"
            />
          </div>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            System Description
          </label>
          <textarea
            value={settings.general?.systemDescription || ''}
            onChange={(e) => handleSettingsChange('general', 'systemDescription', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Brief description of your educational system"
          />
        </div>
      </SettingCard>

      <SettingCard
        title="User Registration"
        description="Control how new users can join the system"
      >
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.registration?.allowSelfRegistration || false}
              onChange={(e) => handleSettingsChange('registration', 'allowSelfRegistration', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Allow self-registration</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.registration?.requireEmailVerification || false}
              onChange={(e) => handleSettingsChange('registration', 'requireEmailVerification', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Require email verification</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.registration?.requireAdminApproval || false}
              onChange={(e) => handleSettingsChange('registration', 'requireAdminApproval', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Require admin approval</span>
          </label>
        </div>
      </SettingCard>

      <SettingCard
        title="Session Management"
        description="Configure user session and security settings"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Session Timeout (minutes)
            </label>
            <input
              type="number"
              value={settings.security?.sessionTimeout || 30}
              onChange={(e) => handleSettingsChange('security', 'sessionTimeout', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Login Attempts
            </label>
            <input
              type="number"
              value={settings.security?.maxLoginAttempts || 5}
              onChange={(e) => handleSettingsChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="mt-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.security?.requireStrongPasswords || false}
              onChange={(e) => handleSettingsChange('security', 'requireStrongPasswords', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Require strong passwords</span>
          </label>
        </div>
      </SettingCard>
    </div>
  );

  const AcademicTermsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Academic Terms</h3>
          <p className="text-sm text-gray-600">Manage academic terms and schedules</p>
        </div>
        <button
          onClick={() => setShowTermModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Term
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {academicTerms.map(term => (
          <div key={term.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">{term.name}</h4>
              <button
                onClick={() => {
                  setSelectedTerm(term);
                  setShowTermModal(true);
                }}
                className="p-1 text-gray-600 hover:text-blue-600"
              >
                <Edit className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-2">{term.description}</p>
            <div className="text-xs text-gray-500">
              <p>Start: {new Date(term.startDate).toLocaleDateString()}</p>
              <p>End: {new Date(term.endDate).toLocaleDateString()}</p>
            </div>
            <div className="mt-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                term.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {term.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const CreditTypesTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Credit Types</h3>
          <p className="text-sm text-gray-600">Define different types of academic credits</p>
        </div>
        <button
          onClick={() => setShowCreditTypeModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Credit Type
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {creditTypes.map(creditType => (
          <div key={creditType.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">{creditType.name}</h4>
              <Award className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600 mb-2">{creditType.description}</p>
            <div className="text-xs text-gray-500">
              <p>Value: {creditType.creditValue} credits</p>
              <p>Category: {creditType.category}</p>
            </div>
            <div className="mt-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                creditType.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {creditType.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const NotificationSettingsTab = () => (
    <div className="space-y-6">
      <SettingCard
        title="Email Notifications"
        description="Configure when and how email notifications are sent"
      >
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.notifications?.enableEmailNotifications || false}
              onChange={(e) => handleSettingsChange('notifications', 'enableEmailNotifications', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Enable email notifications</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.notifications?.notifyOnEnrollment || false}
              onChange={(e) => handleSettingsChange('notifications', 'notifyOnEnrollment', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Notify on new enrollments</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.notifications?.notifyOnAppointment || false}
              onChange={(e) => handleSettingsChange('notifications', 'notifyOnAppointment', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Notify on appointment changes</span>
          </label>
        </div>
      </SettingCard>

      <SettingCard
        title="System Notifications"
        description="Configure system-wide notification preferences"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default Reminder Time (hours)
            </label>
            <input
              type="number"
              value={settings.notifications?.defaultReminderHours || 24}
              onChange={(e) => handleSettingsChange('notifications', 'defaultReminderHours', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notification Frequency
            </label>
            <select
              value={settings.notifications?.frequency || 'immediate'}
              onChange={(e) => handleSettingsChange('notifications', 'frequency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="immediate">Immediate</option>
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
        </div>
      </SettingCard>
    </div>
  );

  const AcademicTermModal = ({ isOpen, onClose, term, onSubmit }) => {
    const [formData, setFormData] = useState({
      name: term?.name || '',
      description: term?.description || '',
      startDate: term?.startDate || '',
      endDate: term?.endDate || '',
      isActive: term?.isActive || false
    });

    useEffect(() => {
      if (term) {
        setFormData({
          name: term.name || '',
          description: term.description || '',
          startDate: term.startDate || '',
          endDate: term.endDate || '',
          isActive: term.isActive || false
        });
      }
    }, [term]);

    const handleSubmit = (e) => {
      e.preventDefault();
      if (term) {
        onSubmit(term.id, formData);
      } else {
        onSubmit(formData);
      }
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {term ? 'Edit Academic Term' : 'Create Academic Term'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Term Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Fall 2024"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Description of the academic term"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Active term</span>
              </label>
            </div>
            
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {term ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const CreditTypeModal = ({ isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
      name: '',
      description: '',
      creditValue: 1,
      category: 'core',
      isActive: true
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(formData);
      setFormData({
        name: '',
        description: '',
        creditValue: 1,
        category: 'core',
        isActive: true
      });
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Create Credit Type</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Credit Type Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mathematics"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Description of the credit type"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Credit Value
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  required
                  value={formData.creditValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, creditValue: parseFloat(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="core">Core</option>
                  <option value="elective">Elective</option>
                  <option value="enrichment">Enrichment</option>
                  <option value="support">Support</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Active credit type</span>
              </label>
            </div>
            
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">System Configuration</h2>
          <p className="text-gray-600">Configure system settings and academic parameters</p>
        </div>
        
        {hasChanges && (
          <button
            onClick={handleSaveSettings}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'general', name: 'General', icon: Settings },
            { id: 'terms', name: 'Academic Terms', icon: Calendar },
            { id: 'credits', name: 'Credit Types', icon: Award },
            { id: 'notifications', name: 'Notifications', icon: Bell }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'general' && <GeneralSettingsTab />}
        {activeTab === 'terms' && <AcademicTermsTab />}
        {activeTab === 'credits' && <CreditTypesTab />}
        {activeTab === 'notifications' && <NotificationSettingsTab />}
      </div>

      {/* Modals */}
      <AcademicTermModal
        isOpen={showTermModal}
        onClose={() => {
          setShowTermModal(false);
          setSelectedTerm(null);
        }}
        term={selectedTerm}
        onSubmit={selectedTerm ? handleUpdateTerm : handleCreateTerm}
      />
      
      <CreditTypeModal
        isOpen={showCreditTypeModal}
        onClose={() => setShowCreditTypeModal(false)}
        onSubmit={handleCreateCreditType}
      />
    </div>
  );
};

export default SystemConfiguration;

