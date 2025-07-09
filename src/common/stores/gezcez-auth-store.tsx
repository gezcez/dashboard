import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { OAUTH_URL } from '../constants'
import { deleteCookie, getCookie, setCookie } from '../utils/master'
import { Navigate, redirect, replace } from 'react-router-dom'
import { customHistory } from '../utils/nav'

interface GezcezStore {
	refresh_token: string | undefined,
	access_token: string | undefined,
	setRefreshToken: (token: string) => [true] | [false, string]
	setAccessToken: (token: string) => [true] | [false, string]
	checkOAuth: () => void
	clearState: () => void
	network_id: number | undefined
	setNetworkId: (id: number) => void
}

export const useGezcezStore = create<GezcezStore>()(

	(set, get) => ({
		network_id: undefined,
		setNetworkId: (id) => {
			setCookie("network_id",id)
			set({ network_id: id })
		},
		refresh_token: undefined,
		access_token: undefined,
		setRefreshToken: (token: string) => {
			set({ refresh_token: token })
			setCookie("refresh_token", token)
			return [true]
		},
		setAccessToken: (token: string) => {
			set({ access_token: token })
			return [true]
		},
		clearState: () => {
			// deleteCookie("refresh_token")
			// set({
			// 	access_token: undefined,
			// 	refresh_token: undefined
			// })
			// customHistory.push("/")
		},
		checkOAuth: () => {
			const cookie_netid = getCookie("network_id")
			const network_id = cookie_netid ? parseInt(cookie_netid) : undefined
			console.log("starting oauth flow")
			if (get().refresh_token && window.location.href === "/") {
				console.log("redirecting to dash")
				customHistory.push("/dash")
				return
			} else {
				const cookie_token = getCookie("refresh_token")
				console.log("cookie", cookie_token?.slice(0, 5))
				set({ refresh_token: cookie_token,network_id:network_id })
				if (cookie_token && window.location.href === "/") {
					console.log("redirecting to dash")
					customHistory.push("/dash")
					return
				}
			}
			if (!get().refresh_token) {
				window.location.href = `${OAUTH_URL}/?app=dashboard`
			}
		}
	})

)
