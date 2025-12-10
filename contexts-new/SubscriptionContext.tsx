import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import SubscriptionModal from "@/components/subscription/SubscriptionModal";

interface SubscriptionContextType {
  isSubscribed: boolean;
  planName: string | null;
  setSubscribed: (subscribed: boolean, plan?: string) => void;
  requireSubscription: (feature?: string) => boolean;
  openSubscriptionModal: (feature?: string) => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: ReactNode }) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [planName, setPlanName] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalFeature, setModalFeature] = useState<string | undefined>();

  const setSubscribed = (subscribed: boolean, plan?: string) => {
    setIsSubscribed(subscribed);
    setPlanName(plan || null);
  };

  const openSubscriptionModal = useCallback((feature?: string) => {
    setModalFeature(feature);
    setModalOpen(true);
  }, []);

  const requireSubscription = useCallback((feature?: string): boolean => {
    if (isSubscribed) return true;
    openSubscriptionModal(feature);
    return false;
  }, [isSubscribed, openSubscriptionModal]);

  return (
    <SubscriptionContext.Provider value={{ 
      isSubscribed, 
      planName, 
      setSubscribed,
      requireSubscription,
      openSubscriptionModal
    }}>
      {children}
      <SubscriptionModal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)}
        feature={modalFeature}
      />
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
};
