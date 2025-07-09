import { BrowserRouter, Link, Route, Routes, useSearchParams } from 'react-router-dom'
import IndexPage from './pages/index-page'
import ProvidersPage from './pages/auth-flow/authorize'
import Layout from './components/Layout'
import AuthorizePage from './pages/auth-flow/authorize'
import DashIndex from './pages/dash/dash-index'
import { useGezcezStore } from './common/stores/GezcezAuthStore'
import { useEffect } from 'react'

function App() {

	return <BrowserRouter>
		<Layout>

			<Routes>
				{/* hi :) */}
				<Route path='/' element={<AuthorizePage />} />
				<Route path="/dash" element={<DashIndex />}>
				</Route>
				<Route path="*" element={<><title>Page Not Found!</title><Link to={"/"}>Page Not Found! click to go home</Link></>} />
			</Routes>
		</Layout>
	</BrowserRouter>

}

export default App
