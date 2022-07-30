<script>
	import Searchbar from '../compontents/searchbar.svelte';
	import School from '../compontents/school.svelte';
	import Develop from '../compontents/Develop.svelte';
	import Social from '../compontents/Social.svelte';
	import Core from '../compontents/Core.svelte';
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
		.items {
			flex-wrap: wrap;
			align-items: center;
			justify-content: center;
		}
	}
</style>

<div class="bag">
	<div class="head">
		<h1 class="text-nosferatu-100 p-1 text-4xl ">Start Page</h1>
		<h1 class="text-blade-100 p-1 text-l ">The Arctesian</h1>
	</div>
	<div class="search">
		<Searchbar />
	</div>
	<div
		class="flex items w-full m-auto flex-wrap flex-row p-5 lg:justify-around md:flex-wrap
		sm:flex-warp">
		<Core />
		<Develop />
		<!-- <WebDev /> -->
		<School />
		<Social />
	</div>
</div>
