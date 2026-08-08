import { api } from '../config/api';
import type { Pet, CreatePetData, UpdatePetData, Appointment, ApiError } from '../types';

export const petService = {
  // get all pets for current user
  getUserPets: async (): Promise<Pet[]> => {
    try {
      const response = await api.get('/pets');
      return response.data;
    } catch (error) {
      console.error('Error fetching pets:', error);
      throw error;
    }
  },

  // get pet by ID
  getPetById: async (petId: string): Promise<Pet> => {
    try {
      const response = await api.get(`/pets/${petId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching pet by ID:', error);
      throw error;
    }
  },

  // create new pet
  createPet: async (petData: CreatePetData): Promise<Pet> => {
    try {
      const response = await api.post('/pets', petData);
      // Handle both possible response structures
      return response.data.pet || response.data;
    } catch (error) {
      console.error('Error creating pet:', error);
      throw error;
    }
  },

  // update pet - now properly handles response
  updatePet: async (petId: string, updateData: UpdatePetData): Promise<Pet> => {
    try {
      const response = await api.put(`/pets/${petId}`, updateData);
      
      // handle both possible response structures from backend
      const updatedPet = response.data.pet || response.data;
      
      // validate that we have the required fields
      if (!updatedPet._id || !updatedPet.name) {
        throw new Error('Invalid pet data received from server');
      }
      
      return updatedPet;
    } catch (error: unknown) {
      console.error('Error updating pet:', error);
      const apiError = error as { response?: { data?: ApiError } };
      throw apiError.response?.data || { error: "Failed to update pet" };
    }
  },

  // delete pet
  deletePet: async (petId: string): Promise<void> => {
    try {
      await api.delete(`/pets/${petId}`);
    } catch (error) {
      console.error('Error deleting pet:', error);
      throw error;
    }
  },

  // get appointments for a specific pet (grooming history)
  getPetAppointments: async (petId: string): Promise<Appointment[]> => {
    try {
      // use the dedicated pet appointments endpoint instead of filtering all appointments
      const response = await api.get<Appointment[]>(`/pets/${petId}/appointments`);
      return response.data;
    } catch (error) {
      console.error('Error fetching pet appointments:', error);
      throw error;
    }
  },

  getDeletedPets: async (): Promise<Pet[]> => {
    try {
      const response = await api.get('/pets/deleted');
      return response.data;
    } catch (error) {
      console.error('Error fetching deleted pets:', error);
      throw error;
    }
  },

  restorePet: async (petId: string): Promise<Pet> => {
    try {
      const response = await api.put(`/pets/${petId}/restore`);
      return response.data.pet || response.data;
    } catch (error: unknown) {
      console.error('Error restoring pet:', error);
      const apiError = error as { response?: { data?: ApiError } };
      throw apiError.response?.data || { error: 'Failed to restore pet' };
    }
  },
};
