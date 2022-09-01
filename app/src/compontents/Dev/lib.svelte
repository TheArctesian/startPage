<style>
	img {
		width: 2.5rem;
		background-color: #ff5555;
		border-radius: 1rem;
		padding: 0.2rem;
	}
	a {
		color: #ff5555;
		margin-top: auto;
		margin-bottom: auto;
		padding-left: 1rem;
		transition: all ease-in-out 300ms;
	}

	a:hover {
		color: #ffa0a0;
	}
	.main {
		border-color: #ff5555;
		border-width: 0.1rem;
		border-radius: 1rem;
	}
	@media (max-width: 1030px) {
		.main {
			border: none;
		}
	}
</style>

<div class="main p-5 flex flex-wrap flex-col">
	<h1 class="text-2xl text-center text-nosferatu-100 my-2">Library</h1>

	<div class=" flex m-1">
		<img alt="github logo" src="https://simpleicons.org/icons/svelte.svg" />
		<a href="https://kit.svelte.dev/" target="_blank">Svelte Kit</a>
	</div>
	<div class=" flex m-1">
		<img alt="github logo" src="https://simpleicons.org/icons/go.svg" />
		<a href="https://docs.gofiber.io/" target="_blank">Go Fiber</a>
	</div>
	<div class=" flex m-1">
		<img alt="github logo" src="https://simpleicons.org/icons/unity.svg" />
		<a href="https://www.tutorialspoint.com/unity/index.htm">Unity</a>
	</div>
	<div class=" flex m-1">
		<img alt="github logo" src="https://simpleicons.org/icons/haskell.svg" />
		<a href="https://xmonad.org/documentation.html">Xmonad</a>
	</div>
</div>
