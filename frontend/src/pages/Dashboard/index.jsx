import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { leadsApi, searchesApi } from '../../api/client'

const STATUS_LABEL = {
  pending: 'Aguardando',
  running: 'Em andamento',
  completed: 'Concluída',
  failed: 'Falhou',
}

const STATUS_COLOR = {
  pending: 'text-yellow-600',
  running: 'text-blue-600',
  completed: 'text-green-600',
  failed: 'text-red-600',
}

function StatCard({ label, value, accent }) {
  return (
    <div className={`bg-white rounded-xl p-6 shadow-sm border-l-4 ${accent}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value ?? '—'}</p>
    </div>
  )
}

export default function Dashboard() {
  const { data: counts } = useQuery({
    queryKey: ['leads-count'],
    queryFn: () => leadsApi.count().then((r) => r.data),
  })

  const { data: searches } = useQuery({
    queryKey: ['searches'],
    queryFn: () => searchesApi.list().then((r) => r.data),
  })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link
          to="/nova-busca"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Nova Busca
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <StatCard label="Total de Leads" value={counts?.total} accent="border-blue-500" />
        <StatCard label="Sem Site" value={counts?.sem_site} accent="border-orange-400" />
        <StatCard label="Fechados" value={counts?.fechados} accent="border-green-500" />
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-base font-semibold text-gray-900">Últimas Buscas</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {['Nicho', 'Cidade', 'Leads', 'Status', 'Data'].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {searches?.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900 capitalize">{s.nicho}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{s.cidade}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{s.total_found}</td>
                <td className="px-6 py-4">
                  <span className={`text-sm font-medium ${STATUS_COLOR[s.status]}`}>
                    {STATUS_LABEL[s.status] ?? s.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(s.created_at).toLocaleDateString('pt-BR')}
                </td>
              </tr>
            ))}
            {!searches?.length && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-400">
                  Nenhuma busca realizada ainda.{' '}
                  <Link to="/nova-busca" className="text-blue-600 underline">
                    Iniciar primeira busca
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
