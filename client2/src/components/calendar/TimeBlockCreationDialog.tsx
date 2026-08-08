import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import { CalendarIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Calendar } from '../ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { cn } from '../../lib/utils';
import { toast } from "sonner";
import groomerService from '../../services/groomerService';
import RecurringOptions from './RecurringOptions';
import { createRecurringTimeBlocks, blockTypeOptions } from '../../utils/timeBlockUtils';

interface TimeBlockCreationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedDate?: Date | null;
  selectedStartTime?: Date | null;
  selectedEndTime?: Date | null;
}

const TimeBlockCreationDialog = ({
  isOpen,
  onClose,
  onSuccess,
  selectedDate,
  selectedStartTime,
  selectedEndTime
}: TimeBlockCreationDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: selectedDate || undefined,
    startTime: selectedStartTime ? selectedStartTime.toTimeString().slice(0, 5) : '09:00',
    endTime: selectedEndTime ? selectedEndTime.toTimeString().slice(0, 5) : '10:00',
    blockType: 'unavailable' as 'unavailable' | 'break' | 'lunch' | 'personal' | 'maintenance',
    reason: '',
    isRecurring: false,
    recurringDays: [] as number[],
    recurringEndDate: undefined as Date | undefined
  });

  // update form data when props change (when user selects time on calendar)
  useEffect(() => {
    if (isOpen) {
      setFormData({
        date: selectedDate || undefined,
        startTime: selectedStartTime ? selectedStartTime.toTimeString().slice(0, 5) : '09:00',
        endTime: selectedEndTime ? selectedEndTime.toTimeString().slice(0, 5) : '10:00',
        blockType: 'unavailable',
        reason: '',
        isRecurring: false,
        recurringDays: [],
        recurringEndDate: undefined
      });
    }
  }, [isOpen, selectedDate, selectedStartTime, selectedEndTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date || !formData.startTime || !formData.endTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    // validate recurring options
    if (formData.isRecurring) {
      if (formData.recurringDays.length === 0) {
        toast.error('Please select at least one day for recurring schedule');
        return;
      }
      if (!formData.recurringEndDate) {
        toast.error('Please select an end date for recurring schedule');
        return;
      }
    }

    // create DateTime objects
    const dateString = format(formData.date, 'yyyy-MM-dd');
    const startDateTime = new Date(`${dateString}T${formData.startTime}:00`);
    const endDateTime = new Date(`${dateString}T${formData.endTime}:00`);

    // validate times
    if (startDateTime >= endDateTime) {
      toast.error('Start time must be before end time');
      return;
    }

    // check if it's in the past
    if (startDateTime < new Date()) {
      toast.error('Cannot create time blocks in the past');
      return;
    }

    setLoading(true);
    
    try {
      // create initial time block
      await groomerService.createTimeBlock({
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        blockType: formData.blockType,
        reason: formData.reason || undefined
      });

      // create recurring blocks if enabled
      if (formData.isRecurring && formData.recurringEndDate) {
        await createRecurringTimeBlocks(
          dateString,
          formData.startTime,
          formData.endTime,
          formData.blockType,
          formData.reason,
          formData.recurringDays,
          format(formData.recurringEndDate, 'yyyy-MM-dd')
        );
      }

      const successMessage = formData.isRecurring 
        ? 'Time blocks created successfully'
        : 'Time block created successfully';
      
      const successDescription = formData.isRecurring && formData.recurringEndDate
        ? `Created recurring blocks until ${formData.recurringEndDate.toLocaleDateString()}`
        : `Blocked ${formData.startTime} - ${formData.endTime} on ${formData.date?.toLocaleDateString()}`;

      toast.success(successMessage, {
        description: successDescription
      });

      onSuccess();
      onClose();
      
      // reset form will be handled by useEffect when dialog opens next time
    } catch (error: unknown) {
      console.error('Error creating time block:', error);
      const errorMessage = error instanceof Error && 'response' in error && 
        typeof error.response === 'object' && error.response !== null &&
        'data' in error.response && typeof error.response.data === 'object' && 
        error.response.data !== null && 'error' in error.response.data &&
        typeof error.response.data.error === 'string' 
        ? error.response.data.error 
        : 'Please try again.';
      
      toast.error('Failed to create time block', {
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean | number[] | Date | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

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
            className="relative w-full max-w-3xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-red-50 to-orange-50">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <ClockIcon className="h-8 w-8 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Block Time Off
                  </h3>
                  <p className="text-sm text-gray-600">
                    Mark time as unavailable for appointments
                  </p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Date and Time Selection */}
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Date Picker */}
                    <div className="md:col-span-1">
                      <Label className="flex items-center gap-2">
                        <CalendarDaysIcon className="h-4 w-4" />
                        Date *
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full mt-1 justify-start text-left font-normal",
                              !formData.date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.date ? (
                              format(formData.date, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.date}
                            onSelect={(date) => handleInputChange('date', date)}
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            captionLayout="dropdown"
                            fromYear={new Date().getFullYear()}
                            toYear={new Date().getFullYear() + 2}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="md:col-span-1">
                      <Label htmlFor="startTime">Start Time *</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => handleInputChange('startTime', e.target.value)}
                        required
                        className="mt-1"
                      />
                    </div>

                    <div className="md:col-span-1">
                      <Label htmlFor="endTime">End Time *</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => handleInputChange('endTime', e.target.value)}
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Block type selection */}
                  <div>
                    <Label htmlFor="blockType">Block Type *</Label>
                    <Select
                      value={formData.blockType}
                      onValueChange={(value) => handleInputChange('blockType', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {blockTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-sm text-gray-500">{option.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Reason */}
                  <div>
                    <Label htmlFor="reason">Reason (Optional)</Label>
                    <Textarea
                      id="reason"
                      value={formData.reason}
                      onChange={(e) => handleInputChange('reason', e.target.value)}
                      placeholder="Provide additional details about this time block..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Recurring Options */}
              <RecurringOptions
                isRecurring={formData.isRecurring}
                onRecurringChange={(isRecurring) => handleInputChange('isRecurring', isRecurring)}
                recurringDays={formData.recurringDays}
                onDaysChange={(days) => handleInputChange('recurringDays', days)}
                recurringEndDate={formData.recurringEndDate}
                onEndDateChange={(date) => handleInputChange('recurringEndDate', date)}
                minEndDate={formData.date}
              />

              {/* Warning */}
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div className="text-sm text-amber-800">
                      <p className="font-medium">Important:</p>
                      <ul className="mt-1 list-disc list-inside space-y-1">
                        <li>This will prevent new appointments from being booked during this time</li>
                        <li>Existing appointments during this time will not be affected</li>
                        <li>You can delete time blocks later by clicking on them in the calendar</li>
                        {formData.isRecurring && (
                          <li className="font-medium">Recurring blocks will be created for selected days until the end date</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {loading ? 'Creating...' : 
                   formData.isRecurring ? 'Create Recurring Blocks' : 'Create Time Block'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default TimeBlockCreationDialog;
