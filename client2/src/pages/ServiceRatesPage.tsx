import { motion } from 'framer-motion';
import { 
  ClockIcon, 
  CurrencyDollarIcon,
  InformationCircleIcon,
  ScissorsIcon
} from '@heroicons/react/24/outline';
import PageTransition from '../components/layout/PageTransition';
import serviceRatesImage from '../assets/service_rates.webp';

const ServiceRatesPage = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  const ServiceCard = ({ 
    title, 
    duration, 
    description, 
    includes, 
    pricing 
  }: {
    title: string;
    duration: string;
    description?: string;
    includes: string[];
    pricing: { category: string; price: string; breeds: string }[];
  }) => (
    <motion.div
      variants={itemVariants}
      className="bg-white rounded-lg shadow-md p-6 mb-6"
    >
      <div className="flex items-center mb-4">
        <ScissorsIcon className="h-6 w-6 text-blue-600 mr-3" />
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          <div className="flex items-center text-gray-600 mt-1">
            <ClockIcon className="h-4 w-4 mr-1" />
            <span className="text-sm">{duration}</span>
          </div>
        </div>
      </div>
      
      {description && (
        <p className="text-gray-600 mb-4">{description}</p>
      )}
      
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-2">Includes:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          {includes.map((item, index) => (
            <li key={index} className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {pricing.map((priceInfo, index) => (
          <div key={index} className="border rounded-lg p-4">
            <div className="flex items-center mb-2">
              <CurrencyDollarIcon className="h-5 w-5 text-green-600 mr-2" />
              <h5 className="font-semibold text-gray-900">{priceInfo.category}</h5>
            </div>
            <p className="text-2xl font-bold text-green-600 mb-2">{priceInfo.price}</p>
            <p className="text-xs text-gray-500 leading-relaxed">{priceInfo.breeds}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              Service Rates
            </h1>
            <div className="max-w-4xl mx-auto">
              <img 
                src={serviceRatesImage} 
                alt="Professional grooming services for your beloved pets with signature care and attention to detail"
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </div>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Important pricing notice */}
            <motion.div
              variants={itemVariants}
              className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8"
            >
              <div className="flex items-start">
                <InformationCircleIcon className="h-6 w-6 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Important Pricing Information</h3>
                  <p className="text-blue-800 text-sm leading-relaxed">
                    We are unable to provide a precise grooming price for your pet without an initial personal assessment. 
                    Grooming rates primarily depend on factors such as breed, size, the specific grooming services requested, 
                    and desired styling. Prices are based on Standard Size. For oversized pets, prices are charged differently. 
                    All grooming does not include de-matting or cutting of knots. We will always provide a quote before starting the grooming.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Dog basic grooming */}
            <ServiceCard
              title="Dog Basic Grooming"
              duration="~ 60 mins"
              includes={[
                "Bathing, Drying & Brushing",
                "Nail clipping & filling",
                "Shaving of paw pad fur & fur around belly, genital & butt area",
                "Ear cleaning & removing of ear fur",
                "Anal glands express"
              ]}
              pricing={[
                {
                  category: "Small Breed",
                  price: "fr $35-50",
                  breeds: "Chihuahua, Toy Poodle, Maltese, Shihtzu, Pomeranian, Jack Russell, Silky Terrier, Yorkshire Terrier, Pug, Frenchie, Miniature Schnauzer, Lhasa Apso, Pekingese, Papillion, Westies, Mini Daschund, Chinese Crested, etc."
                },
                {
                  category: "Medium Breed",
                  price: "fr $55-75",
                  breeds: "Bichon, Jap Spitz, Beagle, Miniature Poodle, Lhasa Apso, Shetland Sheepdog, English Cocker Spaniel, American Cocker Spaniel, Shiba Inu, Corgi, British Bulldog, Coton De Tulear, etc."
                },
                {
                  category: "Large Breed",
                  price: "fr $80-120",
                  breeds: "Chowchow, Husky, Springer Spaniel, Golden Retriever, Rough Collie, Boxer, Keeshond, Samoyed, Border Collie, Singapore Special / Mongrel, Goldendoodle, Labradoodle, Brittany Spaniel, etc."
                }
              ]}
            />

            {/* Dog full grooming */}
            <ServiceCard
              title="Dog Full Grooming"
              duration="~ 120 mins"
              includes={[
                "Overall clipping & styling or shaving",
                "Bathing, Drying & Brushing",
                "Nail clipping & filling",
                "Shaving of paw pad fur & fur around belly, genital & butt area",
                "Ear cleaning & removing of ear fur",
                "Anal glands express"
              ]}
              pricing={[
                {
                  category: "Small Breed",
                  price: "fr $60-75",
                  breeds: "Chihuahua, Toy Poodle, Maltese, Shihtzu, Pomeranian, Jack Russell, Silky Terrier, Yorkshire Terrier, Pug, Frenchie, Miniature Schnauzer, Lhasa Apso, Pekingese, Papillion, Westies, Mini Daschund, Chinese Crested, etc."
                },
                {
                  category: "Medium Breed",
                  price: "fr $80-95",
                  breeds: "Bichon, Jap Spitz, Beagle, Miniature Poodle, Lhasa Apso, Shetland Sheepdog, English Cocker Spaniel, American Cocker Spaniel, Shiba Inu, Corgi, British Bulldog, Coton De Tulear, etc."
                },
                {
                  category: "Large Breed",
                  price: "fr $100-150",
                  breeds: "Chowchow, Husky, Springer Spaniel, Golden Retriever, Rough Collie, Boxer, Keeshond, Samoyed, Border Collie, Singapore Special / Mongrel, Goldendoodle, Labradoodle, Brittany Spaniel, etc."
                }
              ]}
            />

            {/* Cat grooming */}
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-lg shadow-md p-6 mb-8"
            >
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-3">🐱</span>
                <h3 className="text-xl font-semibold text-gray-900">Cat Grooming</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Grooming removes dust, dead skin and loose hairs, prevents serious tangling and matting and can improve circulation of your cat.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border rounded-lg p-6">
                  <div className="flex items-center mb-3">
                    <ClockIcon className="h-5 w-5 text-blue-600 mr-2" />
                    <h4 className="font-semibold text-gray-900">Basic Grooming ~ 60 mins</h4>
                  </div>
                  <p className="text-2xl font-bold text-green-600 mb-3">fr $60-80</p>
                  <div className="text-sm text-gray-600">
                    <p className="font-medium mb-2">Includes:</p>
                    <ul className="space-y-1">
                      <li>• Bathing, Drying & Brushing</li>
                      <li>• Nail clipping & filling</li>
                      <li>• Shaving of paw pad fur & fur around belly, genital & butt area</li>
                      <li>• Ear cleaning & removing of ear fur</li>
                    </ul>
                  </div>
                </div>
                
                <div className="border rounded-lg p-6">
                  <div className="flex items-center mb-3">
                    <ClockIcon className="h-5 w-5 text-blue-600 mr-2" />
                    <h4 className="font-semibold text-gray-900">Full Grooming ~ 120 mins</h4>
                  </div>
                  <p className="text-2xl font-bold text-green-600 mb-3">fr $100-150</p>
                  <div className="text-sm text-gray-600">
                    <p className="font-medium mb-2">Includes:</p>
                    <ul className="space-y-1">
                      <li>• Overall clipping & styling or shaving</li>
                      <li>• Bathing, Drying & Brushing</li>
                      <li>• Nail clipping & filling</li>
                      <li>• Shaving of paw pad fur & fur around belly, genital & butt area</li>
                      <li>• Ear cleaning & removing of ear fur</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Dog size groups */}
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Dog Size Groups</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Small Breed</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Chihuahua, Toy Poodle, Maltese, Shihtzu, Pomeranian, Jack Russell, Silky Terrier, Yorkshire Terrier, Pug, Frenchie, Miniature Schnauzer, Lhasa Apso, Pekingese, Papillion, Westies, Mini Daschund, Chinese Crested, etc.
                  </p>
                </div>
                
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Medium Breed</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Bichon, Jap Spitz, Beagle, Miniature Poodle, Lhasa Apso, Shetland Sheepdog, English Cocker Spaniel, American Cocker Spaniel, Shiba Inu, Corgi, British Bulldog, Coton De Tulear, etc.
                  </p>
                </div>
                
                <div className="border-l-4 border-orange-500 pl-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Large Breed</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Chowchow, Husky, Springer Spaniel, Golden Retriever, Rough Collie, Boxer, Keeshond, Samoyed, Border Collie, Singapore Special / Mongrel, Goldendoodle, Labradoodle, Brittany Spaniel, etc.
                  </p>
                </div>
                
                <div className="border-l-4 border-red-500 pl-4">
                  <h4 className="font-semibold text-gray-900 mb-2">X-Large Breed</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Standard Poodle, Alaskan Malamute, Great Dane, Bernese Mountain Dog, etc.
                  </p>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 italic">
                  <strong>Note:</strong> The list of dog breeds given here is non-exhaustive and should not be regarded as final. 
                  Speak to our groomers if you can't find your dog breed here.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default ServiceRatesPage;
