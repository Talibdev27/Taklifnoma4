import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CreditCard, Smartphone, ArrowLeft } from "lucide-react";

export default function Payment() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedMethod, setSelectedMethod] = useState<'click' | 'payme' | null>(null);

  const createPayment = useMutation({
    mutationFn: async (paymentMethod: 'click' | 'payme') => {
      const currentUserId = localStorage.getItem('currentUserId');
      if (!currentUserId) {
        throw new Error('Please login first');
      }

      const response = await apiRequest("POST", "/api/create-payment", {
        userId: parseInt(currentUserId),
        paymentMethod,
        amount: 50000 // 50,000 UZS
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Redirect to payment gateway
      window.location.href = data.paymentUrl;
    },
    onError: (error: any) => {
      toast({
        title: t('payment.error.title'),
        description: error.message || t('payment.error.description'),
        variant: "destructive",
      });
    }
  });

  const handlePayment = (method: 'click' | 'payme') => {
    setSelectedMethod(method);
    createPayment.mutate(method);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('common.back')}
        </Button>

        <Card className="shadow-xl border-primary/10">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {t('payment.title')}
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              {t('payment.description')}
            </p>
            <div className="text-center mt-4">
              <span className="text-2xl font-bold text-primary">50,000 UZS</span>
              <p className="text-sm text-muted-foreground">{t('payment.oneTime')}</p>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <Button
                variant="outline"
                size="lg"
                className="h-20 p-6 hover:border-primary hover:bg-primary/5 transition-all"
                onClick={() => handlePayment('click')}
                disabled={createPayment.isPending}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold">Click</h3>
                      <p className="text-sm text-muted-foreground">
                        {t('payment.click.description')}
                      </p>
                    </div>
                  </div>
                  {selectedMethod === 'click' && createPayment.isPending && (
                    <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
                  )}
                </div>
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="h-20 p-6 hover:border-primary hover:bg-primary/5 transition-all"
                onClick={() => handlePayment('payme')}
                disabled={createPayment.isPending}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Smartphone className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold">Payme</h3>
                      <p className="text-sm text-muted-foreground">
                        {t('payment.payme.description')}
                      </p>
                    </div>
                  </div>
                  {selectedMethod === 'payme' && createPayment.isPending && (
                    <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
                  )}
                </div>
              </Button>
            </div>

            <div className="bg-muted/30 p-4 rounded-lg mt-6">
              <h4 className="font-semibold mb-2">{t('payment.features.title')}</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>✓ {t('payment.features.unlimited')}</li>
                <li>✓ {t('payment.features.customization')}</li>
                <li>✓ {t('payment.features.rsvp')}</li>
                <li>✓ {t('payment.features.photos')}</li>
                <li>✓ {t('payment.features.guestbook')}</li>
                <li>✓ {t('payment.features.support')}</li>
              </ul>
            </div>

            <div className="text-center text-xs text-muted-foreground mt-4">
              {t('payment.secure')}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}