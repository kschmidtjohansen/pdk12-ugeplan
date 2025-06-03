
import React from 'react';
import { useTranslation } from '../context/TranslationContext';
import VacationPageContainer from '../components/Vacation/VacationPageContainer';
import { Calendar } from 'lucide-react';

const VacationPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-25 via-background to-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6 space-y-8">
        {/* Enhanced Header with Glassmorphism */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-8 text-white shadow-2xl animate-fade-in-up">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl transform translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-2xl transform -translate-x-16 translate-y-16"></div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight">
                  {t("navigation.vacation")}
                </h1>
                <p className="text-blue-100 text-lg font-medium">
                  {t("vacation.pageDescription")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Vacation Content */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-6">
            <VacationPageContainer headerComponent={null} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VacationPage;
