import { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Fuel, Bell, Settings } from 'lucide-react';
import { useTranslation } from '../../contexts/I18nProvider';

export default function BottomNav() {
  const { t } = useTranslation();

  const tabs = useMemo(
    () =>
      [
        { to: '/', icon: Home, label: t('common.nav.dashboard') },
        { to: '/fuel', icon: Fuel, label: t('common.nav.fuel') },
        { to: '/reminders', icon: Bell, label: t('common.nav.reminders') },
        { to: '/settings', icon: Settings, label: t('common.nav.settings') },
      ] as const,
    [t],
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-40">
      {tabs.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center py-2 gap-0.5 text-xs font-medium transition-colors ${
              isActive ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
            }`
          }
        >
          <Icon size={22} strokeWidth={1.8} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
