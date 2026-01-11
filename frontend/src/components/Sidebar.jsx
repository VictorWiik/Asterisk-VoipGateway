import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Phone,
  Server,
  Radio,
  Route,
  PhoneCall,
  Settings,
  LogOut,
  FileText,
  DollarSign
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Clientes', href: '/customers', icon: Users },
  { name: 'DIDs', href: '/dids', icon: Phone },
  { name: 'Provedores', href: '/providers', icon: Server },
  { name: 'Gateways', href: '/gateways', icon: Radio },
  { name: 'Rotas', href: '/routes', icon: Route },
  { name: 'Ramais', href: '/extensions', icon: PhoneCall },
  { name: 'Conferencia', href: '/conference', icon: PhoneCall },
  { name: 'Tarifas', href: '/tariffs', icon: DollarSign },
  { name: 'Relatorios', href: '/reports', icon: FileText },
  { name: 'Configuracoes', href: '/settings', icon: Settings },
]

export default function Sidebar({ onLogout }) {
  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-dark-400 border-r border-dark-100">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-dark-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
            <Phone className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Asterisk</h1>
            <p className="text-xs text-gray-500">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-1 overflow-y-auto" style={{ height: 'calc(100vh - 130px)' }}>
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-dark-300'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-dark-100">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </div>
  )
}
