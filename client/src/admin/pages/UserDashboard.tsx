import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LanguageToggle } from "@/website/components/language-toggle";
import { Heart, Calendar, MapPin, Users, Eye, Edit, Plus, ExternalLink } from "lucide-react";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import type { User } from "@shared/schema";

interface Wedding {
  id: number;
  bride: string;
  groom: string;
  weddingDate: string;
  venue: string;
  uniqueUrl: string;
  isPublic: boolean;
  isApproved: boolean;
  template: string;
}

export default function UserDashboard() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();

  // Check current user role for access control
  const { data: currentUser } = useQuery<User>({
    queryKey: ['/api/user/current']
  });

  const { data: weddings = [], isLoading } = useQuery<Wedding[]>({
    queryKey: ['/api/user/weddings']
  });

  // Redirect guest managers to their restricted dashboard
  useEffect(() => {
    if (currentUser && currentUser.role === 'guest_manager') {
      navigate('/guest-manager');
    }
  }, [currentUser, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-soft-white to-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-romantic-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMMM dd, yyyy');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-white to-white">
      {/* Top Navigation */}
      <div className="w-full bg-white/80 backdrop-blur-sm border-b border-taklif-gold/10 px-4 sm:px-6 py-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img 
              src="/takliflinklogo.jpg" 
              alt="Taklif Link" 
              className="h-10 w-10 object-contain rounded-full shadow-md"
            />
            <h1 className="text-xl sm:text-2xl font-playfair font-bold text-taklif-burgundy">
              Taklif Link
            </h1>
          </Link>
          <LanguageToggle />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Page Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-playfair font-bold text-taklif-navy mb-2">
            {t('dashboard.myWeddingWebsites')}
          </h2>
          <p className="text-base sm:text-lg text-taklif-navy/70">
            {t('dashboard.manageWebsites')}
          </p>
        </div>

        {/* Create New Wedding Button */}
        <div className="text-center mb-6 sm:mb-8">
          <Link href="/create-wedding">
            <Button className="wedding-button w-full sm:w-auto">
              <Plus className="h-5 w-5 mr-2" />
              {t('dashboard.createNewWebsite')}
            </Button>
          </Link>
        </div>

        {/* Weddings Grid */}
        {weddings.length === 0 ? (
          <Card className="wedding-card text-center p-8 sm:p-12">
            <CardContent>
              <Heart className="h-12 w-12 sm:h-16 sm:w-16 text-taklif-gold mx-auto mb-4 sm:mb-6" />
              <h3 className="text-lg sm:text-xl font-playfair font-semibold text-taklif-navy mb-3 sm:mb-4">
                {t('dashboard.noWeddingsYet')}
              </h3>
              <p className="text-taklif-navy/70 mb-4 sm:mb-6 text-sm sm:text-base">
                {t('dashboard.createFirstWebsite')}
              </p>
              <Link href="/create-wedding">
                <Button className="wedding-button w-full sm:w-auto">
                  <Plus className="h-5 w-5 mr-2" />
                  {t('dashboard.createYourFirst')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {weddings.map((wedding: Wedding) => (
              <Card key={wedding.id} className="wedding-card hover:shadow-xl transition-all duration-300 border-taklif-gold/20">
                <CardHeader className="pb-3 sm:pb-4">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-base sm:text-lg font-playfair text-taklif-navy line-clamp-2">
                      {wedding.bride} & {wedding.groom}
                    </CardTitle>
                    <div className="flex flex-col gap-1">
                      <Badge variant={wedding.isPublic ? "default" : "secondary"} className="shrink-0">
                        {wedding.isPublic ? t('dashboard.public') : t('dashboard.private')}
                      </Badge>
                      <Badge 
                        variant={wedding.isApproved ? "default" : "destructive"} 
                        className={`shrink-0 text-xs ${wedding.isApproved ? 'bg-green-500 hover:bg-green-600' : 'bg-amber-500 hover:bg-amber-600'}`}
                      >
                        {wedding.isApproved ? '✓ Active' : '⏳ Pending'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  {/* Wedding Details */}
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center text-xs sm:text-sm text-taklif-navy/70">
                      <Calendar className="h-4 w-4 mr-2 text-taklif-gold shrink-0" />
                      <span className="truncate">{formatDate(wedding.weddingDate)}</span>
                    </div>
                    <div className="flex items-center text-xs sm:text-sm text-taklif-navy/70">
                      <MapPin className="h-4 w-4 mr-2 text-taklif-gold shrink-0" />
                      <span className="truncate">{wedding.venue}</span>
                    </div>
                    <div className="flex items-center text-xs sm:text-sm text-taklif-navy/70">
                      <Heart className="h-4 w-4 mr-2 text-taklif-gold shrink-0" />
                      <span className="truncate">{wedding.template.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-3 sm:pt-4">
                    <Link href={`/wedding/${wedding.uniqueUrl}`} className="flex-1">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full border-taklif-gold/30 hover:bg-taklif-gold hover:text-white"
                        disabled={!wedding.isApproved}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {t('dashboard.view')}
                      </Button>
                    </Link>
                    <Link href={`/manage/${wedding.uniqueUrl}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full border-taklif-burgundy/30 hover:bg-taklif-burgundy hover:text-white">
                        <Edit className="h-4 w-4 mr-1" />
                        {t('dashboard.manage')}
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="sm:w-auto border-taklif-navy/30 hover:bg-taklif-navy hover:text-white"
                      disabled={!wedding.isApproved}
                      onClick={() => {
                        const url = `${window.location.origin}/wedding/${wedding.uniqueUrl}`;
                        navigator.clipboard.writeText(url);
                        // Could add a toast notification here
                      }}
                    >
                      <ExternalLink className="h-4 w-4 sm:mr-0 mr-1" />
                      <span className="sm:hidden">Share</span>
                    </Button>
                  </div>

                  {/* Pending Approval Message */}
                  {!wedding.isApproved && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-xs text-amber-900 text-center">
                        ⏳ {t('dashboard.pendingApprovalMessage')}
                      </p>
                    </div>
                  )}

                  {/* Wedding URL */}
                  <div className="pt-2 border-t border-taklif-gold/10">
                    <p className="text-xs text-taklif-navy/50 truncate">
                      /wedding/{wedding.uniqueUrl}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Stats Section for Users with Weddings */}
        {weddings.length > 0 && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="wedding-card text-center">
              <CardContent className="p-6">
                <Heart className="h-8 w-8 text-romantic-gold mx-auto mb-3" />
                <p className="text-2xl font-bold text-charcoal">{weddings.length}</p>
                <p className="text-sm text-charcoal opacity-70">Wedding Website{weddings.length > 1 ? 's' : ''}</p>
              </CardContent>
            </Card>
            <Card className="wedding-card text-center">
              <CardContent className="p-6">
                <Users className="h-8 w-8 text-romantic-gold mx-auto mb-3" />
                <p className="text-2xl font-bold text-charcoal">
                  {weddings.filter((w: Wedding) => w.isPublic).length}
                </p>
                <p className="text-sm text-charcoal opacity-70">Public Websites</p>
              </CardContent>
            </Card>
            <Card className="wedding-card text-center">
              <CardContent className="p-6">
                <Calendar className="h-8 w-8 text-romantic-gold mx-auto mb-3" />
                <p className="text-2xl font-bold text-charcoal">
                  {weddings.filter((w: Wedding) => new Date(w.weddingDate) > new Date()).length}
                </p>
                <p className="text-sm text-charcoal opacity-70">Upcoming Events</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}