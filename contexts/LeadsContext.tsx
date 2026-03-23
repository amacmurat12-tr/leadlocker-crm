import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/contexts/AuthContext";

export type LeadStatus = "active" | "pending" | "closed" | "lost";
export type PropertyType =
  | "house"
  | "apartment"
  | "condo"
  | "townhouse"
  | "land"
  | "commercial"
  | "luxury"
  | "villa"
  | "tiny-house";

export type ListingType = "sale" | "rent";

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  budget: number;
  currency: string;
  bedrooms: number;
  bathrooms: number;
  hasGarage: boolean;
  garageSpots: number;
  hasPool: boolean;
  squareFootage: number;
  propertyType: PropertyType;
  listingType: ListingType;
  location: string;
  notes: string;
  status: LeadStatus;
  createdAt: number;
  updatedAt: number;
}

interface LeadsContextValue {
  leads: Lead[];
  addLead: (lead: Omit<Lead, "id" | "createdAt" | "updatedAt">) => Lead;
  updateLead: (id: string, updates: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  getLead: (id: string) => Lead | undefined;
  clearAllLeads: () => Promise<void>;
  isLoading: boolean;
  stats: {
    total: number;
    active: number;
    closed: number;
    totalBudget: number;
    avgBudget: number;
  };
}

const LeadsContext = createContext<LeadsContextValue | null>(null);

const LEGACY_STORAGE_KEY = "@leadlocker_leads";

function storageKey(userId: string): string {
  return `@leadlocker_leads_${userId}`;
}

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substring(2, 9);
}

export function LeadsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLeads([]);
      setLoadedUserId(null);
      setIsLoading(false);
      return;
    }

    if (loadedUserId === user.id) return;

    setIsLoading(true);
    const key = storageKey(user.id);

    AsyncStorage.getItem(key).then(async (data) => {
      if (data) {
        try {
          const parsed: Lead[] = JSON.parse(data);
          const migrated = parsed.map((l) => ({
            currency: "USD",
            garageSpots: 1,
            listingType: "sale" as ListingType,
            ...l,
          }));
          setLeads(migrated);
          setLoadedUserId(user.id);
          setIsLoading(false);
          return;
        } catch {}
      }

      // First login for this user — check if there are legacy (non-user-specific) leads to migrate
      try {
        const legacy = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
        if (legacy) {
          const parsed: Lead[] = JSON.parse(legacy);
          const migrated = parsed.map((l) => ({
            currency: "USD",
            garageSpots: 1,
            listingType: "sale" as ListingType,
            ...l,
          }));
          // Migrate legacy leads to this user's key
          await AsyncStorage.setItem(key, JSON.stringify(migrated));
          await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
          setLeads(migrated);
        } else {
          setLeads([]);
        }
      } catch {
        setLeads([]);
      }

      setLoadedUserId(user.id);
      setIsLoading(false);
    });
  }, [user]);

  const saveLeads = (newLeads: Lead[]) => {
    setLeads(newLeads);
    if (user) {
      AsyncStorage.setItem(storageKey(user.id), JSON.stringify(newLeads));
    }
  };

  const addLead = (leadData: Omit<Lead, "id" | "createdAt" | "updatedAt">): Lead => {
    const now = Date.now();
    const newLead: Lead = {
      ...leadData,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    saveLeads([newLead, ...leads]);
    return newLead;
  };

  const updateLead = (id: string, updates: Partial<Lead>) => {
    const updated = leads.map((l) =>
      l.id === id ? { ...l, ...updates, updatedAt: Date.now() } : l
    );
    saveLeads(updated);
  };

  const deleteLead = (id: string) => {
    saveLeads(leads.filter((l) => l.id !== id));
  };

  const getLead = (id: string) => leads.find((l) => l.id === id);

  const clearAllLeads = async () => {
    setLeads([]);
    if (user) {
      await AsyncStorage.removeItem(storageKey(user.id));
    }
  };

  const stats = useMemo(() => {
    const active = leads.filter((l) => l.status === "active").length;
    const closed = leads.filter((l) => l.status === "closed").length;
    const totalBudget = leads.reduce((sum, l) => sum + (l.budget || 0), 0);
    return {
      total: leads.length,
      active,
      closed,
      totalBudget,
      avgBudget: leads.length > 0 ? Math.round(totalBudget / leads.length) : 0,
    };
  }, [leads]);

  const value = useMemo(
    () => ({ leads, addLead, updateLead, deleteLead, getLead, clearAllLeads, isLoading, stats }),
    [leads, isLoading, stats]
  );

  return (
    <LeadsContext.Provider value={value}>{children}</LeadsContext.Provider>
  );
}

export function useLeads() {
  const ctx = useContext(LeadsContext);
  if (!ctx) throw new Error("useLeads must be used within LeadsProvider");
  return ctx;
}
