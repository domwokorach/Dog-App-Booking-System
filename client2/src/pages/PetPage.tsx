import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MagnifyingGlassIcon, ExclamationTriangleIcon, ArrowLeftIcon, HeartIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import { petService } from '../services/petService';
import { Button } from '../components/ui/button';
import LoadingSpinner from '../components/ui/loading-spinner';
import PageTransition from '../components/layout/PageTransition';
import PetForm from '../components/forms/PetForm';
import PetCard from '../components/pets/PetCard';
import type { Pet, CreatePetData } from '../types';
import { useNavigate } from 'react-router-dom';
import { usePetData, useFormModal, useDebounce } from '../hooks';

interface DeleteConfirmationDialogProps {
  pet: Pet;
  hasUpcomingAppointments: boolean;
  upcomingCount?: number;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

const DeleteConfirmationDialog = ({
  pet,
  hasUpcomingAppointments,
  upcomingCount = 0,
  onConfirm,
  onCancel,
  isDeleting
}: DeleteConfirmationDialogProps) => {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="fixed inset-0 bg-black bg-opacity-50"
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-lg shadow-xl p-6"
        >
          <div className="flex items-center mb-4">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              hasUpcomingAppointments ? 'bg-red-100' : 'bg-yellow-100'
            }`}>
              <ExclamationTriangleIcon className={`h-6 w-6 ${
                hasUpcomingAppointments ? 'text-red-600' : 'text-yellow-600'
              }`} />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">
                {hasUpcomingAppointments ? 'Cannot Delete Pet' : 'Delete Pet'}
              </h3>
            </div>
          </div>

          <div className="mb-6">
            {hasUpcomingAppointments ? (
              <div>
                <p className="text-gray-700 mb-3">
                  <span className="font-medium">{pet.name}</span> cannot be deleted because they have{' '}
                  <span className="font-medium text-red-600">
                    {upcomingCount} upcoming appointment{upcomingCount !== 1 ? 's' : ''}
                  </span>.
                </p>
                <p className="text-sm text-gray-600">
                  Please cancel or complete all upcoming appointments before deleting this pet.
                </p>
              </div>
            ) : (
              <div>
                <p className="text-gray-700 mb-3">
                  Are you sure you want to delete <span className="font-medium">{pet.name}</span>?
                </p>
                <p className="text-sm text-gray-600">
                  This will permanently remove all pet information and grooming history. This action cannot be undone.
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {hasUpcomingAppointments ? (
              <>
                <Button
                  variant="outline"
                  onClick={onCancel}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  onClick={() => window.open('/appointments', '_blank')}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  View Appointments
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={onCancel}
                  disabled={isDeleting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={onConfirm}
                  disabled={isDeleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  {isDeleting ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">Deleting...</span>
                    </>
                  ) : (
                    'Delete Pet'
                  )}
                </Button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const PetPage = () => {
  const { isAuthenticated, loading: authLoading } = useAuthStore();
  const navigate = useNavigate();
  
  // Custom hooks for data and state management
  const {
    pets,
    loading,
    error,
    addPet,
    updatePet,
    removePet,
    getUpcomingAppointments
  } = usePetData();
  
  const petFormModal = useFormModal<Pet>();
  
  // local state for search and delete operations
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [deletingPet, setDeletingPet] = useState<Pet | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // handle pet CRUD operations
  const handleAddPet = async (petData: CreatePetData) => {
    try {
      const newPet = await petService.createPet(petData);
      addPet(newPet);
      petFormModal.close();
    } catch (error) {
      console.error('Error adding pet:', error);
      alert('Failed to add pet. Please try again.');
    }
  };

  const handleEditPet = async (petData: CreatePetData) => {
    if (!petFormModal.editingItem) return;
    
    try {
      const updatedPet = await petService.updatePet(petFormModal.editingItem._id, petData);
      updatePet(updatedPet);
      petFormModal.close();
    } catch (error) {
      console.error('Error updating pet:', error);
      alert('Failed to update pet. Please try again.');
    }
  };

  const handleDeletePetClick = (pet: Pet) => {
    setDeletingPet(pet);
  };

  const handleConfirmDelete = async () => {
    if (!deletingPet) return;

    try {
      setIsDeleting(true);
      await petService.deletePet(deletingPet._id);
      removePet(deletingPet._id);
      setDeletingPet(null);
    } catch (error: unknown) {
      console.error('Error deleting pet:', error);
      let errorMessage = 'Failed to delete pet';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        const apiError = error as { response?: { data?: { error?: string } } };
        errorMessage = apiError.response?.data?.error || errorMessage;
      }
      
      alert(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeletingPet(null);
  };

  const handleViewPet = (pet: Pet) => {
    navigate(`/pets/${pet._id}`);
  };

  // check for upcoming appointments when deleting
  const checkUpcomingAppointments = (petId: string) => {
    const upcomingAppointments = getUpcomingAppointments(petId);
    return {
      hasUpcoming: upcomingAppointments.length > 0,
      count: upcomingAppointments.length
    };
  };

  // filter pets based on debounced search term
  const filteredPets = pets.filter(pet =>
    pet && pet.name && pet.breed && pet.species &&
    (pet.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
     pet.breed.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
     pet.species.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
  );

  // show loading spinner while checking authentication or loading data
  if (authLoading || (isAuthenticated && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // if not authenticated, don't render anything (will redirect)
  if (!isAuthenticated) {
    return null;
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
              <h1 className="text-3xl font-bold text-gray-900">My Pets</h1>
              <p className="mt-2 text-gray-600">
                Manage your furry family members
              </p>
            </div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                onClick={petFormModal.openForCreate}
                className="mt-4 sm:mt-0"
              >
                Add Pet
              </Button>
            </motion.div>
          </motion.div>

          {/* Search */}
          {pets.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-6"
            >
              <div className="relative max-w-md">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-500" />
                <input
                  type="text"
                  placeholder="Search pets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-blue-200 rounded-xl bg-gradient-to-r from-white to-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-md hover:shadow-lg transition-all duration-300"
                />
              </div>
            </motion.div>
          )}

          {/* Error display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
              {error}
            </div>
          )}

          {/* Pets grid */}
          {pets.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-white via-stone-50 to-amber-50 rounded-xl border-2 border-stone-200 shadow-lg hover:shadow-xl transition-all duration-300 text-center py-12"
            >
              <div className="flex justify-center mb-4">
                <HeartIcon className="h-16 w-16 text-amber-500" />
              </div>
              <h3 className="text-lg font-medium text-stone-900 mb-2">To book your first grooming appointment, you'll need to add your pet's information first.</h3>
              <p className="text-stone-600 mb-6">This helps our groomers provide the best care tailored to your furry friend's needs.</p>
              <Button onClick={petFormModal.openForCreate}>
                Let's get started!
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredPets.map((pet) => (
                pet && pet._id ? (
                  <PetCard
                    key={pet._id}
                    pet={pet}
                    onView={handleViewPet}
                    onEdit={petFormModal.openForEdit}
                    onDelete={handleDeletePetClick}
                  />
                ) : null
              ))}
            </motion.div>
          )}

          {/* No search results */}
          {pets.length > 0 && filteredPets.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <p className="text-gray-600">No pets match your search criteria.</p>
            </motion.div>
          )}
        </div>

        {/* Pet form modal */}
        <AnimatePresence>
          {petFormModal.isOpen && (
            <PetForm
              pet={petFormModal.editingItem}
              onSubmit={petFormModal.isEditing ? handleEditPet : handleAddPet}
              onCancel={petFormModal.close}
            />
          )}
        </AnimatePresence>

        {/* Delete confirmation modal */}
        <AnimatePresence>
          {deletingPet && (
            <DeleteConfirmationDialog
              pet={deletingPet}
              hasUpcomingAppointments={checkUpcomingAppointments(deletingPet._id).hasUpcoming}
              upcomingCount={checkUpcomingAppointments(deletingPet._id).count}
              onConfirm={handleConfirmDelete}
              onCancel={handleCancelDelete}
              isDeleting={isDeleting}
            />
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
};

export default PetPage;
