import React, { useState, useEffect } from 'react';
import { Package, User, Phone, MapPin, CreditCard, ChevronRight, Hash, Copy, Check, Plus, Trash2, ShoppingCart, Loader2, AlertCircle } from 'lucide-react';
import { sendAlimtalk } from '../services/alimtalkService';

// Global error catcher for legacy browsers / weird environments
if (typeof window !== 'undefined') {
    window.onerror = function (msg, url, lineNo, columnNo, error) {
        alert("CRITICAL ERROR captured by system: " + msg + " (Line: " + lineNo + ")");
        return false;
    };
    window.onunhandledrejection = function (event) {
        alert("ASYNC ERROR captured by system: " + event.reason);
    };
}

const MembershipOrder = ({ viewType, products = [], onAddOrder, memberships = [] }) => {
    const isYakView = viewType === 'yak_order';
    const categoryFilter = isYakView ? 'yak' : 'union';
    const filteredProducts = (products || []).filter(p => !p.category || p.category === categoryFilter);

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

    // Internal debug log to show on screen
    const [debugLogs, setDebugLogs] = useState([]);
    const addLog = (msg) => {
        console.log(msg);
        setDebugLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 5));
    };

    useEffect(() => {
        addLog("v1530: Order System loaded (" + (memberships?.length || 0) + " members found)");
    }, []);

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

    const addToCart = (e) => {
        if (e) e.preventDefault();
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
        addLog("Item added to cart: " + product.name);
    };

    const removeFromCart = (id) => {
        setCartItems(prev => prev.filter(item => item.id !== id));
    };

    const totalOrderPrice = cartItems.reduce((sum, item) => sum + item.total, 0);

    const handleSubmit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();

        // ULTIMATE CLICK DETECTION
        addLog("handleSubmit triggered!");

        try {
            if (cartItems.length === 0) {
                alert('장바구니가 비어있습니다. 상품을 먼저 담아주세요.');
                return;
            }

            const cleanRecipient = recipient?.trim();
            const cleanPhone = phone?.trim();
            const cleanAddress = address?.trim();
            const cleanKey = membershipKey?.trim();

            if (!cleanRecipient || !cleanPhone || !cleanAddress || (!isYakView && !cleanKey)) {
                alert('모든 필수 정보를 입력해주세요.');
                return;
            }

            if (!isYakView) {
                addLog("Validating membership for: " + cleanKey);
                const enteredKeyLower = cleanKey.toLowerCase();
                // Extremely safe search
                const foundMembership = (memberships || []).find(m => {
                    const mk = m?.membershipKey;
                    return mk && typeof mk === 'string' && mk.trim().toLowerCase() === enteredKeyLower;
                });

                if (!foundMembership) {
                    alert(`유효하지 않은 멤버십 키입니다. 입력하신 [${membershipKey}]와 일치하는 회원을 찾을 수 없습니다.`);
                    addLog("Validation failed: key not found");
                    return;
                }
                addLog("Validation success: " + foundMembership.name);
            }

            const brandPrefix = isYakView ? 'YAK' : 'UNM';
            const orderId = `${brandPrefix}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

            setIsSubmitting(true);
            setGeneratedOrderNo(orderId);
            addLog("Processing order: " + orderId);

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

            // Call parent function safely
            if (typeof onAddOrder === 'function') {
                onAddOrder(newOrder);
                addLog("Local order saved.");
            }

            // Alimtalk logic - Even if it hangs/fails, we want to finish
            addLog("Sending notification via Solapi...");
            const result = await sendAlimtalk({
                receiver: cleanPhone,
                name: cleanRecipient,
                productName: orderItemsText.length > 25 ? `${orderItemsText.slice(0, 22)}...` : orderItemsText,
                quantity: totalQty,
                totalPrice: totalOrderPrice,
                orderNumber: orderId,
                brand: isYakView ? 'YAK' : 'UNM'
            }).catch(e => {
                addLog("Solapi error caught: " + e.message);
                return { success: false, error: e.message };
            });

            if (result.success) {
                addLog("Alimtalk sent successfully.");
                setShowKakaoModal(true);
            } else {
                addLog("Alimtalk error: " + result.error);
                alert(`알림톡 발송 중 지연이 발생했습니다. 주문 내역은 정상 기록되었습니다.\n오류내용: ${result.error}`);
                setShowKakaoModal(true);
            }

        } catch (err) {
            addLog("CRITICAL CATCH: " + err.message);
            alert("처리 중 예기치 못한 오류가 발생했습니다: " + err.message);
        } finally {
            setIsSubmitting(false);
            addLog("Submission state cleared.");
        }
    };

    const isCartEmpty = cartItems.length === 0;

    return (
        <div className="membership-order-container" style={{ padding: '10px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>

            {/* Removed visual debug log based on user preference */}

            <div className="card shadow-lg p-4 p-md-5 border-0" style={{ borderRadius: '24px', background: '#fff', marginBottom: '2rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', fontWeight: 800 }}>
                        {isYakView ? '약술형 논술 주문' : '유니온 멤버십 주문'}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>상품을 담은 후 하단 버튼을 눌러주세요.</p>
                </div>

                {/* Product Section */}
                <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '20px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label className="form-label" style={{ fontWeight: 700 }}>상품 선택</label>
                        <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: '12px', border: '1px solid #cbd5e1', padding: '0 1.2rem', height: '54px' }}>
                            <Package size={18} color="#94a3b8" style={{ flexShrink: 0 }} />
                            <select
                                value={selectedProductId}
                                onChange={(e) => setSelectedProductId(e.target.value)}
                                style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', marginLeft: '0.75rem', fontSize: '1rem', padding: 0, minWidth: 0 }}
                            >
                                <option value="">상품을 선택하세요</option>
                                {filteredProducts.map(p => {
                                    const dPrice = Math.floor(p.price * (1 - (p.discount || 0) / 100));
                                    return (
                                        <option key={p.id} value={p.id}>
                                            {p.name} {p.discount > 0 ? `(정가 ${p.price.toLocaleString()}원 → ${p.discount}% 할인 적용: ${dPrice.toLocaleString()}원)` : `(${p.price.toLocaleString()}원)`}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                        <div style={{ flex: 1 }}>
                            <label className="form-label" style={{ fontWeight: 700 }}>수량</label>
                            <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: '12px', border: '1px solid #cbd5e1', padding: '0 1.2rem', height: '54px' }}>
                                <Hash size={18} color="#94a3b8" style={{ flexShrink: 0 }} />
                                <input
                                    type="number"
                                    min="1"
                                    value={quantity}
                                    onChange={(e) => setQuantity(Number(e.target.value))}
                                    style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', marginLeft: '0.75rem', fontSize: '1rem', padding: 0, minWidth: 0 }}
                                />
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={addToCart}
                            style={{
                                height: '54px',
                                borderRadius: '12px',
                                background: '#1e293b',
                                color: '#fff',
                                border: 'none',
                                padding: '0 1.5rem',
                                fontWeight: 800,
                                cursor: 'pointer'
                            }}
                        >
                            <Plus size={18} /> 담기
                        </button>
                    </div>
                </div>

                {/* Cart View */}
                {cartItems.length > 0 && (
                    <div style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#0d9488' }}>
                            <ShoppingCart size={18} />
                            <span style={{ fontWeight: 800 }}>선택된 상품 ({cartItems.length})</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {cartItems.map(item => (
                                <div key={item.id} style={{
                                    padding: '1rem 1.25rem',
                                    background: '#f1f5f9',
                                    borderRadius: '16px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div style={{ textAlign: 'left' }}>
                                        <p style={{ fontWeight: 800, margin: 0, fontSize: '0.9rem' }}>{item.name}</p>
                                        <small>
                                            {item.originalPrice > item.price && (
                                                <span style={{ textDecoration: 'line-through', color: '#94a3b8', marginRight: '6px' }}>
                                                    {item.originalPrice.toLocaleString()}원
                                                </span>
                                            )}
                                            {item.originalPrice > item.price && (
                                                <span style={{ color: '#0ea5e9', fontWeight: 600, marginRight: '4px' }}>
                                                    {Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}% ↓
                                                </span>
                                            )}
                                            {item.price.toLocaleString()}원 × {item.quantity}부
                                        </small>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span style={{ fontWeight: 800 }}>{item.total.toLocaleString()}원</span>
                                        <button onClick={() => removeFromCart(item.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem', marginTop: '1.5rem' }}>
                    <div className="input-group">
                        <label className="form-label" style={{ fontWeight: 700 }}>받는 사람</label>
                        <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: '12px', border: '1px solid #cbd5e1', padding: '0 1.2rem', height: '54px' }}>
                            <User size={18} color="#94a3b8" style={{ flexShrink: 0 }} />
                            <input type="text" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="이름 입력" style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', marginLeft: '0.75rem', fontSize: '1rem', minWidth: 0, padding: 0 }} />
                        </div>
                    </div>
                    <div className="input-group">
                        <label className="form-label" style={{ fontWeight: 700 }}>전화번호</label>
                        <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: '12px', border: '1px solid #cbd5e1', padding: '0 1.2rem', height: '54px' }}>
                            <Phone size={18} color="#94a3b8" style={{ flexShrink: 0 }} />
                            <input type="text" value={phone} onChange={(e) => setPhone(autoHyphen(e.target.value))} maxLength={13} placeholder="010-0000-0000" style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', marginLeft: '0.75rem', fontSize: '1rem', minWidth: 0, padding: 0 }} />
                        </div>
                    </div>
                </div>

                {!isYakView && (
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label className="form-label" style={{ fontWeight: 700 }}>멤버십 고유 키</label>
                        <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: '12px', border: '1px solid #cbd5e1', padding: '0 1.2rem', height: '54px' }}>
                            <CreditCard size={18} color="#94a3b8" style={{ flexShrink: 0 }} />
                            <input type="text" value={membershipKey} onChange={(e) => setMembershipKey(e.target.value)} placeholder="멤버십 키 입력" style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', marginLeft: '0.75rem', fontSize: '1rem', minWidth: 0, padding: 0 }} />
                        </div>
                    </div>
                )}

                <div style={{ marginBottom: '1.5rem' }}>
                    <label className="form-label" style={{ fontWeight: 700 }}>배송 주소</label>
                    <div style={{ display: 'flex', alignItems: 'flex-start', background: '#fff', borderRadius: '12px', border: '1px solid #cbd5e1', padding: '1.2rem', minHeight: '80px' }}>
                        <MapPin size={18} color="#94a3b8" style={{ flexShrink: 0, marginTop: '4px' }} />
                        <textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="상세 주소를 입력하세요" style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', marginLeft: '0.75rem', fontSize: '1rem', minWidth: 0, padding: 0, minHeight: '50px', resize: 'vertical' }} />
                    </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', marginBottom: '1.5rem' }}>
                    <label style={{ fontWeight: 700, marginBottom: '0.75rem', display: 'block' }}>📑 증빙 서류</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <select value={receiptType} onChange={(e) => setReceiptType(e.target.value)} style={{ height: '54px', flex: 1, boxSizing: 'border-box' }}>
                            <option value="현금영수증">현금영수증</option>
                            <option value="세금계산서">세금계산서</option>
                        </select>
                        <input type="text" placeholder="번호 입력" value={bizNumber} onChange={(e) => setBizNumber(e.target.value)} style={{ height: '54px', flex: 2, boxSizing: 'border-box', paddingLeft: '1rem' }} />
                    </div>
                </div>

                {totalOrderPrice > 0 && (
                    <div style={{ background: '#0d9488', padding: '1.5rem', borderRadius: '18px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <span style={{ fontWeight: 800 }}>최종 결제 금액</span>
                        <span style={{ fontSize: '1.5rem', fontWeight: 900 }}>{totalOrderPrice.toLocaleString()}원</span>
                    </div>
                )}

                {/* Final Button with Teal Gradient */}
                <div style={{ position: 'relative' }}>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        style={{
                            height: '74px',
                            fontSize: '1.35rem',
                            background: isCartEmpty
                                ? '#cbd5e1'
                                : 'linear-gradient(135deg, #14b8a6, #0d9488)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '20px',
                            fontWeight: 900,
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            cursor: (isSubmitting || isCartEmpty) ? 'not-allowed' : 'pointer',
                            boxShadow: isCartEmpty ? 'none' : '0 12px 24px -5px rgba(13, 148, 136, 0.5)',
                            transition: 'all 0.2s',
                            opacity: isSubmitting ? 0.7 : 1,
                            zIndex: 10,
                            position: 'relative',
                            pointerEvents: 'auto'
                        }}
                        disabled={isSubmitting || isCartEmpty}
                    >
                        {isSubmitting ? <><Loader2 className="animate-spin" /> 처리 중...</> : (isCartEmpty ? '상품을 담아주세요' : '주문 완료하기 (송금 후 클릭)')}
                    </button>
                    <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem', color: '#64748b' }}>제출 후 1~2초간 기다려주세요.</p>
                </div>
            </div>

            {/* Success Modal */}
            {showKakaoModal && (
                <div onClick={() => { setShowKakaoModal(false); resetForm(); }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
                    <div className="card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', width: '90%', padding: '3rem', textAlign: 'center', background: '#fff', borderRadius: '30px' }}>
                        <div style={{ background: '#F7E600', padding: '1rem', borderRadius: '15px', marginBottom: '1.5rem', fontWeight: 900, fontSize: '1.1rem' }}>알림톡 전송 완료</div>
                        <h3 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '1rem' }}>주문이 완료되었습니다!</h3>
                        <div style={{ background: '#f1f5f9', padding: '1.25rem', borderRadius: '16px', margin: '2rem 0' }}>
                            <p style={{ margin: '0 0 5px 0', fontSize: '0.8rem', color: '#64748b' }}>주문번호</p>
                            <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900 }}>{generatedOrderNo}</p>
                        </div>
                        <button className="btn w-100" style={{ background: '#0f172a', color: '#fff', height: '64px', borderRadius: '18px', fontWeight: 800 }} onClick={() => { setShowKakaoModal(false); resetForm(); }}>확인 완료</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MembershipOrder;
