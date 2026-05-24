import { Fragment, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { exportApi, leadsApi, searchesApi } from '../../api/client'

const CRM_OPTIONS = [
  { value: 'not_contacted', label: 'Não contatado', cls: 'bg-gray-100 text-gray-700' },
  { value: 'contacted', label: 'Contatado', cls: 'bg-blue-100 text-blue-700' },
  { value: 'interested', label: 'Interessado', cls: 'bg-yellow-100 text-yellow-700' },
  { value: 'closed', label: 'Fechado', cls: 'bg-green-100 text-green-700' },
  { value: 'no_interest', label: 'Sem interesse', cls: 'bg-red-100 text-red-700' },
  { value: 'no_response', label: 'Sem resposta', cls: 'bg-gray-100 text-gray-500' },
]
const CRM_MAP = Object.fromEntries(CRM_OPTIONS.map((o) => [o.value, o]))

export default function Leads() {
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const [expandedId, setExpandedId] = useState(null)
  const [obs, setObs] = useState('')

  const filters = {
    search_id: searchParams.get('search_id') || undefined,
    crm_status: searchParams.get('crm_status') || undefined,
    whatsapp_status: searchParams.get('whatsapp_status') || undefined,
    tem_site:
      searchParams.get('tem_site') !== null && searchParams.get('tem_site') !== ''
        ? searchParams.get('tem_site') === 'true'
        : undefined,
    q: searchParams.get('q') || undefined,
  }

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads', filters],
    queryFn: () => leadsApi.list(filters).then((r) => r.data),
  })

  const { data: searches = [] } = useQuery({
    queryKey: ['searches'],
    queryFn: () => searchesApi.list().then((r) => r.data),
  })

  const { mutate: updateLead } = useMutation({
    mutationFn: ({ id, data }) => leadsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['leads-count'] })
    },
  })

  const setFilter = (key, value) => {
    const p = new URLSearchParams(searchParams)
    if (value === undefined || value === '') p.delete(key)
    else p.set(key, value)
    setSearchParams(p)
  }

  const openObs = (lead) => {
    setExpandedId(expandedId === lead.id ? null : lead.id)
    setObs(lead.observacoes || '')
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Leads{' '}
          {leads.length > 0 && (
            <span className="text-gray-400 font-normal text-lg">({leads.length})</span>
          )}
        </h1>
        <button
          onClick={() => exportApi.leads(filters)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
        >
          Exportar CSV
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl px-5 py-4 shadow-sm mb-6 flex gap-3 flex-wrap items-center">
        <span className="text-xs font-medium text-gray-400 uppercase">Filtros</span>

        <input
          type="text"
          placeholder="Buscar por nome..."
          value={searchParams.get('q') || ''}
          onChange={(e) => setFilter('q', e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none w-44"
        />

        <select
          value={searchParams.get('crm_status') || ''}
          onChange={(e) => setFilter('crm_status', e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none"
        >
          <option value="">Todos os status CRM</option>
          {CRM_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          value={searchParams.get('tem_site') ?? ''}
          onChange={(e) => setFilter('tem_site', e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none"
        >
          <option value="">Site: todos</option>
          <option value="false">Sem site</option>
          <option value="true">Com site</option>
        </select>

        <select
          value={searchParams.get('whatsapp_status') || ''}
          onChange={(e) => setFilter('whatsapp_status', e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none"
        >
          <option value="">WhatsApp: todos</option>
          <option value="not_tested">Não testado</option>
          <option value="has_automation">Com automação</option>
          <option value="no_automation">Sem automação</option>
          <option value="human">Atendimento humano</option>
        </select>

        <select
          value={searchParams.get('search_id') || ''}
          onChange={(e) => setFilter('search_id', e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none max-w-xs"
        >
          <option value="">Todas as buscas</option>
          {searches.filter((s) => s.status === 'completed').map((s) => (
            <option key={s.id} value={s.id}>
              {s.nicho} — {s.cidade} ({new Date(s.created_at).toLocaleDateString('pt-BR')})
            </option>
          ))}
        </select>

        {(filters.search_id || filters.crm_status || filters.tem_site !== undefined || filters.whatsapp_status || filters.q) && (
          <button
            onClick={() => setSearchParams({})}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-gray-400">Carregando leads...</div>
        ) : leads.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">
            Nenhum lead encontrado com os filtros selecionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Nome', 'Telefone', 'Site', 'Nota', 'Categoria', 'Status CRM', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leads.map((lead) => (
                  <Fragment key={lead.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{lead.nome}</div>
                        {lead.endereco && (
                          <div className="text-xs text-gray-400 truncate max-w-xs">{lead.endereco}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {lead.telefone || '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {lead.tem_site ? (
                          <a
                            href={lead.site_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 text-xs underline"
                          >
                            Ver site
                          </a>
                        ) : (
                          <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                            Sem site
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {lead.nota ? `${lead.nota} (${lead.total_avaliacoes})` : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{lead.categoria || '—'}</td>
                      <td className="px-4 py-3">
                        <select
                          value={lead.crm_status}
                          onChange={(e) => updateLead({ id: lead.id, data: { crm_status: e.target.value } })}
                          className={`text-xs rounded-full px-3 py-1 font-medium border-0 cursor-pointer focus:outline-none ${CRM_MAP[lead.crm_status]?.cls || ''}`}
                        >
                          {CRM_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openObs(lead)}
                          className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                        >
                          {expandedId === lead.id ? 'Fechar' : lead.observacoes ? 'Ver obs.' : 'Obs.'}
                        </button>
                      </td>
                    </tr>
                    {expandedId === lead.id && (
                      <tr className="bg-blue-50">
                        <td colSpan={7} className="px-4 py-3">
                          <div className="flex gap-3 items-end">
                            <textarea
                              value={obs}
                              onChange={(e) => setObs(e.target.value)}
                              placeholder="Observações sobre o lead..."
                              rows={2}
                              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  updateLead({ id: lead.id, data: { observacoes: obs } })
                                  setExpandedId(null)
                                }}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
                              >
                                Salvar
                              </button>
                              <button
                                onClick={() => setExpandedId(null)}
                                className="text-gray-500 px-3 py-2 text-sm hover:text-gray-700"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
