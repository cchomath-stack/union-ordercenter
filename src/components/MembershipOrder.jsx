import React, { useState, useEffect } from 'react';
import { Package, User, Phone, MapPin, CreditCard, ChevronRight, Hash, Copy, Check, Plus, Trash2, ShoppingCart, Loader2, AlertCircle } from 'lucide-react';
import { sendAlimtalk } from '../services/alimtalkService';

const MembershipOrder = ({ viewType, products, onAddOrder, memberships = [] }) => {
    const isYakView = viewType === 'yak_order';
    const categoryFilter = isYakView ? 'yak' : 'union';
    const filteredProducts = products.filter(p => !p.category || p.category === categoryFilter);

    // Form states
    const [recipient, setRecipient] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [membershipKey, setMembershipKey] = useState('');
    const [receiptType, setReceiptType] = useState('현금영수증');
    const [bizNumber, setBizNumber] = useState('');

    // Cart states
    const [selectedProductId, setSelectedProductId] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [cartItems, setCartItems] = useState([]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showKakaoModal, setShowKakaoModal] = useState(false);
    const [generatedOrderNo, setGeneratedOrderNo] = useState('');
    const [copySuccess, setCopySuccess] = useState(false);

    const resetForm = () => {
        setRecipient('');
        setPhone('');
        setAddress('');
        setMembershipKey('');
        setReceiptType('현금영수증');
        setBizNumber('');
        setCartItems([]);
    };

    const autoHyphen = (value) => {
        return value
            .replace(/[^0-9]/g, '')
            .replace(/^(\d{0,3})(\d{0,4})(\d{0,4})$/g, "$1-$2-$3")
            .replace(/(\-{1,2})$/g, "");
    };

    const addToCart = () => {
        if (!selectedProductId) {
            alert('상품을 먼저 선택해주세요.');
            return;
        }
        const product = filteredProducts.find(p => p.id === Number(selectedProductId));
        if (!product) return;

        const discountedPrice = Math.floor(product.price * (1 - (product.discount || 0) / 100));

        const newItem = {
            id: Date.now(),
            productId: product.id,
            name: product.name,
            originalPrice: product.price,
            price: discountedPrice,
            quantity: quantity,
            total: discountedPrice * quantity
        };

        setCartItems(prev => [...prev, newItem]);
        setSelectedProductId('');
        setQuantity(1);
    };

    const removeFromCart = (id) => {
        setCartItems(prev => prev.filter(item => item.id !== id));
    };

    const totalOrderPrice = cartItems.reduce((sum, item) => sum + item.total, 0);

    const handleCopyOrderNo = () => {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(generatedOrderNo);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        }
    };

    const handleSubmit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        console.log("Order Center HandleSubmit - Ver 2026.03.10.15:00");

        if (cartItems.length === 0) {
            alert('장바구니가 비어있습니다. 상품을 먼저 담아주세요.');
            return;
        }

        const cleanRecipient = recipient?.trim();
        const cleanPhone = phone?.trim();
        const cleanAddress = address?.trim();
        const cleanKey = membershipKey?.trim();

        if (!cleanRecipient || !cleanPhone || !cleanAddress || (!isYakView && !cleanKey)) {
            alert('성함, 전화번호, 주소 등 모든 필수 항목을 입력해주세요.');
            return;
        }

        if (!isYakView) {
            const enteredKeyLower = cleanKey.toLowerCase();
            // Robust validation to prevent crash if any member has missing fields
            const foundMembership = memberships.find(m => {
                const mk = m?.membershipKey;
                return mk && typeof mk === 'string' && mk.trim().toLowerCase() === enteredKeyLower;
            });

            if (!foundMembership) {
                alert(`유효하지 않은 멤버십 키입니다. 입력하신 [${membershipKey}]와 일치하는 회원을 찾을 수 없습니다.`);
                return;
            }
        }

        const brandPrefix = isYakView ? 'YAK' : 'UNM';
        const orderId = `${brandPrefix}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

        setIsSubmitting(true);
        setGeneratedOrderNo(orderId);

        const orderItemsText = cartItems.map(item => `${item.name} (${item.quantity}부)`).join(', ');
        const totalQty = cartItems.reduce((sum, i) => sum + i.quantity, 0);

        const newOrder = {
            id: orderId,
            type: brandPrefix,
            customer: cleanRecipient,
            phone: cleanPhone,
            item: orderItemsText,
            payment_status: '대기',
            delivery_status: '배송전',
            receipt_type: receiptType,
            receipt_status: '발행전',
            biz_number: bizNumber,
            date: new Date().toISOString().slice(0, 19).replace('T', ' '),
            amount: totalOrderPrice,
            quantity: totalQty,
            address: cleanAddress,
            membershipKey: membershipKey
        };

        console.log("Final submission data:", newOrder);

        // Async logic
        setTimeout(async () => {
            try {
                if (typeof onAddOrder === 'function') {
                    onAddOrder(newOrder);
                }

                const result = await sendAlimtalk({
                    receiver: cleanPhone,
                    name: cleanRecipient,
                    productName: orderItemsText.length > 25 ? `${orderItemsText.slice(0, 22)}...` : orderItemsText,
                    quantity: totalQty,
                    totalPrice: totalOrderPrice,
                    orderNumber: orderId
                });

                if (result.success) {
                    setShowKakaoModal(true);
                } else {
                    alert(`주문은 접수되었으나, 알림톡 전송에 실패했습니다: ${result.error}`);
                    setShowKakaoModal(true);
                }
            } catch (err) {
                console.error("Submission catch error:", err);
                alert('처리 과정 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
            } finally {
                setIsSubmitting(false);
            }
        }, 1000);
    };

    const isCartEmpty = cartItems.length === 0;

    return (
        <div className="membership-order-container" style={{ padding: '10px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
            <div className="card shadow-lg p-4 p-md-5 border-0" style={{ borderRadius: '24px', background: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(10px)', marginBottom: '2rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', fontWeight: 800 }}>
                        {isYakView ? '약술형 논술 주문' : '유니온 멤버십 주문'}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>상품 선택 후 [담기]를 눌러 장바구니에 넣어주세요.</p>
                </div>

                {/* Product Section */}
                <div style={{ padding: '1.25rem', background: '#f0f9ff', borderRadius: '20px', marginBottom: '1.5rem', border: '1px solid #bae6fd' }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label className="form-label" style={{ fontWeight: 700 }}>상품 선택</label>
                        <div style={{ position: 'relative' }}>
                            <select
                                value={selectedProductId}
                                onChange={(e) => setSelectedProductId(e.target.value)}
                                style={{ paddingLeft: '3rem', height: '54px' }}
                            >
                                <option value="">상품을 선택하세요</option>
                                {filteredProducts.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} ({p.price.toLocaleString()}원)</option>
                                ))}
                            </select>
                            <Package size={18} color="#0ea5e9" style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)' }} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                        <div style={{ flex: 1 }}>
                            <label className="form-label" style={{ fontWeight: 700 }}>수량</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="number"
                                    min="1"
                                    value={quantity}
                                    onChange={(e) => setQuantity(Number(e.target.value))}
                                    style={{ paddingLeft: '3rem', height: '54px' }}
                                />
                                <Hash size={18} color="#0ea5e9" style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)' }} />
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); addToCart(); }}
                            style={{
                                height: '54px',
                                borderRadius: '12px',
                                background: '#0ea5e9',
                                color: '#fff',
                                border: 'none',
                                padding: '0 1.5rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                transition: '0.2s',
                                boxShadow: '0 4px 10px rgba(14, 165, 233, 0.3)'
                            }}
                        >
                            <Plus size={18} /> 담기
                        </button>
                    </div>
                </div>

                {/* Cart View */}
                {cartItems.length > 0 && (
                    <div style={{ marginBottom: '2rem', animation: 'fadeIn 0.3s ease-out' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#0ea5e9' }}>
                            <ShoppingCart size={18} />
                            <span style={{ fontWeight: 800 }}>선택된 상품 목록</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {cartItems.map(item => (
                                <div key={item.id} style={{
                                    padding: '1.1rem 1.4rem',
                                    background: '#fff',
                                    borderRadius: '16px',
                                    border: '1px solid #e2e8f0',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                }}>
                                    <div style={{ textAlign: 'left' }}>
                                        <p style={{ fontWeight: 800, margin: 0, color: '#1e293b' }}>{item.name}</p>
                                        <small style={{ color: '#64748b' }}>{item.price.toLocaleString()}원 × {item.quantity}부</small>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span style={{ fontWeight: 900, color: '#0ea5e9' }}>{item.total.toLocaleString()}원</span>
                                        <button onClick={() => removeFromCart(item.id)} style={{ padding: '0.5rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Form Fields - Replaced <form> with <div> to prevent auto-submission */}
                <div style={{ marginTop: '2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                        <div className="input-group">
                            <label className="form-label" style={{ fontWeight: 700 }}>받는 사람 (필수)</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    placeholder="성함"
                                    value={recipient}
                                    onChange={(e) => setRecipient(e.target.value)}
                                    style={{ paddingLeft: '3rem', height: '54px' }}
                                />
                                <User size={18} color="#94a3b8" style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)' }} />
                            </div>
                        </div>
                        <div className="input-group">
                            <label className="form-label" style={{ fontWeight: 700 }}>전화번호 (필수)</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    value={phone}
                                    onChange={(e) => setPhone(autoHyphen(e.target.value))}
                                    placeholder="010-0000-0000"
                                    maxLength={13}
                                    style={{ paddingLeft: '3rem', height: '54px' }}
                                />
                                <Phone size={18} color="#94a3b8" style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)' }} />
                            </div>
                        </div>
                    </div>

                    {!isYakView && (
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label className="form-label" style={{ fontWeight: 700 }}>멤버십 고유 키 (필수)</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    placeholder="전용 키 입력"
                                    value={membershipKey}
                                    onChange={(e) => setMembershipKey(e.target.value)}
                                    style={{ paddingLeft: '3rem', height: '54px' }}
                                />
                                <CreditCard size={18} color="#94a3b8" style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)' }} />
                            </div>
                        </div>
                    )}

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label className="form-label" style={{ fontWeight: 700 }}>배송 주소 (필수)</label>
                        <div style={{ position: 'relative' }}>
                            <textarea
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="상세 주소를 입력하세요"
                                style={{
                                    paddingLeft: '3rem',
                                    minHeight: '100px',
                                    paddingTop: '1.1rem',
                                    width: '100%',
                                    borderRadius: '16px',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '0.95rem'
                                }}
                            />
                            <MapPin size={18} color="#94a3b8" style={{ position: 'absolute', left: '1.2rem', top: '1.3rem' }} />
                        </div>
                    </div>

                    {/* Receipt Section */}
                    <div style={{ padding: '1.4rem', background: '#f8fafc', borderRadius: '18px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                        <label className="form-label" style={{ marginBottom: '1rem', display: 'block', fontWeight: 700 }}>📑 증빙 서류 신청</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '0.75rem' }}>
                            <select value={receiptType} onChange={(e) => setReceiptType(e.target.value)} style={{ height: '54px' }}>
                                <option value="현금영수증">현금영수증</option>
                                <option value="세금계산서">세금계산서</option>
                            </select>
                            <input
                                type="text"
                                placeholder={receiptType === '세금계산서' ? '사업자번호' : '휴대폰번호'}
                                value={bizNumber}
                                onChange={(e) => setBizNumber(e.target.value)}
                                style={{ height: '54px' }}
                            />
                        </div>
                    </div>

                    {totalOrderPrice > 0 && (
                        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '1.5rem', borderRadius: '18px', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 800, color: '#166534' }}>결제 예정 금액</span>
                            <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#15803d' }}>{totalOrderPrice.toLocaleString()}원</span>
                        </div>
                    )}

                    <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                        <p style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 700 }}>
                            ⚠️ 카드 결제 불가 (계좌 이체 전용)
                        </p>
                    </div>

                    {/* Big Action Button */}
                    <div style={{ position: 'relative' }}>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            style={{
                                height: '72px',
                                fontSize: '1.3rem',
                                background: isCartEmpty
                                    ? '#e2e8f0'
                                    : 'linear-gradient(135deg, #14b8a6, #0d9488)',
                                color: isCartEmpty ? '#94a3b8' : '#fff',
                                border: 'none',
                                borderRadius: '18px',
                                fontWeight: 900,
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '12px',
                                cursor: (isSubmitting || isCartEmpty) ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: isCartEmpty ? 'none' : '0 12px 24px -6px rgba(13, 148, 136, 0.4)',
                                transform: isSubmitting ? 'scale(0.98)' : 'none',
                                pointerEvents: 'auto'
                            }}
                            disabled={isSubmitting || isCartEmpty}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="animate-spin" size={26} />
                                    주문 처리 중입니다...
                                </>
                            ) : (
                                isCartEmpty ? '상품을 장바구니에 담아주세요' : '주문 완료하기 (송금 후 클릭)'
                            )}
                        </button>
                        <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                            클릭 후 잠시만 기다려주세요 (약 1-2초 내 완료)
                        </p>
                    </div>
                </div>
            </div>

            {/* Success Modal */}
            {showKakaoModal && (
                <div onClick={() => { setShowKakaoModal(false); resetForm(); }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1rem' }}>
                    <div className="card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', width: '100%', padding: '3rem', textAlign: 'center', background: '#fff', borderRadius: '32px', boxShadow: '0 30px 60px -12px rgba(0,0,0,0.5)' }}>
                        <div style={{ background: '#F7E600', padding: '1.4rem', borderRadius: '20px', marginBottom: '1.5rem', fontWeight: 900, color: '#3A1D1D', fontSize: '1.2rem' }}>알림톡 전송 완료</div>
                        <h3 style={{ fontSize: '1.75rem', marginBottom: '1rem', fontWeight: 950 }}>주문이 완료되었습니다!</h3>
                        <p style={{ color: '#475569', marginBottom: '2rem', fontWeight: 500 }}>담당자가 입금 확인 후 즉시 배송을 시작합니다.</p>

                        <div style={{ background: '#f1f5f9', padding: '1.5rem', borderRadius: '18px', marginBottom: '2.5rem', border: '1px solid #e2e8f0' }}>
                            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.75rem', fontWeight: 700 }}>나의 주문번호</p>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                                <span style={{ fontWeight: 950, fontSize: '1.4rem', color: '#0f172a' }}>{generatedOrderNo}</span>
                                <button onClick={handleCopyOrderNo} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copySuccess ? '#22c55e' : '#64748b' }}>
                                    {copySuccess ? <Check size={24} /> : <Copy size={24} />}
                                </button>
                            </div>
                        </div>

                        <button
                            className="btn w-100"
                            style={{ background: '#0f172a', color: '#fff', border: 'none', height: '64px', borderRadius: '18px', fontWeight: 900, fontSize: '1.2rem' }}
                            onClick={() => { setShowKakaoModal(false); resetForm(); }}
                        >
                            확인 후 닫기
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MembershipOrder;
