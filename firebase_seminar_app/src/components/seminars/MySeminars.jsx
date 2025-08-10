
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import TeacherNav from "@/components/teacher/TeacherNav";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Users, Clock } from "lucide-react";

const MySeminars = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [seminars, setSeminars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMySeminars();
  }, [user]);

  const fetchMySeminars = async () => {
    try {
      const { data, error } = await supabase
        .from('seminars')
        .select(`
          *,
          registrations (
            student_name,
            student_email
          )
        `)
        .eq('teacher_email', user?.email)
        .order('hour', { ascending: true });

      if (error) throw error;
      setSeminars(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch seminars",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <TeacherNav />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-8">My Seminars</h1>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading seminars...</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {seminars.map((seminar) => (
                <motion.div
                  key={seminar.id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white rounded-lg shadow-md p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">{seminar.title}</h2>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      seminar.is_locked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {seminar.is_locked ? 'Locked' : 'Open'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <p className="text-gray-600">{seminar.description}</p>
                    <p className="text-gray-500 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Hour {seminar.hour}
                    </p>
                    <p className="text-gray-500">Room: {seminar.room}</p>
                    <p className="text-gray-500 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {seminar.current_enrollment} / {seminar.capacity} students
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => navigate(`/teacher/roster/${seminar.id}`)}
                      className="flex-1"
                    >
                      View Roster
                    </Button>
                    <Button
                      onClick={() => navigate(`/teacher/attendance/${seminar.id}`)}
                      variant="outline"
                      className="flex-1"
                    >
                      Attendance
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default MySeminars;
