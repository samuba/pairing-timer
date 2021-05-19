import { writable } from "svelte/store";
import { storageGet, storagePut } from "./store";

export const enableNotifications = () => {
    console.log("enablty notific")
    // Let's check if the browser supports notifications
    if (!("Notification" in window)) {
        alert("This browser does not support desktop notification");
        return false
    }
    // Let's check whether notification permissions have alredy been granted
    else if (Notification.permission === "granted") {
        // If it's okay let's create a notification
        const notification = new Notification("Notifications enabled");
        setTimeout(() => notification.close(), 1400)
        storagePut("notify", true)
        return true
    }
    // Otherwise, we need to ask the user for permission
    else if (Notification.permission !== 'denied') {
        Notification.requestPermission(function (permission) {
            // If the user accepts, let's create a notification
            if (permission === "granted") {
                const notification = new Notification("Notifications enabled");
                setTimeout(() => notification.close(), 1400)
                storagePut("notify", true)
                return true
            }
        });
    }
    alert("Could not enable notifications");
    return false
  }

  const buildNotify = ()  => {
	let notify = storageGet("notify", false)
	console.log("notify", notify)
	const { subscribe, set } = writable(notify);
	return {
		subscribe,
		set(this: void, value: boolean) {
			console.log("set n", value)
            if (value) {
                const notificationsAreEnabled = enableNotifications()
                console.log({notificationsAreEnabled})
                if (notificationsAreEnabled) {
                    set(true)
                    notify = true
                } else {
                    setTimeout(() => set(false), 2000) // TODO: does not work
                    notify = false
                }
            }
            else {
                storagePut("notify", false)
                set(false)
                notify = false
            } 
		},
        showNotification() {
            if (!notify) return;
            const notification = new Notification("Switch Driver!", { icon: "notification-icon.png" });
            setTimeout(() => notification.close(), 2500);
        }
	}
}
export const notify = buildNotify()
