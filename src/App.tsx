import { Navigate, Route, Routes } from 'react-router'
import CreditDetail from './credits/CreditDetail'
import CreditList from './credits/CreditList'
import CreditNew from './credits/CreditNew'
import Dashboard from './dashboard/Dashboard'
import AppLayout from './layout/AppLayout'
import SectionPage from './pages/SectionPage'
import RecurringDetail from './recurring/RecurringDetail'
import RecurringList from './recurring/RecurringList'
import RecurringNew from './recurring/RecurringNew'
import SavingDetail from './savings/SavingDetail'
import SavingList from './savings/SavingList'
import SavingNew from './savings/SavingNew'
import { sections } from './sections'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {sections
          .filter((s) => !['/', '/gastos-fijos', '/creditos', '/ahorro'].includes(s.path))
          .map((s) => (
            <Route key={s.path} path={s.path} element={<SectionPage section={s} />} />
          ))}
        <Route path="/" element={<Dashboard />} />
        <Route path="/gastos-fijos" element={<RecurringList />} />
        <Route path="/gastos-fijos/nuevo" element={<RecurringNew />} />
        <Route path="/gastos-fijos/:id" element={<RecurringDetail />} />
        <Route path="/creditos" element={<CreditList />} />
        <Route path="/creditos/nuevo" element={<CreditNew />} />
        <Route path="/creditos/:id" element={<CreditDetail />} />
        <Route path="/ahorro" element={<SavingList />} />
        <Route path="/ahorro/nuevo" element={<SavingNew />} />
        <Route path="/ahorro/:id" element={<SavingDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
