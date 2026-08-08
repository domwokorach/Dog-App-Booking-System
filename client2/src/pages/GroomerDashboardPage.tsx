import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  CalendarDaysIcon, 
  ClockIcon,
  CheckCircleIcon,
  PlayIcon,
  ArrowRightIcon,
  ChartBarIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import PageTransition from '../components/layout/PageTransition';
import LoadingSpinner from '../components/ui/loading-spinner';
import AppointmentDetailsDialog from '../components/calendar/AppointmentDetailsDialog';
import GroomerAppointmentCard from '../components/appointments/GroomerAppointmentCard';
import type { Appointment } from '../types';
import { useAppointmentData } from '../hooks';

const GroomerDashboardPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const {
    appointments,
    loading: appointmentsLoading,
    updateAppointment
  } = useAppointmentData();

  // update current time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // filter today's appointments - memoized to prevent infinite re-renders
  const today = new Date();
  const todaysAppointments = useMemo(() => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.startTime);
      return aptDate.toDateString() === today.toDateString();
    });
  }, [appointments, today.toDateString()]);

  // get next upcoming appointment
  const nextAppointment = useMemo(() => {
    const now = currentTime;
    const upcomingAppointments = todaysAppointments
      .filter(apt => {
        const startTime = new Date(apt.startTime);
        return startTime > now && apt.status !== 'cancelled' && apt.status !== 'completed';
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    
    return upcomingAppointments[0] || null;
  }, [todaysAppointments, currentTime]);

  // calculate daily stats
  const dailyStats = useMemo(() => {
    const completed = todaysAppointments.filter(apt => apt.status === 'completed').length;
    const inProgress = todaysAppointments.filter(apt => {
      const now = currentTime;
      const start = new Date(apt.startTime);
      const end = new Date(apt.endTime);
      return now >= start && now <= end && apt.status !== 'cancelled' && apt.status !== 'completed';
    }).length;
    const remaining = todaysAppointments.filter(apt => {
      const now = currentTime;
      const start = new Date(apt.startTime);
      return start > now && apt.status !== 'cancelled' && apt.status !== 'completed';
    }).length;

    return {
      total: todaysAppointments.length,
      completed,
      inProgress,
      remaining
    };
  }, [todaysAppointments, currentTime]);

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedAppointment(null);
  };

  const handleViewCalendar = () => {
    navigate('/calendar');
  };

  if (appointmentsLoading) {
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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6"
          >
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.name}!
                </h1>
                <p className="mt-1 font-bold text-gray-600 text-lg sm:text-xl">
                  {today.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-sm text-gray-500">Current Time</p>
                <p className="text-xl sm:text-2xl font-semibold text-gray-900">
                  {currentTime.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Stats card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"
          >
            <Card className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-900 font-bold">
                    Today's Summary
                  </CardTitle>
                <CardDescription className="text-indigo-700 font-medium">
                  Overview of your appointments for today
                </CardDescription>
                </CardHeader>
                <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-black-500">Total Today</p>
                      <p className="text-3xl font-bold text-black-900">{dailyStats.total}</p>
                      </div>
                    <ChartBarIcon className="h-10 w-10 text-black-500" />
                      </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-500">Completed</p>
                      <p className="text-3xl font-bold text-green-600">{dailyStats.completed}</p>
                    </div>
                    <CheckCircleIcon className="h-10 w-10 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-amber-500">In Progress</p>
                      <p className="text-3xl font-bold text-amber-600">{dailyStats.inProgress}</p>
                    </div>
                    <PlayIcon className="h-10 w-10 text-amber-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-500">Remaining</p>
                      <p className="text-3xl font-bold text-blue-600">{dailyStats.remaining}</p>
                    </div>
                    <ClockIcon className="h-10 w-10 text-blue-500" />
                  </div>
                  </div>
                </CardContent>
              </Card>
            
            {/* Calendar card */}
            <Card className="border-2 border-orange-200 bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 hover:from-yellow-100 hover:via-orange-100 hover:to-red-100 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-[1.02]" onClick={handleViewCalendar}>
              <CardHeader className="text-center pb-2">
                <CalendarDaysIcon className="h-12 w-12 text-red-600 mx-auto mb-2 drop-shadow-sm" />
                <CardTitle className="text-red-900 text-lg font-bold">Calendar View</CardTitle>
                <CardDescription className="text-orange-700 font-medium">
                  Manage your schedule and block time off
                </CardDescription>
                </CardHeader>
              <CardContent className="text-center pt-0">
                <div className="flex items-center justify-center gap-2 text-red-700 font-semibold bg-white/30 backdrop-blur-sm rounded-lg py-2 px-4 border border-orange-200/50">
                  <span className="text-sm">Open Calendar</span>
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                    </div>
                </CardContent>
              </Card>
          </motion.div>

          {/* Next  - if got next appointment */}
          {nextAppointment && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-6"
            >
              <Card className="border-l-4 border-l-blue-500 bg-blue-50/30">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <ArrowRightIcon className="h-5 w-5" />
                    Next Up
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <GroomerAppointmentCard
                    appointment={nextAppointment}
                    onClick={handleAppointmentClick}
                    currentTime={currentTime}
                    className="border-0 p-0 hover:bg-blue-50/50"
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Today's appointments */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <Card className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.005]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-teal-900 font-bold">
                  Today's Appointments
                </CardTitle>
                <CardDescription className="text-emerald-700 font-medium">
                  Click on any appointment to view details
                </CardDescription>
              </CardHeader>
              <CardContent>
                {todaysAppointments.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-lg font-medium">No appointments today</p>
                    <p className="text-sm mt-1">Enjoy your day off!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todaysAppointments
                      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                      .map((appointment) => (
                        <GroomerAppointmentCard
                          key={appointment._id}
                          appointment={appointment}
                          onClick={handleAppointmentClick}
                          currentTime={currentTime}
                        />
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Appointment details dialog */}
      {selectedAppointment && (
        <AppointmentDetailsDialog
          isOpen={isDialogOpen}
          onClose={handleCloseDialog}
          appointment={selectedAppointment}
          onStatusChange={(updated) => {
            updateAppointment(updated);
            setSelectedAppointment(updated);
          }}
        />
      )}
    </PageTransition>
  );
};

export default GroomerDashboardPage;
