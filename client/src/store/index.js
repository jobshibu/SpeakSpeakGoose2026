import { create } from 'zustand';

const loadAuth = () => {
  try {
    return {
      token: localStorage.getItem('token'),
      userId: localStorage.getItem('userId'),
    };
  } catch {
    return { token: null, userId: null };
  }
};

const useAppStore = create((set) => ({
  ...loadAuth(),
  userStats: null,
  currentPhrase: null,
  currentSession: {
    attempts: [],
    finalScore: 0,
  },

  setAuth: (token, userId) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userId', userId);
    set({ token, userId });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    set({ token: null, userId: null, userStats: null });
  },

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
