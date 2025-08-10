
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import TeacherNav from "@/components/teacher/TeacherNav";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";

const ClassRoster = () => {
  const { seminarId } = useParams();
  const { toast } = useToast();
  const [seminar, setSeminar] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSeminarAndStudents();
  }, [seminarId]);

  const fetchSeminarAndStudents = async () => {
    try {
      // Fetch seminar details
      const { data: seminarData, error: seminarError } = await supabase
        .from('seminars')
        .select('*')
        .eq('id', seminarId)
        .single();

      if (seminarError) throw seminarError;
      setSeminar(seminarData);

      // Fetch registered students
      const { data: registrationData, error: registrationError } = await supabase
        .from('registrations')
        .select(`
          *,
          students (
            id,
            first_name,
            last_name,
            email,
            grade,
            advisor
          )
        `)
        .eq('seminar_id', seminarId);

      if (registrationError) throw registrationError;
      setStudents(registrationData || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch roster data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      students.map((registration) => ({
        "First Name": registration.students?.first_name || registration.student_name.split(' ')[0],
        "Last Name": registration.students?.last_name || registration.student_name.split(' ')[1],
        "Email": registration.students?.email || registration.student_email,
        "Grade": registration.students?.grade || "N/A",
        "Advisor": registration.students?.advisor || "N/A",
        "Registration Date": new Date(registration.created_at).toLocaleDateString(),
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Class Roster");
    XLSX.writeFile(workbook, `roster_${seminar?.title.replace(/\s+/g, '_')}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <TeacherNav />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading roster...</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{seminar?.title}</h1>
                <p className="text-gray-600">Hour {seminar?.hour} - Room {seminar?.room}</p>
              </div>
              <Button onClick={exportToExcel} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export Roster
              </Button>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Advisor
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((registration) => (
                    <tr key={registration.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {registration.students?.first_name || registration.student_name.split(' ')[0]}{' '}
                          {registration.students?.last_name || registration.student_name.split(' ')[1]}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {registration.students?.email || registration.student_email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {registration.students?.grade || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {registration.students?.advisor || "N/A"}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default ClassRoster;
