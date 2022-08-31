<script>
	import Searchbar from '../compontents/searchbar.svelte';
	import Google from '../compontents/Skl Google.svelte';
	import School from '../compontents/School.svelte';
	import English from '../compontents/School/English.svelte';
</script>

<div class="bag">
	<div class="head">
		<h1 class="text-nosferatu-100 p-1 text-4xl ">Dev Links</h1>
		<h1 class="text-blade-100 p-1 text-l ">The Arctesian</h1>
	</div>
	<div class="search">
		<Searchbar />
	</div>
	<div class="items flex w-full flex-row lg:justify-around md:flex-wrap sm:flex-warp">
		<Google />
		<English />
		<School />
	</div>
</div>

<style>
	.head {
		padding-top: 2.4rem;
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
	.items {
		margin-top: 3rem;
	}
	@media (max-width: 750px) {
		.items {
			flex-wrap: wrap;
			align-items: center;
			justify-content: center;
			padding: 1rem;
		}
	}
</style>
