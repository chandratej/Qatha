import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { setApiAuth } from '../lib/api';
import { setPlatformApiAuth } from '../lib/platformBackend';

export function ApiAuthSync() {
  const { user, token } = useAuth();
  useEffect(() => {
    setApiAuth(user, token);
    setPlatformApiAuth(token);
  }, [user, token]);
  return null;
}