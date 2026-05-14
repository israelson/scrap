import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { exportApi, leadsApi, searchesApi, whatsappApi } from '../api/client'

function toSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 40)
}

function buildDadosBloco(lead) {
  const linhas = []
  linhas.push(`## Dados do negócio`)
  linhas.push(``)
  linhas.push(`- **Nome:** ${lead.nome}`)
  if (lead.categoria) linhas.push(`- **Categoria/Nicho:** ${lead.categoria}`)
  if (lead.endereco)  linhas.push(`- **Endereço:** ${lead.endereco}`)
  if (lead.telefone)  linhas.push(`- **Telefone:** ${lead.telefone}`)
  if (lead.whatsapp)  linhas.push(`- **WhatsApp:** ${lead.whatsapp}`)
  if (lead.nota)      linhas.push(`- **Avaliação Google:** ${lead.nota} ⭐ (${lead.total_avaliacoes} avaliações)`)
  if (lead.descricao) linhas.push(`- **Sobre:** ${lead.descricao}`)
  return linhas.join('\n')
}

function buildSecoes(lead) {
  const nicho = lead.categoria || 'negócio local'
  const nota = lead.nota ? `${lead.nota} ⭐` : ''
  return [
    `## Seções obrigatórias`,
    ``,
    `1. **Hero** — nome em destaque, slogan atrativo para o nicho, botão "Fale pelo WhatsApp" (wa.me/${(lead.whatsapp || lead.telefone || '').replace(/\D/g, '')}) e botão secundário "Saiba mais"`,
    `2. **Sobre nós** — texto profissional e envolvente criado com base no nicho e nos dados acima`,
    `3. **Serviços** — 4 a 6 serviços típicos de "${nicho}" com ícone, nome e descrição curta`,
    `4. **Por que nos escolher** — 3 diferenciais com ícone e texto`,
    `5. **Depoimentos** — 3 depoimentos fictícios realistas com nome, avatar (inicial em círculo colorido) e texto`,
    `6. **Avaliações Google** — destaque para a nota ${nota} com ${lead.total_avaliacoes || 0} avaliações`,
    `7. **Contato** — endereço, telefone, botão WhatsApp verde, horário de funcionamento sugerido para o nicho`,
    `8. **Footer** — nome, links rápidos, redes sociais (ícones SVG), copyright`,
  ].join('\n')
}

function buildDesign(lead) {
  const nicho = lead.categoria || 'negócio local'
  return [
    `## Diretrizes de design`,
    ``,
    `- Paleta de cores adequada ao nicho "${nicho}" (barbearia → escuro/masculino; clínica → azul/branco; restaurante → cores quentes)`,
    `- Tipografia moderna via Google Fonts`,
    `- Animações de entrada suaves (fade + slide) com Intersection Observer ao rolar`,
    `- Navbar fixa com scroll suave entre seções e sombra ao rolar`,
    `- Botão flutuante do WhatsApp fixo no canto inferior direito`,
    `- Cards com hover effect de elevação`,
    `- Hero com gradiente marcante (sem imagens externas)`,
    `- Layout responsivo mobile-first`,
  ].join('\n')
}

function buildBriefClaudeCode(lead) {
  const slug = toSlug(lead.nome)
  return [
    `Você está dentro da pasta \`Site\`. Crie uma subpasta chamada \`${slug}\` e dentro dela monte um site completo em React + Vite + Tailwind CSS.`,
    ``,
    `**Passos:**`,
    `1. Crie a pasta \`${slug}\` dentro de \`Site\``,
    `2. Dentro dela, scaffold um projeto Vite React: crie \`package.json\`, \`vite.config.js\`, \`index.html\`, \`src/main.jsx\` e \`src/App.jsx\``,
    `3. Configure Tailwind CSS (tailwind.config.js + postcss.config.js + import no CSS)`,
    `4. Use o \`node_modules\` já instalado na pasta \`Site\` adicionando \`"root": true\` no package.json ou ajuste o caminho, OU rode \`npm install\` na subpasta`,
    `5. Crie um componente React por seção em \`src/components/\``,
    `6. O projeto deve rodar com \`npm run dev\` na subpasta \`${slug}\``,
    ``,
    `---`,
    ``,
    buildDadosBloco(lead),
    ``,
    `---`,
    ``,
    buildSecoes(lead),
    ``,
    `---`,
    ``,
    buildDesign(lead),
    ``,
    `---`,
    ``,
    `## Entrega`,
    ``,
    `Projeto React funcional em \`Site/${slug}/\` com componentes separados por seção, pronto para \`npm run dev\`. O resultado deve impressionar o cliente — é uma demonstração de venda.`,
  ].join('\n')
}

