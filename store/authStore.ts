import AsyncStorage from '@react-native-async-storage/async-storage';

interface Division {
  id?: number;
  name: string;
  area?: {
    id?: number;
    name: string;
  };
}

interface Area {
  id?: number;
  name: string;
}

interface User {
  id?: number;
  nip: string;
  name: string;
  role: string;
  email?: string;
  join_date?: string;
  division_id?: Division | number;
  division?: Division;
  area?: Area;
  division_name?: string;
  area_name?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

class AuthStore {
  private state: AuthState = {
    isAuthenticated: false,
    user: null,
    token: null,
  };

  private listeners: ((state: AuthState) => void)[] = [];

  subscribe(listener: (state: AuthState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.state));
  }

  getState() {
    return this.state;
  }

  async login(token: string, user: User) {
    this.state = {
      isAuthenticated: true,
      user,
      token,
    };
    
    // Save to AsyncStorage
    await AsyncStorage.setItem('auth_token', token);
    await AsyncStorage.setItem('auth_user', JSON.stringify(user));
    
    this.notify();
  }

  async logout() {
    this.state = {
      isAuthenticated: false,
      user: null,
      token: null,
    };
    
    // Clear AsyncStorage
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('auth_user');
    
    this.notify();
  }

  async loadFromStorage() {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const userStr = await AsyncStorage.getItem('auth_user');
      
      if (token && userStr) {
        const user = JSON.parse(userStr);
        this.state = {
          isAuthenticated: true,
          user,
          token,
        };
        this.notify();
      }
    } catch (error) {
      console.error('Error loading auth state:', error);
    }
  }
}

export const authStore = new AuthStore();
