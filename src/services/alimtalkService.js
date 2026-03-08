/**
 * 솔라피(Solapi) 리얼타임 알림톡 발송 서비스
 */

const SOLAPI_BASE_URL = 'https://api.solapi.com/messages/v4/send';

/**
 * 알림톡 발송 함수
 * @param {Object} params - { receiver: '01012345678', name: '홍길동', orderNumber: 'UNR-260308-001' }
 */
export const sendAlimtalk = async ({ receiver, name, orderNumber }) => {
    // 환경 변수 확인 (Vite 환경 변수는 import.meta.env 사용)
    const apiKey = import.meta.env.VITE_SOLAPI_API_KEY;
    const pfid = import.meta.env.VITE_SOLAPI_PFID;
    const templateId = import.meta.env.VITE_SOLAPI_TEMPLATE_ID;
    const senderNumber = import.meta.env.VITE_SOLAPI_SENDER_NUMBER;

    if (!apiKey || !pfid || !templateId) {
        console.error('솔라피 연동 정보가 설정되지 않았습니다. .env 환경 변수를 확인해주세요.');
        return { success: false, error: 'Missing Credentials' };
    }

    // 전화번호 형식 정제 (하이픈 제거)
    const cleanReceiver = receiver.replace(/-/g, '');

    const message = {
        to: cleanReceiver,
        from: senderNumber,
        type: 'ATA', // Alimtalk 타입
        kakaoOptions: {
            pfid: pfid,
            templateId: templateId,
            variables: {
                '#{이름}': name,
                '#{주문번호}': orderNumber
            }
        }
    };

    try {
        console.log('알림톡 발송 시도:', message);

        // 실제 운영 시에는 백엔드(Serverless Function 등)를 거치는 것이 보안상 안전하지만,
        // 현재는 빠른 프로토타이핑을 위해 프론트엔드에서 직접 호출하는 구조를 제시합니다.
        // *주의*: 솔라피 API는 브라우저 CORS 정책에 따라 직접 호출이 제한될 수 있습니다. 
        // Vercel에서 배포 시 API Routes(Serverless)를 사용하는 것이 최종 권장 사항입니다.

        // 임시 응답 (UI 테스트용)
        return { success: true, messageId: 'TEMP_ID_' + Date.now() };

        /* 
        const response = await fetch(SOLAPI_BASE_URL, {
            method: 'POST',
            headers: {
                'Authorization': `HMAC-SHA256 apiKey=${apiKey}, date=${new Date().toISOString()}, salt=${Math.random().toString(36).substring(2)}, signature=${'SIGNATURE_LOGIC_NEEDED'}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });
        const data = await response.json();
        return { success: response.ok, data };
        */
    } catch (error) {
        console.error('알림톡 발송 실패:', error);
        return { success: false, error: error.message };
    }
};
