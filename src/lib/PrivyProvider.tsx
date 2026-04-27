import React, { createContext, useContext, useEffect, useState } from 'react';
import { PrivyProvider as BasePrivyProvider, usePrivy as useBasePrivy } from '@privy-io/react-auth';

// --- Types ---
interface SavedCard {
  dataUrl: string;
  name: string;
  discord: string;
  sectionId: string;
  earnedAt: string;
}

interface PrivyContextType {
  user: any;
  loading: boolean;
  authenticated: boolean;
  login: () => void;
  logout: () => void;
  saveCard: (sectionId: string, cardData: Omit<SavedCard, 'sectionId' | 'earnedAt'>) => Promise<void>;
  userCards: Record<string, SavedCard[]>;
}

const PrivyContext = createContext<PrivyContextType | undefined>(undefined);

// --- Inner Provider to access useBasePrivy ---
const PrivyDataWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, authenticated, ready, login, logout } = useBasePrivy();
  const [userCards, setUserCards] = useState<Record<string, SavedCard[]>>({});
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Persistence Logic: Load cards from LocalStorage
  useEffect(() => {
    console.log("PrivyDataWrapper effect triggered:", { ready, authenticated, user: !!user });
    if (ready) {
      if (authenticated && user) {
        const storageKey = `rialo_cards_${user.id}`;
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          try {
            setUserCards(JSON.parse(saved));
          } catch (e) {
            console.error("Failed to parse saved cards:", e);
            setUserCards({});
          }
        } else {
          setUserCards({});
        }
      } else {
        setUserCards({});
      }
      setIsDataLoading(false);
    }
  }, [ready, authenticated, user]);

  const saveCard = async (sectionId: string, cardData: Omit<SavedCard, 'sectionId' | 'earnedAt'>) => {
    if (!user) return;

    const newCard: SavedCard = {
      ...cardData,
      sectionId,
      earnedAt: new Date().toISOString()
    };

    const storageKey = `rialo_cards_${user.id}`;
    const currentCards = { ...userCards };
    
    if (!currentCards[sectionId]) {
      currentCards[sectionId] = [];
    }
    currentCards[sectionId].push(newCard);

    // Save to State and LocalStorage
    setUserCards(currentCards);
    localStorage.setItem(storageKey, JSON.stringify(currentCards));
  };

  // Debugging
  useEffect(() => {
    (window as any).privyDebug = { ready, authenticated, user, isDataLoading };
    console.log('Privy Provider State:', { ready, authenticated, user: !!user, isDataLoading });
  }, [ready, authenticated, user, isDataLoading]);

  return (
    <PrivyContext.Provider value={{ 
      user, 
      loading: !ready || isDataLoading, 
      authenticated,
      login, 
      logout, 
      saveCard, 
      userCards 
    }}>
      {children}
    </PrivyContext.Provider>
  );
};

// --- Main Exported Provider ---
export const PrivyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Real Privy App ID provided by user
  const PRIVY_APP_ID = "cmoh5pwcy00rg0ei8y9mda935"; 

  return (
    <BasePrivyProvider
      appId={PRIVY_APP_ID}
      onSuccess={() => console.log('Privy initialized successfully')}
      config={{
        loginMethods: ['google', 'twitter', 'email', 'wallet'],
        appearance: {
          theme: 'dark',
          accentColor: '#C8A96A',
          showWalletLoginFirst: false,
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
      <PrivyDataWrapper>
        {children}
      </PrivyDataWrapper>
    </BasePrivyProvider>
  );
};

export const usePrivy = () => {
  const context = useContext(PrivyContext);
  if (context === undefined) {
    throw new Error('usePrivy must be used within a PrivyProvider');
  }
  return context;
};

// Alias useFirebase to usePrivy for easier migration if needed, 
// but we'll update the components directly.
export const useFirebase = usePrivy;
