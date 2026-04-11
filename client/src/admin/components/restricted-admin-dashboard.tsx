import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Calendar, Plus, Settings, ArrowLeft, Languages, MessageSquare } from "lucide-react";
import { Link } from "wouter";
import type { Wedding, User } from "@shared/schema";
import { GuestManagerGuestBook } from "./guest-manager-guest-book";

interface RestrictedAdminDashboardProps {
  user: User;
}

export function RestrictedAdminDashboard({ user }: RestrictedAdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"weddings" | "guestbook">("weddings");
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (language: string) => {
    i18n.changeLanguage(language);
    localStorage.setItem('language', language);
    // Force a re-render by triggering a storage event
    window.dispatchEvent(new Event('storage'));
  };

  // Fetch user's accessible weddings
  const { data: weddings = [], isLoading: weddingsLoading } = useQuery<Wedding[]>({
    queryKey: ['/api/guest-manager/weddings'],
  });

  const restrictedTabs = [
    {
      id: "weddings" as const,
      label: t('guestManager.weddingManagement'),
      icon: Calendar,
      description: t('guestManager.manageAssignedWeddings')
    },
    {
      id: "guestbook" as const,
      label: t('guestManager.guestBookManagement'),
      icon: MessageSquare,
      description: t('guestManager.manageGuestBook')
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-Optimized Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-6">
            <div className="flex items-center min-w-0 flex-1">
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{t('guestManager.weddingManagement')}</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <Languages className="h-4 w-4 text-gray-500" />
                <Select value={i18n.language} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="uz">O'zbekcha</SelectItem>
                    <SelectItem value="ru">Русский</SelectItem>
                    <SelectItem value="kk">Қазақша</SelectItem>
                    <SelectItem value="kaa">Қарақалпақша</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <span className="text-sm text-gray-600">{t('guestManager.welcome')}, {user.name}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  // Guest managers should go to landing page
                  window.location.href = '/';
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('guestManager.backToDashboard')}
              </Button>
            </div>
          </div>

          {/* Mobile-Optimized Navigation Tabs */}
          <div className="flex space-x-4 sm:space-x-8 overflow-x-auto">
            {restrictedTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1 sm:space-x-2 py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <tab.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile-Optimized Content */}
      <div className="max-w-7xl mx-auto py-3 sm:py-6 px-3 sm:px-6 lg:px-8">
        {activeTab === "weddings" && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <h2 className="text-base sm:text-lg font-medium text-gray-900">{t('guestManager.assignedWeddings')}</h2>
              <div className="flex items-center">
                <Badge variant="outline" className="text-xs">
                  {weddings.length} {t('guestManager.wedding')}{weddings.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </div>

            {weddingsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="pb-2 sm:pb-4">
                      <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-2 sm:h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : weddings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {weddings.map((wedding: any) => (
                  <Card key={wedding.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3 sm:pb-6">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-sm sm:text-lg truncate">
                            {wedding.bride} & {wedding.groom}
                          </CardTitle>
                          <p className="text-xs sm:text-sm text-gray-600 mt-1">
                            📅 {new Date(wedding.weddingDate).toLocaleDateString()}
                          </p>
                        </div>
                        {wedding.isManaged && (
                          <Badge variant="secondary" className="text-xs flex-shrink-0">
                            {t('guestManager.managed')}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3 sm:space-y-4">
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-gray-700">📍 {t('guestManager.venue')}</p>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">{wedding.venue || 'Not specified'}</p>
                        </div>
                        
                        <div className="flex items-center justify-center sm:justify-end pt-2">
                          <Button size="sm" asChild className="w-full sm:w-auto text-xs sm:text-sm min-h-[44px] sm:min-h-[36px]">
                            <Link href={`/manage/${wedding.uniqueUrl}`}>
                              <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                              {t('guestManager.manageGuests')}
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8 sm:py-12 px-4">
                  <Calendar className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-gray-400 mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">{t('guestManager.noAssignedWeddings')}</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                    {t('guestManager.noAssignedWeddingsDesc')}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {t('guestManager.contactAdmin')}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === "guestbook" && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <h2 className="text-base sm:text-lg font-medium text-gray-900">{t('guestManager.guestBookManagement')}</h2>
            </div>

            {weddingsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="pb-2 sm:pb-4">
                      <div className="h-3 sm:h-4 bg-gray-200 rounded w-3/4"></div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : weddings.length > 0 ? (
              <div className="space-y-4 sm:space-y-6">
                {weddings.map((wedding: any) => (
                  <Card key={wedding.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3 sm:pb-6">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-sm sm:text-lg truncate">
                            {wedding.bride} & {wedding.groom}
                          </CardTitle>
                          <p className="text-xs sm:text-sm text-gray-600 mt-1">
                            📅 {new Date(wedding.weddingDate).toLocaleDateString()}
                          </p>
                        </div>
                        <Button size="sm" asChild className="text-xs sm:text-sm min-h-[44px] sm:min-h-[36px]">
                          <Link href={`/wedding/${wedding.uniqueUrl}`} target="_blank">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            {t('guestManager.viewWedding')}
                          </Link>
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <GuestManagerGuestBook weddingId={wedding.id} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8 sm:py-12 px-4">
                  <MessageSquare className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-gray-400 mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">{t('guestManager.noAssignedWeddings')}</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                    {t('guestManager.noAssignedWeddingsDesc')}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {t('guestManager.contactAdmin')}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

      </div>

    </div>
  );
}