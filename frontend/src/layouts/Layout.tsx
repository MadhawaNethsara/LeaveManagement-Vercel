import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import {
  LayoutDashboard,
  Users,
  CalendarPlus,
  CalendarDays,
  ClipboardCheck,
  LogOut,
  Menu,
  X,
} from 'lucide-react'

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/apply', label: 'Apply Leave', icon: CalendarPlus },
  { path: '/my-leaves', label: 'My Leaves', icon: CalendarDays },
  { path: '/employees', label: 'Employees', icon: Users, adminOnly: true },
  { path: '/approvals', label: 'Leave Approval', icon: ClipboardCheck, adminOnly: true },
]

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const isAdmin = user?.role === 'admin'
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="min-h-screen flex bg-surface-50">
      {/* Mobile overlay */}
      <div
        className="fixed inset-0 z-40 bg-surface-900/50 backdrop-blur-sm lg:hidden"
        aria-hidden={!sidebarOpen}
        onClick={closeSidebar}
        style={{ opacity: sidebarOpen ? 1 : 0, pointerEvents: sidebarOpen ? 'auto' : 'none' }}
      />

      {/* Sidebar - drawer on mobile, fixed on desktop */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 flex flex-col bg-white border-r border-surface-200
          transform transition-transform duration-200 ease-out lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between p-4 border-b border-surface-100 lg:px-6 lg:py-5">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold text-primary-600 truncate">Leave Manager</h1>
            <p className="text-xs text-surface-500 mt-0.5 truncate">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={closeSidebar}
            className="p-2 -mr-2 rounded-lg text-surface-500 hover:bg-surface-100 hover:text-surface-700 lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {navItems.map((item) => {
            if (item.adminOnly && !isAdmin) return null
            const Icon = item.icon
            const active =
              location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path))
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeSidebar}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${active ? 'bg-primary-50 text-primary-700' : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900'}
                `}
              >
                <Icon className="w-5 h-5 shrink-0" aria-hidden />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-3 border-t border-surface-100">
          <button
            type="button"
            onClick={() => { closeSidebar(); handleLogout(); }}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-surface-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-h-screen flex flex-col lg:pl-64">
        {/* Top bar - mobile only */}
        <header className="sticky top-0 z-30 flex items-center gap-3 bg-white/95 backdrop-blur border-b border-surface-200 px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg text-surface-600 hover:bg-surface-100 hover:text-surface-900"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="text-sm font-medium text-surface-900 truncate">Leave Manager</span>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
