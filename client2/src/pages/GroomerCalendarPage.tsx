import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import FullCalendar from '@fullcalendar/react';
import { 
  CalendarDaysIcon, 
  PlusIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import PageTransition from '../components/layout/PageTransition';
import LoadingSpinner from '../components/ui/loading-spinner';
import GroomerCalendar from '../components/calendar/GroomerCalendar';
import TimeBlockCreationDialog from '../components/calendar/TimeBlockCreationDialog';
import groomerService, { type GroomerSchedule } from '../services/groomerService';
import { toast } from "sonner";

const GroomerCalendarPage = () => {
  const { user } = useAuthStore();
  const [schedule, setSchedule] = useState<GroomerSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTimeBlockDialogOpen, setIsTimeBlockDialogOpen] = useState(false);
  const calendarRef = useRef<FullCalendar>(null);

  // load groomer schedule for date range
  const loadSchedule = useCallback(async (start: Date, end: Date) => {
    if (!user?._id) return;
    
    try {
      setLoading(true);
      setError(null);
      const startDate = start.toISOString().split('T')[0];
      const endDate = end.toISOString().split('T')[0];
      const scheduleData = await groomerService.getGroomerSchedule(user._id, startDate, endDate);
      setSchedule(scheduleData);
    } catch (err) {
      console.error('Error loading schedule:', err);
      setError('Failed to load schedule. Please try again.');
      toast.error('Failed to load schedule', {
        description: 'Please try refreshing the page.'
      });
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  // handle date range changes (when user navigates calendar)
  const handleDatesSet = useCallback((start: Date, end: Date) => {
    loadSchedule(start, end);
  }, [loadSchedule]);

  // handle schedule updates (after time block deletion, etc.)
  const handleScheduleUpdate = useCallback(() => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      const currentStart = calendarApi.view.activeStart;
      const currentEnd = calendarApi.view.activeEnd;
      loadSchedule(currentStart, currentEnd);
    }
  }, [loadSchedule]);

  const handleOpenTimeBlockDialog = () => {
    setIsTimeBlockDialogOpen(true);
  };

  const handleCloseTimeBlockDialog = () => {
    setIsTimeBlockDialogOpen(false);
  };

  const handleTimeBlockSuccess = () => {
    handleScheduleUpdate();
  };

  // initial load
  useEffect(() => {
    // load initial month view
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    loadSchedule(start, end);
  }, [loadSchedule]);

  if (loading && !schedule) {
    return (
      <PageTransition>
        <div className="flex justify-center items-center min-h-screen">
          <LoadingSpinner />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <CalendarDaysIcon className="h-8 w-8" />
                  Calendar
                </h1>
                <p className="mt-2 text-gray-600">
                  View your appointments and manage your availability by blocking time off.
                </p>
              </div>
              
              <div className="flex gap-4">
                <Button onClick={handleOpenTimeBlockDialog}>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Block Time
                </Button>
              </div>
            </div>
          </motion.div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* FullCalendar */}
          <Card>
            <CardContent className="p-6">
              <GroomerCalendar
                ref={calendarRef}
                schedule={schedule}
                loading={loading}
                onDatesSet={handleDatesSet}
                onScheduleUpdate={handleScheduleUpdate}
              />
            </CardContent>
          </Card>

          {/* Legend */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Legend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span className="text-sm">Confirmed Appointments</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-amber-500 rounded"></div>
                  <span className="text-sm">In Progress Appointments</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-sm">Completed Appointments</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span className="text-sm">Blocked Time</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-500 rounded"></div>
                  <span className="text-sm">Cancelled Appointments</span>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <p>• Click on time blocks to delete them</p>
                <p>• Click on appointments to view details</p>
                <p>• Use the view buttons to switch between Month, Week, and Day views</p>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Calendar Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>Navigation:</strong> Use the navigation arrows to move between time periods, or click "Today" to return to the current date.</p>
                <p><strong>Views:</strong> Switch between Month, Week, and Day views using the buttons in the top right.</p>
                <p><strong>Create Time Blocks:</strong> Click "Block Time" button or drag to select time on the calendar to create time blocks.</p>
                <p><strong>Delete Time Blocks:</strong> Click on red time blocks to view, edit or delete them.</p>
                <p><strong>Appointments:</strong> Blue appointments are confirmed, amber are in progress, green are completed. Click on them to view details.</p>
                <p><strong>Business Hours:</strong> Gray areas indicate non-business hours. Wednesday is closed.</p>
              </div>
            </CardContent>
          </Card>

          {/* Time Block Creation Dialog */}
          <TimeBlockCreationDialog
            isOpen={isTimeBlockDialogOpen}
            onClose={handleCloseTimeBlockDialog}
            onSuccess={handleTimeBlockSuccess}
          />
        </div>
      </div>
    </PageTransition>
  );
};

export default GroomerCalendarPage;
