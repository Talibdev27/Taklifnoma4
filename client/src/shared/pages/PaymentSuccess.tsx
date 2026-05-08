import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, AlertCircle, ArrowRight } from "lucide-react";

export default function PaymentSuccess() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(true);

  const verifyPayment = useMutation({
    mutationFn: async ({ orderId, method }: { orderId: string; method: string }) => {
      const response = await apiRequest("POST", "/api/verify-payment", {
        orderId,
        paymentMethod: method
      });
      return response.json();
    },
    onSuccess: () => {
      setVerified(true);
      setVerifying(false);
      toast({
        title: t('payment.success.title'),
        description: t('payment.success.description'),
      });
    },
    onError: (error: any) => {
      setVerifying(false);
      toast({
        title: t('payment.error.title'),
        description: error.message || t('payment.error.verification'),
        variant: "destructive",
      });
    }
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('order');
    const method = urlParams.get('method');

    if (orderId && method) {
      verifyPayment.mutate({ orderId, method });
    } else {
      setVerifying(false);
    }
  }, []);

  const handleContinue = () => {
    setLocation('/create-wedding');
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">{t('payment.verifying.title')}</h2>
            <p className="text-muted-foreground">{t('payment.verifying.description')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {verified ? (
              <CheckCircle className="w-16 h-16 text-green-500" />
            ) : (
              <AlertCircle className="w-16 h-16 text-red-500" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {verified ? t('payment.success.title') : t('payment.error.title')}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            {verified 
              ? t('payment.success.message')
              : t('payment.error.message')
            }
          </p>
          
          {verified && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">
                {t('payment.success.nextSteps')}
              </h3>
              <p className="text-green-700 text-sm">
                {t('payment.success.createWebsite')}
              </p>
            </div>
          )}
          
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setLocation('/')}
              className="flex-1"
            >
              {t('common.home')}
            </Button>
            {verified && (
              <Button
                onClick={handleContinue}
                className="flex-1"
              >
                {t('payment.success.continue')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}