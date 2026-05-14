import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { leadsApi, searchesApi } from '../api/client'

const STATUS_LABELS = {
  pending: 'Aguardando',
  running: 'Executando',
  completed: 'Concluída',
  failed: 'Falhou',
}

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  running: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
}

export default function Dashboard() {
  const { data: counts } = useQuery({
    queryKey: ['leads-count'],
    queryFn: () => leadsApi.count().then(r => r.data),
  })

  const { data: searches } = useQuery({
    queryKey: ['searches'],
    queryFn: () => searchesApi.list().then(r => r.data),
    refetchInterval: (query) => {
      const data = query.state.data
      if (data?.some(s => s.status === 'running' || s.status === 'pending')) return 3000
      return false
    },
  })

  return (
    <div className="p-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Dashboard</h2>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <MetricCard label="Total de Leads" value={counts?.total ?? '—'} />
        <MetricCard label="Sem Site" value={counts?.sem_site ?? '—'} />
        <MetricCard label="Fechados" value={counts?.fechados ?? '—'} />
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-medium text-gray-800 text-sm">Buscas Recentes</h3>
          <Link to="/nova-busca" className="text-sm text-blue-600 hover:underline">+ Nova busca</Link>
        </div>
        {!searches || searches.length === 0 ? (
          <p className="text-gray-500 text-sm px-6 py-10 text-center">Nenhuma busca realizada ainda.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-xs uppercase tracking-wide border-b border-gray-100">
                <th className="px-6 py-3 text-left">Nicho</th>
                <th className="px-6 py-3 text-left">Cidade</th>
                <th className="px-6 py-3 text-left">Leads</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {searches.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-800 capitalize">{s.nicho}</td>
                  <td className="px-6 py-3 text-gray-600">{s.cidade}</td>
                  <td className="px-6 py-3 text-gray-600">{s.total_found}</td>
                  <td className="px-6 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[s.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABELS[s.status] ?? s.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-500">{new Date(s.created_at).toLocaleString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function MetricCard({ label, value }) {
  return (
    <div className="bg-white rounded-xl shadow-sm px-6 py-5">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
    </div>
  )
}
