import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { searchesApi } from '../../api/client'

const NICHOS_COMUNS = [
  'Barbearia', 'Restaurante', 'Bar', 'Clínica', 'Pet Shop',
  'Salão de Beleza', 'Academia', 'Pizzaria', 'Farmácia', 'Mercado',
  'Escritório de Advocacia', 'Dentista', 'Personal Trainer', 'Ótica',
]

export default function NewSearch() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ nicho: '', cidade: '', raio_km: 5, max_results: 20 })
  const [runningId, setRunningId] = useState(null)

  const { mutate: createSearch, isPending } = useMutation({
    mutationFn: (data) => searchesApi.create(data).then((r) => r.data),
    onSuccess: (data) => {
      setRunningId(data.id)
      queryClient.invalidateQueries({ queryKey: ['searches'] })
    },
  })

  const { data: search } = useQuery({
    queryKey: ['search', runningId],
    queryFn: () => searchesApi.get(runningId).then((r) => r.data),
    enabled: !!runningId,
    refetchInterval: (query) => {
      const s = query.state.data?.status
      return s === 'running' || s === 'pending' ? 2000 : false
    },
  })

  useEffect(() => {
    if (search?.status === 'completed') {
      queryClient.invalidateQueries({ queryKey: ['leads-count'] })
      const timer = setTimeout(() => navigate(`/leads?search_id=${search.id}`), 1200)
      return () => clearTimeout(timer)
    }
  }, [search?.status])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const setNum = (key) => (e) => setForm((f) => ({ ...f, [key]: parseInt(e.target.value) }))

  if (runningId && search) {
    const running = search.status === 'running' || search.status === 'pending'
    const done = search.status === 'completed'
    const failed = search.status === 'failed'

    return (
      <div className="p-8 max-w-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Nova Busca</h1>
        <div className="bg-white rounded-xl p-10 shadow-sm text-center">
          {running && (
            <>
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-800 font-medium">
                Buscando <span className="capitalize">{form.nicho}</span> em {form.cidade}...
              </p>
              {search.total_found > 0 && (
                <p className="text-gray-400 text-sm mt-2">{search.total_found} leads encontrados</p>
              )}
            </>
          )}
          {done && (
            <>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 text-xl font-bold">OK</span>
              </div>
              <p className="text-gray-800 font-medium">{search.total_found} leads encontrados!</p>
              <p className="text-gray-400 text-sm mt-1">Redirecionando para a lista...</p>
            </>
          )}
          {failed && (
            <>
              <p className="text-red-600 font-medium mb-3">Falha na busca. Verifique sua Google Maps API Key.</p>
              <button
                onClick={() => setRunningId(null)}
                className="text-blue-600 text-sm underline"
              >
                Tentar novamente
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nova Busca</h1>
      <div className="bg-white rounded-xl p-8 shadow-sm">
        <form onSubmit={(e) => { e.preventDefault(); createSearch(form) }} className="space-y-6">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nicho</label>
            <input
              type="text"
              list="nichos-list"
              value={form.nicho}
              onChange={set('nicho')}
              placeholder="ex: barbearia, restaurante..."
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <datalist id="nichos-list">
              {NICHOS_COMUNS.map((n) => <option key={n} value={n} />)}
            </datalist>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Cidade / Região</label>
            <input
              type="text"
              value={form.cidade}
              onChange={set('cidade')}
              placeholder="ex: Florianópolis, Grande Florianópolis..."
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Raio de busca:{' '}
              <span className="text-blue-600 font-semibold">{form.raio_km} km</span>
            </label>
            <input
              type="range" min="1" max="50" value={form.raio_km}
              onChange={setNum('raio_km')}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1 km</span><span>50 km</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Máx. resultados:{' '}
              <span className="text-blue-600 font-semibold">{form.max_results}</span>
            </label>
            <input
              type="range" min="5" max="60" step="5" value={form.max_results}
              onChange={setNum('max_results')}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>5</span><span>60</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-blue-600 text-white py-3 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Iniciando...' : 'Iniciar Busca'}
          </button>
        </form>
      </div>
    </div>
  )
}
