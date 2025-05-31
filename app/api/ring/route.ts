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
function getCorsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*', // Or specify your frontend domain
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
}

export async function OPTIONS(request: NextRequest) {
    // Handle preflight requests for CORS
    return new NextResponse(null, { status: 204, headers: getCorsHeaders() });
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { deviceId, location, triggeredAt } = body;

        if (!deviceId || !location) {
            return NextResponse.json({ message: 'Missing deviceId or location' }, { status: 400, headers: getCorsHeaders() });
        }

        await addDoc(collection(db, 'doorbell_events'), {
            deviceId,
            location,
            triggeredAt: triggeredAt ? Timestamp.fromDate(new Date(triggeredAt)) : Timestamp.now(),
        });

        return NextResponse.json({ message: 'Ring recorded successfully.' }, { status: 200, headers: getCorsHeaders() });
    } catch (error: any) {
        console.error("API Error:", error); // Log the error for debugging
        // Check if it's a JSON parsing error
        if (error instanceof SyntaxError && error.message.includes("JSON")) {
            return NextResponse.json({ message: 'Invalid JSON in request body' }, { status: 400, headers: getCorsHeaders() });
        }
        return NextResponse.json({ message: 'Failed to store ring data', error: error.message }, { status: 500, headers: getCorsHeaders() });
    }
}