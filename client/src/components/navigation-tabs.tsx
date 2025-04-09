
import { useLocation } from 'wouter';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface NavigationTab {
  name: string;
  href: string;
}

const tabs: NavigationTab[] = [
  { name: 'Home', href: '/' },
  { name: 'Your Applications', href: '/applications' },
  { name: 'Your Opportunities', href: '/your-opportunities' },
  { name: 'Profile', href: '/profile' },
];

export default function NavigationTabs() {
  const [location, setLocation] = useLocation();
  
  // Get current tab value based on location
  const getCurrentTab = () => {
    if (location === '/') return '/';
    return tabs.find(tab => location.startsWith(tab.href))?.href || '/';
  };

  return (
    <div className="border-b border-gray-200 w-full sticky top-0 bg-white z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Tabs value={getCurrentTab()} className="w-full">
          <TabsList className="h-14 w-full justify-start bg-transparent border-0">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.name}
                value={tab.href}
                onClick={() => setLocation(tab.href)}
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 sm:px-4"
              >
                {tab.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
