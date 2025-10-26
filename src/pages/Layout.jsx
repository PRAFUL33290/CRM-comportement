

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PropTypes from 'prop-types';
import {
  Calendar,
  Clock,
  MapPin,
  FileText,
  MessageSquare,
  Settings,
  Users,
  Menu,
  X,
  Activity,
  LogOut,
  TrendingUp,
  Home,
  CheckCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
} from "@/components/ui/sidebar";
import ActualitesSidebar from "./components/dashboard/ActualitesSidebar";
import ProchainSuiviSidebar from "./components/dashboard/ProchainSuiviSidebar";

const navigationItems = [
  { name: "Tableau de bord", path: "TableauDeBord", icon: Home },
  { name: "Événements", path: "Evenements", icon: FileText },
  { name: "Enfants", path: "Enfants", icon: Users },
  { name: "Problèmes résolus", path: "ProblemesResolus", icon: CheckCircle },
  { name: "Statistiques", path: "Statistiques", icon: TrendingUp },
  { name: "Suivi", path: "Suivi", icon: Activity },
  { name: "Messagerie", path: "Messagerie", icon: MessageSquare }
];

function InfosTempsReel() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=44.88&longitude=-0.62&current=temperature_2m,weather_code&timezone=Europe/Paris')
      .then(res => res.json())
      .then(data => {
        if (data.current) {
          setWeather({
            temp: Math.round(data.current.temperature_2m),
            code: data.current.weather_code
          });
        }
      })
      .catch(() => {});
  }, []);

  const getWeatherIcon = (code) => {
    // Ensoleillé (0)
    if (code === 0) {
      return (
        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4" strokeWidth="2"/>
          <path strokeWidth="2" strokeLinecap="round" d="M12 2v2m0 16v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M2 12h2m16 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
      );
    }
    // Partiellement nuageux (1-3)
    if (code <= 3) {
      return (
        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"/>
        </svg>
      );
    }
    // Pluie (45-67)
    if (code <= 67) {
      return (
        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"/>
          <path strokeWidth="2" strokeLinecap="round" d="M8 19v2m4-2v2m4-2v2"/>
        </svg>
      );
    }
    // Autre (brouillard, orage, etc.) - default to partially cloudy
    return (
      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"/>
      </svg>
    );
  };

  return (
    <div className="space-y-1 text-[13px] text-gray-600">
      <div className="flex items-center gap-1.5">
        <Calendar className="w-4 h-4 text-purple-600" />
        <span>{format(currentTime, 'd MMM yyyy', { locale: fr })}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Clock className="w-4 h-4 text-purple-600" />
        <span>{format(currentTime, 'HH:mm:ss')}</span>
      </div>
      {weather && (
        <div className="flex items-center gap-1.5">
          {getWeatherIcon(weather.code)}
          <span>{weather.temp}°C</span>
        </div>
      )}
      <div className="flex items-center gap-1.5">
        <MapPin className="w-4 h-4 text-purple-600" />
        <span>Bruges (33)</span>
      </div>
    </div>
  );
}

export default function Layout({ children }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        {/* Desktop Sidebar */}
        <Sidebar className="hidden lg:flex border-r border-gray-200">
          <SidebarHeader className="border-b border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center shadow-md">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Comportements Enfants</h1>
                <p className="text-xs text-gray-500">ALSH App</p>
              </div>
            </div>
            <InfosTempsReel />
          </SidebarHeader>
          
          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 py-2 underline">
                MENU PRINCIPAL
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === `/${item.path}`;
                    return (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <Link to={createPageUrl(item.path)} className="flex items-center gap-3">
                            <Icon className="w-5 h-5" />
                            <span>{item.name}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <div className="mt-4 space-y-2">
              <div className="px-3 py-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider underline">SUIVI DE L&apos;ENFANT</span>
              </div>
              <div className="px-2">
                <ProchainSuiviSidebar />
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="px-3 py-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider underline">DERNIER MESSAGE DE L&apos;ÉQUIPE</span>
              </div>
              <div className="px-2">
                <ActualitesSidebar />
              </div>
            </div>

            <SidebarGroup className="mt-4">
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={location.pathname === '/Reglages'}>
                      <Link to={createPageUrl("Reglages")} className="flex items-center gap-3">
                        <Settings className="w-5 h-5" />
                        <span>Réglages</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-4 border-t border-gray-200">
            {user && (
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.full_name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="text-gray-500 hover:text-red-600"
                  title="Déconnexion"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            )}
          </SidebarFooter>
        </Sidebar>

        {/* Mobile Menu */}
        <div 
          className={`lg:hidden fixed right-0 top-0 bottom-0 w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Comportements Enfants</h1>
                  <p className="text-xs text-gray-500">ALSH App</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-500"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              <div className="space-y-1 mb-4">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === `/${item.path}`;
                  return (
                    <Link
                      key={item.name}
                      to={createPageUrl(item.path)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-purple-50 text-purple-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
                <Link
                  to={createPageUrl("Reglages")}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    location.pathname === '/Reglages'
                      ? 'bg-purple-50 text-purple-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">Réglages</span>
                </Link>
              </div>

              <div className="space-y-4 mt-6">
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2 underline">
                    SUIVI DE L&apos;ENFANT
                  </h3>
                  <ProchainSuiviSidebar />
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2 underline">
                    DERNIER MESSAGE DE L&apos;ÉQUIPE
                  </h3>
                  <ActualitesSidebar />
                </div>
              </div>
            </div>

            {user && (
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.full_name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="text-gray-500 hover:text-red-600"
                  >
                    <LogOut className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {mobileMenuOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <header className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-bold text-gray-900">Comportements Enfants</h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(true)}
              className="text-gray-700"
            >
              <Menu className="w-6 h-6" />
            </Button>
          </header>

          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};

