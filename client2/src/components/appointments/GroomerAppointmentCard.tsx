
import { 
  ClockIcon,
  UserIcon,
  HeartIcon,
  HashtagIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlayIcon,
  CalendarDaysIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { Badge } from '../ui/badge';
import type { Appointment, Pet, User } from '../../types';

interface GroomerAppointmentCardProps {
  appointment: Appointment;
  onClick: (appointment: Appointment) => void;
  className?: string;
  showViewDetails?: boolean;
  currentTime?: Date;
}

const GroomerAppointmentCard = ({ 
  appointment, 
  onClick, 
  className = '',
  showViewDetails = true,
  currentTime = new Date()
}: GroomerAppointmentCardProps) => {
  // get visual status based on time (same logic as calendar)
  const getVisualStatus = (appointment: Appointment) => {
    const now = currentTime;
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
    
    // auto-complete if past end time (but don't change actual status)
    if (now > end && appointment.status === 'confirmed') {
      return 'completed';
    }
    
    return appointment.status; // use actual status as fallback
  };

  const getAppointmentStatusDisplay = (appointment: Appointment) => {
    const visualStatus = getVisualStatus(appointment);
    
    switch(visualStatus) {
      case 'confirmed':
        return { 
          label: 'Confirmed', 
          bgColor: 'bg-blue-500', 
          textColor: 'text-white',
          icon: CheckCircleIcon 
        };
      case 'in_progress':
        return { 
          label: 'In Progress', 
          bgColor: 'bg-amber-500', 
          textColor: 'text-white',
          icon: PlayIcon 
        };
      case 'completed':
        return { 
          label: 'Completed', 
          bgColor: 'bg-green-500', 
          textColor: 'text-white',
          icon: CheckCircleIcon 
        };
      case 'cancelled':
        return { 
          label: 'Cancelled', 
          bgColor: 'bg-gray-500', 
          textColor: 'text-white',
          icon: XCircleIcon 
        };
      case 'no_show':
        return { 
          label: 'No Show', 
          bgColor: 'bg-red-800', 
          textColor: 'text-white',
          icon: XCircleIcon 
        };
      default:
        return { 
          label: 'Scheduled', 
          bgColor: 'bg-blue-500', 
          textColor: 'text-white',
          icon: CalendarDaysIcon 
        };
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getPetName = (petId: string | Pet) => {
    if (typeof petId === 'object' && petId !== null) {
      return petId.name || 'Unknown Pet';
    }
    return 'Unknown Pet';
  };

  const getPetBreedSpecies = (petId: string | Pet) => {
    if (typeof petId === 'object' && petId !== null) {
      const breed = petId.breed || 'Unknown Breed';
      const species = petId.species || 'Unknown Species';
      return { breed, species };
    }
    return { breed: 'Unknown Breed', species: 'Unknown Species' };
  };

  const getOwnerName = (ownerId: string | User) => {
    if (typeof ownerId === 'object' && ownerId !== null) {
      return ownerId.name || 'Unknown Owner';
    }
    return 'Unknown Owner';
  };

  const statusDisplay = getAppointmentStatusDisplay(appointment);
  const StatusIcon = statusDisplay.icon;

  return (
    <div 
      className={`border border-gray-200 rounded-lg p-4 hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer ${className}`}
      onClick={() => onClick(appointment)}
    >
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {(() => {
                const { breed, species } = getPetBreedSpecies(appointment.petId);
                const formattedBreed = breed.charAt(0).toUpperCase() + breed.slice(1);
                const formattedSpecies = species.charAt(0).toUpperCase() + species.slice(1);
                const serviceType = appointment.serviceType === 'basic' ? 'Basic' : 'Full';
                return `${formattedBreed} (${formattedSpecies} ${serviceType} Grooming)`;
              })()}
            </h3>
            <Badge className={`${statusDisplay.bgColor} ${statusDisplay.textColor} border-0`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusDisplay.label}
            </Badge>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-gray-600">
            <span className="flex items-center gap-1 font-medium">
              <ClockIcon className="h-4 w-4" />
              {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
            </span>
            <span className="flex items-center gap-1 font-medium">
              <HeartIcon className="h-4 w-4" />
              Pet: {getPetName(appointment.petId)}
            </span>
            <span className="flex items-center gap-1 font-medium">
              <UserIcon className="h-4 w-4" />
              Owner: {getOwnerName(appointment.ownerId)}
            </span>
            <span className="flex items-center gap-1 font-medium">
              <HashtagIcon className="h-4 w-4" />
              Booking Ref: {appointment._id.slice(-8).toUpperCase()}
            </span>
          </div>
        </div>
        {showViewDetails && (
          <div className="flex items-center text-black-400">
            <EyeIcon className="h-5 w-5" />
            View details
          </div>
        )}
      </div>
    </div>
  );
};

export default GroomerAppointmentCard;
