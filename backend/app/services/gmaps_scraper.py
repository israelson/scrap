import asyncio
import re

from playwright.async_api import async_playwright, Page

GMAPS_BASE = "https://www.google.com"

_SOCIAL_PATTERNS = [
    ("facebook",   r"facebook\.com|fb\.com"),
    ("instagram",  r"instagram\.com"),
    ("youtube",    r"youtube\.com|youtu\.be"),
    ("linkedin",   r"linkedin\.com"),
    ("twitter",    r"twitter\.com|x\.com"),
    ("tiktok",     r"tiktok\.com"),
    ("linktree",   r"linktr\.ee"),
    ("whatsapp",   r"wa\.me|whatsapp\.com"),
]


def classify_url(url: str) -> str:
    if not url:
        return "nenhum"
    url_lower = url.lower()
    for name, pattern in _SOCIAL_PATTERNS:
        if re.search(pattern, url_lower):
            return name
    return "website"


async def _dismiss_consent(page: Page):
    for text in ["Aceitar tudo", "Accept all", "Reject all", "Rejeitar tudo"]:
        try:
            btn = page.get_by_role("button", name=re.compile(text, re.IGNORECASE))
            if await btn.is_visible(timeout=1500):
                await btn.click()
                return
        except Exception:
            pass


async def _text(page: Page, selector: str) -> str:
    try:
        el = page.locator(selector).first
        if await el.count():
            return (await el.inner_text()).strip()
    except Exception:
        pass
    return ""


async def _attr(page: Page, selector: str, attr: str) -> str:
    try:
        el = page.locator(selector).first
        if await el.count():
            return (await el.get_attribute(attr) or "").strip()
    except Exception:
        pass
    return ""


async def _extract_details(page: Page) -> dict | None:
    try:
        await page.wait_for_selector("h1", timeout=8000)
    except Exception:
        return None

    name = await _text(page, "h1")
    if not name:
        return None

    # Nota (rating)
    rating = None
    for sel in ['[aria-label*="estrela"]', '[aria-label*="star"]', "span.MW4etd"]:
        aria = await _attr(page, sel, "aria-label")
        if aria:
            m = re.search(r"[\d,]+", aria)
            if m:
                rating = float(m.group().replace(",", "."))
                break

    # Total de avaliações
    reviews = 0
    for sel in ['[aria-label*="avaliação"]', '[aria-label*="review"]', "span.UY7F9"]:
        aria = await _attr(page, sel, "aria-label")
        if aria:
            nums = re.findall(r"\d+", aria.replace(".", "").replace(",", ""))
            if nums:
                reviews = int(nums[0])
                break

    address = await _text(page, 'button[data-item-id="address"]')
    phone = await _text(page, '[data-item-id*="phone:tel"]')
    website = await _attr(page, 'a[data-item-id="authority"]', "href")

    # Categoria
    category = ""
    for sel in ["button.DkEaL", "[jsaction*='pane.rating.category']"]:
        category = await _text(page, sel)
        if category:
            break

    site_tipo = classify_url(website)

    return {
        "place_id": None,
        "nome": name,
        "endereco": address,
        "telefone": phone,
        "whatsapp": phone,
        "nota": rating,
        "total_avaliacoes": reviews,
        "responde_avaliacoes": False,
        "horario": None,
        "categoria": category,
        "descricao": "",
        "site_url": website,
        "site_tipo": site_tipo,
        "tem_site": site_tipo == "website",
    }


async def scrape_businesses(nicho: str, cidade: str, max_results: int = 20) -> list[dict]:
    query = f"{nicho} em {cidade}"
    search_url = f"{GMAPS_BASE}/maps/search/{query.replace(' ', '+')}"
    results = []

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-dev-shm-usage"],
        )
        ctx = await browser.new_context(locale="pt-BR")

        # Passo 1: coletar URLs dos lugares na lista de resultados
        search_page = await ctx.new_page()
        await search_page.goto(search_url, wait_until="domcontentloaded", timeout=30000)
        await _dismiss_consent(search_page)

        try:
            await search_page.wait_for_selector('[role="feed"]', timeout=12000)
        except Exception:
            await browser.close()
            return []

        place_urls: list[str] = []
        seen: set[str] = set()
        scroll_rounds = max(4, max_results // 5)

        for _ in range(scroll_rounds):
            links = await search_page.locator('[role="feed"] a[href*="/maps/place/"]').all()
            for link in links:
                href = await link.get_attribute("href")
                if href and href not in seen:
                    seen.add(href)
                    full = href if href.startswith("http") else GMAPS_BASE + href
                    place_urls.append(full)

            if len(place_urls) >= max_results:
                break

            await search_page.evaluate(
                "const f = document.querySelector('[role=\"feed\"]'); if(f) f.scrollBy(0, 600);"
            )
            await asyncio.sleep(1.5)

        # Passo 2: visitar cada URL e extrair detalhes
        detail_page = await ctx.new_page()

        for url in place_urls[:max_results]:
            try:
                await detail_page.goto(url, wait_until="domcontentloaded", timeout=15000)
                await asyncio.sleep(0.8)
                details = await _extract_details(detail_page)
                if details and details["nome"]:
                    results.append(details)
            except Exception:
                continue

        await browser.close()

    return results
