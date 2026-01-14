import { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Phone,
  Building2,
  Router,
  GitBranch,
  DollarSign,
  FileText,
  Settings,
  LogOut,
  PhoneForwarded,
  Plug,
  Route,
  CircleDollarSign,
  Layers,
  ChevronDown,
  ChevronRight,
  Waypoints,
  Send,
  Receipt,
  Network,
  Headphones,
  Bug
} from 'lucide-react'

const menuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { 
    label: 'Customers',
    icon: Users,
    submenu: [
      { path: '/customers/trunk', icon: Network, label: 'Trunk' },
      { path: '/customers/pabx', icon: Headphones, label: 'PABX' },
    ]
  },
  { 
    label: 'Routing',
    icon: Waypoints,
    submenu: [
      { path: '/routes', icon: GitBranch, label: 'Rotas' },
      { path: '/route-plans', icon: Route, label: 'Planos de Rotas' },
    ]
  },
  { 
    label: 'Destinations',
    icon: Send,
    submenu: [
      { path: '/gateways', icon: Router, label: 'Gateways' },
      { path: '/gateway-groups', icon: Layers, label: 'Grupos de Gateways' },
    ]
  },
  { 
    label: 'Billing',
    icon: Receipt,
    submenu: [
      { path: '/tariffs', icon: DollarSign, label: 'Tarifas' },
      { path: '/tariff-plans', icon: CircleDollarSign, label: 'Planos de Tarifas' },
    ]
  },
  { path: '/dids', icon: Phone, label: 'DIDs' },
  { path: '/providers', icon: Building2, label: 'Provedores' },
  { path: '/reports', icon: FileText, label: 'Relatorios' },
  { path: '/conference', icon: PhoneForwarded, label: 'Conferencia' },
  { path: '/debug', icon: Bug, label: 'Debug Center' },
  { path: '/integrations', icon: Plug, label: 'Integracoes' },
  { path: '/settings', icon: Settings, label: 'Configuracoes' },
]

function MenuItem({ item }) {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(() => {
    if (item.submenu) {
      return item.submenu.some(sub => location.pathname.startsWith(sub.path))
    }
    return false
  })

  if (item.submenu) {
    const isActive = item.submenu.some(sub => location.pathname.startsWith(sub.path))
    
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
            isActive
              ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
              : 'text-gray-400 hover:bg-dark-300 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </div>
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        
        {isOpen && (
          <div className="ml-4 mt-1 space-y-1 border-l border-dark-100 pl-3">
            {item.submenu.map((subItem) => (
              <NavLink
                key={subItem.path}
                to={subItem.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-200 text-sm ${
                    isActive
                      ? 'bg-primary-500/10 text-primary-400'
                      : 'text-gray-400 hover:bg-dark-300 hover:text-white'
                  }`
                }
              >
                <subItem.icon className="w-4 h-4" />
                <span>{subItem.label}</span>
              </NavLink>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
          isActive
            ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
            : 'text-gray-400 hover:bg-dark-300 hover:text-white'
        }`
      }
    >
      <item.icon className="w-5 h-5" />
      <span className="font-medium">{item.label}</span>
    </NavLink>
  )
}

export default function Sidebar() {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
    window.location.reload()
  }

  return (
    <div className="fixed left-0 top-0 h-screen w-64 bg-dark-400 border-r border-dark-100 flex flex-col z-50">
      <div className="p-6 border-b border-dark-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 via-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20 relative">
            <div className="absolute inset-0 flex flex-col justify-center items-start pl-2 gap-0.5">
              <div className="w-3 h-0.5 bg-white/90 rounded"></div>
              <div className="w-4 h-0.5 bg-white/90 rounded ml-1"></div>
              <div className="w-3 h-0.5 bg-white/90 rounded"></div>
            </div>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">TrunkFlow</h1>
            <p className="text-xs text-gray-500">VoIP Management</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item, index) => (
          <MenuItem key={item.path || index} item={item} />
        ))}
      </nav>

      <div className="p-4 border-t border-dark-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-400 w-full transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </div>
  )
}
