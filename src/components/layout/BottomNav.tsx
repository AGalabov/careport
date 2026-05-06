import { NavLink } from 'react-router-dom';
import { Home, Fuel, Bell, Settings } from 'lucide-react';
import { useTranslation } from '../../contexts/I18nContext';

export default function BottomNav() {
  const { t } = useTranslation();
  const TABS = [
    { to: '/', icon: Home, label: t('layout.nav.dashboard') },
    { to: '/fuel', icon: Fuel, label: t('layout.nav.fuel') },
    { to: '/reminders', icon: Bell, label: t('layout.nav.reminders') },
    { to: '/settings', icon: Settings, label: t('layout.nav.settings') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-40">
      {TABS.map(({ to, icon: Icon, label }) => (
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
