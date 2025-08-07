import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthProvider';
import { 
  createClass, 
  updateClass, 
  deleteClass, 
  cloneClass,
  uploadClassImage,
  getTeacherClasses,
  generateClassDescription
} from '../../lib/teacherFirebase';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Upload, 
  X, 
  Save, 
  Calendar,
  Clock,
  MapPin,
  Users,
  BookOpen,
  Image as ImageIcon,
  Wand2,
  Loader,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const ClassManagement = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    hour: 'all'
  });

  useEffect(() => {
    if (user) {
      loadClasses();
    }
  }, [user, filters]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const filterParams = {};
      if (filters.status !== 'all') filterParams.status = filters.status;
      if (filters.hour !== 'all') filterParams.hour = filters.hour;
      
      const teacherClasses = await getTeacherClasses(user.uid, filterParams);
      setClasses(teacherClasses);
    } catch (error) {
      console.error('Error loading classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const ClassForm = ({ classData, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
      title: '',
      description: '',
      room: '',
      capacity: 20,
      hour: 1,
      availableDays: [],
      startDate: '',
      endDate: '',
      enrollmentStart: '',
      enrollmentEnd: '',
      category: 'general',
      prerequisites: [],
      learningGoals: [],
      materials: [],
      imageUrl: '',
      ...classData
    });
    const [imageFile, setImageFile] = useState(null);
    const [aiGenerating, setAiGenerating] = useState(false);
    const [errors, setErrors] = useState({});

    const hours = Array.from({ length: 7 }, (_, i) => i + 1);
    const days = [
      { id: 1, name: 'Monday', short: 'Mon' },
      { id: 2, name: 'Tuesday', short: 'Tue' },
      { id: 3, name: 'Wednesday', short: 'Wed' },
      { id: 4, name: 'Thursday', short: 'Thu' },
      { id: 5, name: 'Friday', short: 'Fri' },
      { id: 6, name: 'Saturday', short: 'Sat' },
      { id: 0, name: 'Sunday', short: 'Sun' }
    ];

    const categories = [
      'general', 'science', 'math', 'english', 'history', 'arts', 'technology', 'health', 'other'
    ];

    const handleInputChange = (field, value) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: null }));
      }
    };

    const handleArrayInputChange = (field, value) => {
      const items = value.split('\n').filter(item => item.trim());
      setFormData(prev => ({ ...prev, [field]: items }));
    };

    const handleDayToggle = (dayId) => {
      setFormData(prev => ({
        ...prev,
        availableDays: prev.availableDays.includes(dayId)
          ? prev.availableDays.filter(id => id !== dayId)
          : [...prev.availableDays, dayId]
      }));
    };

    const handleImageUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        setImageFile(file);
        // Create preview URL
        const previewUrl = URL.createObjectURL(file);
        setFormData(prev => ({ ...prev, imageUrl: previewUrl }));
      }
    };

    const generateDescription = async () => {
      if (!formData.title.trim()) {
        setErrors(prev => ({ ...prev, title: 'Please enter a title first' }));
        return;
      }

      try {
        setAiGenerating(true);
        const description = await generateClassDescription(
          formData.title, 
          [formData.category, ...formData.prerequisites]
        );
        setFormData(prev => ({ ...prev, description }));
      } catch (error) {
        console.error('Error generating description:', error);
        setErrors(prev => ({ ...prev, description: 'Failed to generate description' }));
      } finally {
        setAiGenerating(false);
      }
    };

    const validateForm = () => {
      const newErrors = {};
      
      if (!formData.title.trim()) newErrors.title = 'Title is required';
      if (!formData.description.trim()) newErrors.description = 'Description is required';
      if (formData.capacity < 1) newErrors.capacity = 'Capacity must be at least 1';
      if (formData.availableDays.length === 0) newErrors.availableDays = 'Select at least one day';
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      
      if (!validateForm()) return;

      try {
        setFormLoading(true);
        
        let finalFormData = { ...formData };
        
        // Upload image if new file selected
        if (imageFile && classData?.id) {
          const imageUrl = await uploadClassImage(classData.id, imageFile);
          finalFormData.imageUrl = imageUrl;
        }

        // Add teacher information
        finalFormData.teacherName = user.displayName;
        finalFormData.teacherEmail = user.email;

        await onSave(finalFormData);
      } catch (error) {
        console.error('Error saving class:', error);
        setErrors({ submit: error.message });
      } finally {
        setFormLoading(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {classData ? 'Edit Class' : 'Create New Class'}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.title ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter class title"
                />
                {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title}</p>}
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Description *
                  </label>
                  <button
                    type="button"
                    onClick={generateDescription}
                    disabled={aiGenerating}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    {aiGenerating ? (
                      <Loader className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Wand2 className="h-4 w-4 mr-1" />
                    )}
                    AI Generate
                  </button>
                </div>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Describe your class..."
                />
                {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room
                </label>
                <input
                  type="text"
                  value={formData.room}
                  onChange={(e) => handleInputChange('room', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Room number or location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacity *
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.capacity}
                  onChange={(e) => handleInputChange('capacity', parseInt(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.capacity ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.capacity && <p className="text-red-600 text-sm mt-1">{errors.capacity}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hour *
                </label>
                <select
                  value={formData.hour}
                  onChange={(e) => handleInputChange('hour', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {hours.map(hour => (
                    <option key={hour} value={hour}>
                      Hour {hour} ({8 + hour - 1}:00 - {8 + hour}:00)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Available Days */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Days *
              </label>
              <div className="flex flex-wrap gap-2">
                {days.map(day => (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => handleDayToggle(day.id)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      formData.availableDays.includes(day.id)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {day.short}
                  </button>
                ))}
              </div>
              {errors.availableDays && <p className="text-red-600 text-sm mt-1">{errors.availableDays}</p>}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enrollment Start
                </label>
                <input
                  type="datetime-local"
                  value={formData.enrollmentStart}
                  onChange={(e) => handleInputChange('enrollmentStart', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enrollment End
                </label>
                <input
                  type="datetime-local"
                  value={formData.enrollmentEnd}
                  onChange={(e) => handleInputChange('enrollmentEnd', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Class Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class Image
              </label>
              <div className="flex items-center space-x-4">
                {formData.imageUrl && (
                  <img
                    src={formData.imageUrl}
                    alt="Class preview"
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                )}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Image
                  </label>
                </div>
              </div>
            </div>

            {/* Prerequisites */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prerequisites (one per line)
              </label>
              <textarea
                value={formData.prerequisites.join('\n')}
                onChange={(e) => handleArrayInputChange('prerequisites', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter prerequisites, one per line"
              />
            </div>

            {/* Learning Goals */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Learning Goals (one per line)
              </label>
              <textarea
                value={formData.learningGoals.join('\n')}
                onChange={(e) => handleArrayInputChange('learningGoals', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter learning goals, one per line"
              />
            </div>

            {/* Materials */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Required Materials (one per line)
              </label>
              <textarea
                value={formData.materials.join('\n')}
                onChange={(e) => handleArrayInputChange('materials', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter required materials, one per line"
              />
            </div>

            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{errors.submit}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {formLoading ? (
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {classData ? 'Update Class' : 'Create Class'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const ClassCard = ({ classItem }) => {
    const [actionLoading, setActionLoading] = useState(null);

    const handleEdit = () => {
      setEditingClass(classItem);
    };

    const handleClone = async () => {
      try {
        setActionLoading('clone');
        const newTitle = `${classItem.title} (Copy)`;
        await cloneClass(user.uid, classItem.id, newTitle);
        await loadClasses();
      } catch (error) {
        console.error('Error cloning class:', error);
      } finally {
        setActionLoading(null);
      }
    };

    const handleDelete = async () => {
      if (window.confirm('Are you sure you want to archive this class?')) {
        try {
          setActionLoading('delete');
          await deleteClass(user.uid, classItem.id, true);
          await loadClasses();
        } catch (error) {
          console.error('Error deleting class:', error);
        } finally {
          setActionLoading(null);
        }
      }
    };

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{classItem.title}</h3>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                classItem.status === 'published' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {classItem.status}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {classItem.description}
            </p>
            
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>Hour {classItem.hour}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>{classItem.room || 'Room TBD'}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>{classItem.currentEnrollment || 0}/{classItem.capacity}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{classItem.availableDays?.length || 0} days</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleEdit}
                className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </button>
              
              <button
                onClick={handleClone}
                disabled={actionLoading === 'clone'}
                className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                {actionLoading === 'clone' ? (
                  <Loader className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Copy className="h-4 w-4 mr-1" />
                )}
                Clone
              </button>
              
              <button
                onClick={handleDelete}
                disabled={actionLoading === 'delete'}
                className="inline-flex items-center px-3 py-1 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 disabled:opacity-50"
              >
                {actionLoading === 'delete' ? (
                  <Loader className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-1" />
                )}
                Archive
              </button>
            </div>
          </div>
          
          {classItem.imageUrl && (
            <div className="ml-4">
              <img 
                src={classItem.imageUrl} 
                alt={classItem.title}
                className="w-16 h-16 rounded-lg object-cover"
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleCreateClass = async (formData) => {
    try {
      await createClass(user.uid, formData);
      setShowCreateForm(false);
      await loadClasses();
    } catch (error) {
      throw error;
    }
  };

  const handleUpdateClass = async (formData) => {
    try {
      await updateClass(user.uid, editingClass.id, formData);
      setEditingClass(null);
      await loadClasses();
    } catch (error) {
      throw error;
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Class Management</h1>
          <p className="text-gray-600">Create and manage your classes</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Class
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hour</label>
            <select
              value={filters.hour}
              onChange={(e) => setFilters(prev => ({ ...prev, hour: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Hours</option>
              {Array.from({ length: 7 }, (_, i) => i + 1).map(hour => (
                <option key={hour} value={hour}>Hour {hour}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Classes Grid */}
      <div className="space-y-4">
        {classes.map((classItem) => (
          <ClassCard key={classItem.id} classItem={classItem} />
        ))}
        
        {classes.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No classes found</h3>
            <p className="text-gray-600 mb-4">
              {filters.status !== 'all' || filters.hour !== 'all' 
                ? 'Try adjusting your filters or create a new class'
                : 'Create your first class to get started'
              }
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Class
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Form Modal */}
      {showCreateForm && (
        <ClassForm
          onSave={handleCreateClass}
          onCancel={() => setShowCreateForm(false)}
        />
      )}
      
      {editingClass && (
        <ClassForm
          classData={editingClass}
          onSave={handleUpdateClass}
          onCancel={() => setEditingClass(null)}
        />
      )}
    </div>
  );
};

export default ClassManagement;

