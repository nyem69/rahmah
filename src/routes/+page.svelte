
<script>

	export let data;

	console.log('data',data);

	import { onMount, onDestroy  } from "svelte";
	import { browser } from '$app/environment';
	import * as d3 from "d3"
	import * as turf from '@turf/turf';
	import d3comparator from '$lib/d3comparator.js';
	import L from 'leaflet';

//	import moment from 'moment';

	let comma = d3.format(','),
			f1 = d3.format('.1f'),
			f2 = d3.format('.2f'),
			f3 = d3.format('.3f');

	//=====================
	//  map
	//=====================

//	let L;
	let map;
	let mapElement;
	let mapLayer;
	let marker;
	let userLocation=null;

	$: zoomLevel = 12;

	$: gettingLocation = false;
	$: locationError = null;


	const bb 				= [99.640623, 0.857777, 119.266349, 7.370785];
	const bounds 		= [[bb[1],bb[0]],[bb[3],bb[2]]];

	//====================================================================================
	//
	//====================================================================================
	const debounce = (func, delay) => {
		let timer;
		return function () {
			const context = this;
			const args = arguments;
			clearTimeout(timer);
			timer = setTimeout(() => func.apply(context, args), delay);
		};
	};

	$: innerwidth=1000;
	$: innerheight=1000;
	const resizeGrids = () => {
		innerwidth = innerWidth;
		innerheight = innerHeight;
	};
	const debouncedResizeWindow = debounce(resizeGrids, 100);


	onMount(async () => {
		if(browser) {

			debouncedResizeWindow();
			window.addEventListener('resize', debouncedResizeWindow);

			const savedLocation = window.localStorage.getItem('location') || null;
			if (savedLocation) userLocation = savedLocation.split(',').map(d=>+d);


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

//		d3.select(mapElement)
//			.style('width',innerwidth+'px')
//			.style('height',innerheight+'px')

		map = L.map(mapElement, {
									preferCanvas				: true,
									attributionControl	: true,
									trackResize					: true,
									zoomControl					: !!userLocation,
									scrollWheelZoom			: !!userLocation,
									doubleClickZoom			: !!userLocation,
									dragging						: true,
									zoomSnap						: 0.5,
									zoomDelta						: .5,
									minZoom							: 5,
//									maxBounds						: boundsPadded,
									padding							: [1,1],
								});

		if (userLocation)	{
			map.setView(userLocation, zoomLevel);
		}else	{
			map.fitBounds(bounds);
		}

    mapLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        opacity: !!userLocation?1:0.4,
    }).addTo(map);

		map.on('locationfound', onLocationFound);
		map.on('locationerror', onLocationError);
		map.on('zoomlevelschange', onZoomChanged);
		map.on('zoomend', onZoomChanged);

		mapMarkerList();
		calcDistance();

		console.groupEnd('initMap');
	}

	function onZoomChanged(e) {
		zoomLevel = map.getZoom();
	}

	function mapZoom(){
		map.setZoom(zoomLevel)
	}
	const debouncedMapZoom = debounce(mapZoom, 50);



	//=====================
	// calcDistance
	//=====================

	function calcDistance(){
		let ll = userLocation ? L.latLng(userLocation[0], userLocation[1]) : null;
		data.list.forEach(d=>{
			d._distance = ll && d.marker._latlng ? map.distance(ll,d.marker._latlng) : null;
		});
		if (ll)	{
			data.list.sort(d3comparator().order(d3.ascending, d=>d._distance))
		}else	{
			data.list.sort(d3comparator().order(d3.ascending, d=>d.nama))
		}

		// force reactive
		// https://svelte.dev/tutorial/updating-arrays-and-objects
		data.list = data.list;
	}

	//=====================
	// location
	//=====================

	function onLocationFound(e) {
		console.group('%conLocationFound','color:magenta');

    var radius = e.accuracy;

    console.log('e.latlng', e.latlng);
    userLocation = [e.latlng.lat,e.latlng.lng];
   	window.localStorage.setItem('location', [e.latlng.lat,e.latlng.lng].join(','));

    locationError = null;
    gettingLocation = false;

    if(map) map.remove();
    window.setTimeout(()=>{

    	initMap();

//	    L.marker(e.latlng).addTo(map)
//	        .bindPopup("You are within " + radius + " meters from this point").openPopup();
//
//	    L.circle(e.latlng, radius).addTo(map);

			console.groupEnd('onLocationFound');

    },100);

	}


	function onLocationError(e) {
		locationError = e.message;
	}

	//====================================================================================
	//
	//====================================================================================

	function mapMarkerList()	{
		let fName = 'mapMarkerList', dbg=1;
		console.group('%c'+fName,'color:magenta');

		data.list.forEach(d=>{

			//dbg&&console.log('d',d);

			let node = mapPopupContent(d);
			let markerid = +d.id;

			let ll = L.latLng([d.geocoder_latitude, d.geocoder_longitude]);
			if (d.latitude && d.longitude)	{
				ll = L.latLng([d.latitude, d.longitude]);
			}

			var myIcon = L.divIcon({
				className: 'my-div-icon',
				html: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">
								<defs>
								  <filter id="fshadow02" filterUnits="objectBoundingBox" x="-50%" y="-50%" width="200%" height="200%">
								    <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="BlurAlpha"/>
								    <feOffset in="BlurAlpha" dx="1" dy="1" result="OffsetBlurAlpha"/>
								    <feMerge>
								      <feMergeNode in="OffsetBlurAlpha"/>
								      <feMergeNode in="SourceGraphic"/>
								    </feMerge>
								  </filter>
								  <radialGradient id="Red" cx="30%" cy="30%" fx="30%" fy="30%" r="50%" gradientUnits="objectBoundingBox">
								    <stop offset="0" style="stop-color:rgb(255,0,0)"/>
								    <stop offset="1" style="stop-color:rgb(128,0,0)"/>
								  </radialGradient>
								  <radialGradient id="Yellow" cx="30%" cy="30%" fx="30%" fy="30%" r="50%" gradientUnits="objectBoundingBox">
								    <stop offset="0" style="stop-color:rgb(255,255,0)"/>
								    <stop offset="1" style="stop-color:rgb(128,128,0)"/>
								  </radialGradient>
								  <radialGradient id="Orange" cx="30%" cy="30%" fx="30%" fy="30%" r="50%" gradientUnits="objectBoundingBox">
								    <stop offset="0" style="stop-color:#ff0"/>
								    <stop offset="1" style="stop-color:#f90"/>
								  </radialGradient>
								  <radialGradient id="Cyan" cx="30%" cy="30%" fx="30%" fy="30%" r="50%" gradientUnits="objectBoundingBox">
								    <stop offset="0" style="stop-color:rgb(0,255,255)"/>
								    <stop offset="1" style="stop-color:rgb(0,128,128)"/>
								  </radialGradient>
								  <radialGradient id="WildStrawberry" cx="30%" cy="30%" fx="30%" fy="30%" r="50%" gradientUnits="objectBoundingBox">
								    <stop offset="0" style="stop-color:rgb(255,10,155)"/>
								    <stop offset="1" style="stop-color:rgb(128,5,78)"/>
								  </radialGradient>
								  <radialGradient id="Blue" cx="30%" cy="30%" fx="30%" fy="30%" r="50%" gradientUnits="objectBoundingBox">
								    <stop offset="0" style="stop-color:rgb(0,0,255)"/>
								    <stop offset="1" style="stop-color:rgb(0,0,128)"/>
								  </radialGradient>
								  <radialGradient id="Purple" cx="30%" cy="30%" fx="30%" fy="30%" r="50%" gradientUnits="objectBoundingBox">
								    <stop offset="0" style="stop-color:rgb(140,35,255)"/>
								    <stop offset="1" style="stop-color:rgb(70,18,128)"/>
								  </radialGradient>
								  <radialGradient id="Lime" cx="30%" cy="30%" fx="30%" fy="30%" r="50%" gradientUnits="objectBoundingBox">
								    <stop offset="0" style="stop-color:rgb(127,255,0)"/>
								    <stop offset="1" style="stop-color:rgb(64,128,0)"/>
								  </radialGradient>
								  <radialGradient id="Silver" cx="30%" cy="30%" fx="30%" fy="30%" r="50%" gradientUnits="objectBoundingBox">
								    <stop offset="0" style="stop-color:#fff"/>
								    <stop offset="1" style="stop-color:#999"/>
								  </radialGradient>
								  <radialGradient id="Brown" cx="30%" cy="30%" fx="30%" fy="30%" r="50%" gradientUnits="objectBoundingBox">
								    <stop offset="0" style="stop-color:#fff"/>
								    <stop offset="1" style="stop-color:#E18400"/>
								  </radialGradient>
								  <radialGradient id="SkyBlue" cx="30%" cy="30%" fx="30%" fy="30%" r="50%" gradientUnits="objectBoundingBox">
								    <stop offset="0" style="stop-color:#fff"/>
								    <stop offset="1" style="stop-color:#87CEFA"/>
								  </radialGradient>
								  <radialGradient id="Tomato" cx="30%" cy="30%" fx="30%" fy="30%" r="50%" gradientUnits="objectBoundingBox">
								    <stop offset="0" style="stop-color:#fff"/>
								    <stop offset="1" style="stop-color:#FF6347"/>
								  </radialGradient>
								</defs>
								<circle cx="11" cy="11" r="10" fill="url(#Orange)" filter="url(#fshadow02)"/>
							</svg>`
			});

//			d.draggable = false;

			var popup = L.popup({
						className:  'marker-'+markerid,
						offset: L.point(0,-10),
						minWidth: 200,
						minHeight: 200,
						keepInView: false
					})
			    .setLatLng(ll)
			    .setContent( node )


			d.marker = L.marker(ll, {
					radius: 100,
					riseOnHover:true,
//					draggable: d.draggable?'true':'false',
					draggable: !!d.draggable,
					bubblingMouseEvents: false,
					icon: myIcon
				})
				.on('mouseover', function(e){
					d3.select('#'+e.target._icon.id).select('circle').style('fill','url(#Red)')
				})
				.on('mouseout', function(e){
					d3.select('#'+e.target._icon.id).select('circle').style('fill','url(#Orange)')
				})
				.on('click', function(e){
					//console.log('e',e)
					//console.log('e.target._icon.id', e.target._icon.id);
					let id = +e.target._icon.id.split('-')[1];
					let d = data.list.find(k=>k.id==id);
					console.log('d', d, d.marker._latlng);

					markerSelected = d;


					//map.setView(d.marker._latlng, zoomLevel);
					//map.setView([d.marker._latlng.lat,d.marker._latlng.lng], zoomLevel);
					window.setTimeout(()=>{
//						map.panTo([d.marker._latlng.lat,d.marker._latlng.lng]);
						map.invalidateSize();
						zoomLevel = map.getZoom();
						map.setView(d.marker._latlng, zoomLevel);
					},100);
				})
				.on('dragend', function(e){
					dbg&&console.group('%ccircle dragend','color:lime');

					//=====================
					// update longitude / latitude
					//=====================

					let position = d.marker[ markerid ].getLatLng();
					dbg&&console.log('position',position);

					d.latitude = position.lat;
					d.longitude = position.lng;

					let ll = L.latLng([d.latitude, d.longitude]);
					let node = mapPopupContent(d);
					let popup = L.popup({
								className:  'marker-'+markerid,
								offset: L.point(0,-10),
								minWidth: 200,
								minHeight: 200,
								keepInView: false
							})
					    .setLatLng(ll)
					    .setContent( node );

					 //M.data.markers[ markerid ].bindPopup(popup);


					dbg&&console.groupEnd('circle dragend');
				})
				.addTo(map)
//				.bindPopup(popup)
				//.openPopup();

			d.marker._icon.id = 'marker-'+markerid;

		});

		console.groupEnd(fName);
	}



	//=====================
	//
	//=====================
	function mapPopupContent(datum) {
		let fName = 'mapPopupContent', dbg=0;
		dbg&&console.group('%c'+fName,'color:magenta');


		let node = d3.create('div').datum(datum)
				.selectChildren('.form').data(d=>[d])
					.join('div').attr('class','form')
						.style('width','300px')
						.call(sel=>{

							sel.selectChildren('table').data(d=>[d])
								.join('table')
									.selectChildren('tbody').data(d=>[d])
										.join('tbody')
											.call(sel=>{

												let tr=0;

												sel.selectChildren('.tr'+tr++).data(d=>[d])
													.join('tr')
														.call(sel=>{
															sel.selectChildren('.key').data(d=>[d])
																.join('td').attr('class','key').html('nama')
															sel.selectChildren('.value').data(d=>[d])
																.join('td').attr('class','value').html(d=>d.nama)
														});

												sel.selectChildren('.tr'+tr++).data(d=>[d])
													.join('tr')
														.call(sel=>{
															sel.selectChildren('.key').data(d=>[d])
																.join('td').attr('class','key').html('alamat')
															sel.selectChildren('.value').data(d=>[d])
																.join('td').attr('class','value').html(d=>d.alamat)
														});

												sel.selectChildren('.tr'+tr++).data(d=>[d])
													.join('tr')
														.call(sel=>{
															sel.selectChildren('.key').data(d=>[d])
																.join('td').attr('class','key').html('daerah')
															sel.selectChildren('.value').data(d=>[d])
																.join('td').attr('class','value').html(d=>d.daerah)
														});

												sel.selectChildren('.tr'+tr++).data(d=>[d])
													.join('tr')
														.call(sel=>{
															sel.selectChildren('.key').data(d=>[d])
																.join('td').attr('class','key').html('jenis')
															sel.selectChildren('.value').data(d=>[d])
																.join('td').attr('class','value').html(d=>d.jenis)
														});

											});


						})

		dbg&&console.groupEnd(fName);
		return node.node();
	}


	//====================================================================================
	//
	//====================================================================================


	function listHover(d) {

		//console.log('e.target', e.target, d.id);
		d3.select('#marker-'+d.id)
			.select('circle').attr('fill','url(#Red)');

		console.log(d3.select('#marker-'+d.id).node());

		// bringToFront()
		// - doesn't work
		//const mouseoverEvent = new Event('mouseover');
		//d3.select('#marker-'+d.id).node().closest('div').dispatchEvent(mouseoverEvent);

		let k=[];
		d3.selectAll('.my-div-icon').each(function(){
			k.push(d3.select(this).style('z-index'));
		});
		d3.select('#marker-'+d.id).style('z-index', d3.max(k)+1);

	}

	function listClick(d){
		console.log('d',d);
		map.setView(d.marker._latlng,zoomLevel)
	}

	function listOut(d){
		d3.select('#marker-'+d.id).select('circle').attr('fill','url(#Orange)');
	}


	//=====================
	//
	//=====================


	const ogtitle = "og:title";
	const ogtitleValue = "Menu Rahmah";
	const ogdescription = "og:description";
	const ogdescriptionValue = "Lokasi Menu Rahmah";


	import { ButtonSet, Button } from "carbon-components-svelte";
	import { ProgressBar } from "carbon-components-svelte";
	import { ToastNotification } from "carbon-components-svelte";
	import AddFilled from "carbon-icons-svelte/lib/Add.svelte";
	import CenterCircle from "carbon-icons-svelte/lib/CenterCircle.svelte"


	$: markerSelected = null;
	$: sortedList = data.list;

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
</svelte:head>





<style>
</style>

<nav>
	<div style="display:flex; flex-wrap:nowrap; justify-content:center; align-items:center; justify-items:center; width:100vw;height:10vh;">
		<div style="flex:1 1 auto; height:10vh; border:2px outset #999; background:orangered; cursor:pointer;"

			on:mouseover={(e)=>{ d3.select(e.target).style('background','orange') }}
			on:focus={(e)=>{ d3.select(e.target).style('background','orange') }}

			on:mouseout={(e)=>{ d3.select(e.target).transition().style('background','orangered') }}
			on:blur={(e)=>{ d3.select(e.target).transition().style('background','orangered') }}

			on:click={(e)=>{d3.select(e.target).style('background','#ff0000')}}
			on:keydown={(e)=>{d3.select(e.target).style('background','#ff0000')}}
			on:keyup={(e)=>{d3.select(e.target).style('background','#ff0000')}}
			on:keypress={(e)=>{d3.select(e.target).style('background','#ff0000')}}
		>

			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 50" style="max-height:10vh;" pointer-events="none" >
				<g transform="translate(0,0)" style="cursor:pointer">

					<rect x="-200" y="-200" width="1e6" height="1e6" fill="#ffffff00" stroke="#999"/>

					<g transform="translate(10,10)" pointer-events="none">

						<svg xmlns="http://www.w3.org/2000/svg"
							width="60" height="60%"
							viewBox="351.67999267578125 562.79931640625 96.30020141601562 41.75085449218758">
							<g fill="#fff" stroke="#ffffff80">
								<path d="M444.06,587.68h-12.48l-0.62-0.62c0.1,0.07,0.21,0.14,0.3,0.21c0.03,0.02,0.05,0.05,0.08,0.07
									c1.17-2.58,1.99-5.28,2.53-8.04c0.33-1.66,1.03-2.97,2.39-3.98c0.18-0.13,0.42-0.24,0.64-0.25c0.83-0.03,1.67,0,2.5-0.01
									c2.18-0.03,3.88-1.61,4.03-3.73c0.14-1.99-1.38-3.78-3.47-4.1c-0.33-0.05-0.67-0.05-1.03-0.08c-0.01-0.23-0.02-0.45-0.04-0.67
									c-0.17-2.07-1.88-3.64-3.99-3.68c-2.11-0.04-3.9,1.47-4.12,3.53c-0.07,0.68-0.09,1.37-0.03,2.05c0.07,0.79-0.11,1.42-0.82,1.88
									c-0.16,0.1-0.26,0.3-0.41,0.42c-0.37,0.3-0.71,0.71-1.15,0.84c-1.04,0.32-2.12,0.5-3.18,0.76c-2.87,0.7-5.73,1.45-8.39,2.75
									c-1.61,0.79-2.81,1.84-3.69,3.08c-1.17-1.01-2.39-1.76-3.66-2.2c-1.14-0.39-2.35-0.55-3.5-0.45c-0.6,0.05-1.46,0.16-2.27,0.55
									c-0.05-0.05-0.1-0.09-0.14-0.13c-0.29-0.28-0.56-0.54-0.89-0.73c-0.85-0.49-1.82-0.81-2.81-0.92c-1.89-0.2-3.89,0.36-5.49,1.55
									c-0.37,0.28-0.63,0.26-1.78-0.14c-0.84-0.29-1.87-0.65-3.11-0.52c-1.77,0.18-3.45,1.03-4.69,2.44
									c-0.03,0.03-0.05,0.06-0.08,0.09c-0.11,0-0.28-0.02-0.41-0.04c-0.6-0.07-1.51-0.18-2.45,0.34c-1.13,0.62-1.88,1.57-2.53,2.41
									c-0.15,0.19-0.3,0.38-0.45,0.57c-0.14-0.04-0.29-0.1-0.41-0.14c-0.64-0.23-1.34-0.49-2.12-0.41c-2.62,0.26-3.59,2.17-4.3,3.56
									c-0.02,0.04-0.04,0.08-0.06,0.12c-1.27-0.09-2.55,0.36-3.46,1.25c-0.65,0.65-1.02,1.49-1.15,2.37h-11.73
									c-2.17,0-3.94,1.71-3.94,3.8c0,2.1,1.77,3.8,3.94,3.8h8.59c6.81,8.83,22.67,9.25,23.39,9.27h9.48h5.5h9.51
									c0.69-0.01,16.55-0.44,23.36-9.27h8.59c2.17,0,3.94-1.71,3.94-3.8C448,589.39,446.24,587.68,444.06,587.68z M432.78,571.26
									c0.51-0.44,0.73-0.95,0.7-1.62c-0.04-0.92-0.01-1.85-0.01-2.77c0-0.86,0.55-1.43,1.36-1.43c0.8,0,1.34,0.58,1.35,1.44
									c0,0.52-0.01,1.04,0,1.56c0.02,0.79,0.53,1.32,1.35,1.36c0.57,0.03,1.14,0,1.71,0.01c0.87,0.01,1.46,0.53,1.47,1.28
									c0.01,0.78-0.59,1.33-1.46,1.34c-1.03,0.01-2.07,0.02-3.1,0c-0.53-0.01-0.95,0.16-1.31,0.53c-0.53,0.54-1.08,1.06-1.61,1.58
									c-0.67-0.65-1.29-1.25-1.96-1.89C431.76,572.2,432.25,571.71,432.78,571.26z M418.04,577.38c2.44-1.19,5.06-1.87,7.69-2.51
									c0.94-0.23,1.89-0.43,2.84-0.63c0.14-0.03,0.34,0,0.44,0.08c0.82,0.76,1.64,1.53,2.43,2.33c0.12,0.12,0.21,0.37,0.17,0.54
									c-0.58,2.68-1.26,5.34-2.27,7.91c-0.03,0.08-0.06,0.15-0.1,0.22c-0.09-0.09-0.18-0.18-0.26-0.27c-0.98-1.03-2.21-2.32-4.6-2.1
									l-2.32,0.22c-0.14-0.38-0.3-0.78-0.52-1.17c-0.53-0.93-1.28-1.58-2.17-1.9c-1.11-0.39-2.18-0.18-3.04-0.01l-0.29,0.06
									c-0.47,0.09-0.68,0.08-0.93-0.1c0.32-0.53,0.68-1.04,1.15-1.49C416.77,578.07,417.4,577.69,418.04,577.38z M370.73,587.4
									c0.31-0.31,0.84-0.44,1.27-0.31c0.2,0.06,0.73,0.22,1.33-0.01c0.62-0.24,0.9-0.73,0.98-0.88c0.18-0.31,0.34-0.63,0.5-0.95
									c0.68-1.34,1-1.82,1.78-1.9c0.14,0.01,0.54,0.15,0.77,0.24c0.84,0.3,1.89,0.68,2.88,0.13c0.48-0.27,0.78-0.63,0.99-0.87
									c0.18-0.22,0.36-0.45,0.54-0.68c0.53-0.67,1.02-1.3,1.6-1.62c0.08-0.02,0.35,0.01,0.53,0.03c0.55,0.07,1.37,0.16,2.22-0.25
									c0.5-0.24,0.81-0.6,1.09-0.92c0.65-0.73,1.59-1.21,2.58-1.31c0.52-0.05,1.09,0.14,1.74,0.37c1.17,0.4,2.94,1.01,4.71-0.31
									c0.97-0.72,2.14-1.07,3.25-0.95c0.55,0.06,1.08,0.24,1.51,0.48c0.1,0.07,0.21,0.19,0.34,0.31c0.55,0.53,1.3,1.17,2.19,1.18
									c0.64-0.01,1.12-0.27,1.51-0.48c0.12-0.06,0.43-0.18,1.18-0.25c0.71-0.06,1.46,0.04,2.19,0.29c1.1,0.38,2.19,1.11,3.25,2.17
									c0.17,0.17,0.33,0.34,0.47,0.49c0.9,0.96,2.01,2.17,4.52,1.68l0.32-0.06c0.52-0.1,1.06-0.21,1.34-0.11
									c0.17,0.06,0.37,0.26,0.53,0.54c0.19,0.33,0.32,0.74,0.47,1.18l0.09,0.28c0.05,0.17,0.22,0.69,0.76,1.03
									c0.55,0.36,1.12,0.3,1.3,0.29l3.22-0.3c0.75-0.07,1,0.07,2.02,1.14c0.2,0.21,0.41,0.41,0.61,0.62h-56.78
									C370.58,587.58,370.65,587.48,370.73,587.4z M412.08,601.56h-9.48h-5.5h-9.45c-0.14,0-12.62-0.35-19.27-6.28h62.92
									C424.67,601.21,412.19,601.56,412.08,601.56z M444.06,592.3h-88.43c-0.46,0-0.84-0.36-0.84-0.81c0-0.45,0.38-0.81,0.84-0.81
									h88.43c0.46,0,0.84,0.36,0.84,0.81C444.9,591.93,444.53,592.3,444.06,592.3z"/>
								<path d="M424.69,581.26c0.49-0.02,0.89-0.43,0.88-0.91c-0.01-0.5-0.43-0.89-0.96-0.87c-0.5,0.02-0.9,0.42-0.89,0.9
									C423.73,580.87,424.18,581.28,424.69,581.26z"/>
								<path d="M425.55,577.79c0.51,0.01,0.94-0.4,0.94-0.9c0-0.49-0.39-0.87-0.9-0.88c-0.5-0.01-0.92,0.36-0.94,0.84
									C424.62,577.34,425.04,577.78,425.55,577.79z"/>
								<path d="M428.66,580.78c0.52,0.02,0.95-0.36,0.97-0.86c0.02-0.49-0.36-0.88-0.87-0.91
									c-0.53-0.03-0.96,0.35-0.97,0.86C427.77,580.34,428.16,580.75,428.66,580.78z"/>
							</g>
						</svg>
					</g>

					<text x="0" y="50%" pointer-events="none" transform="translate(90,0)" font-size="1rem" fill="#fff">
						<tspan x="0" >Menu</tspan>
						<tspan x="0" dy="1em">Rahmah</tspan>
					</text>


				</g>
			</svg>
		</div>
		<div style="flex:1 1 auto;height:10vh;border:2px outset #999; background:orangered;">
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 50" style="max-height:10vh;">
				<g transform="translate(0,0)" style="cursor:pointer">


					<rect x="-200" y="-200" width="1e6" height="1e6" fill="#ffffff00" stroke="#999"

						on:mouseover={(e)=>{
							d3.select(e.target)
									.style('fill','orange')
						}}


						on:focus={(e)=>{
							d3.select(e.target)
									.style('fill','orange')
						}}

						on:mouseout={(e)=>{
							d3.select(e.target)
								.transition()
									.style('fill','#ffffff00')
						}}

						on:blur={(e)=>{
							d3.select(e.target)
								.transition()
									.style('fill','#ffffff00')
						}}


						on:click={(e)=>{
							console.group('%cclick location','color:magenta');

							d3.select(e.target)
									.style('fill','#ff0000')

							if (userLocation)	{

								userLocation=null;
								window.localStorage.removeItem('location');
								if(map) map.remove();
								window.setTimeout(()=>{
									initMap()
								},100);

							}else	{

								gettingLocation=true;
								zoomLevel=12;
								map.locate({setView: true, maxZoom: zoomLevel});

							}

							console.groupEnd('click location');
						}}
						on:keydown={(e)=>{
							d3.select(e.target)
								.transition()
									.style('fill','#ff0000')
						}}
						on:keyup={(e)=>{
							d3.select(e.target)
								.transition()
									.style('fill','#ff0000')
						}}
						on:keypress={(e)=>{
							d3.select(e.target)
								.transition()
									.style('fill','#ff0000')
						}}

					/>

					<g transform="translate(10,0)" pointer-events="none">
						<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-gps"
							style="margin-right:6px;"
							width="40" height="100%" viewBox="0 0 24 24"
							stroke-width="1.5" stroke="#ffffff" fill="none" stroke-linecap="round" stroke-linejoin="round">
						<path stroke="none" d="M0 0h24v24H0z" fill="none"/>
						<circle cx="12" cy="12" r="9" />
						<path d="M12 17l-1 -4l-4 -1l9 -4z" />
						</svg>
					</g>

					<text x="0" y="50%" pointer-events="none" transform="translate(70,0)" font-size="1rem" fill="#fff">
						{#if gettingLocation}
							<tspan x="0">Getting</tspan>
							<tspan x="0" dy="1em">Location</tspan>
						{:else if userLocation}
							<tspan x="0">Disable</tspan>
							<tspan x="0" dy="1em">Location</tspan>
						{:else}
							<tspan x="0">Enable</tspan>
							<tspan x="0" dy="1em">Location</tspan>
						{/if}
					</text>

				</g>
			</svg>
		</div>
		<div style="flex:1 1 auto;height:10vh;border:2px outset #999; background:orangered;">
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 50" style="max-height:10vh;">

				<g transform="translate(0,0)" style="cursor:pointer">

					<rect x="-200" y="-200" width="1e6" height="1e6" fill="#ffffff00" stroke="#999"

						on:mouseover={(e)=>{
							d3.select(e.target)
									.style('fill','orange')
						}}


						on:focus={(e)=>{
							d3.select(e.target)
									.style('fill','orange')
						}}

						on:mouseout={(e)=>{
							d3.select(e.target)
								.transition()
									.style('fill','#ffffff00')
						}}

						on:blur={(e)=>{
							d3.select(e.target)
								.transition()
									.style('fill','#ffffff00')
						}}


						on:click={(e)=>{
							d3.select(e.target)
									.style('fill','#ff0000')

							if (userLocation)	{
								if (map.getZoom() < 18) {
									zoomLevel=18;
									map.setView(userLocation, zoomLevel);
								}

						    marker = L.marker(userLocation).addTo(map)
									        .bindPopup("menu rahmah")
									        .openPopup();
							}
						}}
						on:keydown={(e)=>{
							d3.select(e.target)
								.transition()
									.style('fill','#ff0000')
						}}
						on:keyup={(e)=>{
							d3.select(e.target)
								.transition()
									.style('fill','#ff0000')
						}}
						on:keypress={(e)=>{
							d3.select(e.target)
								.transition()
									.style('fill','#ff0000')
						}}

					/>

					<g transform="translate(10,0)" pointer-events="none">
						<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-circle-plus"
							style="margin-right:6px;"
							width="40" height="100%" viewBox="0 0 24 24" stroke-width="1.5" stroke="#ffffff" fill="none" stroke-linecap="round" stroke-linejoin="round">
						<path stroke="none" d="M0 0h24v24H0z" fill="none"/>
						<circle cx="12" cy="12" r="9" />
						<line x1="9" y1="12" x2="15" y2="12" />
						<line x1="12" y1="9" x2="12" y2="15" />
						</svg>
					</g>


					<text x="0" y="50%" pointer-events="none" transform="translate(70,0)" style="font-size:1rem" fill="#fff">
						<tspan x="0">Add</tspan>
						<tspan x="0" dy="1em">Location</tspan>
					</text>

				</g>
			</svg>
		</div>
	</div>
</nav>



<div style="width:100vw;height:40vh" bind:this={mapElement}></div>

<div style="z-index:1001;position:absolute;top:9vh;left:0px;width:100vw;">
	{#if gettingLocation}
		<ProgressBar/>
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

<!--
<div style="position:fixed; bottom:0px; left:0px; z-index:1000;text-align:center; background:orange; width:100vw; height:10vh; padding:24px;">
	<input type=range min=5 max=18 step=.5 bind:value={zoomLevel} on:input={()=>{
		map.setZoom(zoomLevel)
	}} style="width:300px"/>
</div>
-->

	<div style="height:50vh;width:100vw;overflow:scroll;">
		<table class="bp4-html-table bp4-html-table-striped bp4-interactive">
			<thead>
			</thead>
			<tbody>
				{#each sortedList as d}
					<tr
						on:mouseover={()=>{ listHover(d ) }}
						on:focus={()=>{ listHover(d ) }}

						on:mouseout={()=>{ listOut(d) }}
						on:blur={()=>{ listOut(d) }}

						on:click={()=>{ listClick(d) }}
						on:click={()=>{ listClick(d) }}
						on:keydown={(e)=>{ listClick(d) }}
						on:keyup={(e)=>{ }}
						on:keypress={(e)=>{ listClick(d) }}


						>
						{#if d._distance}
							<td>{f1(d._distance/1000)}km</td>
						{/if}
						<td>{d.nama}</td>
						<td>{d.alamat}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
