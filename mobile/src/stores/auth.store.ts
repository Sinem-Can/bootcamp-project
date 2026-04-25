import * as SecureStore from "expo-secure-store";
import { create } from "zustand";

type AuthState = {
  accessToken: string | null;
  isHydrated: boolean;
  initialRoute: "Home" | "ProfileMatrix";
  setAccessToken: (token: string | null) => Promise<void>;
  setInitialRoute: (route: "Home" | "ProfileMatrix") => void;
  hydrate: () => Promise<void>;
  logout: () => Promise<void>;
};

const TOKEN_KEY = "temizsepet.accessToken";

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  isHydrated: false,
  initialRoute: "Home",
  setAccessToken: async (token) => {
    if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
    else await SecureStore.deleteItemAsync(TOKEN_KEY);
    set({ accessToken: token });
  },
  setInitialRoute: (route) => set({ initialRoute: route }),
  hydrate: async () => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    set({ accessToken: token ?? null, isHydrated: true, initialRoute: "Home" });
  },
  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    set({ accessToken: null, initialRoute: "Home" });
  },
}));

export const authStore = useAuthStore;

