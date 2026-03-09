import React, { useState, useEffect } from 'react';
import { Package, User, Phone, MapPin, CreditCard, ChevronRight, Hash, Copy, Check } from 'lucide-react';
import { sendAlimtalk } from '../services/alimtalkService';

const MembershipOrder = ({ products, onAddOrder, memberships = [] }) => {
    const [selectedProductId, setSelectedProductId] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [recipient, setRecipient] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [membershipKey, setMembershipKey] = useState('');
    const [receiptType, setReceiptType] = useState('없음'); // 없음, 현금영수증, 세금계산서
    const [bizNumber, setBizNumber] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showKakaoModal, setShowKakaoModal] = useState(false);
    const [generatedOrderNo, setGeneratedOrderNo] = useState('');
    const [totalPrice, setTotalPrice] = useState(0);
    const [copySuccess, setCopySuccess] = useState(false);

    const resetForm = () => {
        setSelectedProductId('');
        setQuantity(1);
        setRecipient('');
        setPhone('');
        setAddress('');
        setMembershipKey('');
        setReceiptType('없음');
        setBizNumber('');
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && showKakaoModal) {
                setShowKakaoModal(false);
                resetForm();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showKakaoModal]);

    const autoHyphen = (value) => {
        return value
            .replace(/[^0-9]/g, '')
            .replace(/^(\d{0,3})(\d{0,4})(\d{0,4})$/g, "$1-$2-$3")
            .replace(/(\-{1,2})$/g, "");
    };

    const handlePhoneChange = (e) => {
        setPhone(autoHyphen(e.target.value));
    };

    const [originalPrice, setOriginalPrice] = useState(0);

    useEffect(() => {
        const product = products.find(p => p.id === Number(selectedProductId));
        if (product) {
            setOriginalPrice(product.price * quantity);
            const priceAfterDiscount = product.price - (product.price * (product.discount || 0) / 100);
            setTotalPrice(Math.floor(priceAfterDiscount * quantity));
        } else {
            setOriginalPrice(0);
            setTotalPrice(0);
        }
    }, [selectedProductId, quantity, products]);

    const handleCopyOrderNo = () => {
        navigator.clipboard.writeText(generatedOrderNo);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!recipient || !phone || !address || !membershipKey.trim()) {
            alert('모든 필수 정보를 입력해주세요.');
            return;
        }

        // Check if the entered membership key exists in the memberships array (case-insensitive)
        const enteredKey = membershipKey.trim().toLowerCase();
        const validMembership = memberships.find(m => m.membershipKey.toLowerCase().trim() === enteredKey);

        if (!validMembership) {
            alert(`유효하지 않은 멤버십 키입니다. 입력하신 [${membershipKey}]와 일치하는 회원을 찾을 수 없습니다. (대소문자 무관)`);
            return;
        }

        const selectedProduct = products.find(p => p.id === Number(selectedProductId));
        if (!selectedProduct) {
            alert('상품을 선택해주세요.');
            return;
        }

        const brandType = selectedProduct.name.includes('R') ? 'UNR' : selectedProduct.name.includes('X') ? 'UNX' : 'YAK';
        const orderNo = `${brandType}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

        setGeneratedOrderNo(orderNo);
        setIsSubmitting(true);

        const newOrder = {
            id: orderNo,
            type: brandType,
            customer: recipient,
            phone: phone,
            item: `${selectedProduct.name} (${quantity}부)`,
            payment_status: '대기',
            delivery_status: '배송전',
            receipt_type: receiptType,
            receipt_status: receiptType === '없음' ? '-' : '발행전',
            biz_number: bizNumber,
            date: new Date().toISOString().slice(0, 19).replace('T', ' '),
            amount: totalPrice,
            quantity: parseInt(quantity),
            address: address,
            membershipKey: membershipKey
        };

        // Simulating backend logic...
        setTimeout(async () => {
            onAddOrder(newOrder);

            // 알림톡 발송 시작
            try {
                const result = await sendAlimtalk({
                    receiver: phone,
                    name: recipient,
                    productName: selectedProduct.name,
                    quantity: quantity,
                    totalPrice: totalPrice,
                    orderNumber: orderNo
                });

                if (result.success) {
                    console.log('알림톡 발송 성공:', result.messageId);
                } else {
                    console.warn('알림톡 발송 실패:', result.error);
                }
            } catch (err) {
                console.error('알림톡 발송 중 예외 발생:', err);
            }

            setIsSubmitting(false);
            setShowKakaoModal(true);
        }, 800);
    };

    return (
        <div className="card" style={{ maxWidth: '600px', width: '100%', padding: '2.5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>멤버십 주문하기</h2>
                <p style={{ color: 'var(--text-secondary)' }}>정보를 입력하시면 자동으로 확정 금액이 계산됩니다.</p>
            </div>

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1.5rem' }}>
                    <label className="form-label">신청 상품</label>
                    <div style={{ position: 'relative' }}>
                        <select
                            value={selectedProductId}
                            onChange={(e) => setSelectedProductId(e.target.value)}
                            style={{ paddingLeft: '3rem' }}
                            disabled={isSubmitting}
                        >
                            <option value="">상품을 선택하세요</option>
                            {products.map(p => {
                                const discountedPrice = p.price - (p.price * (p.discount || 0) / 100);
                                return (
                                    <option key={p.id} value={p.id}>
                                        {p.name} {p.discount > 0 ? `(${p.discount}% 할인: ${Math.floor(discountedPrice).toLocaleString()}원)` : `(${p.price.toLocaleString()}원)`}
                                    </option>
                                );
                            })}
                        </select>
                        <Package size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                    </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label className="form-label">신청 부수</label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                            style={{ paddingLeft: '3rem' }}
                            disabled={isSubmitting}
                        />
                        <Hash size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                    </div>
                </div>

                <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div className="input-group">
                        <label className="form-label">받는 사람 (필수)</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                placeholder="성함을 입력하세요"
                                value={recipient}
                                onChange={(e) => setRecipient(e.target.value)}
                                style={{ paddingLeft: '3rem' }}
                                disabled={isSubmitting}
                            />
                            <User size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                        </div>
                    </div>
                    <div className="input-group">
                        <label className="form-label">전화번호 (필수)</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                placeholder="010-0000-0000"
                                value={phone}
                                onChange={handlePhoneChange}
                                maxLength={13}
                                style={{ paddingLeft: '3rem' }}
                                disabled={isSubmitting}
                            />
                            <Phone size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                        </div>
                    </div>
                </div>

                <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                    <label className="form-label">멤버십 고유 키 (필수)</label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="text"
                            placeholder="전용 키를 입력하세요"
                            value={membershipKey}
                            onChange={(e) => setMembershipKey(e.target.value)}
                            style={{ paddingLeft: '3rem' }}
                            disabled={isSubmitting}
                        />
                        <CreditCard size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                    </div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                    <label className="form-label">배송 주소 (필수)</label>
                    <div style={{ position: 'relative' }}>
                        <textarea
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="상세 주소를 입력하세요"
                            style={{ paddingLeft: '3rem', minHeight: '80px', paddingTop: '1rem' }}
                            disabled={isSubmitting}
                        />
                        <MapPin size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '1.2rem' }} />
                    </div>
                </div>

                <div className="p-3 bg-white bg-opacity-5 rounded border border-white border-opacity-10 mb-4">
                    <label className="fw-bold small mb-2 d-block">📑 증빙 서류 신청</label>
                    <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <select
                            value={receiptType}
                            onChange={(e) => setReceiptType(e.target.value)}
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)' }}
                            disabled={isSubmitting}
                        >
                            <option value="없음">신청안함</option>
                            <option value="현금영수증">현금영수증</option>
                            <option value="세금계산서">세금계산서</option>
                        </select>
                        {receiptType !== '없음' && (
                            <input
                                type="text"
                                placeholder={receiptType === '세금계산서' ? '사업자번호' : '휴대폰번호/사업자번호'}
                                value={bizNumber}
                                onChange={(e) => setBizNumber(e.target.value)}
                                disabled={isSubmitting}
                            />
                        )}
                    </div>
                </div>

                {
                    totalPrice > 0 && (
                        <div style={{
                            background: 'rgba(0, 242, 254, 0.05)',
                            border: '1px solid rgba(0, 242, 254, 0.2)',
                            padding: '1.5rem',
                            borderRadius: '16px',
                            marginBottom: '2rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>최종 결제 금액</span>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                                {originalPrice > totalPrice && (
                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                                        {originalPrice.toLocaleString()}원
                                    </span>
                                )}
                                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-teal)' }}>{totalPrice.toLocaleString()}원</span>
                            </div>
                        </div>
                    )
                }

                <button
                    type="submit"
                    className="btn btn-teal w-100"
                    style={{ padding: '1.25rem', fontSize: '1.1rem', fontWeight: 700, borderRadius: '16px' }}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? '처리 중...' : <>주문 완료하기 <ChevronRight size={20} style={{ marginLeft: '0.5rem' }} /></>}
                </button>
            </form >

            {/* Kakao Simulation Modal */}
            {
                showKakaoModal && (
                    <div
                        onClick={() => { setShowKakaoModal(false); resetForm(); }}
                        style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                        }}
                    >
                        <div
                            className="card"
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                maxWidth: '400px',
                                width: '90%',
                                textAlign: 'center',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                padding: 0,
                                background: '#ffffff',
                                borderRadius: '24px',
                                overflow: 'hidden'
                            }}
                        >
                            <div style={{ background: '#F7E600', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ background: '#3A1D1D', color: '#F7E600', padding: '6px 14px', borderRadius: '20px', fontWeight: 900, fontSize: '0.75rem' }}>KAKAOTALK</div>
                                <span style={{ color: '#3A1D1D', fontWeight: 800, fontSize: '1.1rem' }}>UNION 모의고사</span>
                            </div>
                            <div style={{ padding: '2.5rem 2rem' }}>
                                <h3 style={{ marginBottom: '1.5rem', color: '#1a1a1a', fontSize: '1.6rem', fontWeight: 900 }}>알림톡 발송 완료!</h3>
                                <div style={{ color: '#444', fontSize: '1rem', lineHeight: '1.7', marginBottom: '2.5rem' }}>
                                    <span style={{ color: 'var(--accent-teal)', fontWeight: 800 }}>{recipient}</span>님,<br />
                                    입력하신 연락처로 안내가 전송되었습니다.

                                    <div style={{
                                        marginTop: '1.5rem',
                                        padding: '1rem',
                                        background: '#f8f9fa',
                                        borderRadius: '12px',
                                        border: '1px solid #eee',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.5rem'
                                    }}>
                                        <span style={{ fontSize: '0.8rem', color: '#888', fontWeight: 700 }}>나의 주문 번호</span>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                                            <span style={{ color: '#1a1a1a', fontWeight: 950, fontSize: '1.2rem', letterSpacing: '0.05em' }}>{generatedOrderNo}</span>
                                            <button
                                                onClick={handleCopyOrderNo}
                                                style={{
                                                    padding: '6px',
                                                    background: '#fff',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    color: copySuccess ? '#22c55e' : '#666'
                                                }}
                                            >
                                                {copySuccess ? <Check size={16} /> : <Copy size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    className="btn btn-teal w-100"
                                    style={{
                                        borderRadius: '16px',
                                        height: '56px',
                                        fontWeight: 800,
                                        fontSize: '1.1rem',
                                        boxShadow: '0 8px 20px rgba(0, 242, 254, 0.2)'
                                    }}
                                    onClick={() => {
                                        setShowKakaoModal(false);
                                        resetForm();
                                    }}
                                >
                                    확인 완료
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default MembershipOrder;
