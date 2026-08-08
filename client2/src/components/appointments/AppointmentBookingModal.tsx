import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  XMarkIcon,
  CalendarDaysIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui/button';
import { DatePicker } from '../ui/date-picker';
import LoadingSpinner from '../ui/loading-spinner';
import appointmentService from '../../services/appointmentService';
import groomerService from '../../services/groomerService';
import { petService } from '../../services/petService';
import type { Pet, User, Appointment } from '../../types';
import { toast } from "sonner"

interface AppointmentBookingModalProps {
  pets: Pet[];
  selectedPetId?: string;
  editingAppointment?: Appointment | null;
  onClose: () => void;
  onSuccess: (appointment: Appointment) => void;
}

interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
}

type BookingStep = 'selection' | 'summary' | 'confirmation';

const AppointmentBookingModal = ({
  pets,
  selectedPetId,
  editingAppointment,
  onClose,
  onSuccess
}: AppointmentBookingModalProps) => {
  const [groomers, setGroomers] = useState<User[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [currentStep, setCurrentStep] = useState<BookingStep>('selection');
  const [editingInstructions, setEditingInstructions] = useState(false);
  const [editedInstructions, setEditedInstructions] = useState('');
  const [saveInstructionsLoading, setSaveInstructionsLoading] = useState(false);

  const isEditing = !!editingAppointment;

  const validationSchema = Yup.object({
    petId: Yup.string().required('Please select a pet'),
    groomerId: Yup.string().required('Please select a groomer'),
    serviceType: Yup.string().oneOf(['basic', 'full']).required('Please select a service type'),
    selectedDate: Yup.string().required('Please select a date'),
    selectedTimeSlot: Yup.string().required('Please select a time slot'),
    specialInstructions: Yup.string().max(500, 'Special instructions cannot exceed 500 characters')
  });

  const formik = useFormik({
    initialValues: {
      petId: editingAppointment ? 
        (typeof editingAppointment.petId === 'string' ? editingAppointment.petId : editingAppointment.petId._id) :
        selectedPetId || (pets.length === 1 ? pets[0]._id : ''),
      groomerId: editingAppointment ? 
        (typeof editingAppointment.groomerId === 'string' ? editingAppointment.groomerId : editingAppointment.groomerId._id) :
        '',
      serviceType: editingAppointment?.serviceType || '',
      selectedDate: editingAppointment ? 
        new Date(editingAppointment.startTime).toISOString().split('T')[0] : 
        '',
      selectedTimeSlot: editingAppointment?.startTime || '',
      specialInstructions: editingAppointment && typeof editingAppointment.petId === 'object' && editingAppointment.petId !== null ? 
        editingAppointment.petId.notes || '' : 
        ''
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        
        const appointmentData = {
          petId: values.petId,
          groomerId: values.groomerId,
          serviceType: values.serviceType as 'basic' | 'full',
          startTime: values.selectedTimeSlot
        };

        // update pet notes if special instructions provided
        const currentPet = pets.find(pet => pet._id === values.petId);
        if (currentPet && values.specialInstructions !== currentPet.notes) {
          try {
            await petService.updatePet(values.petId, {
              notes: values.specialInstructions.trim()
            });
          } catch (error) {
            console.error('Error updating pet notes:', error);
          }
        }

        let updatedAppointment: Appointment;
        
        if (isEditing && editingAppointment) {
          updatedAppointment = await appointmentService.updateAppointment(editingAppointment._id, appointmentData);
        } else {
          updatedAppointment = await appointmentService.createAppointment(appointmentData);
        }
        
        setCurrentStep('confirmation');
        
        // show success toast with email notification
        toast.success(
          isEditing ? "Appointment Rescheduled!" : "Booking Confirmed!", 
          {
            description: `A confirmation email with your ${isEditing ? 'updated ' : ''}booking reference has been sent to your email address.`,
            duration: 10000, // 10s
            action: {
              label: "Got it",
              onClick: () => {},
            }
          }
        );
        
        // show success for 2 seconds then close
        setTimeout(() => {
          onSuccess(updatedAppointment);
        }, 2000);
      } catch (error: unknown) {
        console.error(`Error ${isEditing ? 'updating' : 'booking'} appointment:`, error);
        const errorMessage = error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : error instanceof Error 
          ? error.message 
          : `Failed to ${isEditing ? 'update' : 'book'} appointment`;
        
        // show error toast
        toast.error(
          `${isEditing ? 'Rescheduling' : 'Booking'} Failed`, 
          {
            description: errorMessage || `Failed to ${isEditing ? 'update' : 'book'} appointment`,
            duration: 8000 // for errors
          }
        );
        
        setCurrentStep('summary');
      } finally {
        setLoading(false);
      }
    }
  });

  // load groomers on component mount
  useEffect(() => {
    const loadGroomers = async () => {
      try {
        const groomersData = await groomerService.getAllGroomers();
        setGroomers(groomersData);
      } catch (error) {
        console.error('Error loading groomers:', error);
      }
    };
    
    loadGroomers();
  }, []);

  // load available time slots when groomer, date, and service type are selected
  useEffect(() => {
    const loadTimeSlots = async () => {
      if (formik.values.groomerId && formik.values.selectedDate && formik.values.serviceType) {
        try {
          setLoadingSlots(true);
          const duration = formik.values.serviceType === 'basic' ? 60 : 120;
          
          const slots = await groomerService.getGroomerAvailability(
            formik.values.groomerId,
            formik.values.selectedDate,
            duration
          );
          setAvailableSlots(slots);
        } catch (error) {
          console.error('Error loading time slots:', error);
          setAvailableSlots([]);
        } finally {
          setLoadingSlots(false);
        }
      } else {
        setAvailableSlots([]);
      }
    };

    loadTimeSlots();
  }, [formik.values.groomerId, formik.values.selectedDate, formik.values.serviceType]);

  // update special instructions
  useEffect(() => {
    if (formik.values.petId && !isEditing) {
      const selectedPet = pets.find(pet => pet._id === formik.values.petId);
      if (selectedPet && selectedPet.notes !== formik.values.specialInstructions) {
        formik.setFieldValue('specialInstructions', selectedPet.notes || '');
      }
    }
  }, [formik.values.petId, pets, isEditing]);

  // helper functions
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    return maxDate.toISOString().split('T')[0];
  };

  const formatTimeSlot = (slot: TimeSlot) => {
    const startTime = slot.start.toLocaleTimeString('en-SG', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Singapore'
    });
    const endTime = slot.end.toLocaleTimeString('en-SG', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Singapore'
    });
    return `${startTime} - ${endTime}`;
  };

  const formatSelectedTimeSlot = () => {
    if (!formik.values.selectedTimeSlot) return '';
    
    const selectedSlot = availableSlots.find(slot => 
      slot.start.toISOString() === formik.values.selectedTimeSlot
    );
    
    if (selectedSlot) {
      return formatTimeSlot(selectedSlot);
    }
    
    // fallback if slot not found
    const date = new Date(formik.values.selectedTimeSlot);
    return date.toLocaleTimeString('en-SG', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Singapore'
    });
  };

  const getSelectedPet = () => pets.find(pet => pet._id === formik.values.petId);
  const getSelectedGroomer = () => groomers.find(groomer => groomer._id === formik.values.groomerId);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getServiceDetails = (serviceType: string) => {
    const services = {
      basic: {
        name: 'Basic Grooming',
        duration: '60 minutes',
        description: 'Bathing, drying, brushing, nail clipping, ear cleaning, anal glands express'
      },
      full: {
        name: 'Full Grooming',
        duration: '120 minutes',
        description: 'Overall clipping & styling + all basic grooming services'
      }
    };
    return services[serviceType as keyof typeof services];
  };

  const handleProceedToSummary = async () => {
    const errors = await formik.validateForm();
    await formik.setTouched({
      petId: true,
      groomerId: true,
      serviceType: true,
      selectedDate: true,
      selectedTimeSlot: true,
    });
    if (Object.keys(errors).length === 0) {
      setCurrentStep('summary');
    }
  };

  const handleBackToSelection = () => {
    setCurrentStep('selection');
  };

  const serviceTypes = [
    {
      type: 'basic',
      name: 'Basic Grooming',
      duration: '60 minutes',
      description: 'Bathing, drying, brushing, nail clipping, ear cleaning, anal glands express'
    },
    {
      type: 'full',
      name: 'Full Grooming',
      duration: '120 minutes',
      description: 'Overall clipping & styling + all basic grooming services'
    }
  ];

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
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  {currentStep === 'selection' && (isEditing ? 'Reschedule Appointment' : 'Book New Appointment')}
                  {currentStep === 'summary' && (isEditing ? 'Reschedule Summary' : 'Booking Summary')}
                  {currentStep === 'confirmation' && (isEditing ? 'Appointment Rescheduled!' : 'Booking Confirmed!')}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={loading}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Step indicator */}
            <div className="px-6 py-4 border-b bg-gray-50">
              <div className="flex items-center justify-center space-x-4">
                <div className={`flex items-center ${currentStep === 'selection' ? 'text-blue-600' : 'text-green-600'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === 'selection' ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    {currentStep === 'selection' ? '1' : '✓'}
                  </div>
                  <span className="ml-2 text-sm font-medium">Details</span>
                </div>
                
                <div className={`w-8 h-1 rounded-full ${
                  currentStep === 'selection' ? 'bg-gray-200' : 'bg-green-300'
                }`} />
                
                <div className={`flex items-center ${
                  currentStep === 'selection' ? 'text-gray-400' : 
                  currentStep === 'summary' ? 'text-blue-600' : 'text-green-600'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === 'selection' ? 'bg-gray-100' :
                    currentStep === 'summary' ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    {currentStep === 'confirmation' ? '✓' : '2'}
                  </div>
                  <span className="ml-2 text-sm font-medium">Review</span>
                </div>
                
                <div className={`w-8 h-1 rounded-full ${
                  currentStep === 'confirmation' ? 'bg-green-300' : 'bg-gray-200'
                }`} />
                
                <div className={`flex items-center ${
                  currentStep === 'confirmation' ? 'text-green-600' : 'text-gray-400'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === 'confirmation' ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    {currentStep === 'confirmation' ? '✓' : '3'}
                  </div>
                  <span className="ml-2 text-sm font-medium">Confirm</span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Selection step */}
              {currentStep === 'selection' && (
                <form className="space-y-6">
                  {/* Pet Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Pet <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="petId"
                      value={formik.values.petId}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Choose a pet...</option>
                      {pets.map((pet) => (
                        <option key={pet._id} value={pet._id}>
                          {pet.name} ({pet.species} - {pet.breed})
                        </option>
                      ))}
                    </select>
                    {formik.touched.petId && formik.errors.petId && (
                      <p className="mt-1 text-sm text-red-600">{formik.errors.petId}</p>
                    )}
                  </div>

                  {/* Service type selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Service type <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {serviceTypes.map((service) => (
                        <motion.div
                          key={service.type}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => formik.setFieldValue('serviceType', service.type)}
                          className={`cursor-pointer border-2 rounded-lg p-4 transition-colors ${
                            formik.values.serviceType === service.type
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{service.name}</h4>
                            <span className="text-sm text-gray-500">{service.duration}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    {formik.touched.serviceType && formik.errors.serviceType && (
                      <p className="mt-1 text-sm text-red-600">{formik.errors.serviceType}</p>
                    )}
                  </div>

                  {/* Groomer selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select groomer <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="groomerId"
                      value={formik.values.groomerId}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Choose a groomer...</option>
                      {groomers.map((groomer) => (
                        <option key={groomer._id} value={groomer._id}>
                          {groomer.name}
                        </option>
                      ))}
                    </select>
                    {formik.touched.groomerId && formik.errors.groomerId && (
                      <p className="mt-1 text-sm text-red-600">{formik.errors.groomerId}</p>
                    )}
                  </div>

                  {/* Date selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred date <span className="text-red-500">*</span>
                    </label>
                    <DatePicker
                      disableDate={date => date.getDay() === 3}
                      value={formik.values.selectedDate}
                      onChange={(value) => formik.setFieldValue('selectedDate', value)}
                      onBlur={() => formik.setFieldTouched('selectedDate', true)}
                      placeholder="Select a date"
                      minDate={getMinDate()}
                      maxDate={getMaxDate()}
                      error={!!(formik.touched.selectedDate && formik.errors.selectedDate)}
                    />
                    {formik.touched.selectedDate && formik.errors.selectedDate && (
                      <p className="mt-1 text-sm text-red-600">{formik.errors.selectedDate}</p>
                    )}
                  </div>

                  {/* Time slot selection — only shown once groomer, date, and service are all chosen */}
                  {formik.values.groomerId && formik.values.selectedDate && formik.values.serviceType ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Available Time Slots <span className="text-red-500">*</span>
                      </label>
                      
                      {loadingSlots ? (
                        <div className="flex justify-center py-8">
                          <LoadingSpinner />
                        </div>
                      ) : availableSlots.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">
                          No available time slots for the selected date. Please choose a different date.
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto">
                          {availableSlots.map((slot, index) => {
                            const slotValue = slot.start.toISOString();
                            return (
                              <motion.button
                                key={index}
                                type="button"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => formik.setFieldValue('selectedTimeSlot', slotValue)}
                                className={`p-3 text-sm border rounded-md transition-colors ${
                                  formik.values.selectedTimeSlot === slotValue
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                }`}
                              >
                                {formatTimeSlot(slot)}
                              </motion.button>
                            );
                          })}
                        </div>
                      )}
                      
                      {formik.touched.selectedTimeSlot && formik.errors.selectedTimeSlot && (
                        <p className="mt-1 text-sm text-red-600">{formik.errors.selectedTimeSlot}</p>
                      )}
                    </div>
                  ) : (
                    /* show time slot error even before the section renders */
                    formik.touched.selectedTimeSlot && formik.errors.selectedTimeSlot ? (
                      <p className="text-sm text-red-600">{formik.errors.selectedTimeSlot}</p>
                    ) : null
                  )}

                  {/* Form actions */}
                  <div className="flex justify-end space-x-3 pt-6 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleProceedToSummary}
                      className="min-w-[120px]"
                    >
                      Continue to Summary
                    </Button>
                  </div>
                </form>
              )}

              {/* Summary step */}
              {currentStep === 'summary' && (
                <div className="space-y-6">
                  {/* Booking details summary */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Booking Details</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Pet</p>
                          <p className="text-gray-900">{getSelectedPet()?.name} ({getSelectedPet()?.species} - {getSelectedPet()?.breed})</p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-500">Service</p>
                          <p className="text-gray-900">{getServiceDetails(formik.values.serviceType)?.name}</p>
                          <p className="text-sm text-gray-600">{getServiceDetails(formik.values.serviceType)?.duration}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-500">Groomer</p>
                          <p className="text-gray-900">{getSelectedGroomer()?.name}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Date</p>
                          <p className="text-gray-900">{formatDate(formik.values.selectedDate)}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-500">Time</p>
                          <p className="text-gray-900">{formatSelectedTimeSlot()}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-500">Duration</p>
                          <p className="text-gray-900">{getServiceDetails(formik.values.serviceType)?.duration}</p>
                        </div>
                      </div>
                    </div>

                    {/* Pet special instructions */}
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-500">Special instructions for groomer</p>
                        {!editingInstructions && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingInstructions(true);
                              setEditedInstructions(formik.values.specialInstructions);
                            }}
                            className="text-sm text-blue-600 hover:text-blue-800 underline"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                      {editingInstructions ? (
                        <div>
                          <textarea
                            value={editedInstructions}
                            onChange={e => setEditedInstructions(e.target.value)}
                            placeholder="Add any special instructions for the groomer (e.g., sensitive areas, behavioral notes, specific styling preferences...)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                            rows={3}
                            maxLength={500}
                            disabled={saveInstructionsLoading}
                          />
                          <div className="flex justify-between items-center mt-1">
                            <p className="text-xs text-gray-500">
                              These notes will be visible to the groomer and saved to your pet's profile.
                            </p>
                            <span className="text-xs text-gray-400">
                              {editedInstructions.length}/500
                            </span>
                          </div>
                          <div className="flex space-x-2 mt-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={async () => {
                                setSaveInstructionsLoading(true);
                                try {
                                  const petId = formik.values.petId;
                                  await petService.updatePet(petId, { notes: editedInstructions.trim() });
                                  formik.setFieldValue('specialInstructions', editedInstructions.trim());
                                  setEditingInstructions(false);
                                } catch {
                                  toast.error('Failed to update instructions. Please try again.');
                                } finally {
                                  setSaveInstructionsLoading(false);
                                }
                              }}
                              disabled={saveInstructionsLoading}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingInstructions(false);
                                setEditedInstructions(formik.values.specialInstructions);
                              }}
                              disabled={saveInstructionsLoading}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        formik.values.specialInstructions ? (
                          <div className="bg-white p-3 rounded border">
                            <p className="text-gray-900 whitespace-pre-wrap">{formik.values.specialInstructions}</p>
                          </div>
                        ) : (
                          <div className="bg-gray-50 p-3 rounded border border-dashed border-gray-300">
                            <p className="text-gray-500 italic">No special instructions provided.</p>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingInstructions(true);
                                setEditedInstructions('');
                              }}
                              className="text-sm text-blue-600 hover:text-blue-800 underline mt-1"
                            >
                              Add instructions
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Important policy warning */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex">
                      <ExclamationTriangleIcon className="h-6 w-6 text-amber-600 flex-shrink-0" />
                      <div className="ml-3">
                        <h4 className="text-sm font-semibold text-amber-800">Important Policy Information</h4>
                        <div className="mt-2 text-sm text-amber-700">
                          <ul className="list-disc pl-5 space-y-1">
                            <li><strong>Cancellation Policy:</strong> Appointments cannot be cancelled or rescheduled less than 24 hours before the scheduled time.</li>
                            <li><strong>Late Arrival:</strong> Please arrive punctually. We offer a 10-minute grace period for late arrivals.</li>
                            <li><strong>Health Requirements:</strong> Pets must be up-to-date with vaccinations and free from fleas/ticks.</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-row flex-wrap gap-2 justify-between items-center w-full pt-6 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBackToSelection}
                      disabled={loading}
                      className="flex-1 min-w-0"
                    >
                      <ArrowLeftIcon className="h-4 w-4 mr-2" />
                      Back to Edit
                    </Button>
                    <Button
                      type="button"
                      onClick={() => formik.handleSubmit()}
                      disabled={loading}
                      className="flex-1 min-w-0 bg-green-600 hover:bg-green-700"
                    >
                      {loading ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <>
                          <CalendarDaysIcon className="h-4 w-4 mr-2" />
                          {isEditing ? 'Confirm Reschedule' : 'Confirm Booking'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Confirmation step */}
              {currentStep === 'confirmation' && (
                <div className="text-center py-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  >
                    <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  </motion.div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {isEditing ? 'Appointment Rescheduled Successfully!' : 'Appointment Booked Successfully!'}
                  </h3>
                  
                  <p className="text-gray-600 mb-4">
                    Your appointment for {getSelectedPet()?.name} has been {isEditing ? 'rescheduled' : 'confirmed'}.
                  </p>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mx-auto max-w-md">
                    <p className="text-sm text-green-800">
                      <strong>{formatDate(formik.values.selectedDate)}</strong><br />
                      {formatSelectedTimeSlot()}<br />
                      {getServiceDetails(formik.values.serviceType)?.name} with {getSelectedGroomer()?.name}
                    </p>
                  </div>
                  
                  <p className="text-sm text-gray-500 mt-4">
                    You will be redirected shortly...
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default AppointmentBookingModal;
