# ProspectorPRO — Briefing Técnico Completo

**Versão:** 1.0  
**Data:** Maio 2026  
**Objetivo:** Ferramenta de prospecção automatizada para venda de serviços digitais (automação WhatsApp, sites) para pequenos negócios

---

## 1. Visão Geral do Produto

ProspectorPRO é uma ferramenta interna de prospecção que:

1. **Scrapa** negócios no Google Maps por nicho e cidade configuráveis
2. **Verifica** se o negócio tem site ou não
3. **Verifica** se o WhatsApp do negócio tem automação ou é atendimento humano
4. **Gera site automaticamente** com os dados coletados usando IA (para demonstração ao cliente)
5. **Gerencia leads** com status de abordagem — funciona como mini CRM de prospecção

### Proposta de Valor
- Você define o nicho e a cidade — a ferramenta faz o resto
- Sabe exatamente o que oferecer para cada lead antes de abordá-lo
- Chega no cliente com o site dele já pronto como demonstração
- Histórico completo de abordagens para não repetir contatos

---

## 2. Funcionalidades

### 2.1 Configuração de Busca
- Nicho configurável (ex: barbearia, bar, restaurante, personal trainer, clínica...)
- Cidade/região configurável (ex: Florianópolis, Grande Florianópolis, Centro Florianópolis)
- Raio de busca em km
- Quantidade máxima de resultados por busca

### 2.2 Scraping Google Maps
Dados coletados por negócio:
- Nome
- Endereço completo
- Telefone / WhatsApp
- Nota média e número de avaliações
- Horário de funcionamento
- Categoria do negócio
- URL do site (se houver)
- Fotos (URLs)
- Descrição / sobre o negócio

### 2.3 Filtros Inteligentes
- **Tem site?** — sim / não / não identificado
- **Tem automação WhatsApp?** — sim / não / não testado
- **Nota mínima** — filtrar só negócios ativos (ex: acima de 3.5)
- **Tem respostas a avaliações?** — dono engajado = mais fácil de vender
- **Tem WhatsApp cadastrado?** — pré-requisito para oferecer automação

### 2.4 Verificação de Automação WhatsApp
- Envia mensagem de teste via Evolution API
- Analisa o padrão da resposta:
  - Resposta instantânea com menu estruturado → **tem automação**
  - Sem resposta em X minutos → **sem automação**
  - Resposta humana com demora → **atendimento manual**
- Marca o lead com o resultado automaticamente

### 2.5 Gerador de Site Automático (IA)
- Com os dados coletados do Google Maps, gera site estático completo
- IA (Claude API) cria:
  - Textos personalizados (sobre, serviços, chamada para ação)
  - Layout adequado ao nicho
- Site gerado em HTML/CSS puro — pronto para publicar
- Funciona como **demonstração para o cliente**: você chega com o site dele já feito

### 2.6 Mini CRM de Prospecção
Status de cada lead:
- `não contatado` — coletado, ainda não abordado
- `contatado` — abordagem feita
- `interessado` — demonstrou interesse
- `fechado` — virou cliente
- `sem interesse` — não quer no momento
- `sem resposta` — não respondeu após X tentativas

Campos adicionais por lead:
- Data do primeiro contato
- Canal de contato (WhatsApp, Instagram, presencial)
- Observações livres
- Qual serviço foi oferecido (site / automação / pacote)

### 2.7 Dashboard
- Total de leads por status
- Taxa de conversão por nicho
- Histórico de buscas anteriores
- Exportação de lista em CSV/Excel

---

## 3. Arquitetura Técnica

### 3.1 Stack

| Camada | Tecnologia |
|--------|-----------|
| Backend API | Python 3.12 + FastAPI |
| Banco de dados | PostgreSQL 16 |
| Scraping Google Maps | `playwright` ou `googlemaps` SDK oficial |
| Verificação WhatsApp | Evolution API (já utilizada no FitCoach) |
| Gerador de sites | Claude API (claude-sonnet) |
| Frontend | React 18 + Vite + TailwindCSS |
| Containerização | Docker + Docker Compose |

### 3.2 Estrutura de Diretórios

```
prospectorpro/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── searches.py        # Configurar e executar buscas
│   │   │   ├── leads.py           # CRUD de leads + status CRM
│   │   │   ├── whatsapp.py        # Verificação de automação
│   │   │   └── sites.py           # Geração de site com IA
│   │   ├── services/
│   │   │   ├── gmaps_scraper.py   # Scraping Google Maps
│   │   │   ├── whatsapp_checker.py # Testa automação via Evolution API
│   │   │   ├── site_generator.py  # Gera site com Claude API
│   │   │   └── export_service.py  # Exporta CSV/Excel
│   │   ├── db/                    # Models SQLAlchemy + Alembic
│   │   ├── schemas/               # Pydantic schemas
│   │   └── core/                  # Config, settings
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard/         # Visão geral + métricas
│   │   │   ├── NewSearch/         # Configurar nova busca
│   │   │   ├── Leads/             # Lista de leads + filtros + CRM
│   │   │   └── SitePreview/       # Visualizar site gerado
│   │   ├── components/
│   │   └── api/                   # Axios + React Query
│   └── Dockerfile
├── docker-compose.yml
└── .env.example
```

### 3.3 Modelo de Dados

