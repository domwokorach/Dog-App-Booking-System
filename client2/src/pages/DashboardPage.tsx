import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  CalendarDaysIcon, 
  ClockIcon,
  PlayIcon,
  HeartIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';
import PageTransition from '../components/layout/PageTransition';
import LoadingSpinner from '../components/ui/loading-spinner';
import type { Appointment, Pet, QuickAction } from '../types';
import AppointmentBookingModal from '../components/appointments/AppointmentBookingModal';
import { useAppointmentData, usePetData, useModal } from '../hooks';
import appointmentService from '../services/appointmentService';
import { toast } from "sonner";

const DashboardPage = () => {
  const { user } = useAuthStore();
  
  // Ccstom hooks for data management
  const {
    appointments,
    loading: appointmentsLoading,
    loadAppointments,
    addAppointment
  } = useAppointmentData();
  
  const {
    pets,
    loading: petsLoading
  } = usePetData(true); // always load pets since owner
  
  const bookingModal = useModal();

  const loading = appointmentsLoading || petsLoading;

  // state variables for cancel functionality
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancellingAppointment, setCancellingAppointment] = useState<Appointment | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  // state for editing appointment
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  const handleBookingSuccess = (appointment: Appointment) => {
    bookingModal.close();
    if (editingAppointment) {
      // this was a reschedule
      setEditingAppointment(null);
    }
    addAppointment(appointment);
    loadAppointments(); // rf to get any server-side updates
  };

  // add this helper to check if owner has pets
  const ownerHasPets = pets.length > 0;
  const ownerHasNoPets = pets.length === 0 && !petsLoading;

  const quickActions: QuickAction[] = [
    {
      title: 'Book Appointment',
      description: ownerHasPets 
        ? 'Schedule a grooming session for your pet'
        : 'Add a pet first to book appointments',
      icon: CalendarDaysIcon,
      action: ownerHasPets ? bookingModal.open : undefined,
      link: ownerHasPets ? undefined : '/pets',
      color: ownerHasPets 
        ? 'bg-blue-500 hover:bg-blue-600' 
        : 'bg-gray-400 hover:bg-gray-500'
    },
    {
      title: 'Manage Pets',
      description: 'View your pet profiles and grooming history',
      icon: HeartIcon,
      link: '/pets',
      color: 'bg-yellow-500 hover:bg-yellow-600'
    },
    {
      title: 'Manage Appointments',
      description: 'View your upcoming and past appointments',
      icon: ClockIcon,
      link: '/appointments',
      color: 'bg-green-500 hover:bg-green-600'
    }
  ];

  // same visual status based on time
  const getVisualStatus = (appointment: Appointment) => {
    const now = new Date();
    const start = new Date(appointment.startTime);
    const end = new Date(appointment.endTime);
    
    // preserve manual overrides for all final statuses
    if (['cancelled', 'completed', 'no_show'].includes(appointment.status)) {
      return appointment.status;
    }
    
    // time-based visual logic for active appointments
    if (now >= start && now <= end && !['cancelled', 'no_show'].includes(appointment.status)) {
      return 'in_progress';
    }
    
    // change to complete if past end time (visual only)
    if (now > end && appointment.status === 'confirmed') {
      return 'completed';
    }
    
    return appointment.status;
  };

  const getAppointmentStatus = (appointment: Appointment) => {
    const visualStatus = getVisualStatus(appointment);
    
    switch (visualStatus) {
      case 'completed':
        return { label: 'Completed', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircleIcon };
      case 'confirmed':
        return { label: 'Upcoming', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: ClockIcon };
      case 'in_progress':
        return { label: 'In Progress', color: 'text-amber-600', bgColor: 'bg-amber-100', icon: PlayIcon };
      case 'cancelled':
        return { label: 'Cancelled', color: 'text-red-600', bgColor: 'bg-red-100', icon: CheckCircleIcon };
      case 'no_show':
        return { label: 'No Show', color: 'text-red-600', bgColor: 'bg-red-100', icon: CheckCircleIcon };
      default:
        return { label: 'Unknown', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: ClockIcon };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // add this new formatting function for clearer date display
  const formatDateClear = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const ordinalSuffix = (day: number) => {
      if (day > 3 && day < 21) return 'th';
      switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      year: 'numeric'
    }).replace(/\d+/, `${day}${ordinalSuffix(day)}`);
  };

  const formatTimeClear = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).replace(' ', ''); // rm space before AM/PM
  };

  const getDuration = (serviceType: string) => {
    return serviceType === 'basic' ? '60 min' : '120 min';
  };

  const getPetName = (petId: string | Pet) => {
    if (typeof petId === 'object' && petId !== null) {
      return petId.name || 'Unknown Pet';
    }
    if (typeof petId === 'string') {
      const pet = pets.find(p => p._id === petId);
      return pet?.name || 'Unknown Pet';
    }
    return 'Unknown Pet';
  };

  const getGroomerName = (groomerId: string | { name?: string; firstName?: string; lastName?: string }) => {
    if (typeof groomerId === 'object' && groomerId !== null) {
      return groomerId.name || 
             (groomerId.firstName && groomerId.lastName ? `${groomerId.firstName} ${groomerId.lastName}` : '') || 
             'Unknown Groomer';
    }
    return 'Unknown Groomer';
  };

  // get recent appointments (last 5)
  const recentAppointments = appointments
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, 5);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  // this handles reschedule and cancel
  const handleReschedule = (appointment: Appointment) => {
    // open the modal to edit the appointment
    setEditingAppointment(appointment);
    bookingModal.open();
  };

  const handleCancelClick = (appointment: Appointment) => {
    setCancellingAppointment(appointment);
    setShowCancelDialog(true);
  };

  const handleCancelConfirm = async () => {
    if (!cancellingAppointment) return;

    try {
      setCancelLoading(true);
      await appointmentService.deleteAppointment(cancellingAppointment._id);
      // remove from local
      loadAppointments(); // refresh appointments
      setShowCancelDialog(false);
      setCancellingAppointment(null);
      
      // show success toast
      toast.success("Appointment Cancelled", {
        description: "A cancellation confirmation has been sent to your email.",
        duration: 10000, // 10 seconds
        action: {
          label: "Got it",
          onClick: () => {},
        }
      });
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel appointment';
      toast.error("Cancellation Failed", {
        description: errorMessage,
        duration: 10000 // for errors
      });
    } finally {
      setCancelLoading(false);
    }
  };

  const handleCancelDialogClose = () => {
    setShowCancelDialog(false);
    setCancellingAppointment(null);
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.name}!
            </h1>
            <p className="mt-2 text-gray-600">
              Take care of your furry friends with ease
            </p>
          </motion.div>

          {/* New pet owner guide msg */}
          {ownerHasNoPets && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-300 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 mb-8"
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    Welcome to Furkids!
                  </h3>
                  <p className="text-blue-800 mb-4">
                    To book your first grooming appointment, you'll need to add your pet's information first. 
                    This helps our groomers provide the best care tailored to your furry friend's needs.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link to="/pets">
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        Add Your First Pet
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Quick actions */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
          >
            {quickActions.map((action, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ scale: ownerHasNoPets && action.title === 'Book Appointment' ? 1 : 1.02 }}
                whileTap={{ scale: ownerHasNoPets && action.title === 'Book Appointment' ? 1 : 0.98 }}
              >
                {action.link ? (
                  <Link to={action.link}>
                    <div className={`bg-gradient-to-br from-white via-gray-50 to-blue-50 rounded-xl border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 p-6 hover:scale-[1.02] hover:border-blue-300 ${
                      ownerHasNoPets && action.title === 'Book Appointment' 
                        ? 'opacity-75 cursor-pointer' 
                        : ''
                    }`}>
                      <div className="flex items-center mb-4">
                        <div className={`p-3 rounded-xl ${action.color} text-white shadow-md`}>
                          <action.icon className="h-6 w-6" />
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-bold text-gray-900">
                            {action.title}
                          </h3>
                        </div>
                      </div>
                      <p className="text-gray-700 font-medium">{action.description}</p>

                    </div>
                  </Link>
                ) : (
                  <div 
                    onClick={action.action}
                    className={`bg-gradient-to-br from-white via-gray-50 to-blue-50 rounded-xl border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 p-6 cursor-pointer hover:scale-[1.02] hover:border-blue-300 ${
                      ownerHasNoPets && action.title === 'Book Appointment' 
                        ? 'opacity-75 cursor-not-allowed' 
                        : ''
                    }`}
                  >
                    <div className="flex items-center mb-4">
                      <div className={`p-3 rounded-xl ${action.color} text-white shadow-md`}>
                        <action.icon className="h-6 w-6" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-bold text-gray-900">
                          {action.title}
                        </h3>
                      </div>
                    </div>
                    <p className="text-gray-700 font-medium">{action.description}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>

          {/* Recent activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-gradient-to-br from-white via-stone-50 to-amber-50 rounded-xl border-2 border-stone-200 shadow-lg hover:shadow-xl transition-all duration-300 p-6"
          >
            <h2 className="text-xl font-bold text-stone-900 mb-4">
              Recent Activity
            </h2>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : recentAppointments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ClockIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No recent activity to show</p>
                <p className="text-sm mt-2">
                  Your pet care activity will appear here
                </p>
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {recentAppointments.map((appointment, index) => {
                  const status = getAppointmentStatus(appointment);
                  const StatusIcon = status.icon;
                  
                  return (
                    <AccordionItem key={appointment._id} value={`item-${index}`}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <div className="flex items-center space-x-4">
                            <StatusIcon className={`h-5 w-5 ${status.color}`} />
                            <div className="text-left">
                              <div className="font-medium text-gray-900">
                                Booking #{appointment._id.slice(-8).toUpperCase()} - {getPetName(appointment.petId)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {formatDateClear(appointment.startTime)} ({formatTimeClear(appointment.startTime)} - {formatTimeClear(appointment.endTime)})
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 text-right">
                            <div>
                              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                                {status.label}
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                {appointment.serviceType === 'basic' ? 'Basic' : 'Full'} ({getDuration(appointment.serviceType)})
                              </div>
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pt-4 pl-9 space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-start space-x-4">
                              <CalendarDaysIcon className="h-5 w-5 text-black-500 mt-1" />
                            <div>
                                <h4 className="font-semibold text-gray-900">Date</h4>
                                <p className="text-gray-600">{formatDate(appointment.startTime)}</p>
                              </div>
                            </div>
                            <div className="flex items-start space-x-4">
                              <ClockIcon className="h-5 w-5 text-black-500 mt-1" />
                            <div>
                                <h4 className="font-semibold text-gray-900">Time</h4>
                                <p className="text-gray-600">{formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}</p>
                              </div>
                            </div>
                            <div className="flex items-start space-x-4">
                              <HeartIcon className="h-5 w-5 text--500 mt-1" />
                            <div>
                                <h4 className="font-semibold text-gray-900">Pet</h4>
                                <p className="text-gray-600">{getPetName(appointment.petId)}</p>
                            </div>
                            </div>
                            <div className="flex items-start space-x-4">
                              <UserIcon className="h-5 w-5 text-black-500 mt-1" />
                            <div>
                                <h4 className="font-semibold text-gray-900">Groomer</h4>
                                <p className="text-gray-600">{getGroomerName(appointment.groomerId)}</p>
                            </div>
                            </div>
                          </div>
                          
                          <div className="pt-3 border-t">
                            {(() => {
                              const now = new Date();
                              const appointmentTime = new Date(appointment.startTime);
                              const isUpcoming = appointmentTime > now;
                              const hoursDifference = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);
                              const canModify = hoursDifference > 24;

                              return (
                                <div className="space-y-3">
                                  {appointment.status === 'confirmed' && isUpcoming && (
                                    <div className="flex flex-wrap gap-2">
                                      <Button 
                                        size="sm" 
                                        className={`${
                                          canModify 
                                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                        onClick={canModify ? () => handleReschedule(appointment) : undefined}
                                        disabled={!canModify}
                                      >
                                        Reschedule
                                      </Button>
                                      
                                      <Button 
                                        size="sm" 
                                        className={`${
                                          canModify 
                                            ? 'bg-red-600 hover:bg-red-700 text-white' 
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                        onClick={canModify ? () => handleCancelClick(appointment) : undefined}
                                        disabled={!canModify}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  )}
                                  
                                  {appointment.status === 'confirmed' && isUpcoming && !canModify && (
                                    <p className="text-xs text-amber-600">
                                      *Unable to reschedule/cancel as it is less than 24 hours before appointment time. Please call/whatsapp us if urgent*
                                    </p>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
            
            {recentAppointments.length > 0 && (
              <div className="mt-6 text-center">
                <Link to="/appointments">
                  <Button variant="outline">
                    View All Appointments
                  </Button>
                </Link>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Booking modal - updated to handle rescheduling */}
      {bookingModal.isOpen && ownerHasPets && (
        <AppointmentBookingModal
          pets={pets}
          editingAppointment={editingAppointment}
          onClose={() => {
            bookingModal.close();
            setEditingAppointment(null);
          }}
          onSuccess={handleBookingSuccess}
        />
      )}

      {/* Cancel Confirmation Dialog */}
      {showCancelDialog && cancellingAppointment && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleCancelDialogClose} />
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Cancel Appointment
              </h3>
              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to cancel the appointment for {getPetName(cancellingAppointment.petId)} on{' '}
                {formatDate(cancellingAppointment.startTime)} at {formatTime(cancellingAppointment.startTime)}?
              </p>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={handleCancelDialogClose}
                  disabled={cancelLoading}
                  className="flex-1"
                >
                  Keep Appointment
                </Button>
                <Button
                  onClick={handleCancelConfirm}
                  disabled={cancelLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {cancelLoading ? <LoadingSpinner size="sm" /> : 'Cancel Appointment'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
};

export default DashboardPage; 
