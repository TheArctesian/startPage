<script>
	import Searchbar from '../compontents/Layout/searchbar.svelte';
	import Google from '../compontents/Home/Skl Google.svelte';
	import Develop from '../compontents/Home/Develop.svelte';
	import Social from '../compontents/Fun/Social.svelte';
	import Core from '../compontents/Home/Core.svelte';
	import School from '../compontents/Home/School.svelte';
	import Todo from '../compontents/TODO/todo.svelte';
</script>

<div class="bag">
	<div class="head">
		<h1 class="text-nosferatu-100 p-1 text-4xl ">Start Page</h1>
		<h1 class="text-blade-100 p-1 text-l ">The Arctesian</h1>
	</div>
<div class="search">
		<Searchbar />
	</div>

		<!-- <div
			class="flex items w-half  flex-wrap flex-row p-5 lg:justify-around md:flex-wrap
		sm:flex-warp"
		>
			<Todo />
		</div> -->
		<div
			class="flex items w-half m-auto flex-wrap flex-row p-5 lg:justify-around md:flex-wrap
		sm:flex-warp"
		>
			<Core />
			<Develop />
			<!-- <WebDev /> -->
			<Google />
			<Social />
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
