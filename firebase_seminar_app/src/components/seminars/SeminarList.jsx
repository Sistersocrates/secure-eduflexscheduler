
import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { Lock, Unlock, Users, ChevronDown, ChevronUp, Edit } from "lucide-react";
import { supabase } from "@/lib/supabase";

const SeminarList = ({ seminars, setSeminars }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [expandedPeriods, setExpandedPeriods] = React.useState({});

  const periods = [
    { id: 1, name: "Hour 1 (9:00 - 9:45)" },
    { id: 2, name: "Hour 2 (9:45 - 10:30)" },
    { id: 3, name: "Hour 3 (10:30 - 11:15)" },
    { id: 4, name: "Hour 4 (11:15 - 12:00)" },
    { id: 5, name: "Hour 5 (12:30 - 1:20)" },
    { id: 6, name: "Hour 6 (1:20 - 2:15)" },
    { id: 7, name: "Hour 7 (2:15 - 3:05)" },
  ];

  const seminarsByPeriod = useMemo(() => {
    const grouped = {};
    periods.forEach(period => {
      grouped[period.id] = seminars.filter(seminar => seminar.hour === period.id);
    });
    return grouped;
  }, [seminars]);

  const handleDelete = async (seminarId) => {
    try {
      const { error } = await supabase
        .from('seminars')
        .delete()
        .eq('id', seminarId);

      if (error) throw error;

      const updatedSeminars = seminars.filter((s) => s.id !== seminarId);
      setSeminars(updatedSeminars);
      
      toast({
        title: "Success",
        description: "Seminar deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete seminar",
        variant: "destructive",
      });
    }
  };

  const toggleLock = async (seminar) => {
    try {
      const { error } = await supabase
        .from('seminars')
        .update({ is_locked: !seminar.is_locked })
        .eq('id', seminar.id);

      if (error) throw error;

      const updatedSeminars = seminars.map(s => {
        if (s.id === seminar.id) {
          return { ...s, is_locked: !s.is_locked };
        }
        return s;
      });
      setSeminars(updatedSeminars);

      toast({
        title: seminar.is_locked ? "Seminar unlocked" : "Seminar locked",
        description: `The seminar has been ${seminar.is_locked ? 'unlocked' : 'locked'} successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update seminar status",
        variant: "destructive",
      });
    }
  };

  const togglePeriod = (periodId) => {
    setExpandedPeriods(prev => ({
      ...prev,
      [periodId]: !prev[periodId]
    }));
  };

  return (
    <div className="space-y-6">
      {periods.map((period) => {
        const periodSeminars = seminarsByPeriod[period.id] || [];
        const isExpanded = expandedPeriods[period.id] !== false;
        
        return (
          <div 
            key={period.id} 
            className="bg-white rounded-xl shadow-md overflow-hidden"
          >
            <button
              onClick={() => togglePeriod(period.id)}
              className="w-full px-6 py-4 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-colors"
            >
              <div>
                <h3 className="text-xl font-semibold text-gray-800">
                  {period.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {periodSeminars.length} {periodSeminars.length === 1 ? 'seminar' : 'seminars'}
                </p>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-6 h-6 text-gray-600" />
              ) : (
                <ChevronDown className="w-6 h-6 text-gray-600" />
              )}
            </button>

            {isExpanded && (
              <div className="p-6">
                {periodSeminars.length === 0 ? (
                  <p className="text-gray-500 italic">No seminars scheduled for this period</p>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {periodSeminars.map((seminar) => (
                      <motion.div
                        key={seminar.id}
                        whileHover={{ scale: 1.02 }}
                        className="bg-white rounded-lg p-4 space-y-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="text-lg font-semibold text-gray-900 line-clamp-2">
                            {seminar.title}
                          </h4>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            seminar.is_locked ? 'bg-red-100 text-red-800' : 
                            'bg-green-100 text-green-800'
                          }`}>
                            {seminar.is_locked ? 'Locked' : 'Open'}
                          </span>
                        </div>
                        
                        <div className="space-y-1 text-sm">
                          <p className="text-gray-600 line-clamp-2">{seminar.description}</p>
                          <p className="text-gray-500">Room: {seminar.room}</p>
                          <p className="text-gray-500 flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {seminar.current_enrollment} / {seminar.capacity}
                          </p>
                          {seminar.community_partner && (
                            <p className="text-gray-500 line-clamp-1">
                              Partner: {seminar.community_partner}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => navigate(`/teacher/attendance/${seminar.id}`)}
                              className="flex-1"
                            >
                              Attendance
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/teacher/edit-seminar/${seminar.id}`)}
                              className="flex-1"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleLock(seminar)}
                              className="flex-1"
                            >
                              {seminar.is_locked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(seminar.id)}
                              className="flex-1"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SeminarList;
