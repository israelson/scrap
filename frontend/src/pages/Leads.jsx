import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { exportApi, leadsApi, searchesApi } from '../api/client'

const CRM_OPTIONS = [
  { value: 'not_contacted', label: 'Não contatado', color: 'bg-gray-100 text-gray-600' },
  { value: 'contacted',     label: 'Contatado',     color: 'bg-blue-100 text-blue-700' },
  { value: 'interested',    label: 'Interessado',   color: 'bg-yellow-100 text-yellow-700' },
  { value: 'closed',        label: 'Fechado',       color: 'bg-green-100 text-green-700' },
  { value: 'no_interest',   label: 'Sem interesse', color: 'bg-red-100 text-red-700' },
  { value: 'no_response',   label: 'Sem resposta',  color: 'bg-orange-100 text-orange-700' },
]

const CRM_MAP = Object.fromEntries(CRM_OPTIONS.map(o => [o.value, o]))

export default function Leads() {
  const qc = useQueryClient()
  const [filters, setFilters] = useState({ crm_status: '', tem_site: '', search_id: '' })

  const { data: searches } = useQuery({
    queryKey: ['searches'],
    queryFn: () => searchesApi.list().then(r => r.data),
  })

  const { data: leads, isLoading } = useQuery({
    queryKey: ['leads', filters],
    queryFn: () => leadsApi.list({
      crm_status: filters.crm_status || undefined,
      search_id: filters.search_id || undefined,
      tem_site: filters.tem_site === '' ? undefined : filters.tem_site === 'true',
    }).then(r => r.data),
  })

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, crm_status }) => leadsApi.update(id, { crm_status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] })
      qc.invalidateQueries({ queryKey: ['leads-count'] })
    },
  })

  const setFilter = (key, value) => setFilters(f => ({ ...f, [key]: value }))

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Leads</h2>
        <button
          onClick={() => exportApi.leads({
            crm_status: filters.crm_status || undefined,
            search_id: filters.search_id || undefined,
            tem_site: filters.tem_site === '' ? undefined : filters.tem_site,
          })}
          className="text-sm bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Exportar CSV
        </button>
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <select
          value={filters.crm_status}
          onChange={e => setFilter('crm_status', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os status</option>
          {CRM_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <select
          value={filters.tem_site}
          onChange={e => setFilter('tem_site', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tem site?</option>
          <option value="false">Sem site</option>
          <option value="true">Com site</option>
        </select>

        <select
          value={filters.search_id}
          onChange={e => setFilter('search_id', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas as buscas</option>
          {searches?.map(s => (
            <option key={s.id} value={s.id}>{s.nicho} — {s.cidade}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <p className="text-gray-500 text-sm px-6 py-10 text-center">Carregando...</p>
        ) : !leads || leads.length === 0 ? (
          <p className="text-gray-500 text-sm px-6 py-10 text-center">Nenhum lead encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-xs uppercase tracking-wide border-b border-gray-100">
                  <th className="px-4 py-3 text-left">Nome</th>
                  <th className="px-4 py-3 text-left">Telefone</th>
                  <th className="px-4 py-3 text-left">Categoria</th>
                  <th className="px-4 py-3 text-left">Nota</th>
                  <th className="px-4 py-3 text-left">Site</th>
                  <th className="px-4 py-3 text-left">Status CRM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {leads.map(lead => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{lead.nome}</p>
                      <p className="text-gray-400 text-xs truncate max-w-[220px]">{lead.endereco}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{lead.telefone || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{lead.categoria || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {lead.nota ? `${lead.nota} ★` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {lead.site_url ? (
                        <a href={lead.site_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs">
                          Ver site
                        </a>
                      ) : (
                        <span className="text-xs text-red-500 font-medium">Sem site</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={lead.crm_status}
                        disabled={lead.crm_status === 'closed'}
                        onChange={e => updateStatus({ id: lead.id, crm_status: e.target.value })}
                        className={`text-xs px-2 py-1 rounded-full font-medium cursor-pointer border-0 focus:outline-none focus:ring-2 focus:ring-blue-400 ${CRM_MAP[lead.crm_status]?.color ?? 'bg-gray-100 text-gray-600'}`}
                      >
                        {CRM_OPTIONS.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
