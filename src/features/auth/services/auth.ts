import { store } from '@store/store';
import { clearUser } from '@features/auth/store/authSlice';

export const isAuthenticated = () => {
    const token = localStorage.getItem('access_token');
    return !!token;
  };
  
  export const logout = () => {
    localStorage.removeItem('access_token');
    store.dispatch(clearUser());
    window.location.href = '/';
  };