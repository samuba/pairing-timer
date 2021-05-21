<script lang="ts">
  import { addSeconds } from "date-fns"
  import { onMount } from "svelte";
  import { notify } from "./notification";
  import { timeNow, cycleMinutes, startTime, start, stop, repeat } from './store'
  import Tailwind from "./Tailwind.svelte"

  let endTime: Date

  $: remainingTime = endTime ? new Date(Number(endTime) - Number($timeNow)) : undefined
  $: if (remainingTime?.getTime() <= 0) finished()

  // Play gong on page load. Because if it is never played before it will not be played when timer triggers it when browser is in background
  onMount(() => playGong(0))

  startTime.subscribe((startTimeS) => {
    // TODO: why do we have to subscribe instead of this:
    // $: endTime = $startTime ? addSeconds($startTime, $cycleMinutes * 60) : undefined 
    endTime = startTimeS ? addSeconds(startTimeS, $cycleMinutes * 60) : undefined
  })

  const finished = () => {
    console.log("finished", {
      start: $startTime?.toISOString(),
      jetzt: $timeNow.toISOString()
    })
    notify.showNotification()
    playGong()
    if ($repeat) start() 
    else stop()
  }

  const formatTime = (remainingTime: Date | undefined) => {
    if (!remainingTime) return "00:00"
    let minutes = remainingTime.getMinutes() < 10 ? `0${remainingTime.getMinutes()}` : remainingTime.getMinutes()
    let seconds = remainingTime.getSeconds() < 10 ? `0${remainingTime.getSeconds()}` : remainingTime.getSeconds()
    return `${minutes}:${seconds}`
  }

  const playGong = (volume = 1) => {
    if (!new Audio().canPlayType('audio/mp3')) return
    const audio = new Audio('beep.mp3')
    audio.volume = volume
    audio.play()
  }

</script>
<Tailwind />

<main class="flex justify-center align-middle">
  <div class="mt-20">
    <div class="mb-4 text-5xl">{formatTime(remainingTime)}</div>

    {#if $startTime}
      <button class="bg-red-500 py-2 px-4 text-2xl text-white" on:click={stop}>Stop</button>
    {:else}
      <button class="bg-green-500 py-2 px-4 text-2xl text-white" on:click={start}>Start</button>
    {/if}

    <div class="flex flex-col my-8">
      <label for="time"><input bind:value={$cycleMinutes} class="mr-2 w-14 border border-indigo-500 pl-2" type="number">Minutes</label>
      <label for="repeat"><input bind:checked={$repeat} id="repeat" type="checkbox" class="mr-2">Repeat</label>
      <label for="notify"><input bind:checked={$notify} id="notify" class="mr-2" type="checkbox">Notification</label>     
    </div>

  </div>  
</main> 

