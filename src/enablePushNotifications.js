import { supabase } from "./supabase";


// ==========================================
// BASE64 → UINT8ARRAY
// ==========================================

function urlBase64ToUint8Array(
    base64String
) {
    const padding =
        "=".repeat(
            (4 -
                (base64String.length % 4)) %
            4
        );

    const base64 =
        (
            base64String + padding
        )
            .replace(/-/g, "+")
            .replace(/_/g, "/");

    const rawData =
        window.atob(base64);

    return Uint8Array.from(
        [...rawData].map(
            (char) =>
                char.charCodeAt(0)
        )
    );
}


// ==========================================
// ENABLE PUSH NOTIFICATIONS
// ==========================================

export async function enablePushNotifications() {
    try {
        // ==================================
        // BROWSER SUPPORT
        // ==================================

        if (
            !("serviceWorker" in navigator)
        ) {
            throw new Error(
                "Service Worker supported nahi hai."
            );
        }

        if (
            !("PushManager" in window)
        ) {
            throw new Error(
                "Push notifications supported nahi hain."
            );
        }

        if (
            !("Notification" in window)
        ) {
            throw new Error(
                "Notification API supported nahi hai."
            );
        }


        // ==================================
        // VAPID PUBLIC KEY
        // ==================================

        const vapidPublicKey =
            import.meta.env
                .VITE_VAPID_PUBLIC_KEY;

        if (!vapidPublicKey) {
            throw new Error(
                "VITE_VAPID_PUBLIC_KEY missing hai."
            );
        }


        // ==================================
        // GET CURRENT USER
        // ==================================

        const {
            data: {
                user,
            },
            error: userError,
        } =
            await supabase.auth.getUser();

        if (userError) {
            throw userError;
        }

        if (!user) {
            throw new Error(
                "Admin login nahi hai."
            );
        }


        // ==================================
        // CHECK ADMIN
        // ==================================

        const {
            data: profile,
            error: profileError,
        } =
            await supabase
                .from("profiles")
                .select("role")
                .eq(
                    "id",
                    user.id
                )
                .single();

        if (profileError) {
            throw profileError;
        }

        if (
            profile?.role !== "admin"
        ) {
            throw new Error(
                "Sirf admin notifications enable kar sakta hai."
            );
        }


        // ==================================
        // NOTIFICATION PERMISSION
        // ==================================

        let permission =
            Notification.permission;

        if (
            permission !== "granted"
        ) {
            permission =
                await Notification.requestPermission();
        }

        if (
            permission !== "granted"
        ) {
            throw new Error(
                "Notification permission allow nahi hui."
            );
        }


        // ==================================
        // REGISTER PUSH SERVICE WORKER
        // ==================================

        const registration =
            await navigator.serviceWorker.register(
                "/push-sw.js",
                {
                    scope: "/",
                }
            );


        console.log(
            "✅ Push Service Worker Registered"
        );


        // ==================================
        // WAIT FOR SERVICE WORKER
        // ==================================

        await navigator.serviceWorker.ready;


        // ==================================
        // GET EXISTING SUBSCRIPTION
        // ==================================

        let subscription =
            await registration.pushManager.getSubscription();


        // ==================================
        // CREATE NEW SUBSCRIPTION
        // ==================================

        if (!subscription) {
            subscription =
                await registration.pushManager.subscribe(
                    {
                        userVisibleOnly: true,

                        applicationServerKey:
                            urlBase64ToUint8Array(
                                vapidPublicKey
                            ),
                    }
                );
        }


        console.log(
            "✅ Push subscription created"
        );


        // ==================================
        // CONVERT SUBSCRIPTION
        // ==================================

        const subscriptionJSON =
            subscription.toJSON();

        const endpoint =
            subscriptionJSON.endpoint;

        const p256dh =
            subscriptionJSON.keys?.p256dh;

        const auth =
            subscriptionJSON.keys?.auth;


        if (
            !endpoint ||
            !p256dh ||
            !auth
        ) {
            throw new Error(
                "Push subscription data incomplete hai."
            );
        }


        // ==================================
        // SAVE SUBSCRIPTION IN SUPABASE
        // ==================================

        const {
            error: saveError,
        } =
            await supabase
                .from(
                    "push_subscriptions"
                )
                .upsert(
                    {
                        user_id:
                            user.id,

                        endpoint,

                        p256dh,

                        auth,

                        updated_at:
                            new Date().toISOString(),
                    },
                    {
                        onConflict:
                            "endpoint",
                    }
                );


        if (saveError) {
            throw saveError;
        }


        console.log(
            "✅ PUSH SUBSCRIPTION SAVED"
        );


        return {
            success: true,
            subscription,
        };

    } catch (error) {

        console.error(
            "❌ PUSH ENABLE ERROR:",
            error
        );

        throw error;
    }
}