import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUserId = localStorage.getItem('autorah_user_id');
    if (storedUserId) {
      fetchUser(storedUserId);
    } else {
      setLoading(false);
    }
  }, []);

  async function fetchUser(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error || !data) {
        localStorage.removeItem('autorah_user_id');
        setUser(null);
      } else {
        setUser(data);
      }
    } catch (err) {
      console.error('Error restoring session:', err);
      localStorage.removeItem('autorah_user_id');
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();

      if (error || !data) throw new Error('Credenciales incorrectas');

      setUser(data);
      localStorage.setItem('autorah_user_id', data.id);
      return data;
    } catch (error) {
      throw error;
    }
  }

  async function register(userData) {
    try {
      // Check if email exists
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('email', userData.email)
        .maybeSingle();

      if (existing) throw new Error('El correo ya está registrado');

      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select()
        .single();

      if (error) throw error;

      setUser(data);
      localStorage.setItem('autorah_user_id', data.id);
      return data;
    } catch (error) {
      throw error;
    }
  }

  function signOut() {
    setUser(null);
    localStorage.removeItem('autorah_user_id');
  }

  const value = {
    user,
    profile: user, // For compatibility
    loading,
    login,
    register,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
