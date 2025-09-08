import {
	BrowserRouter,
	Link,
	Route,
	Routes,
	useSearchParams
} from "react-router-dom"
import IndexPage from "./pages/index-page"
import ProvidersPage from "./pages/auth-flow/authorize"
import Layout from "./components/Layout"
import AuthorizePage from "./pages/auth-flow/authorize"
import DashIndex from "./pages/dash/dash-index"
import { useGezcezStore } from "./common/stores/gezcez-auth-store"
import { useEffect } from "react"
import { ThemeProvider } from "./common/stores/theme-provider"
import ManageRolesPage from "./pages/manage/roles"
import ManagePermissionsPage from "./pages/manage/permissions"
import ManageUsersPage from "./pages/manage/users"
import UnauthorizedPage from "./pages/auth-flow/unauthorized"
import EmailTestingPage from "./pages/utilities/email-testing"

function App() {
	return (
		<BrowserRouter>
			<Layout>
				<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
					<Routes>
						{/* hi :) */}
						<Route path="/" element={<AuthorizePage />} />
						<Route path="/unauthorized" element={<UnauthorizedPage />} />
						<Route path="/dash" element={<DashIndex />}></Route>
						<Route path="manage">
							<Route path="roles" element={<ManageRolesPage />} />
							<Route path="permissions" element={<ManagePermissionsPage />} />
							<Route path="users" element={<ManageUsersPage />} />
						</Route>
						<Route path="/utilities">
							<Route path="email-testing" element={<EmailTestingPage />} />
						</Route>
						<Route
							path="*"
							element={
								<>
									<title>Page Not Found!</title>
									<Link to={"/"}>Page Not Found! click to go home</Link>
								</>
							}
						/>
					</Routes>
				</ThemeProvider>
			</Layout>
		</BrowserRouter>
	)
}

export default App
