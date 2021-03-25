import { createHash } from 'crypto';
import render_page from './page.js';
import render_endpoint from './endpoint.js';

/** @param {string} body */
function md5(body) {
	return createHash('md5').update(body).digest('hex');
}

/**
 * @param {import('../../../types.internal').Request} request
 * @param {import('../../../types.internal').SSRRenderOptions} options
 */
export async function ssr(request, options) {
	if (request.path.endsWith('/') && request.path !== '/') {
		const q = request.query.toString();

		return {
			status: 301,
			headers: {
				location: request.path.slice(0, -1) + (q ? `?${q}` : '')
			}
		};
	}

	let headers = {};
	const { context = {} } =
		(await (options.setup.prepare && options.setup.prepare({ headers: request.headers }))) || {};

	request.context = context;

	try {
		for (const route of options.manifest.routes) {
			if (route.pattern.test(request.path)) {
				/**
				 * @param {any} request
				 */
				const render = async (request) => {
					return route.type === 'endpoint'
						? await render_endpoint(request, route, context, options)
						: await render_page(request, route, context, options);
				};

				/** @type {import('../../../types.internal').SKResponse} */
				let response;

				if (options.setup.handle) {
					//@ts-ignore
					response = await options.setup.handle({ request, render, isPage: route.type === 'page' });
				} else {
					response = await render(request);
				}

				headers = response.headers;

				if (response) {
					// inject ETags for 200 responses
					if (response.status === 200) {
						if (!/(no-store|immutable)/.test(response.headers['cache-control'])) {
							const etag = `"${md5(response.body)}"`;

							if (request.headers['if-none-match'] === etag) {
								return {
									status: 304,
									headers: {},
									body: null
								};
							}

							response.headers['etag'] = etag;
						}
					}

					return {
						status: response.status,
						// TODO header merging is more involved than this — see the 'message.headers'
						// section of https://nodejs.org/api/http.html#http_class_http_incomingmessage
						headers: response.headers,
						body: response.body,
						dependencies: response.dependencies
					};
				}
			}
		}

		return await render_page(request, null, context, options);
	} catch (e) {
		if (e && e.stack) {
			e.stack = await options.get_stack(e);
		}

		console.error((e && e.stack) || e);

		return {
			status: 500,
			headers,
			body: options.dev ? e.stack : e.message
		};
	}
}
