<script>
	import '../app.css';
	import Countdown from '../compontents/Layout/count.svelte';
	import dayjs from 'dayjs';
	import tz from 'dayjs/plugin/timezone.js';
	import { Wave } from 'svelte-loading-spinners';
</script>

<div class="nav">
	<a
		href="/"
		class="text-nosferatu-100 hover:text-nosferatu-50 transition-all duration-100 text-2xl "
	>
		| Home |
	</a>

	<a
		href="/dev"
		class="text-nosferatu-100 hover:text-nosferatu-50 transition-all duration-100 text-2xl "
	>
		Dev |
	</a>
	<a
		href="/school"
		class="text-nosferatu-100 hover:text-nosferatu-50 transition-all duration-100 text-2xl "
	>
		School |
	</a>
</div>
<Countdown from="2022-10-15" dateFormat="YYYY-MM-DD" zone="Asia/Hong_Kong" let:remaining>
	<div class="count text-nosferatu-100 text-center bg-nosfeatu-300 transition-all duration-100 ">
		{#if remaining.done === false}
			<span style="color: #ff79c6;">Time till mid term</span>
			<hr />
			<span>{remaining.days} 天</span>
			<span>{remaining.hours} 小時</span>
			<span>{remaining.minutes} 分鐘</span>
			<span>{remaining.seconds} 秒</span>
		{:else}
			<div class="wav">
				<Wave size="50" color="#a771f6" unit="px" duration="1s" />
			</div>
		{/if}
	</div>
</Countdown>
<slot />

<style>
	.nav {
		position: absolute;
		margin-top: 1rem;
		padding: 1rem;
		right: 0;
	}
	.count {
		position: absolute;
		text-align: center;
		top: 4rem;
		left: 25%;
		right: 25%;
	}
	.wav {
		position: absolute;
		text-align: center;
		left: 40%;
		right: 40%;
	}
	:global(body) {
		background-color: #272727;
	}
	@media (max-width: 750px) {
		.count {
			top: 4rem;
		}
		.nav {
			padding: 0;
			left: 0;
			text-align: center;
		}
	}
</style>
