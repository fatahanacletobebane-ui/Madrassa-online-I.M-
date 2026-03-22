const axios = require('axios');

export default async function handler(req, res) {
    // Permite que o seu site no GitHub aceda a esta função
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { msisdn, amount, nome } = req.body;

    try {
        await axios.post('https://api.debito.co.mz/api/v1/wallets/122767/c2b/mpesa', {
            msisdn: msisdn,
            amount: amount,
            reference_description: `Inscricao Madrassa: ${nome}`
        }, {
            headers: {
                'Authorization': 'Bearer cp_live_eyJ0eX…Id5M', // Sua chave Débito
                'Content-Type': 'application/json'
            }
        });

        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
