self.addEventListener("push", (event) => {
    let data = {
        title: "Apna Mart",
        body: "New notification",
        url: "/",
    };

    try {
        if (event.data) {
            data = event.data.json();
        }
    } catch (error) {
        console.error(
            "PUSH DATA ERROR:",
            error
        );
    }

    const title =
        data.title || "Apna Mart";

    const options = {
        body:
            data.body ||
            "You have a new notification.",

        icon: "/pwa-192x192.png",

        badge: "/pwa-192x192.png",

        vibrate: [
            200,
            100,
            200,
        ],

        tag:
            data.tag ||
            "apna-mart-notification",

        renotify: true,

        requireInteraction: true,

        data: {
            url:
                data.url ||
                "/admin/orders",
        },
    };

    event.waitUntil(
        self.registration.showNotification(
            title,
            options
        )
    );
});


// ==========================================
// NOTIFICATION CLICK
// ==========================================

self.addEventListener(
    "notificationclick",
    (event) => {
        event.notification.close();

        const url =
            event.notification?.data?.url ||
            "/admin/orders";

        event.waitUntil(
            clients
                .matchAll({
                    type: "window",
                    includeUncontrolled: true,
                })
                .then((clientList) => {

                    for (
                        const client of clientList
                    ) {
                        if (
                            "focus" in client
                        ) {
                            client.navigate(
                                url
                            );

                            return client.focus();
                        }
                    }

                    if (
                        clients.openWindow
                    ) {
                        return clients.openWindow(
                            url
                        );
                    }

                    return null;
                })
        );
    }
);