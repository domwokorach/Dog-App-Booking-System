import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  HeartIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  BellAlertIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import LoadingSpinner from '../components/ui/loading-spinner';
import PageTransition from '../components/layout/PageTransition';
import appointmentService from '../services/appointmentService';
import type { Appointment } from '../types';

const AppointmentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuthStore();
  
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // authentication check - redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }
  }, [isAuthenticated, authLoading, navigate]);

  // role auth check
  useEffect(() => {
    if (user && !['owner', 'groomer'].includes(user.role)) {
      navigate('/dashboard');
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    const loadAppointment = async () => {
      if (!id || !user) {
        setError('Appointment ID not provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await appointmentService.getAppointmentById(id);
        
        // auth check - ensure user can view this appointment
        if (user.role === 'owner') {
          // owners can only view their own appointments
          const appointmentOwnerId = typeof data.ownerId === 'string' ? data.ownerId : data.ownerId?._id;
          if (appointmentOwnerId !== user._id) {
            setError('You are not authorized to view this appointment');
            return;
          }
        } else if (user.role === 'groomer') {
          // groomers can only view appointments assigned to them
          const appointmentGroomerId = typeof data.groomerId === 'string' ? data.groomerId : data.groomerId?._id;
          if (appointmentGroomerId !== user._id) {
            setError('You are not authorized to view this appointment');
            return;
          }
        }
        
        setAppointment(data);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load appointment';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadAppointment();
  }, [id, user]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
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

  const getPetName = (petId: string | { name?: string }) => {
    if (typeof petId === 'object' && petId !== null) {
      return petId.name || 'Unknown Pet';
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

  const getStatusInfo = (status: string, startTime: string) => {
    const now = new Date();
    const appointmentDate = new Date(startTime);
    const isUpcoming = appointmentDate >= now;
    
    if (status === 'completed') {
      return { 
        badge: <Badge variant="secondary" className="text-green-700 bg-green-100">Completed</Badge>,
        icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
        text: 'This appointment has been completed'
      };
    } else if (isUpcoming) {
      return { 
        badge: <Badge className="text-blue-700 bg-blue-100">Upcoming</Badge>,
        icon: <BellAlertIcon className="h-5 w-5 text-blue-500" />,
        text: 'This appointment is scheduled for the future'
      };
    } else {
      return { 
        badge: <Badge variant="outline">Past</Badge>,
        icon: <ExclamationCircleIcon className="h-5 w-5 text-gray-500" />,
        text: 'This appointment has passed'
      };
    }
  };

  const getServiceDetails = (serviceType: string) => {
    if (serviceType === 'basic') {
      return {
        name: 'Basic Grooming',
        description: 'Essential grooming services including bath, brush, nail trim, and ear cleaning',
        duration: '60 minutes'
      };
    } else {
      return {
        name: 'Full Grooming',
        description: 'Complete grooming package with bath, brush, haircut, nail trim, ear cleaning, and styling',
        duration: '120 minutes'
      };
    }
  };

  // show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // don't render if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  // don't render if wrong role
  if (!['owner', 'groomer'].includes(user.role)) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <ExclamationCircleIcon className="h-12 w-12 mx-auto text-red-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {error || 'Appointment not found'}
              </h3>
              <Button onClick={() => navigate(user.role === 'owner' ? '/appointments' : '/schedule')} variant="outline">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                {user.role === 'owner' ? 'Back to Appointments' : 'Back to Schedule'}
              </Button>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  const statusInfo = getStatusInfo(appointment.status, appointment.startTime);
  const serviceDetails = getServiceDetails(appointment.serviceType);

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back button */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <Button 
              onClick={() => navigate(user.role === 'owner' ? '/appointments' : '/schedule')} 
              variant="outline"
              size="sm"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              {user.role === 'owner' ? 'Back to Appointments' : 'Back to Schedule'}
            </Button>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-8"
          >
            <div className="mb-4 sm:mb-0">
              <h1 className="text-3xl font-bold text-gray-900">
                Appointment Details
              </h1>
              <p className="mt-2 text-gray-600">
                {user.role === 'owner' 
                  ? 'View your grooming appointment information'
                  : 'View client appointment details'
                }
              </p>
            </div>
            <div className="flex-shrink-0">
              {statusInfo.badge}
            </div>
          </motion.div>

          {/* Appointment details card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            {/* Status banner */}
            <div className="bg-gray-50 px-6 py-4 border-b">
              <div className="flex items-center space-x-3">
                {statusInfo.icon}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {statusInfo.text}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Appointment #{appointment._id.slice(-8).toUpperCase()}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-8">
              {/* Date time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start space-x-4">
                  <CalendarDaysIcon className="h-6 w-6 text-red-500 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Date</h3>
                    <p className="text-gray-600">{formatDate(appointment.startTime)}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <ClockIcon className="h-6 w-6 text-blue-500 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Time</h3>
                    <p className="text-gray-600">
                      {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pet and groomer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start space-x-4">
                  <HeartIcon className="h-6 w-6 text-amber-500 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Pet</h3>
                    <p className="text-gray-600">{getPetName(appointment.petId)}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <UserIcon className="h-6 w-6 text-green-500 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Groomer</h3>
                    <p className="text-gray-600">{getGroomerName(appointment.groomerId)}</p>
                  </div>
                </div>
              </div>

              {/* Service details */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Details</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">{serviceDetails.name}</h4>
                    <span className="text-sm text-gray-500">{serviceDetails.duration}</span>
                  </div>
                  <p className="text-gray-600 text-sm">{serviceDetails.description}</p>
                </div>
              </div>

              {/* Booking information */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Booked on:</span>
                    <p className="font-medium">{formatDate(appointment.createdAt)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Last updated:</span>
                    <p className="font-medium">{formatDate(appointment.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default AppointmentDetailPage;
