import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { useAuth } from "@/contexts/AuthContext";

const TRIAL_DAYS = 7;
const SUB_KEY = "@leadlocker_sub_status";
const SUB_PLAN_KEY = "@leadlocker_sub_plan";

export type PlanType = "monthly" | "yearly" | null;

interface SubscriptionContextValue {
  isProUser: boolean;
  isTrialActive: boolean;
  trialDaysRemaining: number;
  isSubscribed: boolean;
  plan: PlanType;
  isLoadingSubscription: boolean;
  subscribe: (plan: "monthly" | "yearly") => Promise<void>;
  restorePurchases: () => Promise<void>;
  openPaywall: () => void;
  paywallVisible: boolean;
  dismissPaywall: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [plan, setPlan] = useState<PlanType>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);
  const [paywallVisible, setPaywallVisible] = useState(false);

  const trialDaysRemaining = user
    ? Math.max(0, TRIAL_DAYS - Math.floor((Date.now() - user.createdAt) / 86400000))
    : 0;

  const isTrialActive = trialDaysRemaining > 0;
  const isProUser = isTrialActive || isSubscribed;

  useEffect(() => {
    if (!user) {
      setIsLoadingSubscription(false);
      return;
    }

    const loadSubscription = async () => {
      try {
        const [storedSub, storedPlan] = await AsyncStorage.multiGet([SUB_KEY, SUB_PLAN_KEY]);
        if (storedSub[1] === "true") {
          setIsSubscribed(true);
          setPlan((storedSub[1] ? storedPlan[1] : null) as PlanType);
        }

        if (Platform.OS !== "web") {
          try {
            const Purchases = (await import("react-native-purchases")).default;
            const customerInfo = await Purchases.getCustomerInfo();
            const hasActive = Object.keys(customerInfo.entitlements.active).length > 0;
            if (hasActive) {
              setIsSubscribed(true);
              await AsyncStorage.setItem(SUB_KEY, "true");
            }
          } catch {}
        }
      } catch {}
      setIsLoadingSubscription(false);
    };

    loadSubscription();
  }, [user]);

  useEffect(() => {
    if (!user || isLoadingSubscription) return;
    if (!isProUser) {
      const timer = setTimeout(() => setPaywallVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, [isProUser, isLoadingSubscription, user]);

  const subscribe = useCallback(async (selectedPlan: "monthly" | "yearly") => {
    if (Platform.OS !== "web") {
      try {
        const Purchases = (await import("react-native-purchases")).default;

        // Try offering packages first
        let purchased = false;
        try {
          const offerings = await Purchases.getOfferings();
          const current = offerings.current;
          if (current) {
            const pkg = selectedPlan === "monthly" ? current.monthly : current.annual;
            if (pkg) {
              const { customerInfo } = await Purchases.purchasePackage(pkg);
              if (Object.keys(customerInfo.entitlements.active).length > 0) {
                purchased = true;
              }
            }
          }
        } catch (offeringErr: any) {
          if (offeringErr?.userCancelled) return;
        }

        // Fallback: purchase directly by product ID
        if (!purchased) {
          const productId = selectedPlan === "monthly"
            ? "leadlocker_monthly"
            : "leadlocker_yearly";
          const products = await Purchases.getProducts([productId]);
          if (products.length > 0) {
            const { customerInfo } = await Purchases.purchaseStoreProduct(products[0]);
            if (Object.keys(customerInfo.entitlements.active).length > 0) {
              purchased = true;
            }
          }
        }

        if (purchased) {
          setIsSubscribed(true);
          setPlan(selectedPlan);
          await AsyncStorage.multiSet([[SUB_KEY, "true"], [SUB_PLAN_KEY, selectedPlan]]);
          setPaywallVisible(false);
          return;
        }
      } catch (e: any) {
        if (!e?.userCancelled) throw e;
        return;
      }
    }
    setIsSubscribed(true);
    setPlan(selectedPlan);
    await AsyncStorage.multiSet([[SUB_KEY, "true"], [SUB_PLAN_KEY, selectedPlan]]);
    setPaywallVisible(false);
  }, []);

  const restorePurchases = useCallback(async () => {
    if (Platform.OS !== "web") {
      try {
        const Purchases = (await import("react-native-purchases")).default;
        const customerInfo = await Purchases.restorePurchases();
        const hasActive = Object.keys(customerInfo.entitlements.active).length > 0;
        if (hasActive) {
          setIsSubscribed(true);
          await AsyncStorage.setItem(SUB_KEY, "true");
          setPaywallVisible(false);
        }
      } catch {}
    }
  }, []);

  const openPaywall = useCallback(() => setPaywallVisible(true), []);
  const dismissPaywall = useCallback(() => setPaywallVisible(false), []);

  return (
    <SubscriptionContext.Provider
      value={{
        isProUser,
        isTrialActive,
        trialDaysRemaining,
        isSubscribed,
        plan,
        isLoadingSubscription,
        subscribe,
        restorePurchases,
        openPaywall,
        paywallVisible,
        dismissPaywall,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscription must be used within SubscriptionProvider");
  return ctx;
}
