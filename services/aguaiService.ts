import { AppSettings } from '../hooks/useSettings';

export interface AguaiCredentials {
    username: string;
    password: string;
}

export interface AguaiUserProfile {
    username: string;
    nickname: string;
    profilePhotoUrl: string | null;
    token: string;
}

/**
 * aguaiService
 * 
 * Adapter for connecting to the AGUAI backend. This is a stubbed service.
 * A README should be created to document the expected API contract for backend integration.
 * - Endpoints: /login, /profile, /logout
 * - Auth: Bearer token
 * - /login (POST): { username, password } -> { username, nickname, profilePhotoUrl, token }
 * - /profile (GET): (auth header) -> { username, nickname, profilePhotoUrl }
 * - /logout (POST): (auth header) -> {}
 */
export const aguaiService = {
    /**
     * Attempts to log in to the AGUAI backend.
     * @param credentials The user's username and password.
     * @returns A promise that resolves with user profile data and a token on success.
     * @rejects With an error message if login fails or the service is unavailable.
     */
    login: (credentials: AguaiCredentials): Promise<AguaiUserProfile> => {
        console.log('Attempting AGUAI login for:', credentials.username);
        // This is a stub. In a real implementation, this would be a fetch call.
        // For now, it will always fail to simulate the backend not being ready.
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // To test a successful login, uncomment the block below and comment out the reject line.
                /*
                if (credentials.username.toLowerCase() === 'aguai' && credentials.password === '1234') {
                    console.log('AGUAI Login successful (simulated)');
                    resolve({
                        username: 'J.A Ibarra',
                        nickname: 'AGUAI Dev',
                        profilePhotoUrl: '/assets/aguai/logo.png',
                        token: 'fake-jwt-token-for-testing-12345'
                    });
                } else {
                     console.log('AGUAI Login failed (simulated)');
                    reject(new Error('aguaiLogin.error.invalid'));
                }
                */
               
                console.log('AGUAI Login failed - service unavailable (simulated)');
                reject(new Error('aguaiLogin.error.unavailable'));
            }, 1000);
        });
    },

    /**
     * Fetches user profile using a token.
     * @param token The user's authentication token.
     * @returns A promise that resolves with partial profile metadata.
     */
    fetchProfile: (token: string): Promise<Partial<Omit<AguaiUserProfile, 'token'>>> => {
        console.log('Fetching AGUAI profile with token:', token);
        return Promise.resolve({
            nickname: 'Fetched AGUAI User',
            profilePhotoUrl: null,
        });
    },

    /**
     * Logs the user out from the AGUAI backend.
     * @param token The user's authentication token.
     * @returns A promise that resolves on success.
     */
    logout: (token: string): Promise<void> => {
        console.log('Logging out from AGUAI with token:', token);
        return Promise.resolve();
    }
};