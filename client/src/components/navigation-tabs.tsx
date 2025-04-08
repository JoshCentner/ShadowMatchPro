import { Link, useLocation } from 'wouter';

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
  const [location] = useLocation();

  return (
    <div className="border-b border-gray-200 w-full overflow-x-auto">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = 
              tab.href === '/' ? location === '/' : location.startsWith(tab.href);
            
            return (
              <Link href={tab.href} key={tab.name}>
                <a
                  className={`${isActive 
                    ? 'border-primary text-primary' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } border-b-2 whitespace-nowrap py-4 px-1 font-medium text-sm`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {tab.name}
                </a>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
