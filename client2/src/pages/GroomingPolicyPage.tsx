import { motion } from 'framer-motion';
import PageTransition from '../components/layout/PageTransition';

const GroomingPolicyPage = () => {
  const policies = [
    {
      title: 'Cancellation',
      content: 'Rescheduling or cancellation only allowed 24 hours before the appointment. Advanced notice for cancellations is appreciated to accommodate other pet owners. For all other enquiries, please email furkidshome@gmail.com or contact us via WhatsApp at 9046 0410 / 9777 2042.'
    },
    {
      title: 'Pricing',
      content: 'We are unable to provide a precise grooming price for your pet without a personal assessment. Grooming rates primarily depend on factors such as breed, size, the specific grooming services requested, and desired styling. Prices are based on Standard Size. For oversized pet, prices are charged differently. All grooming does not include de-matting or cutting of knots.\n\nFor returning customers, the grooming price will typically remain the same as your previous grooming appointment, unless we advise otherwise.'
    },
    {
      title: 'Promptness for Appointments',
      content: 'We kindly request that you arrive punctually for your pet scheduled appointment to ensure that all our valued pets can receive our services promptly. We acknowledge that life can present unforeseen circumstances, which is why we offer a 10-minute grace period for late arrivals in case of unexpected delays. If you anticipate being late, please contact us in advance so that we can make necessary adjustments to our schedule. It\'s important to note that if you exceed the grace period, we will treat your pet appointment as a walk-in and place her on our waiting list for the next available opening.'
    },
    {
      title: 'Fleas & Ticks',
      content: 'To maintain the well-being of both other pets and our pet grooming center, we are unable to accommodate pets that are infested with fleas or ticks for grooming services.'
    },
    {
      title: 'Aggressive Dog',
      content: 'For dogs displaying aggression and biting behavior, we may need to decline providing grooming services.'
    },
    {
      title: 'Cat Grooming',
      content: 'Cat grooming requires a gentle approach. We prioritize your cat\'s comfort and safety, and we do not use sedation during the grooming process. However, if your cat is uneasy with unfamiliar handling, uncomfortable with bathing or the sound of a hair dryer, or displays scratching or biting behavior, we may be unable to proceed with grooming.\n\nOur commitment is to ensure grooming remains an enjoyable experience for your cat. We also avoid any actions that may cause harm to your cat or our groomers. Therefore, we reserve the right to decline grooming services for cats that exhibit the mentioned behaviors.'
    },
    {
      title: 'Vaccination Requirements',
      content: 'Pets need up-to-date vaccinations (rabies, distemper, parvovirus) as per local regulations. Proof may be required.'
    },
    {
      title: 'Health Conditions',
      content: 'Inform us of any health issues, allergies, or special care needs.'
    },
    {
      title: 'Grooming Requests',
      content: 'Clearly communicate preferences. Outcomes may vary based on factors.'
    },
    {
      title: 'Matted Coat',
      content: 'Severe matting may require shaving. Regular coat maintenance is advised.'
    },
    {
      title: 'Payment',
      content: 'Payment due at service. We accept Cash, PayNow, SGQR, NETS, and American Express credit card. In order to use NETS or an American Credit Card for payment, a minimum of $20 is needed.'
    }
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <section className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Pet Grooming Policy
              </h1>
              <p className="text-lg text-gray-600">
                At Furkids Home Pet Grooming & Spa, we prioritize pet health, safety, and comfort. 
                To ensure a positive experience, please adhere to our policies:
              </p>
            </motion.div>
          </div>
        </section>

        {/* Policy Content */}
        <section className="py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-6">
              {policies.map((policy, index) => (
                <motion.div
                  key={policy.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-lg p-6 shadow-sm border"
                >
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {policy.title}
                  </h3>
                  <div className="text-gray-700 leading-relaxed space-y-2">
                    {policy.content.split('\n\n').map((paragraph, idx) => (
                      <p key={idx}>{paragraph}</p>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Closing statement - blue section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6 text-center"
            >
              <p className="text-lg font-medium text-blue-900 mb-2">
                We aim for a safe, enjoyable grooming experience.
              </p>
              <p className="text-blue-700">
                Contact us with questions or concerns. Thank you.
              </p>
            </motion.div>
          </div>
        </section>
      </div>
    </PageTransition>
  );
};

export default GroomingPolicyPage;
