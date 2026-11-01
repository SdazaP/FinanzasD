import { Navigate, Route, Routes } from 'react-router'
import AppLayout from './layout/AppLayout'
import SectionPage from './pages/SectionPage'
import { sections } from './sections'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {sections.map((s) => (
          <Route key={s.path} path={s.path} element={<SectionPage section={s} />} />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
