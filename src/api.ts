import { UserState } from './types';

// --- NODE.JS BACKEND CONNECTION ---
// আপনার Render সার্ভারের লিঙ্ক এখানে বসানো হয়েছে
const BASE_URL = 'https://gold-earn-pro.onrender.com'; 
const API_URL = `${BASE_URL}/api`;

// Helper: Secure Request Wrapper with Interceptor-like logic
const request = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('auth_token');
    
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

    // INTERCEPTOR: Handle 401 Unauthorized globally
    if (response.status === 401) {
        throw new Error('Unauthorized');
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'API Request Failed');
    }

    return data;
};

export const api = {
    // Authenticate (Login or Register) - Public Route
    authenticate: async (phone: string, password: string, isSignup: boolean, deviceId: string, name?: string, email?: string, referralCode?: string): Promise<UserState> => {
        const endpoint = isSignup ? '/auth/register' : '/auth/login';
        
        const payload = isSignup 
            ? { name, email, phone, password, referralCode, deviceId }
            : { phone, password, deviceId };

        const data = await request(endpoint, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        // Securely store credentials upon success
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user_id', data.user._id);
        if (deviceId) localStorage.setItem('device_id', deviceId);

        return mapUserToState(data.user);
    },

    // Get User Profile - Secure Route
    getUserData: async (userId: string): Promise<UserState> => {
        const user = await request('/user/profile');
        return mapUserToState(user);
    },

    // Secure Task Completion
    completeTask: async (taskType: 'spin' | 'math' | 'video' | 'checkin' | 'refer', data?: any): Promise<boolean> => {
        try {
            await request('/tasks/complete', {
                method: 'POST',
                body: JSON.stringify({ taskType, data })
            });
            return true;
        } catch (e: any) {
            if (e.message === 'Unauthorized') throw e; 
            console.error(e.message);
            return false;
        }
    },

    // Secure Withdrawal Request
    withdrawRequest: async (amount: number, method: string, account: string): Promise<boolean> => {
        try {
            await request('/withdraw', {
                method: 'POST',
                body: JSON.stringify({ amount, method, account })
            });
            return true;
        } catch (e: any) {
            if (e.message === 'Unauthorized') throw e; 
            throw e; 
        }
    },

    // Refill Limits
    refillLimit: async (userId: string, taskType: string) => {
        await request('/user/refill', {
            method: 'POST',
            body: JSON.stringify({ taskType })
        });
    }
};

// Helper
const mapUserToState = (user: any): UserState => {
    return {
        isAuthenticated: true,
        user: {
            _id: user._id,
            name: user.name,
            phone: user.phone,
            email: user.email,
            joinedDate: user.joinedDate,
            photoURL: user.photoURL
        },
        balance: user.balance,
        transactions: user.transactions || [],
        lastCheckIn: user.lastCheckIn,
        referralCode: user.referralCode,
        totalEarned: user.totalEarned,
        taskDate: user.taskDate,
        spinCount: user.spinCount, spinLimit: user.spinLimit,
        mathCount: user.mathCount, mathLimit: user.mathLimit,
        videoCount: user.videoCount, videoLimit: user.videoLimit,
    };
};
