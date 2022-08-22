<script>
	import '../app.css';
	import Countdown from '../compontents/count.svelte';
	import dayjs from 'dayjs';
	import tz from 'dayjs/plugin/timezone.js';
	import { Wave } from 'svelte-loading-spinners';
</script>

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
		top: 13rem;
		left: 25%;
		right: 25%;
	}
	.wav {
		position: absolute;
		text-align: center;
		left: 40%;
		right: 40%;
	}
	@media (min-width: 1030px) {
		.count {
			top: 2rem;
		}
	}
</style>

<div class="nav">
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
<Countdown from="2022-10-15" dateFormat="YYYY-MM-DD" zone="Asia/Hong_Kong" let:remaining>
	<div class="count text-nosferatu-100 text-center bg-nosfeatu-300 transition-all duration-100 ">
		{#if remaining.done === false}
			<span style="color: #ff79c6;">Time till school starts</span>
			<hr />
			<span>{remaining.weeks} 星期</span>
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
