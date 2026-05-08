import { MobileGuestManager } from './mobile-guest-manager';

interface GuestListManagerProps {
  weddingId: number;
  className?: string;
}

export function GuestListManager({ weddingId, className = '' }: GuestListManagerProps) {
  // This component has been replaced by MobileGuestManager for better mobile UX
  // Redirecting to the mobile-optimized version
  return (
    <MobileGuestManager 
      weddingId={weddingId}
      className={className}
    />
  );
}