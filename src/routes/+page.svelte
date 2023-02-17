
<script>


	import { onMount, onDestroy  } from "svelte"
	import { browser } from '$app/environment';
//	import * as d3 from "d3"
//	import * as turf from '@turf/turf';
//	import d3comparator from '$lib/d3comparator.js';
//	import moment from 'moment';


	//=====================
	//  map
	//=====================

	let L;
	let map;
	let mapElement;
	let mapLayer;
	let ll;

	$: gettingLocation = false;
	$: locationError = null;

	const bb 				= [99.640623, 0.857777, 119.266349, 7.370785];
	const bbsem 		= [99.640623, 0.857777, 105, 7.370785];
	const boundsSem = [[bbsem[1],bbsem[0]],[bbsem[3],bbsem[2]]];
	const boundsPadded = [[bb[1]-2, bb[0]-5],[bb[3]+5, bb[2]+5]];


	onMount(async () => {
		if(browser) {

			const savedLocation = window.localStorage.getItem('location') || null;
			if (savedLocation) ll = savedLocation.split(',').map(d=>+d);

			L = await import('leaflet');

			map = L.map(mapElement, {
										preferCanvas				: true,
										attributionControl	: true,
										trackResize					: true,
										zoomControl					: !!ll,
										scrollWheelZoom			: !!ll,
										doubleClickZoom			: !!ll,
										dragging						: !!ll,
										zoomSnap						: 0.5,
										zoomDelta						: .5,
										minZoom							: 5,
										maxBounds						: boundsPadded,
									});

			if (ll)	{
				map.setView(ll, 12);
			}else	{
				map.fitBounds(boundsSem);
			}

	    mapLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
	        opacity: !!ll?1:0.4,
	    }).addTo(map);




			//=====================
			// location
			//=====================

			function onLocationFound(e) {
			    var radius = e.accuracy;

			    L.marker(e.latlng).addTo(map)
			        .bindPopup("You are within " + radius + " meters from this point").openPopup();

			    L.circle(e.latlng, radius).addTo(map);

			    console.log('e.latlng', e.latlng);
			   	window.localStorage.setItem('location', [e.latlng.lat,e.latlng.lng].join(','));

			    locationError = null;
			    gettingLocation = false;

			    map.removeLayer(mapLayer);
			    mapLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
			        opacity: 1,
			    }).addTo(map);

			    map.options.dragging = true;
			    map.options.zoomControl = true;


			}

			map.on('locationfound', onLocationFound);

			function onLocationError(e) {
				locationError = e.message;
			}

			map.on('locationerror', onLocationError);





		} // browser
	}); // onMount

	onDestroy(async () => {
		if(map) map.remove();
  });



	const ogtitle = "og:title";
	const ogtitleValue = "Menu Rahmah";
	const ogdescription = "og:description";
	const ogdescriptionValue = "Lokasi Menu Rahmah";


	import { Button } from "carbon-components-svelte";
	import { ProgressBar } from "carbon-components-svelte";
	import { ToastNotification } from "carbon-components-svelte";

</script>



<svelte:head>
	<title>{ogtitleValue}</title>
	<meta name="apple-mobile-web-app-title" 	content="Menu Rahmah"/>
	<meta itemprop="name" 										content={ogtitleValue} property={ogtitle} name="twitter:title"/>
	<meta property={ogtitle} 				 				 content={ogtitleValue}/>
	<meta name="description" 									content={ogdescriptionValue}/>
	<meta name="keywords"					  					content={ogdescriptionValue}/>
	<meta property={ogdescription}		 				 content={ogdescriptionValue}/>
	<meta itemprop="description" 							content={ogdescriptionValue} property={ogdescription} name="twitter:description" />
	<link type="text/css" rel="stylesheet" href="//libjs.pages.dev/leaflet/1.8.0/leaflet.css"/>
</svelte:head>



<div style="width:100vw;height:100vh" bind:this={mapElement}></div>

<div style="z-index:1000;position:absolute;top:10px;right:10px;width:90vw;">

	{#if gettingLocation}
		<ProgressBar/>
	{:else}
		<Button on:click={()=>{
			gettingLocation=true;
			map.locate({setView: true, maxZoom: 18});
		}}>Detect Location</Button>
	{/if}

</div>

{#if locationError}
	<div style="z-index:1000;position:absolute;top:50vx;left:0vw;width:100vw;">
		<ToastNotification
		  title="Error"
		  subtitle={locationError}
		  caption="Set your browser setting to allow location"}
		  on:close={(e) => {
		  	locationError = null;
		    //e.preventDefault();
		  }}
		/>
	</div>
{/if}
