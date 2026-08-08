import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  EyeIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import LoadingSpinner from '../components/ui/loading-spinner';
import PageTransition from '../components/layout/PageTransition';
import AppointmentBookingModal from '../components/appointments/AppointmentBookingModal';
import type { Appointment, Pet } from '../types';
import { useAppointmentData, usePetData, useModal } from '../hooks';
import appointmentService from '../services/appointmentService';
import { toast } from "sonner";

const AppointmentPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  // Custom hooks for data management
  const {
    appointments,
    loading: appointmentsLoading,
    addAppointment,
    updateAppointment,
    removeAppointment
  } = useAppointmentData();
  
  const {
    pets,
    loading: petsLoading
  } = usePetData(user?.role === 'owner');
  
  const bookingModal = useModal();
  
  const [selectedPetFilter, setSelectedPetFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('upcoming');
  const [bookingType, setBookingType] = useState<'general' | 'specific' | 'reschedule'>('general');
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancellingAppointment, setCancellingAppointment] = useState<Appointment | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const loading = appointmentsLoading || petsLoading;

  // get the selected pet object
  const selectedPet = selectedPetFilter !== 'all' 
    ? pets.find(pet => pet._id === selectedPetFilter) 
    : null;

  // filter all appointments by pet first
  const filteredAppointments = appointments.filter(appointment => {
    if (selectedPetFilter === 'all') return true;
    const petId = typeof appointment.petId === 'object' && appointment.petId !== null
      ? appointment.petId._id 
      : appointment.petId;
    return petId === selectedPetFilter;
  });

  // then separate into upcoming and past
  const now = new Date();
  const upcomingAppointments = filteredAppointments.filter(appointment => {
    const appointmentDate = new Date(appointment.startTime);
    return appointmentDate >= now && appointment.status === 'confirmed';
  }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const pastAppointments = filteredAppointments.filter(appointment => {
    const appointmentDate = new Date(appointment.startTime);
    return appointmentDate < now || appointment.status === 'completed';
  }).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  const handleGeneralBooking = () => {
    setBookingType('general');
    setEditingAppointment(null);
    bookingModal.open();
  };

  const handleSpecificPetBooking = () => {
    setBookingType('specific');
    setEditingAppointment(null);
    bookingModal.open();
  };

  const handleReschedule = (appointment: Appointment) => {
    setBookingType('reschedule');
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
      removeAppointment(cancellingAppointment._id);
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
        duration: 8000 // for errors
      });
    } finally {
      setCancelLoading(false);
    }
  };

  const handleCancelDialogClose = () => {
    setShowCancelDialog(false);
    setCancellingAppointment(null);
  };

  const handleBookingSuccess = (appointment: Appointment) => {
    bookingModal.close();
    if (bookingType === 'reschedule' && editingAppointment) {
      updateAppointment(appointment);
    } else {
      addAppointment(appointment);
    }
    setEditingAppointment(null);
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

  const getPetName = (petId: string | Pet) => {
    // handle object case with null check
    if (typeof petId === 'object' && petId !== null) {
      return petId.name || 'Unknown Pet';
    }
    
    // handle string case
    if (typeof petId === 'string') {
    const pet = pets.find(p => p._id === petId);
    return pet?.name || 'Unknown Pet';
    }
    
    // add fallback for any other case
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

  // same visual states based on time
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
    
    return appointment.status; // use actual status as fallback
  };

  const getStatusBadge = (appointment: Appointment) => {
    const visualStatus = getVisualStatus(appointment);
    
    switch (visualStatus) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-600 hover:bg-green-100">Completed</Badge>;
      case 'confirmed':
        return <Badge className="bg-blue-100 text-blue-600 hover:bg-blue-100">Upcoming</Badge>;
      case 'in_progress':
        return <Badge className="bg-amber-100 text-amber-600 hover:bg-amber-100">In Progress</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-600 hover:bg-red-100">Cancelled</Badge>;
      case 'no_show':
        return <Badge className="bg-red-100 text-red-600 hover:bg-red-100">No Show</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getDuration = (serviceType: string) => {
    return serviceType === 'basic' ? '60 min' : '120 min';
  };

  const handlePetFilterChange = (value: string) => {
    setSelectedPetFilter(value);
  };

  const getDaysSinceLastAppointment = (petId: string) => {
    const petAppointments = appointments.filter(appointment => {
      const appointmentPetId = typeof appointment.petId === 'object' && appointment.petId !== null
        ? appointment.petId._id 
        : appointment.petId;
      return appointmentPetId === petId && appointment.status === 'completed';
    });

    if (petAppointments.length === 0) return null;

    // get the most recent completed appointment
    const mostRecentAppointment = petAppointments.sort((a, b) => 
      new Date(b.endTime).getTime() - new Date(a.endTime).getTime()
    )[0];

    const lastAppointmentDate = new Date(mostRecentAppointment.endTime);
    const today = new Date();
    const diffTime = today.getTime() - lastAppointmentDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  const getEmptyStateDescription = (selectedPet: Pet | null | undefined, isUpcoming: boolean) => {
    if (!selectedPet) {
      return user?.role === 'groomer' 
        ? isUpcoming 
          ? "You don't have any upcoming appointments scheduled."
          : "You haven't completed any appointments yet."
        : isUpcoming
          ? "You don't have any upcoming grooming appointments. Book one for your pet!"
          : "You haven't had any grooming appointments yet.";
    }

    if (isUpcoming) {
      const daysSinceLastAppointment = getDaysSinceLastAppointment(selectedPet._id);
      if (daysSinceLastAppointment !== null) {
        return (
          <>
            {selectedPet.name} doesn't have any upcoming grooming appointments. It's been{' '}
            <span className="underline font-semibold text-rose-500">{daysSinceLastAppointment} days</span>{' '}
            since their last grooming session.
          </>
        );
      }
      return `${selectedPet.name} doesn't have any upcoming grooming appointments.`;
    } else {
      return `${selectedPet.name} hasn't had any grooming appointments yet.`;
    }
  };

  const AppointmentTableRow = ({ appointment }: { appointment: Appointment }) => {
    const now = new Date();
    const appointmentTime = new Date(appointment.startTime);
    const isUpcoming = appointmentTime > now;
    
    // check if it's less than 24 hours before appointment
    const hoursDifference = (appointmentTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const canModify = hoursDifference > 24;
    
    const handleViewDetails = () => {
      navigate(`/appointments/${appointment._id}`);
    };
    
    return (
      <>
    <TableRow className="hover:bg-gray-50">
      <TableCell className="font-mono text-sm">
        #{appointment._id.slice(-8).toUpperCase()}
      </TableCell>
      <TableCell className="font-medium">
        {getPetName(appointment.petId)}
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium">
            {appointment.serviceType === 'basic' ? 'Basic' : 'Full'} Grooming
          </span>
          <span className="text-sm text-gray-500">
            {getDuration(appointment.serviceType)}
          </span>
        </div>
      </TableCell>
      <TableCell>{getGroomerName(appointment.groomerId)}</TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span>{formatDate(appointment.startTime)}</span>
          <span className="text-sm text-gray-500">
            {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
          </span>
        </div>
      </TableCell>
      <TableCell>
        {getStatusBadge(appointment)}
      </TableCell>
      {user?.role === 'owner' && (
        <TableCell>
              <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline" onClick={handleViewDetails}>
              <EyeIcon className="h-4 w-4" />
              View
            </Button>
                  {appointment.status === 'confirmed' && isUpcoming && (
                    <>
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
              </>
                  )}
                </div>
                {appointment.status === 'confirmed' && isUpcoming && !canModify && (
                  <p className="text-xs text-amber-600 max-w-xs">
                    *Unable to reschedule/cancel as it is less than 24 hours before appointment time. Please call/whatsapp us if urgent*
                  </p>
            )}
          </div>
        </TableCell>
      )}
    </TableRow>
      </>
    );
  };

  const EmptyState = ({ 
    message, 
    description, 
    selectedPetName 
  }: { message: string; description: string | React.ReactNode; selectedPetName?: string }) => (
    <div className="text-center py-12">
      <CalendarIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">{message}</h3>
      <p className="text-gray-600 mb-6">{description}</p>
      {user?.role === 'owner' && (
        <Button onClick={handleSpecificPetBooking}>
          {selectedPetName ? `Book for ${selectedPetName} now!` : 'Book New Appointment'}
        </Button>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back button */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <Button 
              onClick={() => navigate('/dashboard')} 
              variant="outline"
              size="sm"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8"
          >
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {user?.role === 'groomer' ? 'Client Appointments' : 'My Appointments'}
              </h1>
              <p className="mt-2 text-gray-600">
                {user?.role === 'groomer' 
                  ? 'Manage your grooming schedule and client appointments'
                  : 'View and manage your pet grooming appointments'
                }
              </p>
            </div>
            {user?.role === 'owner' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Button onClick={handleGeneralBooking} className="mt-4 sm:mt-0">
                Book Appointment
            </Button>
              </motion.div>
            )}
          </motion.div>

            {/* Filters */}
          {user?.role === 'owner' && pets.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-6"
            >
              <div className="bg-gradient-to-r from-white to-gray-50 rounded-xl border-2 border-gray-200 shadow-md p-4">
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-bold text-gray-700">Filter by pet:</label>
                    <Select value={selectedPetFilter} onValueChange={handlePetFilterChange}>
                    <SelectTrigger className="w-48 border-2 border-blue-200 bg-white/80 backdrop-blur-sm">
                        <SelectValue placeholder="Select a pet" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Pets</SelectItem>
                        {pets.map((pet) => (
                          <SelectItem key={pet._id} value={pet._id}>
                          {pet.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
            </motion.div>
            )}

            {/* Appointments tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-white via-stone-50 to-amber-50 rounded-xl border-2 border-stone-200 shadow-lg hover:shadow-xl transition-all duration-300"
          >
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b border-stone-200 px-6 pt-6 bg-gradient-to-r from-stone-50 to-amber-50 rounded-t-xl">
                  <TabsList className="grid w-full grid-cols-2 bg-white/80 backdrop-blur-sm border-2 border-stone-200">
                  <TabsTrigger value="upcoming" className="flex items-center font-semibold">
                    Upcoming ({upcomingAppointments.length})
                    </TabsTrigger>
                  <TabsTrigger value="past" className="flex items-center font-semibold">
                    Past ({pastAppointments.length})
                    </TabsTrigger>
                  </TabsList>
              </div>

              <TabsContent value="upcoming" className="p-6">
                    {upcomingAppointments.length === 0 ? (
                      <EmptyState
                        message="No upcoming appointments"
                        description={getEmptyStateDescription(selectedPet, true)}
                        selectedPetName={selectedPet?.name}
                      />
                    ) : (
                  <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Booking ID</TableHead>
                            <TableHead>Pet</TableHead>
                            <TableHead>Service</TableHead>
                            <TableHead>Groomer</TableHead>
                            <TableHead>Date & Time</TableHead>
                            <TableHead>Status</TableHead>
                            {user?.role === 'owner' && <TableHead>Actions</TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {upcomingAppointments.map((appointment) => (
                            <AppointmentTableRow key={appointment._id} appointment={appointment} />
                          ))}
                        </TableBody>
                      </Table>
                  </div>
                    )}
                  </TabsContent>

              <TabsContent value="past" className="p-6">
                    {pastAppointments.length === 0 ? (
                      <EmptyState
                        message="No past appointments"
                        description={getEmptyStateDescription(selectedPet, false)}
                        selectedPetName={selectedPet?.name}
                      />
                    ) : (
                  <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Booking ID</TableHead>
                            <TableHead>Pet</TableHead>
                            <TableHead>Service</TableHead>
                            <TableHead>Groomer</TableHead>
                            <TableHead>Date & Time</TableHead>
                            <TableHead>Status</TableHead>
                            {user?.role === 'owner' && <TableHead>Actions</TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pastAppointments.map((appointment) => (
                            <AppointmentTableRow key={appointment._id} appointment={appointment} />
                          ))}
                        </TableBody>
                      </Table>
                  </div>
                    )}
                  </TabsContent>
                </Tabs>
            </motion.div>
            </div>
          </div>

      {/* Booking modal */}
      {bookingModal.isOpen && user?.role === 'owner' && (
        <AppointmentBookingModal
          pets={pets}
          selectedPetId={bookingType === 'specific' && selectedPetFilter !== 'all' ? selectedPetFilter : undefined}
          editingAppointment={editingAppointment}
          onClose={() => {
            bookingModal.close();
            setEditingAppointment(null);
          }}
          onSuccess={handleBookingSuccess}
        />
      )}

      {/* Cancel confirmation dialog */}
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

export default AppointmentPage;