```sql
searches
  id, nicho, cidade, raio_km, max_results,
  status (pending/running/completed/failed),
  total_found, created_at

leads
  id, search_id,
  nome, endereco, telefone, whatsapp,
  nota, total_avaliacoes, responde_avaliacoes,
  horario, categoria, descricao,
  site_url, tem_site (bool),
  whatsapp_status (not_tested/has_automation/no_automation/human),
  site_gerado_path,
  crm_status (not_contacted/contacted/interested/closed/no_interest/no_response),
  canal_contato, servico_oferecido, observacoes,
  data_contato, created_at

generated_sites
  id, lead_id, html_content, preview_url, created_at
```

---

## 4. Fluxos Principais

### 4.1 Fluxo de Nova Busca

```
Usuário configura: nicho + cidade + raio + quantidade
  → Backend dispara gmaps_scraper
  → Coleta dados de cada negócio
  → Para cada lead: verifica se tem site (checar site_url)
  → Salva todos os leads no banco com status "não contatado"
  → Frontend exibe lista com filtros
```

### 4.2 Fluxo de Verificação WhatsApp

```
Usuário seleciona leads para verificar
  → Backend envia mensagem de teste via Evolution API
  → Aguarda resposta por X minutos (configurável)
  → Analisa padrão da resposta
  → Atualiza whatsapp_status de cada lead
  → Frontend exibe resultado com ícone colorido
```

### 4.3 Fluxo de Geração de Site

```
Usuário clica "Gerar site" em um lead sem site
  → Backend monta prompt com dados do negócio (nome, categoria, descrição, horário, telefone)
  → Claude API gera HTML completo personalizado para o nicho
  → HTML salvo no banco + arquivo estático
  → Frontend exibe preview do site gerado
  → Usuário pode usar como demonstração na abordagem ao cliente
```

---

## 5. Regras de Negócio

- Uma busca não pode rodar em paralelo com outra do mesmo nicho + cidade
- Verificação WhatsApp só roda em leads que têm número de telefone cadastrado
- Site gerado só para leads sem site (`tem_site = false`)
- Exportação CSV inclui todos os campos + status CRM atual
- Lead fechado não pode voltar para status anterior

---

## 6. Interface — Telas Principais

### Dashboard
- Cards: total de leads, leads sem site, leads sem automação, fechados
- Gráfico de funil de conversão
- Últimas buscas realizadas

### Nova Busca
- Campo: Nicho (texto livre ou seleção de lista pré-definida)
- Campo: Cidade/Região
- Slider: Raio em km
- Campo: Quantidade máxima de resultados
- Botão: Iniciar busca (com progress bar em tempo real)

### Lista de Leads
- Tabela com filtros por: status CRM, tem site, tem automação, nota, nicho
- Ações por lead: verificar WhatsApp, gerar site, atualizar status CRM, adicionar observação
- Exportar seleção em CSV

### Preview do Site Gerado
- Iframe com o site gerado
- Botão: Exportar HTML
- Botão: Copiar link de preview

---

## 7. Configurações (.env)

```env
# Google Maps
GOOGLE_MAPS_API_KEY=...

# Evolution API (já configurada no FitCoach)
EVOLUTION_API_URL=...
EVOLUTION_API_KEY=...
EVOLUTION_INSTANCE_NAME=...

# Claude API
ANTHROPIC_API_KEY=...

# Banco
DATABASE_URL=postgresql://...

# Verificação WhatsApp
WHATSAPP_CHECK_TIMEOUT_MINUTES=5
WHATSAPP_TEST_MESSAGE=Olá! Tudo bem?
```

---

## 8. Roadmap de Desenvolvimento

### Fase 1 — MVP (1–2 semanas)
- [ ] Scraping Google Maps configurável (nicho + cidade)
- [ ] Listagem de leads com filtros básicos
- [ ] Status CRM por lead (não contatado → fechado)
- [ ] Exportação CSV
- [ ] Deploy com Docker Compose

### Fase 2 — Verificação WhatsApp (3–5 dias)
- [ ] Integração Evolution API para verificação de automação
- [ ] Atualização automática de `whatsapp_status` por lead
- [ ] Filtro por status de automação na lista

### Fase 3 — Gerador de Site com IA (3–5 dias)
- [ ] Integração Claude API
- [ ] Geração de HTML por nicho com dados do Google Maps
- [ ] Preview do site gerado no frontend
- [ ] Exportação do HTML gerado

### Fase 4 — Melhorias (contínuo)
- [ ] Dashboard com métricas de conversão
- [ ] Lista pré-definida de nichos comuns
- [ ] Histórico de mensagens de abordagem por lead
- [ ] Agendamento de buscas recorrentes

---

## 9. Pontos de Atenção

| Ponto | Risco | Mitigação |
|-------|-------|-----------|
| Google Maps scraping | Bloqueio por rate limit | Usar SDK oficial com API Key; respeitar limites |
| Evolution API banimento | Número bloqueado ao enviar mensagens em massa | Usar número dedicado; enviar com intervalo entre mensagens |
| Claude API custo | Geração de muitos sites = custo alto | Gerar só quando solicitado manualmente, não em batch automático |
| Dados desatualizados | Google Maps pode ter info errada | Exibir aviso: "dados coletados em [data]" |

---

## 10. Próximos Passos Imediatos

1. Configurar repositório + Docker Compose base
2. Implementar `gmaps_scraper.py` com Google Maps SDK
3. CRUD de leads com status CRM no backend
4. Tela de nova busca + lista de leads no frontend
5. Testar scraping em nicho real (ex: barbearias em Florianópolis)
6. Integrar verificação WhatsApp via Evolution API
7. Integrar gerador de site com Claude API

---

*Documento gerado para implementação com Claude Code ou VSCode.*
