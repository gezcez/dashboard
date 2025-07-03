import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import IndexPage from './pages/index-page'
import ProvidersPage from './pages/privacy/providers'
import Layout from './components/Layout'

function App() {

	return <BrowserRouter>
		<Layout>

			<Routes>
				{/* hi :) */}
				<Route path='/' element={<IndexPage />} />
				<Route path='/privacy'>
					<Route path='providers' element={<ProvidersPage />}>
					</Route>
				</Route>
				<Route path="*" element={<><title>Page Not Found!</title><Link to={"/"}>Page Not Found! click to go home</Link></>} />
			</Routes>
		</Layout>
	</BrowserRouter>

}

export default App
