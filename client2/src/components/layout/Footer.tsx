// import React from 'react';
// import { Link } from 'react-router-dom';
// import { useAuthStore } from '../../store/authStore';

const Footer = () => {
  // const { isAuthenticated } = useAuthStore();

  const operatingHours = [
    { day: 'Mon', hours: '11:00 am – 08:00 pm' },
    { day: 'Tue', hours: '11:00 am – 08:00 pm' },
    { day: 'Wed', hours: 'Closed', closed: true },
    { day: 'Thu', hours: '11:00 am – 08:00 pm' },
    { day: 'Fri', hours: '11:00 am – 08:00 pm' },
    { day: 'Sat', hours: '10:00 am – 07:00 pm' },
    { day: 'Sun', hours: '10:00 am – 07:00 pm' },
  ];

  // encoded address for Google Maps
  const mapAddress = encodeURIComponent('Furkids Home Pet Grooming & Spa');

  return (
    <footer id="footer" className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Contact info - Left column */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <div className="text-gray-400 space-y-3">
              <div className="flex items-start">
                <span className="text-blue-400 mr-2">📍</span>
                <div>
                  <p className="font-medium text-white text-sm">Furkids Home | Pet Grooming & Spa Singapore</p>
                  <p className="text-sm">Blk 412 Bedok North Ave 2</p>
                  <p className="text-sm">#01-136 Singapore 460412</p>
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-blue-400 mr-2">📞</span>
                <div className="text-sm">
                  <a 
                    href="tel:+6590460410" 
                    className="hover:text-white transition-colors"
                  >
                    9046 0410
                  </a>
                  <span className="text-gray-400 mx-2">/</span>
                  <a 
                    href="tel:+6597772042" 
                    className="hover:text-white transition-colors"
                  >
                    9777 2042
                  </a>
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-blue-400 mr-2">📧</span>
                <a 
                  href="mailto:furkidshome@gmail.com" 
                  className="hover:text-white transition-colors text-sm"
                >
                  furkidshome@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* Google Map - mid column */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Find Us</h4>
            <div className="relative">
              {/* Simple embedded map without API key */}
              <div className="aspect-w-16 aspect-h-12 rounded-lg overflow-hidden border border-gray-700">
                <iframe
                  src={`https://maps.google.com/maps?q=${mapAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                  width="100%"
                  height="200"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Furkids Home Location"
                  className="rounded-lg"
                ></iframe>
              </div>
              
              {/* Direct link to Google Maps */}
              <div className="mt-3">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${mapAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 transition-colors text-sm flex items-center"
                >
                  📍 Get Directions →
                </a>
              </div>
            </div>
          </div>

          {/* Operating Hours - Right Column */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Operating Hours</h4>
            <div className="space-y-2 text-gray-400 text-sm">
              {operatingHours.map((schedule, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="font-medium">{schedule.day}</span>
                  <span className={schedule.closed ? 'text-red-400' : 'text-gray-300'}>
                    {schedule.hours}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              <p>&copy; 2025 Furkids Home | Pet Grooming & Spa Singapore. All rights reserved.</p>
            </div>
            <div className="flex space-x-6 text-gray-400 text-sm">
              <p>Where Pets Get Priority</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
