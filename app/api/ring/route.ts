import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc, Timestamp } from "firebase/firestore";

// Firebase config
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
};

// Initialize Firebase
// Ensure Firebase is initialized only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// Helper function for CORS headers - adjust origins as needed
function getCorsHeaders(origin?: string | null): Record<string, string> {
    // filter out any undefined env var
    const allowedOrigins = [
        process.env.NEXT_PUBLIC_FRONTEND_URL,
        'http://localhost:3000'
    ].filter((url): url is string => !!url);

    // always have a string fallback
    const defaultOrigin = allowedOrigins[0] || '*';
    const useOrigin = origin && allowedOrigins.includes(origin)
        ? origin
        : defaultOrigin;

    return {
        'Access-Control-Allow-Origin': useOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
}

export async function OPTIONS(request: NextRequest) {
    const origin = request.headers.get('origin');
    // Handle preflight requests for CORS
    return new NextResponse(null, { status: 204, headers: getCorsHeaders(origin) });
}

export async function POST(request: NextRequest) {
    const origin = request.headers.get('origin');
    try {
        const body = await request.json();
        const { deviceId, location, triggeredAt } = body;

        if (typeof deviceId !== 'string' || !deviceId.trim()) {
            return NextResponse.json({ message: 'Invalid deviceId' }, { status: 400, headers: getCorsHeaders(origin) });
        }
        if (typeof location !== 'string' || !location.trim()) {
            return NextResponse.json({ message: 'Invalid location' }, { status: 400, headers: getCorsHeaders(origin) });
        }

        let ts: Timestamp;
        if (triggeredAt) {
            const date = new Date(triggeredAt);
            if (isNaN(date.getTime())) {
                return NextResponse.json({ message: 'Invalid triggeredAt' }, { status: 400, headers: getCorsHeaders(origin) });
            }
            ts = Timestamp.fromDate(date);
        } else {
            ts = Timestamp.now();
        }

        await addDoc(collection(db, 'doorbell_events'), {
            deviceId,
            location,
            triggeredAt: ts,
        });

        return NextResponse.json({ message: 'Ring recorded successfully.' }, { status: 200, headers: getCorsHeaders(origin) });
    } catch (error: any) {
        console.error("API Error:", error); // Log the error for debugging
        // Check if it's a JSON parsing error
        if (error instanceof SyntaxError && error.message.includes("JSON")) {
            return NextResponse.json({ message: 'Invalid JSON in request body' }, { status: 400, headers: getCorsHeaders(origin) });
        }
        return NextResponse.json({ message: 'Failed to store ring data', error: error.message }, { status: 500, headers: getCorsHeaders(origin) });
    }
}