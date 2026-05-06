import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import BottomNav from './BottomNav';
import { useTranslation } from '../../contexts/I18nProvider';
import { useCar } from '../../contexts/CarContext';

export default function Layout() {
  const { t } = useTranslation();
  const { cars, activeCar, selectCar, loading } = useCar();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && cars.length === 0) {
      navigate('/settings', { replace: true });
    }
  }, [loading, cars.length, navigate]);

  return (
    <div className="flex flex-col min-h-svh bg-gray-50">
      <header className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between z-30">
        <span className="text-lg font-semibold text-indigo-600 tracking-tight">{t('common.appTitle')}</span>

        {cars.length > 1 && activeCar && (
          <button
            className="flex items-center gap-1 text-sm text-gray-700 bg-gray-100 rounded-lg px-3 py-1.5"
            onClick={() => {
              const next = cars.find((c) => c.id !== activeCar.id);
              if (next) selectCar(next.id);
            }}
          >
            {activeCar.name}
            <ChevronDown size={14} />
          </button>
        )}

        {cars.length === 1 && activeCar && (
          <span className="text-sm text-gray-500">{activeCar.name}</span>
        )}
      </header>

      <main className="flex-1 pb-20">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}
