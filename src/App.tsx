import { BrowserRouter, Route, Routes } from 'react-router-dom'
import IndexPage from './pages/index-page'
import ProvidersPage from './pages/privacy/providers'

function App() {

	return <BrowserRouter>
		<Routes>
			{/* hi :) */}

			<Route path='/' element={<IndexPage />} />
			<Route path='/privacy'>
				<Route path='providers' element={<ProvidersPage />}>
				</Route>
			</Route>
			<Route path="*" element={<>not found</>}/>
		</Routes>
	</BrowserRouter>

}

export default App
