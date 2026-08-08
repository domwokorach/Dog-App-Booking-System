import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  TrashIcon,
  PencilIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
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
import groomerService, { type TimeBlock } from '../../services/groomerService';
import RecurringOptions from './RecurringOptions';
import { createRecurringTimeBlocks, blockTypeOptions } from '../../utils/timeBlockUtils';

interface TimeBlockDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  timeBlock: TimeBlock | null;
}

const TimeBlockDetailsDialog = ({
  isOpen,
  onClose,
  onSuccess,
  timeBlock
}: TimeBlockDetailsDialogProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    date: undefined as Date | undefined,
    startTime: '',
    endTime: '',
    blockType: 'unavailable' as 'unavailable' | 'break' | 'lunch' | 'personal' | 'maintenance',
    reason: '',
    isRecurring: false,
    recurringDays: [] as number[],
    recurringEndDate: undefined as Date | undefined
  });

  // Init form data when timeBlock changes
  useEffect(() => {
    if (timeBlock && isOpen) {
      const startDate = new Date(timeBlock.startTime);
      const endDate = new Date(timeBlock.endTime);
      
      setFormData({
        date: startDate,
        startTime: startDate.toTimeString().slice(0, 5),
        endTime: endDate.toTimeString().slice(0, 5),
        blockType: timeBlock.blockType,
        reason: timeBlock.reason || '',
        isRecurring: false,
        recurringDays: [],
        recurringEndDate: undefined
      });
      setIsEditing(false);
      setShowDeleteConfirm(false);
    }
  }, [timeBlock, isOpen]);

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

  const getBlockTypeColor = (blockType: string) => {
    switch (blockType) {
      case 'break': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'lunch': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'personal': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'maintenance': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const handleInputChange = (field: string, value: string | boolean | number[] | Date | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!timeBlock) return;

    if (!formData.date || !formData.startTime || !formData.endTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate recurring options
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

    setLoading(true);
    
    try {
      await groomerService.updateTimeBlock(timeBlock._id, {
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        blockType: formData.blockType,
        reason: formData.reason || undefined
      });

      // handle recurring creation if enabled
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
        ? 'Time block updated and recurring blocks created'
        : 'Time block updated successfully';

      toast.success(successMessage, {
        description: formData.isRecurring && formData.recurringEndDate ? `Recurring blocks created until ${formData.recurringEndDate.toLocaleDateString()}` : undefined
      });

      onSuccess();
      onClose();
    } catch (error: unknown) {
      console.error('Error updating time block:', error);
      const errorMessage = error instanceof Error && 'response' in error && 
        typeof error.response === 'object' && error.response !== null &&
        'data' in error.response && typeof error.response.data === 'object' && 
        error.response.data !== null && 'error' in error.response.data &&
        typeof error.response.data.error === 'string' 
        ? error.response.data.error 
        : 'Please try again.';
      
      toast.error('Failed to update time block', {
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!timeBlock) return;
    
    setLoading(true);
    
    try {
      await groomerService.deleteTimeBlock(timeBlock._id);
      toast.success('Time block deleted successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error deleting time block:', error);
      toast.error('Failed to delete time block', {
        description: 'Please try again.'
      });
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!isOpen || !timeBlock) return null;

  const { date, time: startTime } = formatDateTime(timeBlock.startTime);
  const { time: endTime } = formatDateTime(timeBlock.endTime);

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
                    {timeBlock.blockType.charAt(0).toUpperCase() + timeBlock.blockType.slice(1)} Time Block
                  </h3>
                  <p className="text-sm text-gray-600">
                    {date} • {startTime} - {endTime}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getBlockTypeColor(timeBlock.blockType)}`}>
                  {timeBlock.blockType.charAt(0).toUpperCase() + timeBlock.blockType.slice(1)}
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
              {!isEditing ? (
                // View mode
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CalendarDaysIcon className="h-5 w-5 text-red-600" />
                        Time Block Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="font-medium text-gray-500">Date</p>
                          <p className="text-gray-900">{date}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-500">Time</p>
                          <p className="text-gray-900">{startTime} - {endTime}</p>
                        </div>
                      </div>
                      
                      {timeBlock.reason && (
                        <div>
                          <p className="font-medium text-gray-500">Reason</p>
                          <p className="text-gray-900">{timeBlock.reason}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2"
                    >
                      <PencilIcon className="h-4 w-4" />
                      Edit
                    </Button>
                    
                    <Button
                      variant="destructive"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-2"
                    >
                      <TrashIcon className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </>
              ) : (
                // Edit mode
                <div className="space-y-6">
                  {/* Date and Time */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Edit Time Block</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Date Picker */}
                        <div>
                          <Label>Date *</Label>
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

                        <div>
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

                        <div>
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

                      <div>
                        <Label htmlFor="reason">Reason (Optional)</Label>
                        <Textarea
                          id="reason"
                          value={formData.reason}
                          onChange={(e) => handleInputChange('reason', e.target.value)}
                          placeholder="Provide additional details..."
                          className="mt-1"
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recurring opts */}
                  <RecurringOptions
                    isRecurring={formData.isRecurring}
                    onRecurringChange={(isRecurring) => handleInputChange('isRecurring', isRecurring)}
                    recurringDays={formData.recurringDays}
                    onDaysChange={(days) => handleInputChange('recurringDays', days)}
                    recurringEndDate={formData.recurringEndDate}
                    onEndDateChange={(date) => handleInputChange('recurringEndDate', date)}
                    minEndDate={formData.date}
                  />

                  {/* Actions */}
                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {loading ? 'Saving...' : 
                       formData.isRecurring ? 'Save & Create Recurring' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Delete confirmation */}
              {showDeleteConfirm && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-red-800">Delete Time Block</h4>
                        <p className="text-sm text-red-700 mt-1">
                          Are you sure you want to delete this {timeBlock.blockType} time block? 
                          This action cannot be undone.
                        </p>
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowDeleteConfirm(false)}
                            disabled={loading}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={loading}
                          >
                            {loading ? 'Deleting...' : 'Confirm Delete'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default TimeBlockDetailsDialog;
