import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { setApiAuth } from '../lib/api';

export function ApiAuthSync() {
  const { user, token } = useAuth();
  useEffect(() => {
    setApiAuth(user, token);
  }, [user, token]);
  return null;
}