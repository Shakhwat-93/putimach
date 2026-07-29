import { useState, useEffect } from 'react';
import './Sidebar.css';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, ShieldCheck, Headphones, Truck, 
  Factory, BarChart3, Settings, LogOut, Users, Package, ClipboardList,
  Megaphone, ShieldAlert, ChevronDown, ChevronRight, X, Sun, Moon,
  DatabaseBackup, Store
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../hooks/useBranding';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/utils';

const menuItems = [
  { path: '/', label: 'Overview', icon: LayoutDashboard, group: 'Main Console' },
  { path: '/tasks', label: 'Tasks', icon: ClipboardList, group: 'Main Console' },
  {
    path: '/orders', label: 'Orders', icon: ShoppingCart, group: 'Main Console',
    children: [
      { path: '/orders?status=All', label: 'All Orders', status: 'All', tone: 'all' },
      { path: '/orders?status=Pending%20Call', label: 'Pending Call', status: 'Pending Call', tone: 'pending' },
      { path: '/orders?status=Final%20Call%20Pending', label: 'Final Call', status: 'Final Call Pending', tone: 'final' },
      { path: '/orders?status=Confirmed', label: 'Confirmed', status: 'Confirmed', tone: 'confirmed' },
      { path: '/orders?status=Cancelled', label: 'Cancelled', status: 'Cancelled', tone: 'cancelled' },
      { path: '/orders?status=Fake%20Order', label: 'Fake Order', status: 'Fake Order', tone: 'fake' }
    ]
  },
  { path: '/storefront', label: 'Storefront', icon: Store, roles: ['Admin'], group: 'Main Console' },
  { path: '/inventory', label: 'Inventory', icon: Package, roles: ['Admin', 'Moderator'], group: 'Main Console' },
  { path: '/factory', label: 'Confirmed', icon: Factory, roles: ['Admin', 'Factory Team'], group: 'Logistics' },
  { path: '/steadfast', label: 'Courier Hub', icon: Truck, roles: ['Admin', 'Courier Team', 'Moderator'], group: 'Logistics' },
  { path: '/moderator', label: 'Moderator', icon: ShieldCheck, roles: ['Admin', 'Moderator'], group: 'Intelligence' },
  { path: '/call-team', label: 'Call Team', icon: Headphones, roles: ['Admin', 'Call Team'], group: 'Intelligence' },
  { path: '/users', label: 'Users', icon: Users, roles: ['Admin'], group: 'Intelligence' },
  { path: '/fraud', label: 'Fraud', icon: ShieldAlert, roles: ['Admin'], group: 'Intelligence' },
  { path: '/reports', label: 'Analytics', icon: BarChart3, roles: ['Admin'], group: 'System' },
  {
    path: '/digital-marketer', label: 'Marketing', icon: Megaphone, roles: ['Admin', 'Digital Marketer'], group: 'System',
    children: [
      { path: '/digital-marketer', label: 'Campaigns' },
      { path: '/digital-marketer/content-planning', label: 'Content Planning' },
      { path: '/digital-marketer/finance-planning', label: 'Finance Plan' }
    ]
  },
  { path: '/backup', label: 'Backup', icon: DatabaseBackup, roles: ['Admin'], group: 'System' },
];

const GROUP_ORDER = ['Main Console', 'Logistics', 'Intelligence', 'System'];

const toneColors = {
  all:       { dot: 'bg-slate-400', active: 'text-slate-700 dark:text-slate-200' },
  pending:   { dot: 'bg-amber-400',  active: 'text-amber-700 dark:text-amber-300' },
  final:     { dot: 'bg-orange-500', active: 'text-orange-700 dark:text-orange-300' },
  confirmed: { dot: 'bg-emerald-500',active: 'text-emerald-700 dark:text-emerald-300' },
  cancelled: { dot: 'bg-rose-400',   active: 'text-rose-700 dark:text-rose-300' },
  fake:      { dot: 'bg-red-600',    active: 'text-red-700 dark:text-red-300' },
};

