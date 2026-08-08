import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeftIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  CheckIcon,
  XMarkIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { petService } from '../services/petService';
import { Button } from '../components/ui/button';
import LoadingSpinner from '../components/ui/loading-spinner';
import PageTransition from '../components/layout/PageTransition';
import AppointmentBookingModal from '../components/appointments/AppointmentBookingModal';
import { useAuthStore } from '../store/authStore';
import type { Pet, Appointment, User } from '../types';

const PetDetailPage = () => {
  const { petId } = useParams<{ petId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [pet, setPet] = useState<Pet | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const loadPetData = useCallback(async () => {
    if (!petId) return;

    try {
      setLoading(true);
      setAppointmentsLoading(true);

      // New dedicated endpoint for better performance
      const [petData, petAppointmentsData] = await Promise.all([
        petService.getPetById(petId),
        petService.getPetAppointments(petId) // use dedicated pet appointments endpoint
      ]);

      setPet(petData);
      setEditedNotes(petData.notes || '');
      
      // sort appointments by date (newest first) - with proper typing
      const sortedAppointments = petAppointmentsData.sort((a: Appointment, b: Appointment) => 
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );

      setAppointments(sortedAppointments);
      
    } catch (error) {
      console.error('Error loading pet data:', error);
      // navigate back if pet not found
      navigate('/pets');
    } finally {
      setLoading(false);
      setAppointmentsLoading(false);
    }
  }, [petId, navigate]);

  useEffect(() => {
    if (petId) {
      loadPetData();
    }
  }, [petId, loadPetData]);

  const handleEditNotes = () => {
    setIsEditingNotes(true);
    setEditedNotes(pet?.notes || '');
  };

  const handleSaveNotes = async () => {
    if (!pet || !petId) return;

    try {
      setSaveLoading(true);
      
      // update pet with new notes
      const updatedPet = await petService.updatePet(pet._id, { notes: editedNotes.trim() });
      
      // ensure we have valid pet data before updating state
      if (updatedPet && updatedPet._id) {
        setPet(updatedPet);
        setIsEditingNotes(false);
      } else {
        throw new Error('Invalid pet data received from server');
      }
      
    } catch (error) {
      console.error('Error updating pet notes:', error);
      
      // more specific error handling
      let errorMessage = 'Failed to update notes. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        // create a proper type for the error response
        const apiError = error as { response?: { data?: { error?: string } } };
        errorMessage = apiError.response?.data?.error || errorMessage;
      }
      
      alert(errorMessage);
      
      // reset the edited notes to original val on err
      setEditedNotes(pet?.notes || '');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingNotes(false);
    setEditedNotes(pet?.notes || '');
  };

  const handleBookingSuccess = () => {
    setShowBookingModal(false);
    loadPetData(); // rf appts
  };

  const getSpeciesEmoji = (species: string) => {
    return species === 'dog' ? '🐶' : '😸';
  };

  const formatAge = (age: number | undefined) => {
    if (age === undefined || age === null || isNaN(age)) {
      return 'Age unknown';
    }
    return age === 1 ? '1 year old' : `${age} years old`;
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Date unknown';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // use same visual status based on time (same logic as DashboardPage)
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

  const getStatusIcon = (appointment: Appointment) => {
    const visualStatus = getVisualStatus(appointment);
    
    switch (visualStatus) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'confirmed':
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case 'in_progress':
        return <ClockIcon className="h-5 w-5 text-amber-500" />;
      default:
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusText = (appointment: Appointment) => {
    const visualStatus = getVisualStatus(appointment);
    
    switch (visualStatus) {
      case 'completed':
        return 'Completed';
      case 'confirmed':
        return 'Upcoming';
      case 'in_progress':
        return 'In Progress';
      default:
        return 'Cancelled';
    }
  };

  const getServiceTypeLabel = (serviceType: string) => {
    return serviceType === 'basic' ? 'Basic Grooming' : 'Full Grooming';
  };

  const getDuration = (serviceType: string) => {
    return serviceType === 'basic' ? '1 hour' : '2 hours';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Pet not found</p>
          <Button onClick={() => navigate('/pets')}>
            Back to Pets
          </Button>
        </div>
      </div>
    );
  }

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
              onClick={() => navigate('/pets')} 
              variant="outline"
              size="sm"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Pets
            </Button>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <span className="text-4xl mr-4">{getSpeciesEmoji(pet.species)}</span>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      {pet.name || 'Unknown Pet'}
                    </h1>
                    <p className="text-lg text-gray-600 capitalize">
                      {pet.breed || 'Unknown Breed'} • {formatAge(pet.age)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Added {formatDate(pet.createdAt)}
                    </p>
                  </div>
                </div>
                
                {!isEditingNotes && (
                  <Button variant="outline" size="sm" onClick={handleEditNotes}>
                    Edit Notes
                  </Button>
                )}
              </div>

              {/* Notes/special instructions section */}
              <div className="mt-6 p-4 bg-gray-50 rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-900">
                    Special instructions for groomer
                  </h3> 
                  {isEditingNotes && (
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        onClick={handleSaveNotes}
                        disabled={saveLoading}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {saveLoading ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <>
                            <CheckIcon className="h-4 w-4 mr-1" />
                            Save
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={saveLoading}
                      >
                        <XMarkIcon className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
                
                {isEditingNotes ? (
                  <div>
                    <textarea
                      value={editedNotes}
                      onChange={(e) => setEditedNotes(e.target.value)}
                      placeholder="Add special instructions for the groomer (e.g., sensitive areas, behavioral notes, specific styling preferences...)"
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      rows={4}
                      maxLength={500}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-gray-500">
                        These instructions will be visible to the groomer when booking appointments.
                      </p>
                      <span className="text-xs text-gray-400">
                        {editedNotes.length}/500
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    {pet.notes ? (
                      <p className="text-gray-700">{pet.notes}</p>
                    ) : (
                      <p className="text-gray-500 italic">
                        No special instructions provided. Click "Edit Notes" to add grooming instructions.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Grooming history - filtered for the specific pet */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-md"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Grooming History for {pet?.name}
                </h2>
                <Button onClick={() => setShowBookingModal(true)} size="sm">
                  Book Appointment
                </Button>
              </div>
            </div>

            <div className="p-6">
              {appointmentsLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="md" />
                </div>
              ) : appointments.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No grooming history yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Book {pet?.name}'s first grooming appointment to get started!
                  </p>
                  <Button onClick={() => setShowBookingModal(true)}>
                    Book First Appointment
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Show appointment count */}
                  <div className="text-sm text-gray-600 mb-4">
                    {appointments.length} appointment{appointments.length !== 1 ? 's' : ''} found for {pet?.name}
                  </div>
                  
                  {appointments.map((appointment, index) => (
                    <motion.div
                      key={appointment._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          {getStatusIcon(appointment)}
                          <span className="ml-2 font-medium text-gray-900">
                            {getServiceTypeLabel(appointment.serviceType)}
                          </span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          getVisualStatus(appointment) === 'completed' 
                            ? 'bg-green-100 text-green-600'
                            : getVisualStatus(appointment) === 'confirmed'
                            ? 'bg-blue-100 text-blue-600'
                            : getVisualStatus(appointment) === 'in_progress'
                            ? 'bg-amber-100 text-amber-600'
                            : 'bg-red-100 text-red-600'
                        }`}>
                          {getStatusText(appointment)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Date:</span> {formatDate(appointment.startTime)}
                        </div>
                        <div>
                          <span className="font-medium">Time:</span> {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                        </div>
                        <div>
                          <span className="font-medium">Duration:</span> {getDuration(appointment.serviceType)}
                        </div>
                      </div>

                      {/* Show groomer info if available - Fixed typing */}
                      {appointment.groomerId && typeof appointment.groomerId === 'object' && 'name' in appointment.groomerId && (
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Groomer:</span> {(appointment.groomerId as User).name}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Booking modal with pre-selected pet */}
      {showBookingModal && user?.role === 'owner' && pet && (
        <AppointmentBookingModal
          pets={[pet]}
          selectedPetId={pet._id} // pre-select the current pet
          onClose={() => setShowBookingModal(false)}
          onSuccess={handleBookingSuccess}
        />
      )}
    </PageTransition>
  );
};

export default PetDetailPage;
