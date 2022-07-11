<script>
	import Simpleicons from '../SVG/simpleicons.svg';
</script>

<style>
	img {
		width: 2.5rem;
		background-color: #ff79c6;
		border-radius: 1rem;
		padding: 0.2rem;
	}
	a {
		color: #ff79c6;
		margin-top: auto;
		margin-bottom: auto;
		padding-left: 1rem;
		transition: all ease-in-out 300ms;
	}
	a:hover {
		color: #ffc4e6;
	}
	.main {
		border-color: #ff79c6;
		border-width: 0.1rem;
		border-radius: 1rem;
	}
	@media (max-width: 1030px) {
		.main {
			border: none;
		}
	}
</style>

<div class="p-5 flex main flex-wrap flex-col">
	<h1 class="text-2xl text-center text-nosferatu-100 my-2">Icons</h1>
	<div class=" flex m-1">
		<img alt="github logo" src="https://img.icons8.com/plumpy/344/icons8-logo.png" />
		<a href="https://icons8.com/" target="_blank">Icons8</a>
	</div>
	<div class=" flex m-1">
		<img alt="github logo" src="https://cdn-icons-png.flaticon.com/512/4478/4478871.png" />
		<a href="https://www.flaticon.com/" target="_blank">Flat Icons</a>
	</div>
	<div class=" flex m-1">
		<img alt="github logo" src={Simpleicons} />
		<a href="https://simpleicons.org/" target="_blank">Simple Icons</a>
	</div>
	<div class=" flex m-1">
		<img alt="github logo" src="https://img.icons8.com/fluency-systems-filled/344/add-font.png" />
		<a href="https://www.onlinewebfonts.com/icon/" target="_blank">Web Fonts</a>
	</div>
</div>
