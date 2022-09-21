<script>
	import Searchbar from '../compontents/Layout/searchbar.svelte';
	import Lib from '../compontents/Dev/lib.svelte';
	import Langs from '../compontents/Dev/langs.svelte';
	import UI from '../compontents/Dev/UI.svelte';
	import Icons from '../compontents/Dev/Icons.svelte';
	import Server from '../compontents/Dev/server.svelte';
</script>

<style>
	.head {
		padding-top: 1rem;
		padding-left: 2.4rem;
		padding-bottom: 1rem;
	}
	div {
		background-color: #282a36;
	}
	.bag {
		height: 100vh;
	}
	.search {
		padding-left: 5rem;
		padding-right: 5rem;
	}
	@media (max-width: 750px) {
		.head {
			padding-top: 8rem;
			text-align: center;
		}
		.items {
			flex-wrap: wrap;
			align-items: center;
			justify-content: center;
		}
	}
</style>

<div class="bag">
	<div class="head">
		<h1 class="text-nosferatu-100 p-1 text-4xl ">Dev Links</h1>
		<h1 class="text-blade-100 p-1 text-l ">The Arctesian</h1>
	</div>
	<div class="search">
		<Searchbar />
	</div>
	<div class="items flex w-full flex-row lg:justify-around md:flex-wrap sm:flex-warp">
		<Langs />
		<Lib />
		<UI />
		<Icons />
		<Server />
	</div>
</div>
