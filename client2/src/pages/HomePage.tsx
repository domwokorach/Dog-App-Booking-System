import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { Button } from '../components/ui/button';
import { useAuthStore } from '../store/authStore';
import PageTransition from '../components/layout/PageTransition';
import petGroomingImage from '../assets/pet_grooming.webp';
import AppointmentBookingModal from '../components/appointments/AppointmentBookingModal';
import { petService } from '../services/petService';
import type { Pet } from '../types';
import lovingCareImage from '../assets/loving-unsplash.jpg';
import professionalServiceImage from '../assets/professional-unsplash.jpg';
import convenientBookingImage from '../assets/convenient-unsplash.jpg';
import licensedInsuredImage from '../assets/insured.png';
import experiencedTeamImage from '../assets/team.png';
import stressFreeImage from '../assets/nostress-unsplash.jpg';
import basicGroomingImage from '../assets/basic-unsplash.jpg';
import fullGroomingImage from '../assets/full-unsplash.jpg';

const HomePage = () => {
  const { isAuthenticated, user } = useAuthStore();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [userPets, setUserPets] = useState<Pet[]>([]);
  const navigate = useNavigate();

  // load user pets if authenticated
  useEffect(() => {
    const loadUserPets = async () => {
      if (isAuthenticated && user?.role === 'owner') {
        try {
          const pets = await petService.getUserPets();
          setUserPets(pets);
        } catch (error) {
          console.error('Error loading user pets:', error);
        }
      }
    };

    loadUserPets();
  }, [isAuthenticated, user]);

      const handleBookingSuccess = () => {
    setShowBookingModal(false);
  };

  const handleBookAppointment = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (user?.role === 'owner') {
      setShowBookingModal(true);
    }
  };

  const combinedFeatures = [
    {
      image: lovingCareImage,
      alt: 'Gentle groomer providing loving care to a dog',
      title: 'Loving Care',
      description: 'Every pet receives personalized attention and gentle handling from our experienced groomers.'
    },
    {
      image: professionalServiceImage,
      alt: 'Professional pet groomer working with expertise',
      title: 'Professional Service',
      description: 'Our certified groomers use premium products and industry-best practices for exceptional results.'
    },
    {
      image: convenientBookingImage,
      alt: 'Easy and convenient pet appointment booking',
      title: 'Convenient Booking',
      description: 'Easy online scheduling that fits your busy lifestyle. Book appointments 24/7 through our platform.'
    },
    {
      image: licensedInsuredImage,
      alt: 'Licensed and insured pet grooming facility',
      title: 'Licensed & Insured',
      description: 'Fully licensed pet grooming facility with comprehensive insurance coverage for your peace of mind.'
    },
    {
      image: experiencedTeamImage,
      alt: 'Experienced team of professional pet groomers',
      title: 'Experienced Team',
      description: 'Our groomers have years of experience with all breeds and temperaments.'
    },
    {
      image: stressFreeImage,
      alt: 'Calm and relaxed dog in stress-free grooming environment',
      title: 'Stress-Free Environment',
      description: 'We create a calm, comfortable environment that pets actually enjoy visiting.'
    }
  ];

  const services = [
    {
      title: 'Basic Grooming',
      duration: '60 min',
      image: basicGroomingImage,
      alt: 'Happy dog enjoying a basic grooming bath service',
      features: ['Bath & Dry', 'Nail Clipping', 'Ear Cleaning', 'Basic Trimming']
    },
    {
      title: 'Full Grooming',
      duration: '120 min',
      image: fullGroomingImage,
      alt: 'Beautifully styled poodle after full grooming service',
      features: ['Everything in Basic', 'Full Styling', 'Breed-Specific Cuts', 'Premium Products']
    }
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-stone-50">
        {/* Hero section with img */}
        <section className="relative overflow-hidden bg-gradient-to-br from-gray-100 to-stone-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Hero content */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
                  Where Pets Get 
                  <span className="text-blue-600 block">Priority</span>
                </h1>
                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                  Professional pet grooming services in the heart of Bedok. We treat your furry family members with the love and care they deserve.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700" onClick={handleBookAppointment}>
                    Book Appointment
                  </Button>
                  <Button asChild variant="outline" size="lg" className="text-gray-700 border-gray-300 hover:bg-gray-50">
                    <Link to="/service-rates">
                      View Our Services
                    </Link>
                  </Button>
                </div>
              </motion.div>

              {/* Hero img */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative"
              >
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <img 
                    src={petGroomingImage}
                    alt="Professional pet grooming session showing a happy dog being groomed by our experienced team"
                    className="w-full h-[500px] object-contain"
                  />
                  {/* Expertise Message Overlay */}
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-6 border border-blue-100">
                      <p className="text-center text-lg font-medium text-gray-900 leading-relaxed">
                        "With over a decade of grooming expertise—your pet is in safe, caring hands from start to finish"
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 bg-gradient-to-b from-stone-50 to-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Why Choose Furkids?
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                We combine professional expertise with genuine love for animals to provide the best grooming experience.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {combinedFeatures.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-stone-50/80 backdrop-blur-sm rounded-lg overflow-hidden shadow-sm border border-stone-200 hover:shadow-lg hover:border-blue-200 hover:-translate-y-1 transition-all duration-300 group"
                >
                  {/* Image - top */}
                  <div className="w-full h-48 overflow-hidden">
                    <img 
                      src={feature.image} 
                      alt={feature.alt} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                  
                  {/* Content - bottom */}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center group-hover:text-blue-700 transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-center leading-relaxed text-sm">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="py-16 bg-gradient-to-b from-gray-100 to-stone-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Our Services
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Comprehensive grooming packages designed to keep your pets healthy, happy, and looking their best.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {services.map((service, index) => (
                <motion.div
                  key={service.title}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white/90 backdrop-blur-sm rounded-lg overflow-hidden shadow-sm border border-stone-200 hover:shadow-lg hover:border-blue-200 hover:-translate-y-1 transition-all duration-300 group"
                >
                  {/* Image */}
                  <div className="w-full h-48 overflow-hidden relative">
                    <img 
                      src={service.image} 
                      alt={service.alt} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    {/* Duration badge */}
                    <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {service.duration}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center group-hover:text-blue-700 transition-colors duration-300">
                      {service.title}
                    </h3>
                    
                    {/* Features list */}
                    <ul className="space-y-2 mb-6">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center text-gray-600 text-sm">
                          <SparklesIcon className="h-4 w-4 text-blue-500 mr-3 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    
                    {/* Book button */}
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={handleBookAppointment}
                    >
                      Book {service.title}
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-center mt-12"
            >
              <Button asChild variant="outline" size="lg" className="text-gray-700 border-gray-300 hover:bg-gray-50">
                <Link to="/service-rates">
                  View All Services & Pricing
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Booking modal */}
        {showBookingModal && isAuthenticated && user?.role === 'owner' && (
          <AppointmentBookingModal
            pets={userPets}
            onClose={() => setShowBookingModal(false)}
            onSuccess={handleBookingSuccess}
          />
        )}
      </div>
    </PageTransition>
  );
};

export default HomePage;
