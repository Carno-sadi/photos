import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Nav from './components/Nav'
import Gallery from './pages/Gallery'
import PhotoDetail from './pages/PhotoDetail'
import Upload from './pages/Upload'

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        <Route path="/" element={<Gallery />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/photo/:id" element={<PhotoDetail />} />
      </Routes>
    </BrowserRouter>
  )
}