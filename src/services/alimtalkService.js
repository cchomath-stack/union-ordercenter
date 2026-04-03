/**
 * 솔라피(Solapi) 리얼타임 알림톡 발송 서비스
 */

const SOLAPI_BASE_URL = 'https://api.solapi.com/messages/v4/send';

/**
 * 솔라피 인증을 위한 HMAC-SHA256 시그니처 생성 (브라우저용)
 */
async function generateSignature(apiSecret, date, salt) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(apiSecret);
    const messageData = encoder.encode(date + salt);

    const key = await window.crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await window.crypto.subtle.sign(
        'HMAC',
        key,
        messageData
    );

    return Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

export const sendAlimtalk = async ({ receiver, name, productName, quantity, totalPrice, orderNumber, brand }) => {
    try {
        const payload = { receiver, name, productName, quantity, totalPrice, orderNumber, brand };
        
        console.log('알림톡 발송 요청 (Vercel Proxy):', payload);

        const response = await fetch('/api/alimtalk', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok && data.success) {
            console.log('알림톡 발송 성공:', data);
            return { success: true, data };
        } else {
            console.error('알림톡 발송 프록시 오류:', data);
            return { success: false, error: data.error || 'Unknown Proxy Error', details: data.details };
        }
    } catch (error) {
        console.error('알림톡 통신 네트워크 오류:', error);
        return { success: false, error: error.message };
    }
};
