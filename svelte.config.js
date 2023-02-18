import adapter from '@sveltejs/adapter-cloudflare';
//import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
//		adapter: adapter()
		adapter: adapter({ pages: 'docs', assets: 'docs', fallback: 'index.html', precompress: true }),
	}
};

export default config;
