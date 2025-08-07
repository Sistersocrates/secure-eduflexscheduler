import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthProvider';
import { 
  uploadClassResource,
  getClassResources,
  deleteResource,
  generateLessonPlan,
  generateClassContent,
  analyzeAttendancePatterns
} from '../../lib/teacherFirebase';
import { 
  Upload, 
  File, 
  Image, 
  Video, 
  FileText, 
  Download, 
  Trash2, 
  Eye,
  Plus,
  Wand2,
  Brain,
  TrendingUp,
  BookOpen,
  Lightbulb,
  Target,
  Clock,
  Users,
  BarChart3,
  PieChart,
  Calendar,
  Loader,
  AlertCircle,
  CheckCircle,
  X,
  Save,
  Edit,
  Share,
  Copy
} from 'lucide-react';

const ResourceManagement = ({ classId, className }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('resources');
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiContent, setAiContent] = useState('');
  const [attendanceAnalysis, setAttendanceAnalysis] = useState(null);

  useEffect(() => {
    if (classId && user) {
      loadResources();
      if (activeTab === 'analytics') {
        loadAttendanceAnalysis();
      }
    }
  }, [classId, user, activeTab]);

  const loadResources = async () => {
    try {
      setLoading(true);
      const resourceData = await getClassResources(user.uid, classId);
      setResources(resourceData);
    } catch (error) {
      console.error('Error loading resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceAnalysis = async () => {
    try {
      const analysis = await analyzeAttendancePatterns(user.uid, classId);
      setAttendanceAnalysis(analysis);
    } catch (error) {
      console.error('Error loading attendance analysis:', error);
    }
  };

  const handleFileUpload = async (files, category = 'general') => {
    try {
      setUploading(true);
      
      for (const file of files) {
        // Check file size (2MB limit)
        if (file.size > 2 * 1024 * 1024) {
          alert(`File ${file.name} is too large. Maximum size is 2MB.`);
          continue;
        }

        await uploadClassResource(user.uid, classId, file, {
          category,
          uploadedBy: user.displayName,
          uploadedAt: new Date()
        });
      }
      
      await loadResources();
      setShowUploadModal(false);
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Error uploading files. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteResource = async (resourceId) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      try {
        await deleteResource(user.uid, classId, resourceId);
        await loadResources();
      } catch (error) {
        console.error('Error deleting resource:', error);
      }
    }
  };

  const generateAIContent = async (type, prompt) => {
    try {
      setAiGenerating(true);
      let content = '';
      
      switch (type) {
        case 'lesson-plan':
          content = await generateLessonPlan(className, prompt);
          break;
        case 'activity':
          content = await generateClassContent(className, 'activity', prompt);
          break;
        case 'assessment':
          content = await generateClassContent(className, 'assessment', prompt);
          break;
        case 'discussion':
          content = await generateClassContent(className, 'discussion', prompt);
          break;
        default:
          content = await generateClassContent(className, type, prompt);
      }
      
      setAiContent(content);
    } catch (error) {
      console.error('Error generating AI content:', error);
      alert('Error generating content. Please try again.');
    } finally {
      setAiGenerating(false);
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return <Image className="h-5 w-5" />;
    if (fileType.startsWith('video/')) return <Video className="h-5 w-5" />;
    if (fileType.includes('pdf')) return <FileText className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const UploadModal = () => {
    const [dragActive, setDragActive] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [category, setCategory] = useState('general');

    const handleDrag = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === 'dragenter' || e.type === 'dragover') {
        setDragActive(true);
      } else if (e.type === 'dragleave') {
        setDragActive(false);
      }
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      
      const files = Array.from(e.dataTransfer.files);
      setSelectedFiles(files);
    };

    const handleFileSelect = (e) => {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Upload Resources</h2>
            <button
              onClick={() => setShowUploadModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="general">General</option>
                <option value="lesson-plan">Lesson Plans</option>
                <option value="handout">Handouts</option>
                <option value="assignment">Assignments</option>
                <option value="media">Media</option>
                <option value="reference">Reference Materials</option>
              </select>
            </div>

            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center ${
                dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm text-gray-600 mb-2">
                Drag and drop files here, or click to select
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Maximum file size: 2MB
              </p>
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
              >
                Select Files
              </label>
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900">Selected Files:</h4>
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      {getFileIcon(file.type)}
                      <span className="text-sm text-gray-900">{file.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleFileUpload(selectedFiles, category)}
                disabled={selectedFiles.length === 0 || uploading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {uploading ? (
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Upload
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const AIAssistantModal = () => {
    const [aiType, setAiType] = useState('lesson-plan');
    const [prompt, setPrompt] = useState('');

    const aiTypes = [
      { id: 'lesson-plan', name: 'Lesson Plan', icon: BookOpen },
      { id: 'activity', name: 'Class Activity', icon: Users },
      { id: 'assessment', name: 'Assessment', icon: Target },
      { id: 'discussion', name: 'Discussion Questions', icon: Lightbulb }
    ];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">AI Content Generator</h2>
            <button
              onClick={() => setShowAIModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Content Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {aiTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setAiType(type.id)}
                    className={`flex items-center p-3 border rounded-lg text-left transition-colors ${
                      aiType === type.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <type.icon className="h-5 w-5 mr-3" />
                    <span className="font-medium">{type.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Describe what you need
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="E.g., Create a lesson plan about photosynthesis for 9th grade students, including hands-on activities and assessment questions..."
              />
            </div>

            {aiContent && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Generated Content</h4>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => navigator.clipboard.writeText(aiContent)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        const blob = new Blob([aiContent], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${aiType}-${Date.now()}.txt`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">{aiContent}</pre>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowAIModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => generateAIContent(aiType, prompt)}
                disabled={!prompt.trim() || aiGenerating}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {aiGenerating ? (
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4 mr-2" />
                )}
                Generate
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ResourceCard = ({ resource }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 text-gray-400">
            {getFileIcon(resource.fileType)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {resource.name}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {resource.category} • {formatFileSize(resource.size)} • 
              Uploaded {new Date(resource.uploadedAt?.toDate()).toLocaleDateString()}
            </p>
            {resource.description && (
              <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                {resource.description}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => window.open(resource.downloadUrl, '_blank')}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              const a = document.createElement('a');
              a.href = resource.downloadUrl;
              a.download = resource.name;
              a.click();
            }}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteResource(resource.id)}
            className="p-1 text-gray-400 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const AttendanceAnalytics = () => {
    if (!attendanceAnalysis) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Attendance</p>
                <p className="text-2xl font-bold text-gray-900">
                  {attendanceAnalysis.averageAttendance}%
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Most Attended Day</p>
                <p className="text-2xl font-bold text-gray-900">
                  {attendanceAnalysis.bestDay}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">At-Risk Students</p>
                <p className="text-2xl font-bold text-gray-900">
                  {attendanceAnalysis.atRiskStudents}
                </p>
              </div>
            </div>
          </div>
        </div>

        {attendanceAnalysis.insights && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Insights</h3>
            <div className="space-y-3">
              {attendanceAnalysis.insights.map((insight, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <Brain className="h-5 w-5 text-purple-600 mt-0.5" />
                  <p className="text-sm text-gray-700">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        )}
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
          <h1 className="text-2xl font-bold text-gray-900">Resources & Analytics</h1>
          <p className="text-gray-600">{className}</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAIModal(true)}
            className="inline-flex items-center px-4 py-2 border border-purple-300 shadow-sm text-sm font-medium rounded-md text-purple-700 bg-white hover:bg-purple-50"
          >
            <Brain className="h-4 w-4 mr-2" />
            AI Assistant
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Upload Resource
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'resources', name: 'Resources', icon: File, count: resources.length },
            { id: 'analytics', name: 'Analytics', icon: BarChart3 }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.name}
              {tab.count !== undefined && (
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'resources' && (
        <div className="space-y-4">
          <div className="grid gap-4">
            {resources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
            
            {resources.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <File className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No resources yet</h3>
                <p className="text-gray-600 mb-4">
                  Upload lesson plans, handouts, and other materials for your class
                </p>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Upload First Resource
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && <AttendanceAnalytics />}

      {/* Modals */}
      {showUploadModal && <UploadModal />}
      {showAIModal && <AIAssistantModal />}
    </div>
  );
};

export default ResourceManagement;

