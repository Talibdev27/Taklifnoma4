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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Language Toggle */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex-1">
            <h1 className="text-4xl font-playfair font-bold text-charcoal mb-4">
              {t('dashboard.myWeddingWebsites')}
            </h1>
            <p className="text-lg text-charcoal opacity-70">
              {t('dashboard.manageWebsites')}
            </p>
          </div>
          <div className="ml-4">
            <LanguageToggle />
          </div>
        </div>

        {/* Create New Wedding Button */}
        <div className="text-center mb-8">
          <Link href="/create-wedding">
            <Button className="wedding-button">
              <Plus className="h-5 w-5 mr-2" />
              {t('dashboard.createNewWebsite')}
            </Button>
          </Link>
        </div>

        {/* Weddings Grid */}
        {weddings.length === 0 ? (
          <Card className="wedding-card text-center p-12">
            <CardContent>
              <Heart className="h-16 w-16 text-romantic-gold mx-auto mb-6" />
              <h3 className="text-xl font-playfair font-semibold text-charcoal mb-4">
                {t('dashboard.noWeddingsYet')}
              </h3>
              <p className="text-charcoal opacity-70 mb-6">
                {t('dashboard.createFirstWebsite')}
              </p>
              <Link href="/create-wedding">
                <Button className="wedding-button">
                  <Plus className="h-5 w-5 mr-2" />
                  {t('dashboard.createYourFirst')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {weddings.map((wedding: Wedding) => (
              <Card key={wedding.id} className="wedding-card hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-playfair text-charcoal">
                      {wedding.bride} & {wedding.groom}
                    </CardTitle>
                    <Badge variant={wedding.isPublic ? "default" : "secondary"}>
                      {wedding.isPublic ? t('dashboard.public') : t('dashboard.private')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Wedding Details */}
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-charcoal opacity-70">
                      <Calendar className="h-4 w-4 mr-2 text-romantic-gold" />
                      {formatDate(wedding.weddingDate)}
                    </div>
                    <div className="flex items-center text-sm text-charcoal opacity-70">
                      <MapPin className="h-4 w-4 mr-2 text-romantic-gold" />
                      {wedding.venue}
                    </div>
                    <div className="flex items-center text-sm text-charcoal opacity-70">
                      <Heart className="h-4 w-4 mr-2 text-romantic-gold" />
                      {wedding.template.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4">
                    <Link href={`/wedding/${wedding.uniqueUrl}`}>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="h-4 w-4 mr-1" />
                        {t('dashboard.view')}
                      </Button>
                    </Link>
                    <Link href={`/manage/${wedding.uniqueUrl}`}>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="h-4 w-4 mr-1" />
                        {t('dashboard.manage')}
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const url = `${window.location.origin}/wedding/${wedding.uniqueUrl}`;
                        navigator.clipboard.writeText(url);
                        // Could add a toast notification here
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Wedding URL */}
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-charcoal opacity-50 truncate">
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