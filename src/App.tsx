import { Navigate, Route, Routes } from 'react-router'
import AppLayout from './layout/AppLayout'
import SectionPage from './pages/SectionPage'
import RecurringDetail from './recurring/RecurringDetail'
import RecurringList from './recurring/RecurringList'
import RecurringNew from './recurring/RecurringNew'
import { sections } from './sections'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {sections
          .filter((s) => s.path !== '/gastos-fijos')
          .map((s) => (
            <Route key={s.path} path={s.path} element={<SectionPage section={s} />} />
          ))}
        <Route path="/gastos-fijos" element={<RecurringList />} />
        <Route path="/gastos-fijos/nuevo" element={<RecurringNew />} />
        <Route path="/gastos-fijos/:id" element={<RecurringDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
