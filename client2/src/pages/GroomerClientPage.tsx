import { motion } from 'framer-motion';
import { 
  UsersIcon
} from '@heroicons/react/24/outline';
import PageTransition from '../components/layout/PageTransition';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

const GroomerClientPage = () => {
  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <UsersIcon className="h-8 w-8 text-gray-600" />
              Client Management
            </h1>
            <p className="mt-2 text-gray-600">
              Manage your client history, track service records, and build lasting relationships
            </p>
          </motion.div>

          {/* Development Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="bg-white shadow">
              <CardHeader className="text-center">
                <CardTitle className="text-gray-900 text-xl">
                  Feature Under Development
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Stay tuned for more features coming soon!
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-gray-700">
                  The Client Management system is currently in development. Soon you'll be able to:
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-1">Client Profiles</h3>
                    <p className="text-sm text-gray-600">View detailed client and pet information</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-1">Service History</h3>
                    <p className="text-sm text-gray-600">Track all past appointments and services</p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-1">Analytics</h3>
                    <p className="text-sm text-gray-600">Insights on client preferences and trends</p>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-800 font-medium">
                    Expected Release: Coming Soon
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default GroomerClientPage; 
