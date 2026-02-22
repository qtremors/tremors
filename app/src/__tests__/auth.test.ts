import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { hashPassword, verifyPassword, setAdminCookie, verifyAdminCookie, clearAdminCookie } from '../lib/auth';
import * as nextHeaders from 'next/headers';

// Mock next/headers
vi.mock('next/headers', () => ({
    cookies: vi.fn(),
}));

describe('Password Hashing', () => {
    it('should hash a password', () => {
        const hash = hashPassword('testpassword');
        expect(hash).toBeDefined();
        expect(hash).toContain(':'); // salt:hash format
    });

    it('should create different hashes for same password', () => {
        const hash1 = hashPassword('testpassword');
        const hash2 = hashPassword('testpassword');
        expect(hash1).not.toBe(hash2); // Different salts
    });

    it('should verify correct password', () => {
        const password = 'testpassword123';
        const hash = hashPassword(password);
        expect(verifyPassword(password, hash)).toBe(true);
    });

    it('should reject incorrect password', () => {
        const hash = hashPassword('correctpassword');
        expect(verifyPassword('wrongpassword', hash)).toBe(false);
    });

    it('should handle invalid hash format', () => {
        expect(verifyPassword('password', 'invalidhash')).toBe(false);
        expect(verifyPassword('password', '')).toBe(false);
    });
});

describe('Session Management', () => {
    const mockCookieStore = {
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
    };

    beforeEach(() => {
        vi.resetAllMocks();
        (nextHeaders.cookies as any).mockReturnValue(Promise.resolve(mockCookieStore));
        process.env.AUTH_SECRET = 'test-secret-at-least-thirty-two-chars-long';
    });

    it('should set an admin cookie', async () => {
        await setAdminCookie();
        expect(mockCookieStore.set).toHaveBeenCalledWith(
            'admin_session',
            expect.any(String),
            expect.objectContaining({
                httpOnly: true,
                path: '/',
            })
        );
    });

    it('should verify a valid admin cookie', async () => {
        // First create a token to use
        await setAdminCookie();
        const token = mockCookieStore.set.mock.calls[0][1];

        mockCookieStore.get.mockReturnValue({ value: token });
        const isValid = await verifyAdminCookie();
        expect(isValid).toBe(true);
    });

    it('should reject an invalid admin cookie', async () => {
        mockCookieStore.get.mockReturnValue({ value: 'invalid.token' });
        const isValid = await verifyAdminCookie();
        expect(isValid).toBe(false);
    });

    it('should reject an expired token', async () => {
        // Create token normally
        await setAdminCookie();
        const token = mockCookieStore.set.mock.calls[0][1];

        // Move time forward 25 hours to simulate expiration
        vi.useFakeTimers();
        vi.setSystemTime(new Date(Date.now() + 1000 * 60 * 60 * 25));

        mockCookieStore.get.mockReturnValue({ value: token });
        const isValid = await verifyAdminCookie();
        expect(isValid).toBe(false);

        vi.useRealTimers();
    });

    it('should clear the admin cookie', async () => {
        await clearAdminCookie();
        expect(mockCookieStore.delete).toHaveBeenCalledWith('admin_session');
    });
});
