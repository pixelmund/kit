import { Headers, LoadInput, LoadOutput, Logger, SKResponse } from './types.internal';

export type Config = {
	compilerOptions?: any;
	extensions?: string[];
	kit?: {
		adapter?: Adapter;
		amp?: boolean;
		appDir?: string;
		files?: {
			assets?: string;
			lib?: string;
			routes?: string;
			serviceWorker?: string;
			setup?: string;
			template?: string;
		};
		host?: string;
		hostHeader?: string;
		paths?: {
			base?: string;
			assets?: string;
		};
		prerender?: {
			crawl?: boolean;
			enabled?: boolean;
			force?: boolean;
			pages?: string[];
		};
		target?: string;
		vite?: {} | (() => {});
	};
	preprocess?: any;
};

type Builder = {
	copy_client_files: (dest: string) => void;
	copy_server_files: (dest: string) => void;
	copy_static_files: (dest: string) => void;
	prerender: ({ force, dest }: { force?: boolean; dest: string }) => Promise<void>;
	log: Logger;
};

export type Adapter = {
	name: string;
	adapt: (builder: Builder) => Promise<void>;
};

interface ReadOnlyFormData extends Iterator<[string, string]> {
	get: (key: string) => string;
	getAll: (key: string) => string[];
	has: (key: string) => boolean;
	entries: () => Iterator<[string, string]>;
	keys: () => Iterator<string>;
	values: () => Iterator<string>;
}

export interface RequestHandlerResponse {
	status?: number;
	headers?: Record<string, string>;
	body?: any;
}

export type Request<Con = any> = {
	host: string;
	headers: Headers;
	path: string;
	params: Record<string, string>;
	query: URLSearchParams;
	body: string | Buffer | ReadOnlyFormData;
	context: Con;
};

export type SetupHandler<Con = any> = (props: {
	request: Request<Con>;
	render: (request: Request<Con>) => Promise<Omit<SKResponse, 'dependencies'>>;
	isPage: boolean;
}) => Omit<SKResponse, 'dependencies'> | Promise<Omit<SKResponse, 'dependencies'>>;

export type RequestHandler = (
	request?: Request,
	context?: any
) => RequestHandlerResponse | Promise<RequestHandlerResponse>;

export type Load = (input: LoadInput) => LoadOutput | Promise<LoadOutput>;
