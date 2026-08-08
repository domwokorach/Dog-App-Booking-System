import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { toast } from 'sonner';
import appointmentService from '../../services/appointmentService';
import { useAuthStore } from '../../store/authStore';
import type { Appointment, Pet, User } from '../../types';

// extended interfaces for additional properties that may exist
interface ExtendedUser extends User {
  phone?: string;
}

interface ExtendedPet extends Pet {
  weight?: number;
}

interface AppointmentDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment;
  onStatusChange?: (updated: Appointment) => void;
}

const AppointmentDetailsDialog = ({
  isOpen,
  onClose,
  appointment,
  onStatusChange
}: AppointmentDetailsDialogProps) => {
  const { user } = useAuthStore();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [currentAppointment, setCurrentAppointment] = useState<Appointment>(appointment);

  // treat as groomer if role says groomer OR if logged-in user is the assigned groomer
  const groomerId = typeof currentAppointment.groomerId === 'object'
    ? currentAppointment.groomerId._id
    : currentAppointment.groomerId;
  const isGroomer = user?.role === 'groomer' || (!!user && groomerId === user._id);

  const handleWorkflowAction = async (action: 'acknowledge' | 'start' | 'complete') => {
    setActionLoading(action);
    try {
      let updated: Appointment;
      if (action === 'acknowledge') {
        updated = await appointmentService.acknowledgeAppointment(currentAppointment._id);
        toast.success('Appointment acknowledged');
      } else if (action === 'start') {
        updated = await appointmentService.startService(currentAppointment._id);
        toast.success('Service started');
      } else {
        updated = await appointmentService.completeService(currentAppointment._id);
        toast.success('Service completed');
      }
      setCurrentAppointment(updated);
      onStatusChange?.(updated);
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'error' in err ? (err as { error: string }).error : 'Action failed';
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  };
  // safely extract pet and owner data - now correctly handles both string and object cases
  const pet = typeof currentAppointment.petId === 'object' && currentAppointment.petId !== null 
    ? currentAppointment.petId as ExtendedPet 
    : null;
  const owner = typeof currentAppointment.ownerId === 'object' && currentAppointment.ownerId !== null 
    ? currentAppointment.ownerId as ExtendedUser 
    : null;

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    };
  };

  const getDuration = (serviceType: string) => {
    return serviceType === 'basic' ? '60 minutes' : '120 minutes';
  };



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const { date, time } = formatDateTime(currentAppointment.startTime);
  const endTime = formatDateTime(currentAppointment.endTime).time;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Grooming Appointment - {pet?.name || 'Pet Details Loading...'}
                </h3>
                <p className="text-sm text-gray-600">
                  Booking #{appointment._id.slice(-8).toUpperCase()}
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(currentAppointment.status)}`}>
                  {currentAppointment.status.replace('_', ' ').charAt(0).toUpperCase() + currentAppointment.status.replace('_', ' ').slice(1)}
                </span>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Appointment details */}
              <Card>
                <CardHeader>
                  <CardTitle>Appointment Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-500">Date</p>
                      <p className="text-gray-900">{date}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-500">Time</p>
                      <p className="text-gray-900">{time} - {endTime}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-500">Service</p>
                      <p className="text-gray-900 capitalize">{currentAppointment.serviceType} Grooming</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-500">Duration</p>
                      <p className="text-gray-900">{getDuration(currentAppointment.serviceType)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pet information */}
              <Card>
                <CardHeader>
                  <CardTitle>Pet Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Pet image placeholder */}
                    <div className="flex-shrink-0">
                      <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                        <div className="text-center text-gray-500">
                          <div className="text-2xl mb-1">Insert Photo Here</div>
                          <div className="text-xs">No Photo</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Pet details */}
                    <div className="flex-1 space-y-4">
                      {pet ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="font-medium text-gray-500">Name</p>
                            <p className="text-gray-900 capitalize">{pet.name || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-500">Species</p>
                            <p className="text-gray-900 capitalize">{pet.species || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-500">Breed</p>
                            <p className="text-gray-900 capitalize">{pet.breed || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-500">Age</p>
                            <p className="text-gray-900">{pet.age ? `${pet.age} years` : 'N/A'}</p>
                          </div>
                          
                          {/* Special instructions - spans full width */}
                          {pet.notes && (
                            <div className="col-span-2 md:col-span-4">
                              <p className="font-medium text-gray-500 mb-2">Special Instructions</p>
                              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <p className="text-gray-900 whitespace-pre-wrap text-sm">{pet.notes}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 bg-gray-50 rounded-lg text-center">
                          <p className="text-gray-600">Pet details are not fully loaded.</p>
                          <p className="text-sm text-gray-500 mt-1">
                            Pet ID: {typeof appointment.petId === 'string' ? appointment.petId : 'Unknown'}
                          </p>
                        </div>
                      )}

                      {pet?.weight && (
                        <div>
                          <p className="font-medium text-gray-500">Weight</p>
                          <p className="text-gray-900">{pet.weight} lbs</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Owner contact */}
              <Card>
                <CardHeader>
                  <CardTitle>Owner Contact</CardTitle>
                </CardHeader>
                <CardContent>
                  {owner ? (
                    <div className="space-y-3">
                      <div>
                        <p className="font-medium text-gray-900 text-lg">{owner.name || 'Owner Name'}</p>
                        <p className="text-sm text-gray-600">Pet Owner</p>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-4">
                        {owner.email && (
                          <div className="flex items-center gap-2">
                            <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                            <a href={`mailto:${owner.email}`} className="text-sm text-blue-600 hover:text-blue-800">
                              {owner.email}
                            </a>
                          </div>
                        )}
                        
                        {owner.phone && (
                          <div className="flex items-center gap-2">
                            <PhoneIcon className="h-4 w-4 text-gray-400" />
                            <a href={`tel:${owner.phone}`} className="text-sm text-blue-600 hover:text-blue-800">
                              {owner.phone}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <p className="text-gray-600">Owner details are not fully loaded.</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Owner ID: {typeof appointment.ownerId === 'string' ? appointment.ownerId : 'Unknown'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Footer */}
            <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
              <div className="flex gap-3">
                {/* Groomer workflow actions */}
                {isGroomer && (
                  <>
                    {!currentAppointment.groomerAcknowledged && currentAppointment.status === 'confirmed' && (
                      <Button
                        variant="outline"
                        onClick={() => handleWorkflowAction('acknowledge')}
                        disabled={actionLoading !== null}
                      >
                        {actionLoading === 'acknowledge' ? 'Acknowledging...' : 'Acknowledge'}
                      </Button>
                    )}
                    {currentAppointment.groomerAcknowledged && currentAppointment.status === 'confirmed' && (
                      <Button
                        onClick={() => handleWorkflowAction('start')}
                        disabled={actionLoading !== null}
                        className="bg-amber-500 hover:bg-amber-600"
                      >
                        {actionLoading === 'start' ? 'Starting...' : 'Start Service'}
                      </Button>
                    )}
                    {currentAppointment.status === 'in_progress' && (
                      <Button
                        onClick={() => handleWorkflowAction('complete')}
                        disabled={actionLoading !== null}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {actionLoading === 'complete' ? 'Completing...' : 'Complete Service'}
                      </Button>
                    )}
                  </>
                )}
              </div>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default AppointmentDetailsDialog;
