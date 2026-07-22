import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Nav from './components/Nav'
import Gallery from './pages/Gallery'
import IntimatePage from './components/intimate/IntimatePage'

const Upload = lazy(() => import('./pages/Upload'))

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Gallery />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/intimate" element={<IntimatePage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
