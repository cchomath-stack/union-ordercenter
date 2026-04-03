import crypto from 'crypto';

const SOLAPI_BASE_URL = 'https://api.solapi.com/messages/v4/send';

function generateSignature(apiSecret, date, salt) {
    const hmac = crypto.createHmac('sha256', apiSecret);
    hmac.update(date + salt);
    return hmac.digest('hex');
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { receiver, name, productName, quantity, totalPrice, orderNumber, brand } = req.body;

    const apiKey = process.env.VITE_SOLAPI_API_KEY || process.env.SOLAPI_API_KEY;
    const apiSecret = process.env.VITE_SOLAPI_API_SECRET || process.env.SOLAPI_API_SECRET;
    const senderNumber = process.env.VITE_SOLAPI_SENDER_NUMBER || process.env.SOLAPI_SENDER_NUMBER;

    let pfid = process.env.VITE_SOLAPI_PFID || process.env.SOLAPI_PFID;
    let templateId = process.env.VITE_SOLAPI_TEMPLATE_ID || process.env.SOLAPI_TEMPLATE_ID;

    if (brand === 'YAK') {
        pfid = process.env.VITE_SOLAPI_YAK_PFID || process.env.SOLAPI_YAK_PFID || pfid;
        templateId = process.env.VITE_SOLAPI_YAK_TEMPLATE_ID || process.env.SOLAPI_YAK_TEMPLATE_ID || templateId;
    }

    if (!apiKey || !apiSecret || !pfid || !templateId) {
        console.error('Server is missing Solapi Credentials');
        return res.status(500).json({ success: false, error: 'Server Missing Credentials' });
    }

    const cleanReceiver = receiver.replace(/-/g, '');
    const date = new Date().toISOString();
    const salt = Math.random().toString(36).substring(2, 12);

    try {
        const signature = generateSignature(apiSecret, date, salt);
        const authHeader = `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;

        const payload = {
            message: {
                to: cleanReceiver,
                from: senderNumber,
                type: 'ATA',
                kakaoOptions: {
                    pfId: pfid,
                    templateId: templateId,
                    variables: {
                        '#{이름}': name,
                        '#{주문상품}': productName,
                        '#{수량}': String(quantity),
                        '#{결제금액}': `${totalPrice.toLocaleString()}원`,
                        '#{주문번호}': orderNumber
                    }
                }
            }
        };

        const response = await fetch(SOLAPI_BASE_URL, {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
            return res.status(200).json({ success: true, data });
        } else {
            return res.status(400).json({ success: false, error: data.errorMessage || 'Unknown API Error', details: data });
        }
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
