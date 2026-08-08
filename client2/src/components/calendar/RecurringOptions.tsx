import { ArrowPathIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Calendar } from '../ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { cn } from '../../lib/utils';

interface RecurringOptionsProps {
  isRecurring: boolean;
  onRecurringChange: (isRecurring: boolean) => void;
  recurringDays: number[];
  onDaysChange: (days: number[]) => void;
  recurringEndDate: Date | undefined;
  onEndDateChange: (date: Date | undefined) => void;
  minEndDate: Date | undefined;
}

const RecurringOptions = ({
  isRecurring,
  onRecurringChange,
  recurringDays,
  onDaysChange,
  recurringEndDate,
  onEndDateChange,
  minEndDate
}: RecurringOptionsProps) => {
  const daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
  ];

  const handleDayToggle = (dayValue: number) => {
    const newDays = recurringDays.includes(dayValue)
      ? recurringDays.filter(d => d !== dayValue)
      : [...recurringDays, dayValue].sort();
    onDaysChange(newDays);
  };

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <ArrowPathIcon className="h-5 w-5" />
          Recurring Schedule
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isRecurring"
            checked={isRecurring}
            onChange={(e) => onRecurringChange(e.target.checked)}
            className="rounded border-gray-300"
          />
          <Label htmlFor="isRecurring">Make this a recurring time block</Label>
        </div>

        {isRecurring && (
          <>
            <div>
              <Label>Repeat on days</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {daysOfWeek.map((day) => (
                  <label key={day.value} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={recurringDays.includes(day.value)}
                      onChange={() => handleDayToggle(day.value)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{day.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full mt-1 justify-start text-left font-normal",
                      !recurringEndDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {recurringEndDate ? (
                      format(recurringEndDate, "PPP")
                    ) : (
                      <span>Pick an end date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={recurringEndDate}
                    onSelect={(date) => onEndDateChange(date)}
                    disabled={(date) => minEndDate ? date < minEndDate : date < new Date(new Date().setHours(0, 0, 0, 0))}
                    captionLayout="dropdown"
                    fromYear={new Date().getFullYear()}
                    toYear={new Date().getFullYear() + 2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RecurringOptions;
