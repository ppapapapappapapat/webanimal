'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';



export default function Verification() {
    const searchParams = useSearchParams();
    const defaultEmail = searchParams.get('email') || '';
    const [email, setEmail] = useState(defaultEmail);
    const [token, setToken] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        if (!email || !token) {
            setMessage('Please enter both email and token.');
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch('http://localhost:3001/verify-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, token }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage('✅ Email verified successfully!');
                setTimeout(() => router.push('/login'), 2000);
            } else {
                setMessage(`❌ Verification failed: ${data.error}`);
            }
        } catch (err: any) {
            console.error(err);
            setMessage('❌ Network error. Make sure the Flask server is running.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md space-y-6">
                <h1 className="text-2xl font-bold text-green-600 text-center">Email Verification</h1>
                <p className="text-center text-gray-600">Enter your email and 6-character token to verify your account.</p>

                {message && (
                    <div className={`p-3 rounded-md text-sm ${message.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleVerify} className="space-y-4">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        disabled={isLoading}
                    />
                    <input
                        type="text"
                        placeholder="6-character token"
                        value={token}
                        onChange={(e) => setToken(e.target.value.toUpperCase())}
                        maxLength={6}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Verifying...' : 'Verify Email'}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-4">
                    Already verified? <a href="/login" className="text-blue-600 hover:text-blue-500">Sign in</a>
                </p>
            </div>
        </div>
    );
}
