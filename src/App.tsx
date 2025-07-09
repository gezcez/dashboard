import { BrowserRouter, Link, Route, Routes, useSearchParams } from 'react-router-dom'
import IndexPage from './pages/index-page'
import ProvidersPage from './pages/auth-flow/authorize'
import Layout from './components/Layout'
import AuthorizePage from './pages/auth-flow/authorize'
import DashIndex from './pages/dash/dash-index'
import { useGezcezStore } from './common/stores/gezcez-auth-store'
import { useEffect } from 'react'
import { ThemeProvider } from './common/stores/theme-provider'
import ManageRolesPage from './pages/manage/roles'

function App() {

	return <BrowserRouter>
		<Layout>
			<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
				<Routes>
					{/* hi :) */}
					<Route path='/' element={<AuthorizePage />} />
					<Route path="/dash" element={<DashIndex />}>
					</Route>
					<Route path = "manage">
						<Route path = "roles" element = {<ManageRolesPage/>}>
						</Route>
					</Route>
					<Route path="*" element={<><title>Page Not Found!</title><Link to={"/"}>Page Not Found! click to go home</Link></>} />
				</Routes>
			</ThemeProvider>
		</Layout>
	</BrowserRouter>

}

export default App
