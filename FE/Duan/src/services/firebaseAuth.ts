import { firebaseConfig } from '../config/firebaseConfig';
import { AuthSession } from '../types';

export type FirebaseSignInPayload = {
  email: string;
  password: string;
};

export type FirebaseSignInResponse = {
  session: AuthSession;
  firebaseUser: {
    uid: string;
    email: string;
    displayName?: string;
  };
};

const isConfigured = () =>
  firebaseConfig.apiKey && firebaseConfig.apiKey !== 'YOUR_FIREBASE_WEB_API_KEY';

type FirebaseAuthResponse = {
  idToken: string;
  refreshToken: string;
  expiresIn: string;
  email: string;
  localId: string;
  displayName?: string;
};

const mapAuthResponse = (data: FirebaseAuthResponse): FirebaseSignInResponse => {
  const session: AuthSession = {
    idToken: data.idToken,
    refreshToken: data.refreshToken,
    expiresIn: Number(data.expiresIn),
    fetchedAt: Date.now(),
  };

  return {
    session,
    firebaseUser: {
      uid: data.localId,
      email: data.email,
      displayName: data.displayName,
    },
  };
};

export const signInWithEmail = async (
  payload: FirebaseSignInPayload,
): Promise<FirebaseSignInResponse> => {
  if (!isConfigured()) {
    throw new Error('Vui lòng cấu hình apiKey Firebase trong firebaseConfig.ts');
  }

  const endpoint = `${firebaseConfig.authBaseUrl}/accounts:signInWithPassword?key=${firebaseConfig.apiKey}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...payload,
      returnSecureToken: true,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    const message = data?.error?.message || 'Đăng nhập Firebase thất bại';
    throw new Error(message);
  }

  return mapAuthResponse(data);
};

export const signUpWithEmail = async (
  payload: FirebaseSignInPayload,
): Promise<FirebaseSignInResponse> => {
  if (!isConfigured()) {
    throw new Error('Vui lòng cấu hình apiKey Firebase trong firebaseConfig.ts');
  }

  const endpoint = `${firebaseConfig.authBaseUrl}/accounts:signUp?key=${firebaseConfig.apiKey}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...payload,
      returnSecureToken: true,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    const message = data?.error?.message || 'Đăng ký Firebase thất bại';
    throw new Error(message);
  }

  return mapAuthResponse(data);
};
