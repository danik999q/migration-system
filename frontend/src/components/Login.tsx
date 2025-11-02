import React, { useState } from 'react';
import axios from 'axios';
import { api } from '../services/api';
import { authService } from '../services/auth';
import './Login.css';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrors([]);
    setLoading(true);

    try {
      const response = isRegister
        ? await api.auth.register(username, password)
        : await api.auth.login(username, password);

      authService.setToken(response.token, response.user);
      onLogin();
    } catch (error: unknown) {
      console.error('Auth error:', error);
      let errorMessages: string[] = [];
      
      if (axios.isAxiosError(error)) {
        const responseData = error.response?.data;
        if (responseData && typeof responseData === 'object') {
          if ('errors' in responseData && Array.isArray(responseData.errors)) {
            errorMessages = responseData.errors.map((item: any) => {
              if (typeof item === 'object' && item !== null && 'msg' in item) {
                return String(item.msg);
              }
              return String(item);
            });
          } else if ('error' in responseData && responseData.error) {
            errorMessages = [String(responseData.error)];
          } else if ('message' in responseData && responseData.message) {
            errorMessages = [String(responseData.message)];
          }
        }
        
        if (errorMessages.length === 0) {
          if (error.response?.status === 429) {
            const retryAfter = error.response?.data?.retryAfter || 15 * 60;
            const minutes = Math.ceil(retryAfter / 60);
            errorMessages = [`Слишком много попыток входа. Пожалуйста, подождите ${minutes} минут и попробуйте снова.`];
          } else if (error.response?.status === 504) {
            errorMessages = ['Превышено время ожидания ответа сервера. Попробуйте позже.'];
          } else if (error.response?.status === 500) {
            errorMessages = ['Ошибка сервера. Попробуйте позже.'];
          } else if (error.code === 'ECONNABORTED') {
            errorMessages = ['Превышено время ожидания. Попробуйте еще раз.'];
          } else {
            errorMessages = ['Неожиданная ошибка сервера. Попробуйте еще раз.'];
          }
        }
      } else if (error instanceof Error) {
        errorMessages = [error.message || 'Unexpected error occurred'];
      } else {
        errorMessages = ['Unexpected error occurred'];
      }
      
      setErrors(errorMessages);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>{isRegister ? 'Create Account' : 'Sign In'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              disabled={loading}
              placeholder="Enter your username"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={loading}
              placeholder="Enter your password"
            />
          </div>

          {errors.length > 0 && (
            <div className="error-message">
              {errors.map((message, index) => (
                <div key={index}>{message}</div>
              ))}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Processing...' : isRegister ? 'Register' : 'Log In'}
          </button>
        </form>

        <div className="login-footer">
          <button
            type="button"
            className="link-button"
            onClick={() => {
              setIsRegister((value) => !value);
              setErrors([]);
            }}
            disabled={loading}
          >
            {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
