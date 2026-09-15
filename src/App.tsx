import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { Layout } from '@/components/layout/Layout'
import { RequireAuth } from '@/components/layout/RequireAuth'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { SignupPage } from '@/pages/SignupPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ReportItemPage } from '@/pages/ReportItemPage'
import { BrowseItemsPage } from '@/pages/BrowseItemsPage'
import { ItemDetailsPage } from '@/pages/ItemDetailsPage'
import { MyReportsPage } from '@/pages/MyReportsPage'
import { MyClaimsPage } from '@/pages/MyClaimsPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { NotificationsPage } from '@/pages/NotificationsPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <DashboardPage />
                </RequireAuth>
              }
            />
            <Route path="/browse" element={<BrowseItemsPage />} />
            <Route path="/items/:id" element={<ItemDetailsPage />} />
            <Route
              path="/report-lost"
              element={
                <RequireAuth>
                  <ReportItemPage type="lost" />
                </RequireAuth>
              }
            />
            <Route
              path="/report-found"
              element={
                <RequireAuth>
                  <ReportItemPage type="found" />
                </RequireAuth>
              }
            />
            <Route
              path="/my-reports"
              element={
                <RequireAuth>
                  <MyReportsPage />
                </RequireAuth>
              }
            />
            <Route
              path="/my-claims"
              element={
                <RequireAuth>
                  <MyClaimsPage />
                </RequireAuth>
              }
            />
            <Route
              path="/users/:id"
              element={
                <RequireAuth>
                  <ProfilePage />
                </RequireAuth>
              }
            />
            <Route
              path="/notifications"
              element={
                <RequireAuth>
                  <NotificationsPage />
                </RequireAuth>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  )
}