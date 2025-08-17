import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../components/AuthProvider";
import { getAllSeminars } from "../lib/firebase";
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Upload, X } from "lucide-react";

const HOURS = [
  { id: 1, time: "9:00 - 9:45" },
  { id: 2, time: "9:45 - 10:30" },
  { id: 3, time: "10:30 - 11:15" },
  { id: 4, time: "11:15 - 12:00" },
  { id: 5, time: "12:30 - 1:20" },
  { id: 6, time: "1:20 - 2:15" },
  { id: 7, time: "2:15 - 3:05" },
];

const EditSeminarPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    room: "",
    capacity: 20,
    hour: 1,
    community_partner: "",
    notes: "",
    image_url: "",
    teacher_email: "",
    teacher_name: ""
  });

  useEffect(() => {
    fetchSeminar();
  }, [id]);

  const fetchSeminar = async () => {
    try {
      const seminars = await getAllSeminars();
      const seminar = seminars.find(s => s.id === id);
      
      if (!seminar) {
        setError("Seminar not found");
        navigate("/teacher/my-seminars");
        return;
      }

      if (seminar.createdBy !== user.uid) {
        setError("You don't have permission to edit this seminar");
        navigate("/teacher/my-seminars");
        return;
      }

      if (seminar.image_url) {
        setImagePreview(seminar.image_url);
      }

      setFormData({
        title: seminar.title || "",
        description: seminar.description || "",
        room: seminar.location || "",
        capacity: seminar.capacity || 20,
        hour: seminar.hour || 1,
        community_partner: seminar.community_partner || "",
        notes: seminar.notes || "",
        image_url: seminar.image_url || "",
        teacher_email: seminar.teacher_email || user.email,
        teacher_name: seminar.teacher_name || user.displayName
      });
    } catch (error) {
      setError("Failed to fetch seminar details");
      console.error('Error fetching seminar:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        return;
      }
      setImageFile(file);
      const preview = URL.createObjectURL(file);
      setImagePreview(preview);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData(prev => ({ ...prev, image_url: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const updateData = {
        title: formData.title,
        description: formData.description,
        location: formData.room,
        capacity: parseInt(formData.capacity),
        hour: parseInt(formData.hour),
        community_partner: formData.community_partner,
        notes: formData.notes,
        teacher_email: formData.teacher_email,
        teacher_name: formData.teacher_name,
        updatedAt: new Date()
      };

      const seminarRef = doc(db, 'seminars', id);
      await updateDoc(seminarRef, updateData);

      navigate("/teacher/my-seminars");
    } catch (error) {
      console.error("Error updating seminar:", error);
      setError("Failed to update seminar. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "number" ? parseInt(value) : value,
    }));
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading seminar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6">Edit Seminar</h2>
        
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hour *
            </label>
            <select
              name="hour"
              value={formData.hour}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {HOURS.map((hour) => (
                <option key={hour.id} value={hour.id}>
                  Hour {hour.id} ({hour.time})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Room Number
            </label>
            <input
              type="text"
              name="room"
              value={formData.room}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Maximum Number of Students
            </label>
            <input
              type="number"
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Community Partner
            </label>
            <input
              type="text"
              name="community_partner"
              value={formData.community_partner}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/teacher/my-seminars")}
              disabled={saving}
              className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditSeminarPage;