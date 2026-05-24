import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchesApi } from '../api/client'

export default function NewSearch() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ nicho: '', cidade: '', bairro: '', raio_km: 5, max_results: 20 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setForm(f => ({ ...f, [name]: type === 'number' ? Number(value) : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await searchesApi.create(form)
      navigate('/dashboard')
    } catch {
      setError('Erro ao iniciar busca. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-lg">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Nova Busca</h2>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nicho</label>
          <input
            name="nicho"
            value={form.nicho}
            onChange={handleChange}
            placeholder="ex: barbearia, restaurante, clínica"
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cidade / Região</label>
          <input
            name="cidade"
            value={form.cidade}
            onChange={handleChange}
            placeholder="ex: Porto Velho, RO"
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bairro / Região específica
            <span className="text-gray-400 font-normal ml-1">(opcional)</span>
          </label>
          <input
            name="bairro"
            value={form.bairro}
            onChange={handleChange}
            placeholder="ex: Centro, Lagoa, Industrial..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            Use para explorar áreas diferentes na mesma cidade e encontrar novos leads.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Raio (km)</label>
            <input
              type="number"
              name="raio_km"
              value={form.raio_km}
              onChange={handleChange}
              min={1}
              max={50}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Máx. resultados</label>
            <input
              type="number"
              name="max_results"
              value={form.max_results}
              onChange={handleChange}
              min={5}
              max={100}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Iniciando busca...' : 'Iniciar Busca'}
        </button>
      </form>
    </div>
  )
}
