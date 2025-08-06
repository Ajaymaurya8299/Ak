import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  email: string;
  name: string;
  balance: number;
  createdAt: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  updateBalance: (newBalance: number) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // In demo mode, any email/password works
        // In production, this would make a real API call
        const existingUsers = JSON.parse(localStorage.getItem('demo_users') || '[]');
        let user = existingUsers.find((u: User) => u.email === email);
        
        if (!user) {
          throw new Error("User not found. Please sign up first.");
        }
        
        console.log("User logged in:", user.email);
        
        set({
          user,
          isAuthenticated: true
        });
      },

      signup: async (email: string, password: string, name: string) => {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if user already exists
        const existingUsers = JSON.parse(localStorage.getItem('demo_users') || '[]');
        const userExists = existingUsers.find((u: User) => u.email === email);
        
        if (userExists) {
          throw new Error("User already exists. Please login instead.");
        }
        
        // Create new user
        const newUser: User = {
          id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          email,
          name,
          balance: 1000, // Starting balance
          createdAt: Date.now()
        };
        
        // Save to demo storage
        existingUsers.push(newUser);
        localStorage.setItem('demo_users', JSON.stringify(existingUsers));
        
        console.log("User registered:", newUser.email);
        
        set({
          user: newUser,
          isAuthenticated: true
        });
      },

      logout: () => {
        console.log("User logged out");
        set({
          user: null,
          isAuthenticated: false
        });
      },

      updateBalance: (newBalance: number) => {
        const { user } = get();
        if (!user) return;
        
        const updatedUser = { ...user, balance: newBalance };
        
        // Update in demo storage
        const existingUsers = JSON.parse(localStorage.getItem('demo_users') || '[]');
        const userIndex = existingUsers.findIndex((u: User) => u.id === user.id);
        if (userIndex !== -1) {
          existingUsers[userIndex] = updatedUser;
          localStorage.setItem('demo_users', JSON.stringify(existingUsers));
        }
        
        set({ user: updatedUser });
      }
    }),
    {
      name: "aviator-auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);