import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
const queryclient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: false
		}
	}
})
createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<QueryClientProvider client={queryclient}>
			<App />
		</QueryClientProvider>
	</StrictMode>,
)
