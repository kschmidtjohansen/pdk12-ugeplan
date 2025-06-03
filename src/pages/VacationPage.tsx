
import React from 'react';
import { useTranslation } from '../context/TranslationContext';
import VacationPageContainer from '../components/Vacation/VacationPageContainer';
import { Calendar } from 'lucide-react';

const VacationPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Clean Page Header */}
        <div className="bg-white rounded-xl border border-gray-100 p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-gray-900">
                {t("navigation.vacation")}
              </h1>
              <p className="text-sm text-gray-600">
                {t("vacation.pageDescription")}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                <Calendar className="h-6 w-6 text-primary" />
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
