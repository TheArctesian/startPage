<script>
	import '../app.css';
</script>

<style>
	div {
		position: absolute;
		margin-top: 1rem;
		padding: 1rem;
		right: 0;
	}
</style>

<div>
	<a
		href="/"
		class="text-nosferatu-100 hover:text-nosferatu-50 transition-all duration-100 text-2xl ">
		| Home |
	</a>

	<a
		href="/dev"
		class="text-nosferatu-100 hover:text-nosferatu-50 transition-all duration-100 text-2xl ">
		Dev |
	</a>
</div>
<slot />