export const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { hasAnyRole, signOut, profile, user } = useAuth();
  const { appName } = useBranding();
  const { theme, toggleTheme } = useTheme();
  const [openMenus, setOpenMenus] = useState(() => ({
    orders: location.pathname === '/orders',
    marketing: location.pathname.startsWith('/digital-marketer')
  }));

  useEffect(() => { onClose?.(); }, [location.pathname]);

  const isSuperAdmin = true;
  const primaryRole = 'Super Admin';
  const displayName = profile?.name || user?.user_metadata?.full_name || user?.email || 'Admin';
  const currentStatus = new URLSearchParams(location.search).get('status') || '';

  const filteredItems = menuItems.filter(item => !item.roles || isSuperAdmin || hasAnyRole(item.roles));
  const groupedItems = GROUP_ORDER
    .map(group => ({ group, items: filteredItems.filter(item => item.group === group) }))
    .filter(entry => entry.items.length > 0);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300 ease-in-out md:sticky md:top-0 md:h-screen md:translate-x-0 md:flex-shrink-0',
        isOpen ? 'translate-x-0' : '-translate-x-full',
      )}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-2.5" onClick={onClose}>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground font-display font-black text-sm">
              {(appName?.charAt(0) || 'P').toUpperCase()}
            </div>
            <span className="font-display font-bold text-sm text-sidebar-foreground tracking-wide">
              {appName}
            </span>
          </Link>

          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              title={theme === 'light' ? 'Dark mode' : 'Light mode'}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors md:hidden"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* ── Nav ── */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4 scrollbar-none [scrollbar-width:none]">
          {groupedItems.map(({ group, items }) => (
            <div key={group}>
              <p className="mb-1 px-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                {group}
              </p>

              <div className="space-y-0.5">
                {items.map(item => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  const hasChildren = Array.isArray(item.children) && item.children.length > 0;
                  const menuKey = item.label.toLowerCase();
                  const isMenuOpen = hasChildren && openMenus[menuKey];

                  return (
                    <div key={item.path}>
                      <Link
                        to={item.path}
                        onClick={e => {
                          if (hasChildren) {
                            e.preventDefault();
                            setOpenMenus(prev => ({ ...prev, [menuKey]: !prev[menuKey] }));
                            navigate(item.path);
                          } else {
                            onClose?.();
                          }
                        }}
                        className={cn(
                          'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-150',
                          isActive
                            ? 'bg-sidebar-active text-sidebar-active-foreground shadow-sm'
                            : 'text-sidebar-foreground/80 hover:bg-secondary hover:text-sidebar-foreground'
                        )}
                      >
                        <Icon size={16} className="shrink-0" />
                        <span className="flex-1">{item.label}</span>
                        {hasChildren && (
                          <ChevronDown
                            size={14}
                            className={cn('shrink-0 transition-transform duration-200', isMenuOpen && 'rotate-180')}
                          />
                        )}
                        {!hasChildren && isActive && <ChevronRight size={13} className="shrink-0 opacity-60" />}
                      </Link>

                      {/* Sub-menu */}
                      {hasChildren && isMenuOpen && (
                        <div className="mt-0.5 ml-3 pl-4 border-l border-border/50 space-y-0.5">
                          {item.children.map(child => {
                            const isChildActive = child.status
                              ? (isActive && (currentStatus === child.status || (!currentStatus && child.status === 'All')))
                              : (location.pathname === child.path);
                            const toneClass = child.tone ? toneColors[child.tone] : null;

                            return (
                              <Link
                                key={child.status || child.path}
                                to={child.path}
                                onClick={onClose}
                                className={cn(
                                  'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors',
                                  isChildActive
                                    ? cn('bg-secondary', toneClass?.active || 'text-primary')
                                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                                )}
                              >
                                <span className={cn(
                                  'h-1.5 w-1.5 rounded-full shrink-0',
                                  isChildActive && toneClass ? toneClass.dot : 'bg-muted-foreground/50'
                                )} />
                                {child.label}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* ── Footer ── */}
        <div className="border-t border-sidebar-border p-3 space-y-1">
          <Link
            to="/profile"
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-secondary transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-black shrink-0 overflow-hidden">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                : displayName.substring(0, 2).toUpperCase()
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-sidebar-foreground truncate">{displayName}</p>
              <p className="text-[10px] font-semibold text-muted-foreground">{primaryRole}</p>
            </div>
          </Link>

          <button
            onClick={signOut}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 transition-colors"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
};
