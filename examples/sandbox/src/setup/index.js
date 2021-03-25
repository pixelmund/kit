export function prepare({ headers }) {
	return {
		context: {
			answer: 42
		}
	};
}

export function getSession({ context }) {
	return context;
}

/** @type {import ('@sveltejs/kit').SetupHandler<{answer: number}>} */
export async function handle({ request, render, isPage }) {
	const rendered = await render(request); // { status, headers, body }
	if (isPage) {
		return {
			...rendered,
			body: rendered.body.replace(
				'%My.HtmlClass%',
				request.context.answer === 42 ? 'dark' : 'light'
			),
			headers: {
				...rendered.headers,
				'x-foo': 'banana'
			}
		};
	}

	return rendered;
}
