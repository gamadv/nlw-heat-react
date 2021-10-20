import React, { createContext, useEffect, useState } from 'react';
import { api } from '../services/api';

type User = {
  id: string;
  name: string;
  login: string;
  avatar_url: string;
};

type AuthContextData = {
  user: User | null;
  signInUrl: string;
  signOut: () => void;
};

type AuthRes = {
  authtoken: string;
  user: {
    id: string;
    login: string;
    name: string;
    avatar_url: string;
  };
};
const AuthContext = createContext({} as AuthContextData);

const AuthProvider: React.FC = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const signInUrl = `https://github.com/login/oauth/authorize?scope=user&client_id=5b16ecbf7aa1990ec7c9`;

  const signIn = async (githubCode: string) => {
    const { data } = await api.post<AuthRes>('authenticate', {
      code: githubCode,
    });

    const { authtoken, user } = data;

    localStorage.setItem('@dowhile:token', authtoken);
    api.defaults.headers.common.authorization = `Bearer ${authtoken}`;
    setUser(user);
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('@dowhile:token');
  };
  useEffect(() => {
    const hasToken = localStorage.getItem('@dowhile:token');

    if (hasToken) {
      api.defaults.headers.common.authorization = `Bearer ${hasToken}`;

      api.get<User>('profile').then((response) => {
        setUser(response.data);
      });
    }
  }, []);

  useEffect(() => {
    const url = window.location.href;
    const hasGithubCode = url.includes('?code=');

    if (hasGithubCode) {
      const [urlWithouCode, githubCode] = url.split('?code=');

      window.history.pushState({}, '', urlWithouCode);
      signIn(githubCode);
    }
  }, []);
  return (
    <AuthContext.Provider value={{ user, signInUrl, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, AuthContext };
