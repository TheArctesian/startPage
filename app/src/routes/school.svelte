<script>
	import Searchbar from '../compontents/Layout/searchbar.svelte';
	import Google from '../compontents/Home/Berkeley.svelte';
	import School from '../compontents/Home/School.svelte';
	import English from '../compontents/School/Languages.svelte';
	import Stem from '../compontents/School/Stem.svelte';
	import Humanities from '../compontents/School/Inso.svelte';
</script>

<div class="bag">
	<div class="head">
		<h1 class="text-nosferatu-100 p-1 text-4xl ">School Links</h1>
		<h1 class="text-blade-100 p-1 text-l ">The Arctesian</h1>
	</div>
	<div class="search">
		<Searchbar />
	</div>
	<div class="items flex w-full flex-row lg:justify-around md:flex-wrap sm:flex-warp">
		<Stem />
		<Google />
		<English />
		<Humanities />
		<School />
	</div>
</div>

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
			padding-left: 0rem;
			text-align: center;
		}
		.items {
			flex-wrap: wrap;
			align-items: center;
			justify-content: center;
		}
	}
</style>
