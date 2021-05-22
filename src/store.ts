import { readable, writable } from "svelte/store";
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set as dbSet, onValue, push, remove, runTransaction } from "firebase/database"
import { localStoragePut } from "./common";
import { userId } from "./userId";

try {
	initializeApp({
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

const addMeToParticipants = (timerId: string) => {
	return runTransaction(ref(db, `${timersPath}/${timerId}/participants`), currentParticipants => {
		if (!currentParticipants) return [userId];
		if (currentParticipants.includes(userId)) return currentParticipants
		return [...currentParticipants, userId]
	})
}

const removeMeFromParticipants = (timerId: string) => {
	runTransaction(ref(db, `${timersPath}/${timerId}/participants`), currentParticipants => {
		if (!currentParticipants) return;
		return currentParticipants.filter(x => x !== userId)
	})
}

let timerId = window.location.hash?.split("#")?.[1]
const initialTimer = { start: null, status: "STOPPED", cycleMinutes: 0.05, participants: [userId] } as Timer
const timersPath = "/timers"
if (!timerId) {
	const { key } = push(ref(db, timersPath), initialTimer)
	timerId = key
	window.location.hash = timerId 
} else {
	addMeToParticipants(timerId)
} 
const participantsRef = ref(db, `${timersPath}/${timerId}/participants`)
const cycleRef = ref(db, `${timersPath}/${timerId}/cycleMinutes`)
const repeatRef = ref(db, `${timersPath}/${timerId}/repeat`)
const startRef = ref(db, `${timersPath}/${timerId}/start`)
const statusRef = ref(db, `${timersPath}/${timerId}/status`)

export const participants = (() => {
	const { subscribe, set } = writable(initialTimer.participants);
	let currentParticipants = initialTimer.participants
	onValue(participantsRef, data =>  { 
		currentParticipants = data.val()
		set(currentParticipants); 
	})
	window.addEventListener("beforeunload", async event => {
		event.preventDefault()
		if (currentParticipants.length === 1) {
			// cleanup timer entry if we are last participant
			await remove(ref(db, `${timersPath}/${timerId}`)) 
		} else {
			await removeMeFromParticipants(timerId)
		}
		return null
	})
	return { subscribe }
})()

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
			localStoragePut("repeat", value)
		}
	}
})()

const parseISOString = (s) => {
	if (!s) return
	var b = s.split(/\D+/);
	return new Date(Date.UTC(b[0], --b[1], b[2], b[3], b[4], b[5], b[6]));
}

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

export const timeNow = readable(new Date(), (set) => {
	const interval = setInterval(() => set(new Date()), 1000);
	return () => clearInterval(interval);
});

export type TimerStatus =  "RUNNING" | "PAUSED" | "STOPPED"

export type Timer = { 
	id: string, 
	start: Date | undefined
	cycleMinutes: number
	status: TimerStatus
	repeat: boolean
	participants: string[]
}
