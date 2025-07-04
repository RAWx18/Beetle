"use client";
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Brain, Search, Upload, User, Settings, LogOut, Moon, Sun, Table, Info, HelpCircle, Code, Github, GitBranch, GitPullRequest } from 'lucide-react';
import { useRippleEffect } from '@/lib/animations';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useBranch } from '@/contexts/BranchContext';
import AuthModal from '@/components/AuthModal';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TooltipProvider } from '@/components/ui/tooltip';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  hasSubmenu?: boolean;
  children?: React.ReactNode;
}

const NavItem = ({ to, icon, label, active, onClick, hasSubmenu, children }: NavItemProps) => {
  const handleRipple = useRippleEffect();
  
  if (hasSubmenu) {
    return (
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger 
              className={cn(
                "relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300",
                "hover:bg-primary/10 hover:text-primary", 
                active ? "bg-primary/10 text-primary" : "text-foreground/80"
              )}
            >
              <span className={cn(
                "transition-all duration-300",
                active ? "text-primary" : "text-foreground/60"
              )}>
                {icon}
              </span>
              <span className="font-medium">{label}</span>
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <div className="grid w-[200px] gap-1 p-2">
                {children}
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    );
  }
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link 
          href={to} 
          className={cn(
            "relative flex items-center justify-center px-4 py-3 rounded-lg transition-all duration-300",
            "hover:bg-primary/10 hover:text-primary",
            "overflow-hidden",
            active ? "bg-primary/10 text-primary" : "text-foreground/80"
          )}
          onClick={(e) => {
            handleRipple(e);
            onClick();
          }}
        >
          <span className={cn(
            "transition-all duration-300",
            active ? "text-primary" : "text-foreground/60"
          )}>
            {icon}
          </span>
          {active && (
            <span className="ml-2 font-medium">{label}</span>
          )}
        </Link>
      </TooltipTrigger>
      <TooltipContent>
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
};

const SubMenuItem = ({ to, icon, label, active, onClick }: NavItemProps) => {
  return (
    <Link 
      href={to} 
      className={cn(
        "flex items-center gap-2 p-2 rounded-md hover:bg-primary/10 hover:text-primary transition-all duration-300",
        active ? "bg-primary/10 text-primary" : ""
      )}
      onClick={onClick}
    >
      <span className={cn(
        "transition-all duration-300",
        active ? "text-primary" : "text-foreground/60"
      )}>
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );
};

export const Navbar = () => {
  const [active, setActive] = useState('what');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { selectedBranch, setSelectedBranch, getBranchInfo } = useBranch();
  const pathname = usePathname();
  const isOnContributionPage = pathname?.startsWith('/contribution');
  
  const handleOpenAuthModal = () => {
    setIsAuthModalOpen(true);
  };

  const handleCloseAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const handleNavItemClick = (id: string) => {
    setActive(id);
  };

  const branches = [
    { id: 'dev' as const, name: 'Dev Branch', color: 'text-blue-600', description: 'Integration layer' },
    { id: 'agents' as const, name: 'Agents Branch', color: 'text-emerald-600', description: 'Multi-agent AI systems' },
    { id: 'snowflake' as const, name: 'Snowflake Branch', color: 'text-cyan-600', description: 'Enterprise data integrations' }
  ];

  const cortexSubmenu = [
    { to: '/contribution', icon: <Info size={18} />, label: 'About AIFAQ', id: 'what' },
    { to: '/contribution/why', icon: <HelpCircle size={18} />, label: 'Why AIFAQ', id: 'why' },
    { to: '/contribution/how', icon: <Code size={18} />, label: 'How It Works', id: 'how' },
    { to: '/contribution/contribute', icon: <Github size={18} />, label: 'Contribute', id: 'contribute' },
  ];
  
  const authNavItems = [
    { to: '/contribution/manage', icon: <Table size={20} />, label: 'Manage', id: 'manage' },
    { to: '/contribution/search', icon: <Search size={20} />, label: 'Search', id: 'search' },
    { to: '/contribution/import', icon: <Upload size={20} />, label: 'Import', id: 'import' },
    { to: '/contribution/profile', icon: <User size={20} />, label: 'Profile', id: 'profile' },
    { to: '/contribution/settings', icon: <Settings size={20} />, label: 'Settings', id: 'settings' },
  ];

  const navItems = isAuthenticated ? authNavItems : [];

  return (
    <>
      <TooltipProvider>
        <header className="glass-panel fixed top-6 left-1/2 transform -translate-x-1/2 z-40 rounded-lg px-1 py-1">
          <nav className="flex items-center">
            <NavItem
              to="#"
              icon={<Brain size={20} />}
              label="AIFAQ"
              active={['what', 'why', 'how', 'contribute'].includes(active)}
              onClick={() => {}}
              hasSubmenu={true}
            >
              {cortexSubmenu.map((item) => (
                <SubMenuItem
                  key={item.id}
                  to={item.to}
                  icon={item.icon}
                  label={item.label}
                  active={active === item.id}
                  onClick={() => handleNavItemClick(item.id)}
                />
              ))}
            </NavItem>

            {/* Branch Dropdown */}
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-primary/10 hover:text-primary"
                    >
                      <GitBranch size={20} />
                      <span className="font-medium">{branches.find(b => b.id === selectedBranch)?.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-background border border-border shadow-lg">
                    {branches.map((branch) => (
                      <DropdownMenuItem
                        key={branch.id}
                        onClick={() => setSelectedBranch(branch.id)}
                        className={cn(
                          "flex flex-col items-start gap-1 cursor-pointer hover:bg-accent p-3",
                          selectedBranch === branch.id && "bg-accent"
                        )}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <div className={cn("w-2 h-2 rounded-full bg-primary")}></div>
                          <span className="text-primary font-medium">{branch.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground pl-4">{branch.description}</p>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TooltipTrigger>
              <TooltipContent>
                <p>Select Branch</p>
              </TooltipContent>
            </Tooltip>

            {/* Contribution Button - Only show when not on contribution pages */}
            {!isOnContributionPage && (
              <NavItem
                to="/contribution"
                icon={<GitPullRequest size={20} />}
                label="Contribution"
                active={active === 'contribution'}
                onClick={() => handleNavItemClick('contribution')}
              />
            )}
            
            {/* Other nav items */}
            {navItems.map((item) => (
              <NavItem
                key={item.id}
                to={item.to}
                icon={item.icon}
                label={item.label}
                active={active === item.id}
                onClick={() => handleNavItemClick(item.id)}
              />
            ))}
            
            {/* Theme toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-lg ml-1"
                  onClick={toggleTheme}
                >
                  {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle {theme === 'dark' ? 'light' : 'dark'} mode</p>
              </TooltipContent>
            </Tooltip>
            
            {isAuthenticated ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-primary hover:text-primary-foreground"
                    onClick={logout}
                  >
                    <LogOut size={20} />
                    {active === 'logout' && <span className="font-medium">Logout</span>}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Logout</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-primary hover:text-primary-foreground"
                    onClick={handleOpenAuthModal}
                  >
                    <Github size={20} />
                    {active === 'github' && <span className="font-medium">GitHub</span>}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sign in with GitHub</p>
                </TooltipContent>
              </Tooltip>
            )}
          </nav>
        </header>
      </TooltipProvider>
      
      <AuthModal isOpen={isAuthModalOpen} onClose={handleCloseAuthModal} />
    </>
  );
};

export default Navbar;
