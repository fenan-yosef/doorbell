// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp(); // Initialize the Firebase Admin SDK

exports.sendDoorbellNotification = functions.firestore
    .document('doorbell_events/{docId}') // Listens for any new document added to 'doorbell_events'
    .onCreate(async (snapshot, context) => {
        const eventData = snapshot.data(); // Get the data of the new doorbell event
        const { deviceId, location, triggeredAt } = eventData;

        // Construct the notification message
        const message = {
            notification: {
                title: `🔔 Doorbell Ring at ${location}!`,
                body: `Device: ${deviceId} just triggered the doorbell.`,
            },
            data: { // Custom data payload (can be useful for deep-linking in your app)
                type: 'doorbell_ring',
                deviceId: deviceId,
                location: location,
                triggeredAt: triggeredAt ? triggeredAt.toDate().toISOString() : new Date().toISOString(),
            },
            // To send to all devices subscribed to a topic (simpler for group notifications)
            topic: 'doorbell_alerts',
            // Or, to send to a specific device token (if you store user FCM tokens in Firestore)
            // token: 'FCM_DEVICE_TOKEN_FROM_YOUR_APP',
        };

        try {
            await admin.messaging().send(message);
            console.log('FCM notification sent successfully for:', eventData);
            return null; // Important: Cloud Functions must return a Promise or null/void
        } catch (error) {
            console.error('Error sending FCM notification:', error);
            return null;
        }
    });