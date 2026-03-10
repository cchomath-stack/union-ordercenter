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

        setCartItems([...cartItems, newItem]);
        setSelectedProductId('');
        setQuantity(1);
    };

    const removeFromCart = (id) => {
        setCartItems(cartItems.filter(item => item.id !== id));
    };

    const totalOrderPrice = cartItems.reduce((sum, item) => sum + item.total, 0);

    const handleCopyOrderNo = () => {
        navigator.clipboard.writeText(generatedOrderNo);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    const handleSubmit = async () => {
        console.log("handleSubmit triggered via onClick");

        if (cartItems.length === 0) {
            alert('장바구니가 비어있습니다. 상단의 [담기] 버튼을 눌러 상품을 추가해주세요.');
            return;
        }

        if (!recipient || !phone || !address || (!isYakView && !membershipKey.trim())) {
            alert('성함, 전화번호, 주소 등 필수 정보를 모두 입력해주세요.');
            return;
        }

        if (!isYakView) {
            const enteredKey = membershipKey.trim().toLowerCase();
            const validMembership = memberships.find(m => m.membershipKey.toLowerCase().trim() === enteredKey);
            if (!validMembership) {
                alert(`유효하지 않은 멤버십 키입니다. 입력하신 [${membershipKey}]와 일치하는 회원을 찾을 수 없습니다.`);
                return;
            }
        }

        const brandPrefix = isYakView ? 'YAK' : 'UNM';
        const orderNo = `${brandPrefix}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

        setIsSubmitting(true);
        setGeneratedOrderNo(orderNo);

        const orderItemsText = cartItems.map(item => `${item.name} (${item.quantity}부)`).join(', ');
        const totalQty = cartItems.reduce((sum, i) => sum + i.quantity, 0);

        const newOrder = {
            id: orderNo,
            type: brandPrefix,
            customer: recipient,
            phone: phone,
            item: orderItemsText,
            payment_status: '대기',
            delivery_status: '배송전',
            receipt_type: receiptType,
            receipt_status: '발행전',
            biz_number: bizNumber,
            date: new Date().toISOString().slice(0, 19).replace('T', ' '),
            amount: totalOrderPrice,
            quantity: totalQty,
            address: address,
            membershipKey: membershipKey
        };

        console.log("Finalizing order submission:", newOrder);

        // API Call Simulation
        setTimeout(async () => {
            try {
                onAddOrder(newOrder);
                const result = await sendAlimtalk({
                    receiver: phone,
                    name: recipient,
                    productName: orderItemsText.length > 25 ? `${orderItemsText.slice(0, 22)}...` : orderItemsText,
                    quantity: totalQty,
                    totalPrice: totalOrderPrice,
                    orderNumber: orderNo
                });

                if (result.success) {
                    setShowKakaoModal(true);
                } else {
                    alert(`주문은 접수되었으나 알림톡 발송에 실패했습니다: ${result.error}`);
                    setShowKakaoModal(true);
                }
            } catch (err) {
                console.error("Critical order error:", err);
                alert('주문 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
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
                    <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {isYakView ? '약술형 논술 주문' : '유니온 멤버십 주문'}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>상품 선택 후 담기 버튼을 눌러주세요.</p>
                </div>

                {/* Product Selection */}
                <div className="cart-builder" style={{ padding: '1.25rem', background: 'rgba(0, 204, 255, 0.03)', borderRadius: '20px', marginBottom: '1.5rem', border: '1px solid rgba(0, 204, 255, 0.1)' }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label className="form-label" style={{ fontWeight: 700 }}>상품 선택</label>
                        <div style={{ position: 'relative' }}>
                            <select
                                value={selectedProductId}
                                onChange={(e) => setSelectedProductId(e.target.value)}
                                style={{ paddingLeft: '3rem', height: '52px', border: '1px solid #e2e8f0' }}
                            >
                                <option value="">상품을 선택하세요</option>
                                {filteredProducts.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} ({p.price.toLocaleString()}원)</option>
                                ))}
                            </select>
                            <Package size={18} color="#94a3b8" style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)' }} />
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
                                    style={{ paddingLeft: '3rem', height: '52px', border: '1px solid #e2e8f0' }}
                                />
                                <Hash size={18} color="#94a3b8" style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)' }} />
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={addToCart}
                            className="btn"
                            style={{
                                height: '52px',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                background: 'var(--accent-teal)',
                                color: '#fff',
                                border: 'none',
                                padding: '0 1.5rem',
                                fontWeight: 800,
                                boxShadow: '0 4px 12px rgba(0, 242, 254, 0.2)'
                            }}
                        >
                            <Plus size={18} /> 담기
                        </button>
                    </div>
                </div>

                {/* Cart List */}
                {cartItems.length > 0 && (
                    <div style={{ marginBottom: '2rem', animation: 'fadeIn 0.3s ease-out' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--accent-teal)' }}>
                            <ShoppingCart size={18} />
                            <span style={{ fontWeight: 800 }}>선택된 상품 ({cartItems.length})</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {cartItems.map(item => (
                                <div key={item.id} style={{
                                    padding: '1rem 1.25rem',
                                    background: '#f8fafc',
                                    borderRadius: '16px',
                                    border: '1px solid #f1f5f9',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div style={{ textAlign: 'left' }}>
                                        <p style={{ fontWeight: 700, margin: 0, fontSize: '0.95rem', color: '#1e293b' }}>{item.name}</p>
                                        <small style={{ color: '#64748b' }}>{item.price.toLocaleString()}원 × {item.quantity}부</small>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span style={{ fontWeight: 800, color: 'var(--accent-teal)' }}>{item.total.toLocaleString()}원</span>
                                        <button onClick={() => removeFromCart(item.id)} style={{ padding: '0.5rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Form Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div className="input-group">
                        <label className="form-label" style={{ fontWeight: 700 }}>받는 사람 (필수)</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="text"
                                placeholder="성함"
                                value={recipient}
                                onChange={(e) => setRecipient(e.target.value)}
                                style={{ paddingLeft: '3rem', height: '52px' }}
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
                                style={{ paddingLeft: '3rem', height: '52px' }}
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
                                style={{ paddingLeft: '3rem', height: '52px' }}
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
                                minHeight: '90px',
                                paddingTop: '1rem',
                                width: '100%',
                                borderRadius: '14px',
                                border: '1px solid #e2e8f0',
                                fontSize: '0.95rem'
                            }}
                        />
                        <MapPin size={18} color="#94a3b8" style={{ position: 'absolute', left: '1.2rem', top: '1.2rem' }} />
                    </div>
                </div>

                {/* Receipt Section */}
                <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9', marginBottom: '1.5rem' }}>
                    <label className="form-label" style={{ marginBottom: '1rem', display: 'block', fontWeight: 700 }}>📑 증빙 서류 신청</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '0.75rem' }}>
                        <select value={receiptType} onChange={(e) => setReceiptType(e.target.value)} style={{ height: '52px', border: '1px solid #e2e8f0' }}>
                            <option value="현금영수증">현금영수증</option>
                            <option value="세금계산서">세금계산서</option>
                        </select>
                        <input
                            type="text"
                            placeholder={receiptType === '세금계산서' ? '사업자번호' : '휴대폰번호'}
                            value={bizNumber}
                            onChange={(e) => setBizNumber(e.target.value)}
                            style={{ height: '52px', border: '1px solid #e2e8f0' }}
                        />
                    </div>
                </div>

                {totalOrderPrice > 0 && (
                    <div style={{ background: 'rgba(20, 184, 166, 0.05)', border: '1px solid rgba(20, 184, 166, 0.2)', padding: '1.5rem', borderRadius: '16px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 800, color: '#0f172a' }}>최종 결제 금액</span>
                        <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0d9488' }}>{totalOrderPrice.toLocaleString()}원</span>
                    </div>
                )}

                <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                    <p style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                        <AlertCircle size={14} /> 카드 결제 불가 (계좌 이체 전용)
                    </p>
                </div>

                {/* Submission Button */}
                <div style={{ position: 'relative' }}>
                    {isCartEmpty && (
                        <div style={{ textAlign: 'center', marginBottom: '1rem', color: '#64748b', fontSize: '0.85rem', fontWeight: 700, background: '#f1f5f9', padding: '0.75rem', borderRadius: '10px' }}>
                            ⚠️ 상품을 먼저 선택하고 [담기]를 눌러야 주문이 가능합니다.
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="btn btn-teal w-100"
                        style={{
                            height: '68px',
                            fontSize: '1.25rem',
                            background: isCartEmpty
                                ? '#cbd5e1'
                                : 'linear-gradient(135deg, #0d9488, #14b8a6)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '16px',
                            fontWeight: 800,
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            cursor: (isSubmitting || isCartEmpty) ? 'not-allowed' : 'pointer',
                            opacity: isSubmitting ? 0.7 : 1,
                            boxShadow: isCartEmpty ? 'none' : '0 10px 25px -5px rgba(20, 184, 166, 0.4)',
                            transition: 'all 0.2s',
                            pointerEvents: 'auto' // Explicitly allow click events
                        }}
                        disabled={isSubmitting || isCartEmpty}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="animate-spin" size={24} />
                                주문 처리 중...
                            </>
                        ) : (
                            isCartEmpty ? '상품을 담아주세요' : '주문 완료하기'
                        )}
                    </button>
                    {!isSubmitting && !isCartEmpty && (
                        <p style={{ marginTop: '0.75rem', textAlign: 'center', fontSize: '0.8rem', color: '#64748b' }}>
                            클릭 후 1~2초간 기다려주세요.
                        </p>
                    )}
                </div>
            </div>

            {/* Kakao Modal */}
            {showKakaoModal && (
                <div onClick={() => { setShowKakaoModal(false); resetForm(); }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
                    <div className="card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', width: '100%', padding: '2.5rem', textAlign: 'center', background: '#fff', borderRadius: '28px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                        <div style={{ background: '#F7E600', padding: '1.25rem', borderRadius: '18px', marginBottom: '1.5rem', fontWeight: 900, color: '#3A1D1D', fontSize: '1.1rem' }}>알림톡 발송 완료</div>
                        <h3 style={{ fontSize: '1.6rem', marginBottom: '1rem', fontWeight: 900 }}>주문이 완료되었습니다!</h3>
                        <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '0.95rem' }}>입금 확인 후 신속히 배송해 드리겠습니다.</p>

                        <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', marginBottom: '2.5rem', border: '1px solid #e2e8f0' }}>
                            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>주문번호</p>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                                <span style={{ fontWeight: 900, fontSize: '1.2rem', color: '#1e293b' }}>{generatedOrderNo}</span>
                                <button onClick={handleCopyOrderNo} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copySuccess ? '#22c55e' : '#64748b' }}>
                                    {copySuccess ? <Check size={20} /> : <Copy size={20} />}
                                </button>
                            </div>
                        </div>

                        <button
                            className="btn w-100"
                            style={{
                                background: '#1e293b',
                                color: '#fff',
                                border: 'none',
                                height: '60px',
                                borderRadius: '16px',
                                fontWeight: 800,
                                fontSize: '1.1rem'
                            }}
                            onClick={() => { setShowKakaoModal(false); resetForm(); }}
                        >
                            확인 완료
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MembershipOrder;
