
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
	let ll=null;
	let marker;

	$: zoomLevel = 12;

	$: gettingLocation = false;
	$: locationError = null;


	const bb 				= [99.640623, 0.857777, 119.266349, 7.370785];
	const bbsem 		= [99.640623, 0.857777, 105, 7.370785];
	const boundsSem = [[bbsem[1],bbsem[0]],[bbsem[3],bbsem[2]]];
	const boundsPadded = [[bb[1], bb[0]],[bb[3], bb[2]]];


	onMount(async () => {
		if(browser) {

			const savedLocation = window.localStorage.getItem('location') || null;
			if (savedLocation) ll = savedLocation.split(',').map(d=>+d);

			L = await import('leaflet');
			initMap();


		} // browser
	}); // onMount

	onDestroy(async () => {
		if(map) map.remove();
  });



	//=====================
	// map
	//=====================
	function initMap(cb)	{
		console.group('%cinitMap','color:magenta');

		map = L.map(mapElement, {
									preferCanvas				: true,
									attributionControl	: true,
									trackResize					: true,
									zoomControl					: false,
									scrollWheelZoom			: !!ll,
									doubleClickZoom			: !!ll,
									dragging						: true,
									zoomSnap						: 0.5,
									zoomDelta						: .5,
									minZoom							: 5,
									maxBounds						: boundsPadded,
									padding							: [1,1],
								});

		if (ll)	{
			map.setView(ll, zoomLevel);
		}else	{
			map.fitBounds(boundsSem);
		}

    mapLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        opacity: !!ll?1:0.4,
    }).addTo(map);

		map.on('locationfound', onLocationFound);
		map.on('locationerror', onLocationError);
		map.on('zoomlevelschange', onZoomChanged);
		map.on('zoomend', onZoomChanged);

		console.groupEnd('initMap');
	}

	function onZoomChanged(e) {
		zoomLevel = map.getZoom();
	}

	//=====================
	// location
	//=====================

	function onLocationFound(e) {
		console.group('%conLocationFound','color:magenta');

    var radius = e.accuracy;

    console.log('e.latlng', e.latlng);
    ll = [e.latlng.lat,e.latlng.lng];
   	window.localStorage.setItem('location', [e.latlng.lat,e.latlng.lng].join(','));

    locationError = null;
    gettingLocation = false;

    if(map) map.remove();
    window.setTimeout(()=>{

    	initMap();

	    L.marker(e.latlng).addTo(map)
	        .bindPopup("You are within " + radius + " meters from this point").openPopup();

//	    L.circle(e.latlng, radius).addTo(map);

			console.groupEnd('onLocationFound');

    },100);

	}


	function onLocationError(e) {
		locationError = e.message;
	}


	const ogtitle = "og:title";
	const ogtitleValue = "Menu Rahmah";
	const ogdescription = "og:description";
	const ogdescriptionValue = "Lokasi Menu Rahmah";


	import { ButtonSet, Button } from "carbon-components-svelte";
	import { ProgressBar } from "carbon-components-svelte";
	import { ToastNotification } from "carbon-components-svelte";
	import AddFilled from "carbon-icons-svelte/lib/Add.svelte";
	import CenterCircle from "carbon-icons-svelte/lib/CenterCircle.svelte"

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

<div style="z-index:1001;position:absolute;top:0px;left:0px;width:100vw;">
	{#if gettingLocation}
		<ProgressBar/>
	{/if}
</div>

<div style="z-index:1000;position:absolute;top:0px;right:0px;width:100vw;">

	<ButtonSet>

		{#if gettingLocation}
		{:else if ll}


			<Button kind="danger" on:click={()=>{
				console.group('%cdisable location','color:magenta');
				ll=null;
				window.localStorage.removeItem('location');
				if(map) map.remove();
				window.setTimeout(()=>{
					initMap(()=>{console.groupEnd('disable location')})
				},100);
			}}>

				<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-gps"
					style="margin-right:6px;"
					width="44" height="44" viewBox="0 0 24 24"
					stroke-width="2" stroke="#ffffff" fill="none" stroke-linecap="round" stroke-linejoin="round">
				<path stroke="none" d="M0 0h24v24H0z" fill="none"/>
				<circle cx="12" cy="12" r="9" />
				<path d="M12 17l-1 -4l-4 -1l9 -4z" />
				</svg>

				Disable Location</Button>

			<Button on:click={()=>{
				console.group('%cAdd new MenuRahmah','color:magenta');

				if (map)	{
					if (map.getZoom() < 18) {
						zoomLevel=19;
						map.setView(ll, zoomLevel);
					}

			    marker = L.marker(ll).addTo(map)
						        .bindPopup("menu rahmah")
						        .openPopup();
				}

				console.groupEnd('Add new MenuRahmah');

			}}>

				<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-circle-plus"
				style="margin-right:6px;"
				width="44" height="44" viewBox="0 0 24 24" stroke-width="2" stroke="#ffffff" fill="none" stroke-linecap="round" stroke-linejoin="round">
				<path stroke="none" d="M0 0h24v24H0z" fill="none"/>
				<circle cx="12" cy="12" r="9" />
				<line x1="9" y1="12" x2="15" y2="12" />
				<line x1="12" y1="9" x2="12" y2="15" />
				</svg>

				Add new MenuRahmah</Button>

		{:else}

			<Button on:click={()=>{
				console.group('%cDetect Location','color:magenta');
				gettingLocation=true;
				zoomLevel=18;
				map.locate({setView: true, maxZoom: zoomLevel});
				console.groupEnd('Detect Location');
			}}>

				<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-current-location"
					style="margin-right:6px;"
					width="44" height="44" viewBox="0 0 24 24" stroke-width="2" stroke="#ffffff" fill="none" stroke-linecap="round" stroke-linejoin="round">
				  <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
				  <circle cx="12" cy="12" r="3" />
				  <circle cx="12" cy="12" r="8" />
				  <line x1="12" y1="2" x2="12" y2="4" />
				  <line x1="12" y1="20" x2="12" y2="22" />
				  <line x1="20" y1="12" x2="22" y2="12" />
				  <line x1="2" y1="12" x2="4" y2="12" />
				</svg>

				Detect Location</Button>
		{/if}


	</ButtonSet>

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


<div style="position:fixed; bottom:10px; left:10px; z-index:1000">
	<input type=range min=5 max=20 bind:value={zoomLevel} on:input={()=>{
		map.setZoom(zoomLevel)
	}} style="width:300px"/>
</div>

