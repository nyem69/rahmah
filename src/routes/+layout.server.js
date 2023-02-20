import * as d3 from "d3";
import d3comparator from '$lib/d3comparator.js';
import {DB_URL} from '$env/static/private';

let dbg=0;
let data = {};


dbg&&console.log('+layout.server.js START');
dbg&&console.log('DB_URL',DB_URL);


export async function load() {

	const url = DB_URL+"/list/1/200";
	dbg&&console.log('url',url);

	await d3.json(url)
	.then(res=>{

		dbg&&console.log('res', res);
		data.list = res;

		data.list.forEach(d=>{
			d.nama.replace(/\\\'/g,"'");
		});

	});




	//=====================
	//
	//=====================
	dbg&&console.log('data', data);
	dbg&&console.log('+layout.server.js END');

  return data;

}


