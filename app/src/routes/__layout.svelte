<script>
	import '../app.css';
	import Countdown from '../compontents/count.svelte'
	import dayjs from 'dayjs'
	import tz from 'dayjs/plugin/timezone.js'
	dayjs.extend(tz)
	console.log("PEPEORPOAOPSOPDO")
	
	console.log(dayjs('2022-08-22', 'YYYY-MM-DD', 'Europe/London').isValid())
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
		top: 2rem;
		left: 25%;
		right: 25%;
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
	<Countdown from="2022-08-22" dateFormat="YYYY-MM-DD" zone="Asia/Hong_Kong" let:remaining>
    <div class="count text-nosferatu-100 text-center bg-nosfeatu-300 transition-all duration-100 ">
        {#if remaining.done === false}
		<span> Time till school starts: </span>
        <span>{remaining.months} 月</span>
        <span>{remaining.weeks} 星期</span>
        <span>{remaining.days} 天</span>
        <span>{remaining.hours} 小時</span>
        <span>{remaining.minutes} 分鐘</span>
        <span>{remaining.seconds} 秒</span>
        {:else}
        <h2>Change this to something Else</h2>
        {/if}
    </div>
</Countdown>
<slot />
