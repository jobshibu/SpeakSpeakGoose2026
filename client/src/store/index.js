import { create } from 'zustand';

const useAppStore = create((set) => ({
  token: null,
  userId: null,
  userStats: null,
  currentPhrase: null,
  currentSession: {
    attempts: [],
    finalScore: 0,
  },

  setAuth: (token, userId) => set({ token, userId }),
  logout: () => set({ token: null, userId: null, userStats: null }),
  
  setUserStats: (stats) => set({ userStats: stats }),
  setCurrentPhrase: (phrase) => set({ currentPhrase: phrase }),
  
  updateSession: (attempt) => set((state) => ({
    currentSession: {
      ...state.currentSession,
      attempts: [...state.currentSession.attempts, attempt]
    }
  })),
  
  resetSession: () => set({
    currentSession: { attempts: [], finalScore: 0 }
  }),
  
  setFinalScore: (score) => set((state) => ({
    currentSession: { ...state.currentSession, finalScore: score }
  })),
}));

export default useAppStore;
