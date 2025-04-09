
import { Link, useLocation } from 'wouter';
import { Home, FileText, Briefcase, User } from 'lucide-react';

interface NavigationTab {
  name: string;
  shortName: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: NavigationTab[] = [
  { name: 'Home', shortName: 'Home', href: '/', icon: Home },
  { name: 'Your Applications', shortName: 'Apps', href: '/applications', icon: FileText },
  { name: 'Your Opportunities', shortName: 'Opps', href: '/your-opportunities', icon: Briefcase },
  { name: 'Profile', shortName: 'Profile', href: '/profile', icon: User },
];

export default function NavigationTabs() {
  const [location] = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white z-10">
      <nav className="max-w-7xl mx-auto px-4" aria-label="Tabs">
        <div className="grid grid-cols-4 gap-1">
          {tabs.map((tab) => {
            const isActive = 
              tab.href === '/' ? location === '/' : location.startsWith(tab.href);
            
            return (
              <Link href={tab.href} key={tab.name}>
                <a
                  className={`${
                    isActive 
                      ? 'text-primary border-primary' 
                      : 'text-gray-500 hover:text-gray-700'
                  } flex flex-col items-center justify-center py-2 px-1`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <tab.icon className={`h-5 w-5 ${isActive ? 'text-primary' : ''}`} />
                  <span className="text-xs mt-1">{tab.shortName}</span>
                </a>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
