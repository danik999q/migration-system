import React, { useState } from 'react';
import axios from 'axios';
import { api } from '../services/api';
import { authService } from '../services/auth';
import { useToast } from './ToastProvider';
import { useTranslation } from './LanguageProvider';
import './Login.css';

interface LoginProps {
  onLogin: () => void;
}

const MIN_USERNAME = 3;
const MIN_PASSWORD = 6;

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const validateLocal = () => {
    const messages: string[] = [];
    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      messages.push(t('auth.usernameRequired'));
    } else if (trimmedUsername.length < MIN_USERNAME) {
      messages.push(t('auth.usernameShort'));
    }

    if (!password) {
      messages.push(t('auth.passwordRequired'));
    } else if (password.length < MIN_PASSWORD) {
      messages.push(t('auth.passwordShort'));
    }

    return messages;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors([]);

    const localErrors = validateLocal();
    if (localErrors.length > 0) {
      setErrors(localErrors);
      return;
    }

    setLoading(true);

    try {
      const trimmedUsername = username.trim();
      const response = isRegister
        ? await api.auth.register(trimmedUsername, password)
        : await api.auth.login(trimmedUsername, password);

      authService.setToken(response.token, response.user);
      showToast({
        type: 'success',
        message: isRegister ? t('auth.registerSuccess') : t('auth.loginSuccess'),
      });
      onLogin();
    } catch (error: unknown) {
      console.error('Auth error:', error);
      const messages: string[] = [];

      if (axios.isAxiosError(error)) {
        const data = error.response?.data as Record<string, unknown> | undefined;

        if (data) {
          if (Array.isArray(data.errors)) {
            data.errors.forEach((item) => {
              if (typeof item === 'object' && item !== null && 'msg' in item) {
                messages.push(String((item as Record<string, unknown>).msg));
              } else {
                messages.push(String(item));
              }
            });
          }

          if (typeof data.error === 'string') {
            messages.push(data.error);
          }

          if (typeof data.message === 'string') {
            messages.push(data.message);
          }
        }

        if (messages.length === 0) {
          if (error.response?.status === 429) {
            const retryAfter = (error.response.data as { retryAfter?: number })?.retryAfter ?? 15 * 60;
            const minutes = Math.ceil(retryAfter / 60);
            messages.push(t('auth.manyAttempts', { minutes }));
          } else if (error.response?.status === 504) {
            messages.push(t('auth.timeout'));
          } else if (error.response?.status === 500) {
            messages.push(t('auth.serverError'));
          } else if (error.code === 'ECONNABORTED') {
            messages.push(t('auth.aborted'));
          } else {
            messages.push(t('auth.unknown'));
          }
        }
      } else if (error instanceof Error) {
        messages.push(error.message || t('auth.unexpected'));
      } else {
        messages.push(t('auth.unexpected'));
      }

      setErrors(messages);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>{isRegister ? t('auth.registerTitle') : t('auth.loginTitle')}</h2>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label>{t('auth.username')}</label>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              disabled={loading}
              placeholder={isRegister ? t('auth.username') : t('auth.username')}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label>{t('auth.password')}</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={loading}
              placeholder={t('auth.password')}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
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
            {loading ? t('auth.processing') : isRegister ? t('auth.registerButton') : t('auth.loginButton')}
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
            {isRegister ? t('auth.toggleToLogin') : t('auth.toggleToRegister')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;

