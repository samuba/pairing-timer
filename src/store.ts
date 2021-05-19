import { readable, Updater, writable } from "svelte/store";
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, addDoc, DocumentSnapshot, DocumentData, doc, getDoc, updateDoc, DocumentReference, startAfter } from 'firebase/firestore';
import { userId } from "./userId";

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
		appId: "1:961812360178:web:e96ca5961212b97698196b"
	})
} catch (err) {
	// if we don't catch this hot module reloading while developing breaks
	if (!err.toString().includes("Firebase App named '[DEFAULT]' already exists")) throw err 
}
const firestore = getFirestore(firebase)
const timers = collection(firestore, "timers")
const myAuthorId = userId

export type TimerStatus =  "RUNNING" | "PAUSED" | "STOPPED"

export type Timer = { 
	id: string, 
	start: Date | undefined
	cycleMinutes: number
	status: TimerStatus
	repeat: boolean
	lastChangeAuthor: string
}

const extractTimer = (doc: DocumentSnapshot<DocumentData>) => { 
	const data = doc.data()
	console.log("extract called for " + doc.id)
	return { 
		...data,
		id: doc.id, 
		start: data.start?.toDate(),
	} as Timer
}


export const storagePut = (key: string, value: boolean) => localStorage.setItem(key, `${value}`)
export const storageGet = (key: string, defaultValue: boolean) => {
  const val = localStorage.getItem(key)
  if (val === null) return defaultValue
  else return val == "true"
}

const initialTimer = { id: null, start: null, status: null, cycleMinutes: 0.05 } as Timer

let timerRef: DocumentReference<DocumentData>
if (window.location.hash) {
	const timerId = window.location.hash.split("#")[1]
	timerRef = doc(firestore, "timers/" + timerId)
} else {
	addDoc(timers, initialTimer).then(ref => {
		timerRef = ref
		window.location.hash = ref.id
	}) // note: does not work offline
}

window.addEventListener("beforeunload", event => {
	// TODO: cleanup firestore if all participants left
	alert("close now?")
}, {capture: true})

const isChangeFromMe = (timer: Timer) => timer.lastChangeAuthor === myAuthorId

const setStoreValue = (updatedDoc: DocumentSnapshot<DocumentData>, field: string, set: (this: void, value: any) => void) => {
	const updatedTimer = extractTimer(updatedDoc)
	if (isChangeFromMe(updatedTimer)) return
	set(updatedTimer[field]) // TODO: perf improvement: use update() and only update if value changed
}

const buildCycleMinutes = ()  => {
	const { subscribe, set } = writable(initialTimer.cycleMinutes);
	onSnapshot(timerRef, doc => setStoreValue(doc, 'cycleMinutes', set)) 
	return {
		subscribe,
		set(this: void, value: number) {
			updateDoc(timerRef, { cycleMinutes: value, lastChangeAuthor: myAuthorId } as Pick<Timer, 'cycleMinutes' | 'lastChangeAuthor'>)
		}
	}
}
export const cycleMinutes = buildCycleMinutes()

const buildRepeat = ()  => {
	const { subscribe, set } = writable(true);
	onSnapshot(timerRef, doc => setStoreValue(doc, 'repeat', set))
	return {
		subscribe,
		set(this: void, value: boolean) {
			updateDoc(timerRef, { repeat: value, lastChangeAuthor: myAuthorId } as Pick<Timer, 'repeat' | 'lastChangeAuthor'>)
			storagePut("repeat", value)
		}
	}
}
export const repeat = buildRepeat()

const buildStartTime = ()  => {
	const { subscribe, set } = writable(null as Date);
	onSnapshot(timerRef, doc => setStoreValue(doc, 'start', set))
	return { subscribe, set }
}
export const startTime = buildStartTime()

const buildStatus = ()  => {
	const { subscribe, set } = writable("STOPPED" as TimerStatus);
	onSnapshot(timerRef, doc => setStoreValue(doc, 'status', set))
	return { subscribe, set }
}
export const status = buildStatus()


export const start = async () => {
	const start = new Date()
	status.set("RUNNING")
	startTime.set(start)
	updateDoc(timerRef, { 
		status: "RUNNING", 
		start,
		lastChangeAuthor: myAuthorId,
	} as Pick<Timer, 'status' | 'start' | 'lastChangeAuthor'>)
}

export const stop = async () => {
	const start = null
	status.set("STOPPED")
	startTime.set(start)
	updateDoc(timerRef, { 
		status: "STOPPED", 
		start,
		lastChangeAuthor: myAuthorId,
	} as Pick<Timer, 'status' | 'start' |'lastChangeAuthor'>)
}

// export const pause = async () => {
// 	updateDoc(timerRef, { 
// 		status: "PAUSED", 
// 		lastChangeAuthor: myAuthorId, 
// 	} as Pick<Timer, 'status'|'lastChangeAuthor'>)
// }

