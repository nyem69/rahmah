<script>

 	import "carbon-components-svelte/css/all.css";
	import './styles.css';

	import FakeProgressBar from "$lib/Components/FakeProgressBar.svelte";

</script>



<style>
</style>




<div class="app">

	<main>
	  <!-- +page.svelte is rendered in this <slot> -->
		<slot />
	</main>

	<FakeProgressBar/>

</div>
