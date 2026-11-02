import { Navigate, Route, Routes } from 'react-router'
import CreditDetail from './credits/CreditDetail'
import CreditList from './credits/CreditList'
import CreditNew from './credits/CreditNew'
import Dashboard from './dashboard/Dashboard'
import HistoryPage from './history/HistoryPage'
import AppLayout from './layout/AppLayout'
import SectionPage from './pages/SectionPage'
import RecurringDetail from './recurring/RecurringDetail'
import RecurringList from './recurring/RecurringList'
import RecurringNew from './recurring/RecurringNew'
import SavingDetail from './savings/SavingDetail'
import SavingList from './savings/SavingList'
import SavingNew from './savings/SavingNew'
import AccountDetail from './money/AccountDetail'
import AccountNew from './money/AccountNew'
import CardNew from './money/CardNew'
import AccountsPage from './money/AccountsPage'
import { investmentsSection } from './sections'
import SpendingDetail from './spending/SpendingDetail'
import SpendingList from './spending/SpendingList'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/gastos-fijos" element={<RecurringList />} />
        <Route path="/gastos-fijos/nuevo" element={<RecurringNew />} />
        <Route path="/gastos-fijos/:id" element={<RecurringDetail />} />
        <Route path="/gastos-hormiga" element={<SpendingList />} />
        <Route path="/gastos-historial" element={<HistoryPage />} />
        <Route path="/gastos-hormiga/:id" element={<SpendingDetail />} />
        <Route path="/creditos" element={<CreditList />} />
        <Route path="/creditos/nuevo" element={<CreditNew />} />
        <Route path="/creditos/:id" element={<CreditDetail />} />
        <Route path="/ahorro" element={<SavingList />} />
        <Route path="/ahorro/nuevo" element={<SavingNew />} />
        <Route path="/ahorro/:id" element={<SavingDetail />} />
        <Route path="/cuentas" element={<AccountsPage />} />
        <Route path="/cuentas/nueva" element={<AccountNew />} />
        <Route path="/cuentas/tarjeta-nueva" element={<CardNew />} />
        <Route path="/cuentas/:id" element={<AccountDetail />} />
        <Route path="/inversiones" element={<SectionPage section={investmentsSection} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
