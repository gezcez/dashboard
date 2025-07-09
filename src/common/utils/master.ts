import { API_URL } from "../constants"
import { useGezcezStore } from "../stores/GezcezAuthStore"
import { customHistory } from "./nav"

export async function fetchJSON(
	input: string | URL | globalThis.Request,
	init?: RequestInit
): Promise<[any, Response]> {
	const request = (await fetch(input, init)) as Response
	const json = (await request.json()) as any
	return [json, request]
}
export function setCookie(name: string, value: any, days: number = 7) {
	const expires = new Date(Date.now() + days * 864e5).toUTCString()
	document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
		value
	)}; expires=${expires}; path=/`
}
export function deleteCookie(name: string) {
	const expires = new Date(Date.now()).toUTCString()
	document.cookie = `${encodeURIComponent(name)}=}; expires=${expires}; path=/`
}
export function getCookie(name: string) {
	return document.cookie
		.split("; ")
		.find((row) => row.startsWith(`${encodeURIComponent(name)}=`))
		?.split("=")[1]
}

export async function makeGezcezRequest(
	input: string | URL | globalThis.Request,
	init?: RequestInit,
	is_use_refresh_token?:boolean
) : Promise<[false,any]|[any]> {
	const state = useGezcezStore.getState()
	if (!state.refresh_token || (!state.access_token && !is_use_refresh_token)) {
		state.clearState()
		return [false,"not logged in, redirecting to login"]
	}
	const url = input.toString()
	if (!url.startsWith(API_URL))
		throw new Error(`Cant make api requests outside the ${API_URL}!`)
	const [data, request] = await fetchJSON(input, {
		method: init?.body ? "POST" : "GET",
		...init,
		headers: { ...init?.headers, Authorization: `Bearer ${is_use_refresh_token ? state.refresh_token : state.access_token}`,"Content-Type": init?.body ? "application/json" : "application/json" },
	})
	if ([401].includes(request.status)) {
		state.clearState()
		return [false,"unauthorized, redirecting to login"]
	}
	return [data,request]
}
