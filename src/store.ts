import { readable, Updater, writable } from "svelte/store";
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set as dbSet, onValue, push, update } from "firebase/database"

export const timeNow = readable(new Date(), (set) => {
	const interval = setInterval(() => set(new Date()), 1000);
	return () => clearInterval(interval);
});
  
try {
	var firebase = initializeApp({
		apiKey: "AIzaSyDJfeIN2N8fPSVzOIjw1vlRANsRG_zj8WY",
		authDomain: "pairing-timer.firebaseapp.com",
		projectId: "pairing-timer",
		storageBucket: "pairing-timer.appspot.com",
		messagingSenderId: "961812360178",
		appId: "1:961812360178:web:e96ca5961212b97698196b",
		databaseURL: " https://pairing-timer-default-rtdb.europe-west1.firebasedatabase.app",
	})
} catch (err) {
	// if we don't catch this hot module reloading while developing breaks
	if (!err.toString().includes("Firebase App named '[DEFAULT]' already exists")) throw err 
}
const db = getDatabase();

export type TimerStatus =  "RUNNING" | "PAUSED" | "STOPPED"

export type Timer = { 
	id: string, 
	start: Date | undefined
	cycleMinutes: number
	status: TimerStatus
	repeat: boolean
}

export const storagePut = (key: string, value: boolean) => localStorage.setItem(key, `${value}`)
export const storageGet = (key: string, defaultValue: boolean) => {
  const val = localStorage.getItem(key)
  if (val === null) return defaultValue
  else return val == "true"
}

const parseISOString = (s) => {
	if (!s) return
	var b = s.split(/\D+/);
	return new Date(Date.UTC(b[0], --b[1], b[2], b[3], b[4], b[5], b[6]));
}

const initialTimer = { start: null, status: "STOPPED", cycleMinutes: 0.05 } as Timer

let timerId = window.location.hash ? window.location.hash.split("#")[1] : undefined
const timersPath = "/timers"
const timersRef = ref(db, timersPath)
if (!timerId) {
	const { key } = push(timersRef, {})
	timerId = key
	window.location.hash = timerId
}
const cycleRef = ref(db, `${timersPath}/${timerId}/cycleMinutes`)
const repeatRef = ref(db, `${timersPath}/${timerId}/repeat`)
const startRef = ref(db, `${timersPath}/${timerId}/start`)
const statusRef = ref(db, `${timersPath}/${timerId}/status`)

window.addEventListener("beforeunload", event => {
	// TODO: cleanup db if all participants left
	alert("close now?")
}, {capture: true})

export const cycleMinutes = (() => {
	const { subscribe, set } = writable(initialTimer.cycleMinutes);
	onValue(cycleRef, data => set(data.val()))
	return {
		subscribe,
		set(this: void, value: number) {
			console.log({ value})
			dbSet(cycleRef,  value)
		}
	}
})()

export const repeat = (() => {
	const { subscribe, set } = writable(true);
	onValue(repeatRef, data => set(data.val()))
	return {
		subscribe,
		set(this: void, value: boolean) {
			console.log({ value})
			dbSet(repeatRef, value)
			storagePut("repeat", value)
		}
	}
})()

export const startTime = (() => {
	const { subscribe, set } = writable(initialTimer.start);
	onValue(startRef, data => set(parseISOString(data.val())))
	return { subscribe, set }
})()

export const status = (() => {
	const { subscribe, set } = writable(initialTimer.status);
	onValue(statusRef, data => set(data.val()))
	return { subscribe, set }
})()

export const start = async () => {
	const start = new Date()
	status.set("RUNNING")
	startTime.set(start)
	dbSet(startRef, start.toISOString());
	dbSet(statusRef, "RUNNING");
}

export const stop = async () => {
	const start = null
	status.set("STOPPED")
	startTime.set(start)
	dbSet(statusRef, "STOPPED");
	dbSet(startRef, start);
}

// export const pause = async () => {
// 	updateDoc(timerRef, { 
// 		status: "PAUSED", 
// 		lastChangeAuthor: myAuthorId, 
// 	} as Pick<Timer, 'status'|'lastChangeAuthor'>)
// }

