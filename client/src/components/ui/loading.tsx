import { Heart, Sparkles, Flower, Gift, Camera } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  };

  return (
    <div className={cn("animate-spin", sizeClasses[size], className)}>
      <Heart className="w-full h-full text-gold" />
    </div>
  );
}

interface WeddingLoadingProps {
  message?: string;
  className?: string;
}

export function WeddingLoading({ message = "Loading...", className }: WeddingLoadingProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center min-h-[200px] space-y-6", className)}>
      {/* Animated Hearts */}
      <div className="relative">
        <div className="flex items-center justify-center space-x-2">
          <Heart 
            className="w-8 h-8 text-gold animate-pulse" 
            style={{ animationDelay: "0s" }}
          />
          <Heart 
            className="w-10 h-10 text-gold animate-pulse" 
            style={{ animationDelay: "0.5s" }}
          />
          <Heart 
            className="w-8 h-8 text-gold animate-pulse" 
            style={{ animationDelay: "1s" }}
          />
        </div>
        
        {/* Floating sparkles */}
        <div className="absolute -top-2 -left-2">
          <Sparkles className="w-4 h-4 text-sage animate-bounce" />
        </div>
        <div className="absolute -top-2 -right-2">
          <Sparkles className="w-4 h-4 text-sage animate-bounce" style={{ animationDelay: "0.7s" }} />
        </div>
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
          <Sparkles className="w-4 h-4 text-sage animate-bounce" style={{ animationDelay: "1.4s" }} />
        </div>
      </div>

      {/* Loading message */}
      <p className="text-charcoal/70 font-medium animate-pulse">{message}</p>
    </div>
  );
}

export function WeddingPageLoading({ message = "Preparing your special moment..." }: WeddingLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-cream via-white to-sage/10 space-y-8">
      {/* Main illustration */}
      <div className="relative">
        {/* Wedding rings animation */}
        <div className="flex items-center justify-center space-x-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gold rounded-full animate-spin-slow" />
            <div className="absolute inset-2 w-12 h-12 border-2 border-sage rounded-full animate-spin-reverse" />
          </div>
          <Heart className="w-12 h-12 text-gold animate-pulse" />
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gold rounded-full animate-spin-slow" style={{ animationDelay: "0.5s" }} />
            <div className="absolute inset-2 w-12 h-12 border-2 border-sage rounded-full animate-spin-reverse" style={{ animationDelay: "0.5s" }} />
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
          <Flower className="w-6 h-6 text-sage animate-bounce" />
        </div>
        <div className="absolute -bottom-6 -left-6">
          <Gift className="w-5 h-5 text-gold animate-bounce" style={{ animationDelay: "0.8s" }} />
        </div>
        <div className="absolute -bottom-6 -right-6">
          <Gift className="w-5 h-5 text-gold animate-bounce" style={{ animationDelay: "1.2s" }} />
        </div>
        
        {/* Floating sparkles around */}
        <div className="absolute -top-8 -left-8">
          <Sparkles className="w-4 h-4 text-sage/60 animate-pulse" style={{ animationDelay: "0.3s" }} />
        </div>
        <div className="absolute -top-4 -right-8">
          <Sparkles className="w-3 h-3 text-gold/60 animate-pulse" style={{ animationDelay: "0.9s" }} />
        </div>
        <div className="absolute -bottom-4 left-12">
          <Sparkles className="w-4 h-4 text-sage/60 animate-pulse" style={{ animationDelay: "1.5s" }} />
        </div>
        <div className="absolute -bottom-8 right-12">
          <Sparkles className="w-3 h-3 text-gold/60 animate-pulse" style={{ animationDelay: "2s" }} />
        </div>
      </div>

      {/* Loading text */}
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-playfair font-bold text-charcoal animate-pulse">
          {message}
        </h2>
        <div className="flex justify-center space-x-1">
          <div className="w-2 h-2 bg-gold rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
          <div className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
        </div>
      </div>
    </div>
  );
}

export function CreateWeddingLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] space-y-6">
      {/* Wedding cake illustration */}
      <div className="relative">
        {/* Cake layers */}
        <div className="flex flex-col items-center space-y-1">
          <div className="w-16 h-6 bg-gradient-to-r from-cream to-white rounded-lg border-2 border-gold/30 animate-pulse" />
          <div className="w-20 h-8 bg-gradient-to-r from-cream to-white rounded-lg border-2 border-gold/30 animate-pulse" style={{ animationDelay: "0.3s" }} />
          <div className="w-24 h-10 bg-gradient-to-r from-cream to-white rounded-lg border-2 border-gold/30 animate-pulse" style={{ animationDelay: "0.6s" }} />
        </div>

        {/* Cake topper */}
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
          <Heart className="w-4 h-4 text-gold animate-bounce" />
        </div>

        {/* Decorative hearts */}
        <div className="absolute -top-4 -left-4">
          <Heart className="w-3 h-3 text-sage animate-pulse" style={{ animationDelay: "0.5s" }} />
        </div>
        <div className="absolute -top-4 -right-4">
          <Heart className="w-3 h-3 text-sage animate-pulse" style={{ animationDelay: "1s" }} />
        </div>
        <div className="absolute -bottom-2 -left-6">
          <Sparkles className="w-4 h-4 text-gold animate-bounce" style={{ animationDelay: "0.7s" }} />
        </div>
        <div className="absolute -bottom-2 -right-6">
          <Sparkles className="w-4 h-4 text-gold animate-bounce" style={{ animationDelay: "1.3s" }} />
        </div>
      </div>

      <p className="text-charcoal/70 font-medium animate-pulse">Creating your perfect wedding website...</p>
    </div>
  );
}

interface PhotoLoadingProps {
  count?: number;
}

export function PhotoLoading({ count = 6 }: PhotoLoadingProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="aspect-square bg-gradient-to-br from-cream to-sage/10 rounded-lg animate-pulse border-2 border-gold/20"
          style={{ animationDelay: `${index * 0.2}s` }}
        >
          <div className="flex items-center justify-center h-full">
            <Camera className="w-8 h-8 text-gold/40" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function GuestListLoading() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center space-x-4 p-4 bg-white rounded-lg border animate-pulse"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="w-10 h-10 bg-gold/20 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-sage/20 rounded w-3/4" />
            <div className="h-3 bg-sage/20 rounded w-1/2" />
          </div>
          <div className="w-20 h-6 bg-gold/20 rounded" />
        </div>
      ))}
    </div>
  );
}