function buildBriefLovable(lead) {
  return [
    `Crie um site one-page profissional e moderno para o negócio abaixo. Use React com Tailwind CSS e shadcn/ui. O resultado deve ser visualmente impressionante — é uma demonstração de venda para o cliente.`,
    ``,
    `---`,
    ``,
    buildDadosBloco(lead),
    ``,
    `---`,
    ``,
    buildSecoes(lead),
    ``,
    `---`,
    ``,
    buildDesign(lead),
    ``,
    `---`,
    ``,
    `## Componentes sugeridos (shadcn/ui)`,
    ``,
    `- \`Button\` para CTAs`,
    `- \`Card\` para serviços e depoimentos`,
    `- \`Badge\` para categorias`,
    `- \`Avatar\` para depoimentos`,
    `- \`Separator\` entre seções`,
    ``,
    `Use framer-motion para as animações de entrada. O site deve ser publicável direto pelo Lovable.`,
  ].join('\n')
}

function BriefModal({ lead, onClose }) {
  const [target, setTarget] = useState('claude')
  const [copied, setCopied] = useState(false)

  const brief = target === 'claude' ? buildBriefClaudeCode(lead) : buildBriefLovable(lead)

  const handleCopy = () => {
    navigator.clipboard.writeText(brief)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const hints = {
    claude: `Abra a pasta Site no VS Code com Claude Code e cole este prompt. O Claude vai criar a subpasta \`${toSlug(lead.nome)}\` e montar o projeto React completo.`,
    lovable: `Acesse lovable.dev, crie um novo projeto e cole este prompt. O Lovable vai gerar e publicar o site automaticamente.`,
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-semibold text-gray-800">Gerar Brief — {lead.nome}</h3>
            <div className="flex gap-1 mt-2">
              <button
                onClick={() => { setTarget('claude'); setCopied(false) }}
                className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${target === 'claude' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Claude Code (React)
              </button>
              <button
                onClick={() => { setTarget('lovable'); setCopied(false) }}
                className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${target === 'lovable' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Lovable
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className={`text-sm px-4 py-2 rounded-lg font-medium transition-colors ${copied ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              {copied ? 'Copiado!' : 'Copiar prompt'}
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1 p-6">
          <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 rounded-lg p-4 leading-relaxed">
            {brief}
          </pre>
        </div>
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <p className="text-xs text-gray-500">{hints[target]}</p>
        </div>
      </div>
    </div>
  )
}

const SITE_TIPO_CONFIG = {
  website:      { label: 'Site próprio',  color: 'bg-green-100 text-green-700' },
  facebook:     { label: 'Facebook',      color: 'bg-blue-100 text-blue-700' },
  instagram:    { label: 'Instagram',     color: 'bg-pink-100 text-pink-700' },
  youtube:      { label: 'YouTube',       color: 'bg-red-100 text-red-700' },
  linkedin:     { label: 'LinkedIn',      color: 'bg-sky-100 text-sky-700' },
  twitter:      { label: 'Twitter/X',     color: 'bg-slate-100 text-slate-700' },
  tiktok:       { label: 'TikTok',        color: 'bg-purple-100 text-purple-700' },
  linktree:     { label: 'Linktree',      color: 'bg-lime-100 text-lime-700' },
  whatsapp:     { label: 'WhatsApp',      color: 'bg-emerald-100 text-emerald-700' },
  outro_social: { label: 'Rede social',   color: 'bg-orange-100 text-orange-700' },
  nenhum:       { label: 'Sem presença',  color: 'bg-gray-100 text-gray-500' },
}

const WA_STATUS_CONFIG = {
  not_tested:      { label: 'Não testado',       color: 'bg-gray-100 text-gray-500' },
  checking:        { label: 'Verificando...',     color: 'bg-yellow-100 text-yellow-700' },
  has_automation:  { label: 'Tem automação',      color: 'bg-green-100 text-green-700' },
  no_automation:   { label: 'Sem automação',      color: 'bg-orange-100 text-orange-700' },
  human:           { label: 'Atend. humano',      color: 'bg-blue-100 text-blue-700' },
}

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
  const [filters, setFilters] = useState({ crm_status: '', tem_site: '', search_id: '', site_tipo: '' })
  const [briefLead, setBriefLead] = useState(null)

  const { data: waStatus } = useQuery({
    queryKey: ['whatsapp-status'],
    queryFn: () => whatsappApi.status().then(r => r.data),
  })
  const waEnabled = waStatus?.enabled ?? false

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
      site_tipo: filters.site_tipo || undefined,
    }).then(r => r.data),
    refetchInterval: (query) => {
      const data = query.state.data
      if (data?.some(l => l.whatsapp_status === 'checking')) return 4000
      return false
    },
  })

  const { mutate: updateStatus } = useMutation({
    mutationFn: ({ id, crm_status }) => leadsApi.update(id, { crm_status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] })
      qc.invalidateQueries({ queryKey: ['leads-count'] })
    },
  })

  const { mutate: checkWhatsapp } = useMutation({
    mutationFn: (leadId) => whatsappApi.check([leadId]),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
    onError: (err) => {
      const msg = err?.response?.data?.detail || 'Erro ao verificar WhatsApp'
      alert(msg)
    },
  })

  const setFilter = (key, value) => setFilters(f => ({ ...f, [key]: value }))

  return (
    <div className="p-8">
      {briefLead && <BriefModal lead={briefLead} onClose={() => setBriefLead(null)} />}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Leads</h2>
        <div className="flex items-center gap-3">
          {!waEnabled && (
            <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
              WhatsApp inativo — configure o Evolution API no .env
            </span>
          )}
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
          value={filters.site_tipo}
          onChange={e => setFilter('site_tipo', e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Presença web</option>
          {Object.entries(SITE_TIPO_CONFIG).map(([value, { label }]) => (
            <option key={value} value={value}>{label}</option>
          ))}
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
                  <th className="px-4 py-3 text-left">Nota</th>
                  <th className="px-4 py-3 text-left">Presença Web</th>
                  <th className="px-4 py-3 text-left">WhatsApp</th>
                  <th className="px-4 py-3 text-left">Status CRM</th>
                  <th className="px-4 py-3 text-left">Site</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {leads.map(lead => {
                  const waCfg = WA_STATUS_CONFIG[lead.whatsapp_status] ?? WA_STATUS_CONFIG.not_tested
                  const isChecking = lead.whatsapp_status === 'checking'
                  const canCheck = waEnabled && lead.telefone && !isChecking

                  return (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{lead.nome}</p>
                        <p className="text-gray-400 text-xs truncate max-w-[200px]">{lead.endereco}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{lead.telefone || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{lead.nota ? `${lead.nota} ★` : '—'}</td>
                      <td className="px-4 py-3">
                        {(() => {
                          const cfg = SITE_TIPO_CONFIG[lead.site_tipo] ?? SITE_TIPO_CONFIG.nenhum
                          const badge = (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>
                              {cfg.label}
                            </span>
                          )
                          return lead.site_url
                            ? <a href={lead.site_url} target="_blank" rel="noreferrer" className="hover:opacity-80">{badge}</a>
                            : badge
                        })()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${waCfg.color}`}>
                            {waCfg.label}
                          </span>
                          {lead.whatsapp_status !== 'has_automation' && lead.whatsapp_status !== 'checking' && (
                            <button
                              onClick={() => checkWhatsapp(lead.id)}
                              disabled={!canCheck}
                              title={!waEnabled ? 'Configure o Evolution API no .env' : !lead.telefone ? 'Sem telefone' : 'Verificar automação'}
                              className="text-xs text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                              testar
                            </button>
                          )}
                        </div>
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
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setBriefLead(lead)}
                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors"
                          title="Gerar prompt para criar site no Claude Code"
                        >
                          Gerar brief
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
