<div class="bag">
	<div class="head">
	</div>
<div class="flex flex-row text-4xl min-h-screen justify-center items-center">
    <h1 id="breathing-button"> FOCUS ON ONE THING AT A TIME</h1>
</div>
</div>
<style>

    #breathing-button {
    width: 70vw;
    font-size: 3rem;
    padding: 12px;
    -webkit-animation: breathing 18s ease-out infinite normal;
    animation: breathing 5s ease-out infinite normal;
    background: #ff79c6;
    color: #fff;
    -webkit-font-smoothing: antialiased;
    border-radius: 2px;
    text-align: center;    
    }


@-webkit-keyframes breathing {
  0% {
    -webkit-transform: scale(0.9);
    transform: scale(0.9);
  }

  25% {
    -webkit-transform: scale(1);
    transform: scale(1);
  }

  60% {
    -webkit-transform: scale(0.9);
    transform: scale(0.9);
  }

  100% {
    -webkit-transform: scale(0.9);
    transform: scale(0.9);
  }
}

@keyframes breathing {
  0% {
    -webkit-transform: scale(1);
    -ms-transform: scale(1);
    transform: scale(1);
  }

  60% {
    -webkit-transform: scale(1.3);
    -ms-transform: scale(1.3);
    transform: scale(1.3);
  }

 75% {
    -webkit-transform: scale(1.3);
    -ms-transform: scale(1.3);
    transform: scale(1.3);
  }
  100% {
    -webkit-transform: scale(1);
    -ms-transform: scale(1);
    transform: scale(1);
  }
}

    .focus{
        color: white;
    }
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
