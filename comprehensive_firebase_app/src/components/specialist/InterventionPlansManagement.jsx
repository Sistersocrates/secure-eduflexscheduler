import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthProvider';
import { 
  createInterventionPlan,
  getInterventionPlans,
  updateInterventionPlan,
  getProgressTracking,
  createProgressEntry,
  searchStudents
} from '../../lib/specialistFirebase';
import { 
  Target,
  User,
  Plus,
  Edit,
  Eye,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  Filter,
  Save,
  X,
  Flag,
  Users,
  FileText,
  BarChart3,
  Star,
  Award,
  Heart,
  Brain,
  Lightbulb,
  Shield,
  Loader,
  ChevronDown,
  ChevronRight,
  Activity
} from 'lucide-react';

const InterventionPlansManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, completed, on_hold
  const [progressEntries, setProgressEntries] = useState([]);
  const [expandedPlans, setExpandedPlans] = useState(new Set());

  useEffect(() => {
    if (user) {
      loadPlansData();
    }
  }, [user, selectedStudent, filterStatus]);

  const loadPlansData = async () => {
    try {
      setLoading(true);
      
      const plansData = await getInterventionPlans(
        user.uid, 
        selectedStudent?.id || null
      );
      
      // Filter plans based on status
      let filteredPlans = plansData;
      if (filterStatus !== 'all') {
        filteredPlans = plansData.filter(plan => plan.status === filterStatus);
      }
      
      setPlans(filteredPlans);
    } catch (error) {
      console.error('Error loading plans data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProgressData = async (planId) => {
    try {
      const progressData = await getProgressTracking(user.uid, null, planId);
      setProgressEntries(progressData);
    } catch (error) {
      console.error('Error loading progress data:', error);
    }
  };

  const handleSearchStudents = async (term) => {
    if (term.length > 2) {
      try {
        const studentsData = await searchStudents(user.uid, term);
        setStudents(studentsData);
      } catch (error) {
        console.error('Error searching students:', error);
      }
    } else {
      setStudents([]);
    }
  };

  const handleCreatePlan = async (planData) => {
    try {
      await createInterventionPlan(user.uid, planData);
      setShowCreateModal(false);
      loadPlansData();
    } catch (error) {
      console.error('Error creating intervention plan:', error);
    }
  };

  const handleUpdatePlan = async (planId, updates) => {
    try {
      await updateInterventionPlan(user.uid, planId, updates);
      setShowEditModal(false);
      setSelectedPlan(null);
      loadPlansData();
    } catch (error) {
      console.error('Error updating intervention plan:', error);
    }
  };

  const handleCreateProgress = async (progressData) => {
    try {
      await createProgressEntry(user.uid, {
        ...progressData,
        interventionPlanId: selectedPlan.id,
        studentId: selectedPlan.studentId
      });
      setShowProgressModal(false);
      loadProgressData(selectedPlan.id);
    } catch (error) {
      console.error('Error creating progress entry:', error);
    }
  };

  const togglePlanExpansion = (planId) => {
    const newExpanded = new Set(expandedPlans);
    if (newExpanded.has(planId)) {
      newExpanded.delete(planId);
    } else {
      newExpanded.add(planId);
      loadProgressData(planId);
    }
    setExpandedPlans(newExpanded);
  };

  const formatDate = (timestamp) => {
    return timestamp.toDate().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateProgress = (plan) => {
    if (!plan.goals || plan.goals.length === 0) return 0;
    
    const completedGoals = plan.goals.filter(goal => goal.status === 'completed').length;
    return Math.round((completedGoals / plan.goals.length) * 100);
  };

  const InterventionPlanCard = ({ plan }) => {
    const isExpanded = expandedPlans.has(plan.id);
    const progress = calculateProgress(plan);
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <button
                  onClick={() => togglePlanExpansion(plan.id)}
                  className="flex items-center space-x-2"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  )}
                  <h3 className="text-lg font-semibold text-gray-900">{plan.title}</h3>
                </button>
                
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(plan.priority)}`}>
                  {plan.priority} priority
                </span>
                
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(plan.status)}`}>
                  {plan.status}
                </span>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                <div className="flex items-center space-x-1">
                  <User className="h-4 w-4" />
                  <span>{plan.student?.displayName || 'Unknown Student'}</span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>Created {formatDate(plan.createdAt)}</span>
                </div>
                
                {plan.reviewDate && (
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>Review {formatDate(plan.reviewDate)}</span>
                  </div>
                )}
              </div>
              
              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">Goal Progress</span>
                  <span className="font-medium text-gray-900">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
              
              <p className="text-gray-700 line-clamp-2">{plan.description}</p>
            </div>
            
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={() => {
                  setSelectedPlan(plan);
                  setShowProgressModal(true);
                }}
                className="p-2 text-gray-400 hover:text-green-600"
                title="Add Progress"
              >
                <TrendingUp className="h-4 w-4" />
              </button>
              
              <button
                onClick={() => {
                  setSelectedPlan(plan);
                  setShowEditModal(true);
                }}
                className="p-2 text-gray-400 hover:text-blue-600"
                title="Edit Plan"
              >
                <Edit className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {isExpanded && (
            <div className="border-t border-gray-200 pt-4 space-y-4">
              {/* Goals */}
              {plan.goals && plan.goals.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Goals</h4>
                  <div className="space-y-2">
                    {plan.goals.map((goal, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className={`w-2 h-2 rounded-full ${
                          goal.status === 'completed' ? 'bg-green-500' :
                          goal.status === 'in_progress' ? 'bg-yellow-500' :
                          'bg-gray-300'
                        }`}></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{goal.title}</p>
                          <p className="text-xs text-gray-600">{goal.description}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          goal.status === 'completed' ? 'bg-green-100 text-green-800' :
                          goal.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {goal.status || 'not_started'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Strategies */}
              {plan.strategies && plan.strategies.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Strategies</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {plan.strategies.map((strategy, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-blue-50 rounded-lg">
                        <Lightbulb className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-gray-700">{strategy}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Timeline */}
              {plan.timeline && Object.keys(plan.timeline).length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Timeline</h4>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {plan.timeline.startDate && (
                        <div>
                          <span className="text-gray-600">Start Date:</span>
                          <span className="ml-2 font-medium">{plan.timeline.startDate}</span>
                        </div>
                      )}
                      {plan.timeline.endDate && (
                        <div>
                          <span className="text-gray-600">End Date:</span>
                          <span className="ml-2 font-medium">{plan.timeline.endDate}</span>
                        </div>
                      )}
                      {plan.timeline.duration && (
                        <div>
                          <span className="text-gray-600">Duration:</span>
                          <span className="ml-2 font-medium">{plan.timeline.duration}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Recent Progress */}
              {progressEntries.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Recent Progress</h4>
                  <div className="space-y-2">
                    {progressEntries.slice(0, 3).map(entry => (
                      <div key={entry.id} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                        <Activity className="h-4 w-4 text-green-600 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{entry.title}</p>
                          <p className="text-xs text-gray-600">{entry.description}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-gray-500">
                              {formatDate(entry.createdAt)}
                            </span>
                            {entry.rating && (
                              <div className="flex items-center space-x-1">
                                <Star className="h-3 w-3 text-yellow-500" />
                                <span className="text-xs text-gray-600">{entry.rating}/5</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const CreatePlanModal = () => {
    const [formData, setFormData] = useState({
      studentId: '',
      title: '',
      description: '',
      priority: 'medium',
      goals: [],
      strategies: [],
      timeline: {},
      authorizedTeachers: [],
      parentNotified: false,
      reviewDate: ''
    });
    const [goalInput, setGoalInput] = useState('');
    const [strategyInput, setStrategyInput] = useState('');

    const handleSubmit = (e) => {
      e.preventDefault();
      handleCreatePlan(formData);
    };

    const addGoal = () => {
      if (goalInput.trim()) {
        setFormData({
          ...formData,
          goals: [...formData.goals, {
            title: goalInput.trim(),
            description: '',
            status: 'not_started',
            targetDate: null
          }]
        });
        setGoalInput('');
      }
    };

    const addStrategy = () => {
      if (strategyInput.trim()) {
        setFormData({
          ...formData,
          strategies: [...formData.strategies, strategyInput.trim()]
        });
        setStrategyInput('');
      }
    };

    const removeGoal = (index) => {
      setFormData({
        ...formData,
        goals: formData.goals.filter((_, i) => i !== index)
      });
    };

    const removeStrategy = (index) => {
      setFormData({
        ...formData,
        strategies: formData.strategies.filter((_, i) => i !== index)
      });
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Create Intervention Plan</h2>
            <button
              onClick={() => setShowCreateModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Student Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for student..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    handleSearchStudents(e.target.value);
                  }}
                />
                {students.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                    {students.map(student => (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, studentId: student.id });
                          setStudents([]);
                          setSearchTerm(student.displayName);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <User className="h-4 w-4 text-gray-400" />
                        <span>{student.displayName}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plan Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Academic Support Plan"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="4"
                placeholder="Describe the intervention plan and its purpose..."
              />
            </div>

            {/* Goals */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Goals
              </label>
              <div className="flex items-center space-x-2 mb-3">
                <input
                  type="text"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGoal())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add a goal..."
                />
                <button
                  type="button"
                  onClick={addGoal}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Goal
                </button>
              </div>
              
              {formData.goals.length > 0 && (
                <div className="space-y-2">
                  {formData.goals.map((goal, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">{goal.title}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeGoal(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Strategies */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Strategies
              </label>
              <div className="flex items-center space-x-2 mb-3">
                <input
                  type="text"
                  value={strategyInput}
                  onChange={(e) => setStrategyInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addStrategy())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add a strategy..."
                />
                <button
                  type="button"
                  onClick={addStrategy}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Add Strategy
                </button>
              </div>
              
              {formData.strategies.length > 0 && (
                <div className="space-y-2">
                  {formData.strategies.map((strategy, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Lightbulb className="h-4 w-4 text-green-600" />
                        <span className="text-sm">{strategy}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeStrategy(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Review Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Date
              </label>
              <input
                type="date"
                value={formData.reviewDate}
                onChange={(e) => setFormData({ ...formData, reviewDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Parent Notification */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="parentNotified"
                checked={formData.parentNotified}
                onChange={(e) => setFormData({ ...formData, parentNotified: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="parentNotified" className="text-sm text-gray-700">
                Parent/Guardian has been notified
              </label>
            </div>

            <div className="flex items-center space-x-3 pt-6">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Save className="h-4 w-4 mr-2 inline" />
                Create Plan
              </button>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const ProgressModal = () => {
    const [formData, setFormData] = useState({
      title: '',
      description: '',
      progressType: 'behavioral',
      rating: 3,
      observations: '',
      nextSteps: ''
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      handleCreateProgress(formData);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Add Progress Entry
            </h2>
            <button
              onClick={() => setShowProgressModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Progress entry title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={formData.progressType}
                onChange={(e) => setFormData({ ...formData, progressType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="behavioral">Behavioral</option>
                <option value="academic">Academic</option>
                <option value="social">Social</option>
                <option value="emotional">Emotional</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rating (1-5)
              </label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating })}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                      formData.rating >= rating
                        ? 'bg-yellow-500 border-yellow-500 text-white'
                        : 'border-gray-300 text-gray-400 hover:border-yellow-400'
                    }`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Describe the progress observed..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observations
              </label>
              <textarea
                value={formData.observations}
                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Additional observations..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Next Steps
              </label>
              <textarea
                value={formData.nextSteps}
                onChange={(e) => setFormData({ ...formData, nextSteps: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="2"
                placeholder="Recommended next steps..."
              />
            </div>

            <div className="flex items-center space-x-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <Save className="h-4 w-4 mr-2 inline" />
                Add Progress
              </button>
              <button
                type="button"
                onClick={() => setShowProgressModal(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
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
          <h1 className="text-2xl font-bold text-gray-900">Intervention Plans</h1>
          <p className="text-gray-600">Create and manage student intervention plans and track progress</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Plan
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Plans</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search student..."
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    handleSearchStudents(e.target.value);
                  }}
                />
                {students.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                    {students.map(student => (
                      <button
                        key={student.id}
                        onClick={() => {
                          setSelectedStudent(student);
                          setStudents([]);
                          setSearchTerm(student.displayName);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <User className="h-4 w-4 text-gray-400" />
                        <span>{student.displayName}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {selectedStudent && (
            <button
              onClick={() => setSelectedStudent(null)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Plans List */}
      <div className="space-y-4">
        {plans.length > 0 ? (
          plans.map(plan => (
            <InterventionPlanCard key={plan.id} plan={plan} />
          ))
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No intervention plans found
            </h3>
            <p className="text-gray-600 mb-4">
              Create intervention plans to support student success and track progress over time.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create First Plan
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && <CreatePlanModal />}
      {showProgressModal && <ProgressModal />}
    </div>
  );
};

export default InterventionPlansManagement;

