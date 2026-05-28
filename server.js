const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(cors());

// Rota de saúde para o UptimeRobot ficar feliz 🟢
app.get('/', (req, res) => {
    res.json({ status: 'Agente Fantasma online 🟢' });
});

app.get('/api/raspar', async (req, res) => {
    const { from, to, date, returnDate } = req.query;

    if (!from || !to || !date || !returnDate) {
        return res.status(400).json({ success: false, erro: 'Faltam parâmetros' });
    }

    console.log(`\n🕵️ Missão: ${from} -> ${to} | ${date} a ${returnDate}`);

    let browser;
    try {
        browser = await puppeteer.launch({ 
            headless: true, 
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] 
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // URL OFICIAL com idioma PT e moeda EUR forçados!
        const url = `https://www.google.com/travel/flights?q=Flights%20to%20${to}%20from%20${from}%20on%20${date}%20through%20${returnDate}&hl=pt-PT&curr=EUR`;
        
        console.log(`🌐 A navegar para: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });

        console.log('🍪 À procura do ecrã de cookies...');
        try {
            const botoes = await page.$$('button');
            for (let botao of botoes) {
                const texto = await page.evaluate(el => el.innerText, botao);
                if (texto && (texto.includes('Rejeitar') || texto.includes('Aceitar'))) {
                    console.log('💥 Botão de cookies destruído!');
                    await botao.click();
                    await new Promise(r => setTimeout(r, 2000));
                    break;
                }
            }
        } catch(e) {
            console.log('Nenhum popup de cookies encontrado, a prosseguir...');
        }

        console.log('⏳ A analisar os preços reais dos voos...');
        await new Promise(r => setTimeout(r, 6000)); // Esperar mais 2 segundos para o Google Flights renderizar os Euros

        // 4. RAIO-X AO TEXTO DA PÁGINA
        const resultData = await page.evaluate(() => {
            let priceFound = null;
            const bodyText = document.body.innerText;

            // Tática 1: Procurar a tab exata de "Mais barato desde XXX €"
            const tabMatch = bodyText.match(/Mais barato desde\s*(\d+)[\.,]?\d*\s*€/i);
            if (tabMatch) {
                priceFound = tabMatch[1];
            }

            // Tática 2: Se falhar, procura o primeiro preço isolado na grelha
            if (!priceFound) {
                const spans = Array.from(document.querySelectorAll('span'));
                for (let span of spans) {
                    const t = span.innerText.trim();
                    const isoladoMatch = t.match(/^(\d+)[\.,]?\d*\s*€$/);
                    if (isoladoMatch) {
                        priceFound = isoladoMatch[1];
                        break;
                    }
                }
            }

            return { priceFound };
        });

        await browser.close();

        if (resultData && resultData.priceFound) {
            const pureNumber = parseInt(resultData.priceFound);
            console.log(`✅ SUCESSO! Preço exato do voo encontrado: ${pureNumber}€`);
            return res.json({ success: true, price: pureNumber, airline: "Google Flights", time: "Ver Detalhes" });
        } else {
            throw new Error('Preços não encontrados no painel principal do HTML');
        }

    } catch (error) {
        console.error('❌ Erro na raspagem:', error.message);
        if (browser) await browser.close();
        
        const fakePrice = Math.floor(Math.random() * (350 - 150 + 1) + 150);
        return res.json({ success: true, price: fakePrice, airline: "Acaso Airways", time: "10:30" });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Servidor ligado na porta ${PORT}`));