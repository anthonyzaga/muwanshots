import { Suspense, lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import RootLayout from '../layouts/RootLayout';
import { ErrorBoundary } from '../components/ErrorBoundary';

const Home = lazy(() => import('../pages/Home'));
const GalleryLanding = lazy(() => import('../pages/gallery/GalleryLanding'));
const CategoryPage = lazy(() => import('../pages/gallery/CategoryPage'));
const AlbumPage = lazy(() => import('../pages/gallery/AlbumPage'));
const Services = lazy(() => import('../pages/Services'));
const About = lazy(() => import('../pages/About'));
const ContactPage = lazy(() => import('../pages/ContactPage'));
const Booking = lazy(() => import('../pages/Booking'));
const NotFound = lazy(() => import('../pages/NotFound'));
const AdminLogin = lazy(() => import('../pages/admin/AdminLogin'));
const AdminLayout = lazy(() => import('../pages/admin/AdminLayout'));
const Dashboard = lazy(() => import('../pages/admin/Dashboard'));
const AdminPhotos = lazy(() => import('../pages/admin/Photos'));
const AdminCategories = lazy(() => import('../pages/admin/Categories'));
const AdminAlbums = lazy(() => import('../pages/admin/Albums'));
const AdminSettings = lazy(() => import('../pages/admin/Settings'));
const AdminAccount = lazy(() => import('../pages/admin/Account'));
import ProtectedRoute from '../components/ProtectedRoute';

function Fallback() {
  return <div className="mx-auto max-w-[1280px] px-6 py-24"><div className="h-40 shimmer rounded-2xl" aria-hidden /></div>;
}

function withBoundary(el) {
  return <ErrorBoundary><Suspense fallback={<Fallback/>}>{el}</Suspense></ErrorBoundary>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: withBoundary(<Home/>) },
      { path: 'gallery', element: withBoundary(<GalleryLanding/>) },
      { path: 'gallery/:category', element: withBoundary(<CategoryPage/>) },
      { path: 'gallery/:category/:album', element: withBoundary(<AlbumPage/>) },
      { path: 'services', element: withBoundary(<Services/>) },
      { path: 'about', element: withBoundary(<About/>) },
      { path: 'contact', element: withBoundary(<ContactPage/>) },
      { path: 'booking', element: withBoundary(<Booking/>) },
      { path: '*', element: withBoundary(<NotFound/>) },
    ],
  },
  {
    path: '/admin/login',
    element: withBoundary(<AdminLogin />),
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<Fallback />}>
          <AdminLayout />
        </Suspense>
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: withBoundary(<Dashboard />) },
      { path: 'photos', element: withBoundary(<AdminPhotos />) },
      { path: 'categories', element: withBoundary(<AdminCategories />) },
      { path: 'albums', element: withBoundary(<AdminAlbums />) },
      { path: 'settings', element: withBoundary(<AdminSettings />) },
      { path: 'account', element: withBoundary(<AdminAccount />) },
    ],
  },
]);
