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

/**
 * 알림톡 발송 함수
 * @param {Object} params - { receiver, name, productName, quantity, totalPrice, orderNumber }
 */
export const sendAlimtalk = async ({ receiver, name, productName, quantity, totalPrice, orderNumber }) => {
    // 환경 변수 확인
    const apiKey = import.meta.env.VITE_SOLAPI_API_KEY;
    const apiSecret = import.meta.env.VITE_SOLAPI_API_SECRET;
    const pfid = import.meta.env.VITE_SOLAPI_PFID;
    const templateId = import.meta.env.VITE_SOLAPI_TEMPLATE_ID;
    const senderNumber = import.meta.env.VITE_SOLAPI_SENDER_NUMBER;

    if (!apiKey || !apiSecret || !pfid || !templateId) {
        console.error('솔라피 연동 정보(API Key, Secret, PFID, TemplateID)가 설정되지 않았습니다.');
        return { success: false, error: 'Missing Credentials' };
    }

    // 전화번호 형식 정제 (하이픈 제거)
    const cleanReceiver = receiver.replace(/-/g, '');
    const date = new Date().toISOString();
    const salt = Math.random().toString(36).substring(2, 12);

    try {
        const signature = await generateSignature(apiSecret, date, salt);
        const authHeader = `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;

        const payload = {
            message: {
                to: cleanReceiver,
                from: senderNumber,
                type: 'ATA',
                kakaoOptions: {
                    pfid: pfid,
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

        console.log('알림톡 발송 요청:', payload);

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
            console.log('알림톡 발송 성공:', data);
            return { success: true, data };
        } else {
            console.error('알림톡 발송 API 오류:', data);
            return { success: false, error: data.errorMessage || 'Unknown API Error' };
        }
    } catch (error) {
        console.error('알림톡 발송 네트워크 오류:', error);
        return { success: false, error: error.message };
    }
};
