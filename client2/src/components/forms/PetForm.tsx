import { motion } from 'framer-motion';
import { Formik, Form, Field } from 'formik';
import type { FormikHelpers } from 'formik';
import * as Yup from 'yup';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '../ui/button';
import LoadingSpinner from '../ui/loading-spinner';
import type { Pet, CreatePetData } from '../../types';

interface PetFormProps {
  pet?: Pet;
  onSubmit: (data: CreatePetData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const PetSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .required('Pet name is required'),
  species: Yup.string()
    .oneOf(['dog', 'cat'], 'Please select either dog or cat')
    .required('Species is required'),
  breed: Yup.string()
    .min(2, 'Breed must be at least 2 characters')
    .max(50, 'Breed must be less than 50 characters')
    .required('Breed is required'),
  age: Yup.number()
    .min(0, 'Age cannot be negative')
    .max(30, 'Age seems too high')
    .required('Age is required'),
  notes: Yup.string()
    .max(500, 'Notes must be less than 500 characters')
});

const PetForm = ({ pet, onSubmit, onCancel, isLoading = false }: PetFormProps) => {
  const isEditing = !!pet;

  const initialValues: CreatePetData = {
    name: pet?.name || '',
    species: pet?.species || 'dog',
    breed: pet?.breed || '',
    age: pet?.age || 1,
    notes: pet?.notes || ''
  };

  const handleSubmit = async (
    values: CreatePetData,
    { setSubmitting, setStatus }: FormikHelpers<CreatePetData>
  ) => {
    try {
      setStatus(null);
      await onSubmit(values);
    } catch (error: unknown) {
      const apiError = error as { error?: string };
      setStatus(apiError.error || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const formVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3 }
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        variants={formVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Pet' : 'Add New Pet'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          <Formik
            initialValues={initialValues}
            validationSchema={PetSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({ errors, touched, isSubmitting, status }) => (
              <Form className="space-y-4">
                {status && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm"
                  >
                    {status}
                  </motion.div>
                )}

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Pet Name *
                  </label>
                  <Field
                    id="name"
                    name="name"
                    type="text"
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.name && touched.name 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300'
                    }`}
                    placeholder="Enter your pet's name"
                  />
                  {errors.name && touched.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="species" className="block text-sm font-medium text-gray-700 mb-1">
                    Species *
                  </label>
                  <Field
                    as="select"
                    id="species"
                    name="species"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="dog">Dog</option>
                    <option value="cat">Cat</option>
                  </Field>
                  {errors.species && touched.species && (
                    <p className="mt-1 text-sm text-red-600">{errors.species}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="breed" className="block text-sm font-medium text-gray-700 mb-1">
                    Breed *
                  </label>
                  <Field
                    id="breed"
                    name="breed"
                    type="text"
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.breed && touched.breed 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300'
                    }`}
                    placeholder="e.g., Golden Retriever, Persian Cat"
                  />
                  {errors.breed && touched.breed && (
                    <p className="mt-1 text-sm text-red-600">{errors.breed}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                    Age (years) *
                  </label>
                  <Field
                    id="age"
                    name="age"
                    type="number"
                    min="0"
                    max="30"
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                      errors.age && touched.age 
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                        : 'border-gray-300'
                    }`}
                    placeholder="Enter age in years"
                  />
                  {errors.age && touched.age && (
                    <p className="mt-1 text-sm text-red-600">{errors.age}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Special instructions for groomer (Optional)
                  </label>
                  <Field
                    as="textarea"
                    id="notes"
                    name="notes"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Any special notes about your pet such as behavior, allergies, preferences, etc. (No worries, you can change this when booking an appointment.)"
                  />
                  {errors.notes && touched.notes && (
                    <p className="mt-1 text-sm text-red-600">{errors.notes}</p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmitting || isLoading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || isLoading}
                    className="flex-1"
                  >
                    {(isSubmitting || isLoading) ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        {isEditing ? 'Updating...' : 'Adding...'}
                      </>
                    ) : (
                      isEditing ? 'Update Pet' : 'Add Pet'
                    )}
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PetForm;
