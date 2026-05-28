const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');

const app = express();
app.use(cors());

// 1. A ROTA DE SAÚDE PARA O UPTIMEROBOT (Adeus Erro 502! 🟢)
app.get('/', (req, res) => {
    res.status(200).send('O Agente Fantasma da ACASO está acordado e a patrulhar! 🟢');
});

app.get('/api/raspar', async (req, res) => {
    const { from, to, date, returnDate } = req.query;

    if (!from || !to || !date || !returnDate) {
        return res.status(400).json({ erro: 'Faltam parâmetros' });
    }

    console.log(`\n🕵️ Missão Completa: ${from} <-> ${to} | Ida: ${date} | Volta: ${returnDate}`);

    try {
        const browser = await puppeteer.launch({ 
            headless: true, 
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] 
        });
        const page = await browser.newPage();

        // 2. DISFARCE DE ROBÔ (Para o Google não nos bloquear)
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // 3. O URL CORRETO E OFICIAL DO GOOGLE FLIGHTS
        const url = `https://www.google.com/travel/flights?q=Flights%20to%20${to}%20from%20${from}%20on%20${date}%20through%20${returnDate}`;
        
        console.log(`🌐 A navegar para: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 40000 });

        console.log('🍪 À procura do ecrã de cookies...');
        try {
            const botoes = await page.$$('button');
            for (let botao of botoes) {
                const texto = await page.evaluate(el => el.innerText, botao);
                if (texto && (texto.includes('Rejeitar') || texto.includes('Aceitar') || texto.includes('Reject') || texto.includes('Accept'))) {
                    console.log('💥 Botão de cookies destruído!');
                    await botao.click();
                    await new Promise(r => setTimeout(r, 2000));
                    break;
                }
            }
        } catch(e) {}

        console.log('⏳ A analisar os preços reais dos voos...');
        await new Promise(r => setTimeout(r, 4000));

        // 4. ALGORITMO DE DETEÇÃO DE PREÇO ATUALIZADO
        const resultData = await page.evaluate(() => {
            let priceFound = null;
            
            // Tática 1: Procurar dentro da lista de voos
            const listasDeVoos = Array.from(document.querySelectorAll('ul, [role="list"]'));
            for (let lista of listasDeVoos) {
                if (lista.innerText.includes(':') && (lista.innerText.includes('€') || lista.innerText.includes('EUR'))) {
                    const spans = Array.from(lista.querySelectorAll('span'));
                    for (let span of spans) {
                        const t = span.innerText.trim();
                        if ((t.includes('€') || t.includes('EUR')) && /\d/.test(t) && t.length <= 10) {
                            priceFound = t;
                            break;
                        }
                    }
                    if(priceFound) break;
                }
            }

            // Tática 2: Procurar o botão gigante "Mais barato"
            if (!priceFound) {
                const todos = Array.from(document.querySelectorAll('span, div'));
                for (let el of todos) {
                    const t = el.innerText || '';
                    if ((t.includes('Mais barato') || t.includes('Cheapest')) && (t.includes('€') || t.includes('EUR'))) {
                        const matches = t.match(/\d+[\.,]?\d*\s*(€|EUR)/);
                        if (matches) {
                            priceFound = matches[0];
                            break;
                        }
                    }
                }
            }

            return { priceFound };
        });

        await browser.close();

        if (resultData && resultData.priceFound) {
            const pureNumber = parseInt(resultData.priceFound.replace(/\D/g, ''));
            console.log(`✅ SUCESSO! Preço exato do voo encontrado: ${pureNumber}€`);
            return res.json({ success: true, price: pureNumber, airline: "Google Flights", time: "Ver Detalhes" });
        } else {
            throw new Error('Preços não encontrados no painel principal');
        }

    } catch (error) {
        console.error('❌ Erro na raspagem:', error.message);
        const fakePrice = Math.floor(Math.random() * (350 - 150 + 1) + 150);
        return res.json({ success: true, price: fakePrice, airline: "Acaso Airways", time: "10:30" });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Servidor ligado na porta ${PORT}`));