<script lang="ts">
	import type { event } from '../../lib/types/todo';
	import data from './todo.json';
	for (let e of data) {
		console.log(e);
	}
	let newEventTime: String;
	let newEventName: String;
	function add() {}
	let list: event[] = [];
</script>

<div class="p-5 main flex flex-wrap flex-col">
	<div class="s flex m-1">
		<h1 class="text-2xl text-center text-nosferatu-100 my-2">Todo</h1>
		<form class="bg-nosferatu-800 flex p-2 my-5 object-contain justify-around rounded-lg ">
			<img class="h" src="https://cdn-icons-png.flaticon.com/512/1950/1950715.png" />
			<input
				class="rounded mx-2 border-dracula-400 bg-aro-900 text-vonCount-50  flex-grow border-2 px-3 py-2"
				name="q"
				placeholder="Add an Event"
			/>
			<input
				class="rounded mx-1 border-dracula-400 bg-aro-900 text-vonCount-50 flex-grow border-2 px-3 py-2"
				name="q"
				placeholder="Add an Event"
			/>
			<input
				class="bg-nosferatu-700 mx-2 px-3 py-2 rounded text-vonCount-50 "
				type="submit"
				on:submit={add}
				value="Add"
			/>
		</form>
		{#each data as event}
			<div class=" flex m-1">
				{#if event.completed}
					<img src="https://cdn-icons-png.flaticon.com/512/1442/1442912.png" />
					<p class="done">{event.event} {event.date}</p>
				{:else}
					<img src="https://cdn-icons-png.flaticon.com/512/1617/1617543.png" />
					<p>{event.event} {event.date}</p>
				{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	img {
		width: 2.5rem;
		background-color: #f1fa8c;
		border-radius: 1rem;
		padding: 0.2rem;
	}
	p {
		color: #f1fa8c;
		margin-top: auto;
		margin-bottom: auto;
		padding-left: 1rem;
		transition: all ease-in-out 300ms;
	}

	p:hover {
		color: #ffa0a0;
	}
	.main {
		border-color: #f1fa8c;
		border-width: 0.1rem;
		border-radius: 1rem;
	}
	.s {
		flex-direction: column;
		text-align: center;
	}
	@media (max-width: 1030px) {
		.main {
			border: none;
		}
	}
</style>
