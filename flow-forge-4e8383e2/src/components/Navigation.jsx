
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Home, 
  Zap, 
  Workflow, 
  Plug, 
  Bot,
  CheckSquare, 
  Activity, 
  BarChart3, 
  Settings, 
  CreditCard,
  Library, // This icon will now be used for 'Marketplace'
  Shield,
  Sparkles,
  Upload // Added for the new 'Publisher' item
} from 'lucide-react';

export default function Navigation() {
  const location = useLocation();
  const currentPath = location.pathname;

  const navSections = [
    {
      title: 'Automation',
      items: [
        { name: 'Home', path: 'AutomationHome', icon: Home },
        { name: 'Composer', path: 'WorkflowComposer', icon: Zap },
        { name: 'My Workflows', path: 'Workflows', icon: Workflow },
        { name: 'Marketplace', path: 'Marketplace', icon: Library }, // Changed from 'Library' to 'Marketplace'
        { name: 'Action Center', path: 'ActionCenter', icon: CheckSquare },
      ]
    },
    {
      title: 'Intelligence',
      items: [
        { name: 'Agent Hub', path: 'AgentHub', icon: Bot },
        { name: 'Genome AI', path: 'Optimize', icon: Sparkles },
        { name: 'Brain Home', path: 'BrainHome', icon: Sparkles },
      ]
    },
    {
      title: 'System',
      items: [
        { name: 'Connections', path: 'Connections', icon: Plug },
        { name: 'Runs', path: 'Runs', icon: Activity },
        { name: 'Analytics', path: 'Analytics', icon: BarChart3 },
        { name: 'Compliance', path: 'Compliance', icon: Shield },
      ]
    },
    {
      title: 'Account',
      items: [
        { name: 'Settings', path: 'Settings', icon: Settings },
        { name: 'Billing', path: 'Billing', icon: CreditCard },
        { name: 'Publisher', path: 'PublisherConsole', icon: Upload }, // Added new 'Publisher' item
      ]
    }
  ];

  const isActive = (path) => currentPath.includes(path);

  return (
    <nav className="bg-white border-r border-gray-200 w-64 min-h-screen p-4 overflow-y-auto">
      <div className="mb-8">
        <Link to={createPageUrl('AutomationHome')}>
          <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            DataChoreography
          </h2>
          <p className="text-xs text-gray-500 mt-1">Automation OS</p>
        </Link>
      </div>

      {navSections.map((section) => (
        <div key={section.title} className="mb-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            {section.title}
          </h3>
          <ul className="space-y-1">
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <li key={item.path}>
                  <Link
                    to={createPageUrl(item.path)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      active
                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <div className="mt-8 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
        <p className="text-sm font-semibold text-gray-900 mb-2">💡 Pro Tip</p>
        <p className="text-xs text-gray-600 mb-3">
          Explore powerful templates in the Marketplace to accelerate your automation! {/* Updated tip text */}
        </p>
        <Link to={createPageUrl('Marketplace')}> {/* Updated link path */}
          <button className="w-full bg-indigo-600 text-white text-xs px-3 py-2 rounded-lg hover:bg-indigo-700">
            Browse Marketplace {/* Updated button text */}
          </button>
        </Link>
      </div>
    </nav>
  );
}
