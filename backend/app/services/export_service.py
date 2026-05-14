import csv
import io

from app.db.models import Lead


CRM_LABELS = {
    "not_contacted": "Não contatado",
    "contacted": "Contatado",
    "interested": "Interessado",
    "closed": "Fechado",
    "no_interest": "Sem interesse",
    "no_response": "Sem resposta",
}


def leads_to_csv(leads: list[Lead]) -> str:
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(
        [
            "Nome",
            "Endereço",
            "Telefone",
            "Nota",
            "Avaliações",
            "Categoria",
            "Site URL",
            "Tem Site",
            "Status CRM",
            "Canal Contato",
            "Serviço Oferecido",
            "Observações",
            "Data Contato",
            "Coletado em",
        ]
    )

    for lead in leads:
        writer.writerow(
            [
                lead.nome,
                lead.endereco or "",
                lead.telefone or "",
                lead.nota or "",
                lead.total_avaliacoes,
                lead.categoria or "",
                lead.site_url or "",
                "Sim" if lead.tem_site else "Não",
                CRM_LABELS.get(lead.crm_status, lead.crm_status),
                lead.canal_contato or "",
                lead.servico_oferecido or "",
                lead.observacoes or "",
                lead.data_contato.isoformat() if lead.data_contato else "",
                lead.created_at.isoformat() if lead.created_at else "",
            ]
        )

    return output.getvalue()
