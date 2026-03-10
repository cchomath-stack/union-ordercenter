import React, { useState, useEffect } from 'react';
import { Package, User, Phone, MapPin, CreditCard, ChevronRight, Hash, Copy, Check, Plus, Trash2, ShoppingCart, Loader2 } from 'lucide-react';
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
            return null;
        }
        const product = filteredProducts.find(p => p.id === Number(selectedProductId));
        if (!product) return null;

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

        const updatedCart = [...cartItems, newItem];
        setCartItems(updatedCart);
        setSelectedProductId('');
        setQuantity(1);
        return updatedCart;
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

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        console.log("Submit attempt started...");

        // Smart Cart Logic: If cart is empty but a product is selected, auto-add it.
        let finalCart = [...cartItems];
        if (finalCart.length === 0) {
            if (selectedProductId) {
                console.log("Auto-adding selected product to cart...");
                const product = filteredProducts.find(p => p.id === Number(selectedProductId));
                if (product) {
                    const discountedPrice = Math.floor(product.price * (1 - (product.discount || 0) / 100));
                    finalCart = [{
                        id: Date.now(),
                        productId: product.id,
                        name: product.name,
                        originalPrice: product.price,
                        price: discountedPrice,
                        quantity: quantity,
                        total: discountedPrice * quantity
                    }];
                    // Update state too for feedback
                    setCartItems(finalCart);
                    setSelectedProductId('');
                }
            }
        }

        if (finalCart.length === 0) {
            alert('장바구니가 비어있습니다. 상품을 선택하고 담기 버튼을 누르거나 상품을 선택해주세요.');
            return;
        }

        if (!recipient || !phone || !address || (!isYakView && !membershipKey.trim())) {
            alert('성함, 전화번호, 주소 등 모든 필수 정보를 입력해주세요.');
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

        setGeneratedOrderNo(orderNo);
        setIsSubmitting(true);
        const orderItemsText = finalCart.map(item => `${item.name} (${item.quantity}부)`).join(', ');
        const totalAmount = finalCart.reduce((sum, item) => sum + item.total, 0);
        const totalQty = finalCart.reduce((sum, i) => sum + i.quantity, 0);

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
            amount: totalAmount,
            quantity: totalQty,
            address: address,
            membershipKey: membershipKey
        };

        console.log("Submitting finalized order:", newOrder);

        // API Call simulation
        setTimeout(async () => {
            try {
                console.log("Executing onAddOrder...");
                onAddOrder(newOrder);

                console.log("Calling sendAlimtalk API...");
                const result = await sendAlimtalk({
                    receiver: phone,
                    name: recipient,
                    productName: orderItemsText.length > 25 ? `${orderItemsText.slice(0, 22)}...` : orderItemsText,
                    quantity: totalQty,
                    totalPrice: totalAmount,
                    orderNumber: orderNo
                });

                if (result.success) {
                    console.log("Order and Alimtalk success!");
                    setShowKakaoModal(true);
                } else {
                    console.error("Alimtalk failed:", result.error);
                    alert(`주문은 접수되었으나, 알림톡 발송에 실패했습니다.\n사유: ${result.error}`);
                    setShowKakaoModal(true); // Still show modal because order is technically in DB
                }
            } catch (err) {
                console.error("Critical submission error:", err);
                alert('주문 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
            } finally {
                setIsSubmitting(false);
            }
        }, 800);
    };

    return (
        <div className="membership-order-container" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <div className="card shadow-lg p-5 border-0" style={{ borderRadius: '24px', background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)', marginBottom: '2rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
                        {isYakView ? '약술형 논술 주문하기' : '유니온 멤버십 주문'}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)' }}>상품을 선택해 장바구니에 담아주세요.</p>
                </div>

                {/* Product Selection */}
                <div className="cart-builder" style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.02)', borderRadius: '20px', marginBottom: '2rem', border: '1px solid var(--border-glass)' }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label className="form-label">상품 선택</label>
                        <div style={{ position: 'relative' }}>
                            <select
                                value={selectedProductId}
                                onChange={(e) => setSelectedProductId(e.target.value)}
                                style={{ paddingLeft: '3rem' }}
                            >
                                <option value="">상품을 선택하세요</option>
                                {filteredProducts.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} ({p.price.toLocaleString()}원)</option>
                                ))}
                            </select>
                            <Package size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                        <div style={{ flex: 1 }}>
                            <label className="form-label">수량</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="number"
                                    min="1"
                                    value={quantity}
                                    onChange={(e) => setQuantity(Number(e.target.value))}
                                    style={{ paddingLeft: '3rem' }}
                                />
                                <Hash size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                            </div>
                        </div>
                        <button
                            onClick={addToCart}
                            className="btn btn-primary"
                            style={{ height: '52px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg, var(--accent-teal), var(--accent-cyan))', color: '#fff', border: 'none', padding: '0 1.5rem' }}
                        >
                            <Plus size={18} /> 담기
                        </button>
                    </div>
                </div>

                {/* Cart List */}
                {cartItems.length > 0 && (
                    <div style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--accent-teal)' }}>
                            <ShoppingCart size={18} />
                            <span style={{ fontWeight: 800 }}>선택된 상품 ({cartItems.length})</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {cartItems.map(item => (
                                <div key={item.id} style={{
                                    padding: '1rem 1.25rem',
                                    background: '#fff',
                                    borderRadius: '16px',
                                    border: '1px solid var(--border-glass)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
                                }}>
                                    <div style={{ textAlign: 'left' }}>
                                        <p style={{ fontWeight: 700, margin: 0, fontSize: '0.95rem' }}>{item.name}</p>
                                        <small style={{ color: 'var(--text-muted)' }}>{item.price.toLocaleString()}원 × {item.quantity}부</small>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span style={{ fontWeight: 800, color: 'var(--accent-teal)' }}>{item.total.toLocaleString()}원</span>
                                        <button onClick={() => removeFromCart(item.id)} style={{ padding: '0.5rem', color: '#ff4d4d', background: 'none', border: 'none' }}>
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div className="input-group">
                            <label className="form-label">받는 사람 (필수)</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    placeholder="성함"
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
                                    value={phone}
                                    onChange={(e) => setPhone(autoHyphen(e.target.value))}
                                    placeholder="010-0000-0000"
                                    maxLength={13}
                                    style={{ paddingLeft: '3rem' }}
                                    disabled={isSubmitting}
                                />
                                <Phone size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                            </div>
                        </div>
                    </div>

                    {!isYakView && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label className="form-label">멤버십 고유 키 (필수)</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    placeholder="전용 키 입력"
                                    value={membershipKey}
                                    onChange={(e) => setMembershipKey(e.target.value)}
                                    style={{ paddingLeft: '3rem' }}
                                    disabled={isSubmitting}
                                />
                                <CreditCard size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                            </div>
                        </div>
                    )}

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label className="form-label">배송 주소 (필수)</label>
                        <div style={{ position: 'relative' }}>
                            <textarea
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="상세 주소를 입력하세요"
                                style={{ paddingLeft: '3rem', minHeight: '80px', paddingTop: '1rem', width: '100%', borderRadius: '14px', border: '1px solid var(--border-glass)', background: 'var(--bg-glass)' }}
                                disabled={isSubmitting}
                            />
                            <MapPin size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '1.2rem' }} />
                        </div>
                    </div>

                    {/* Receipt Section */}
                    <div style={{ padding: '1.25rem', background: 'rgba(0,0,0,0.02)', borderRadius: '16px', border: '1px solid var(--border-glass)', marginBottom: '2rem' }}>
                        <label className="form-label" style={{ marginBottom: '1rem', display: 'block' }}>📑 증빙 서류 신청</label>
                        <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <select value={receiptType} onChange={(e) => setReceiptType(e.target.value)} disabled={isSubmitting}>
                                <option value="현금영수증">현금영수증</option>
                                <option value="세금계산서">세금계산서</option>
                            </select>
                            <input
                                type="text"
                                placeholder={receiptType === '세금계산서' ? '사업자번호' : '휴대폰번호'}
                                value={bizNumber}
                                onChange={(e) => setBizNumber(e.target.value)}
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>

                    {(totalOrderPrice > 0 || selectedProductId) && (
                        <div style={{ background: 'rgba(0, 242, 254, 0.05)', border: '1px solid rgba(0, 242, 254, 0.2)', padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700 }}>총 결제 예상 금액</span>
                            <span style={{ fontSize: '1.5rem', fontWeight: 950, color: 'var(--accent-teal)' }}>
                                {(cartItems.length > 0 ? totalOrderPrice : (filteredProducts.find(p => p.id === Number(selectedProductId))?.price || 0) * quantity).toLocaleString()}원
                            </span>
                        </div>
                    )}

                    <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                        <p style={{ color: '#ff4d4d', fontSize: '0.9rem', fontWeight: 700 }}>⚠️ 카드 결제 불가 (계좌 이체 전용)</p>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-teal w-100"
                        style={{
                            height: '64px',
                            fontSize: '1.2rem',
                            background: 'linear-gradient(135deg, #0369a1, #0284c7)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '16px',
                            fontWeight: 700,
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            opacity: isSubmitting ? 0.8 : 1
                        }}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="animate-spin" size={24} />
                                처리 중...
                            </>
                        ) : '주문 완료하기'}
                    </button>
                    <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        클릭 후 잠시만 기다려주세요 (약 1-2초 소요)
                    </p>
                </form>
            </div>

            {/* Kakao Modal (Simplified for brevity but functional) */}
            {showKakaoModal && (
                <div onClick={() => { setShowKakaoModal(false); resetForm(); }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
                    <div className="card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px', width: '100%', padding: '2.5rem', textAlign: 'center', background: '#fff', borderRadius: '24px' }}>
                        <div style={{ background: '#F7E600', padding: '1rem', borderRadius: '16px', marginBottom: '1.5rem', fontWeight: 800 }}>알림톡 발송 완료</div>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>주문이 접수되었습니다!</h3>
                        <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '12px', marginBottom: '2rem' }}>
                            <p style={{ fontSize: '0.8rem', color: '#888', margin: '0 0 5px 0' }}>주문번호</p>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <span style={{ fontWeight: 900, fontSize: '1.1rem' }}>{generatedOrderNo}</span>
                                <button onClick={handleCopyOrderNo} style={{ background: 'none', border: 'none' }}>{copySuccess ? <Check size={18} color="#22c55e" /> : <Copy size={18} />}</button>
                            </div>
                        </div>
                        <button className="btn btn-teal w-100" style={{ background: 'linear-gradient(135deg, #0369a1, #0284c7)', color: '#fff', border: 'none', height: '54px' }} onClick={() => { setShowKakaoModal(false); resetForm(); }}>확인 완료</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MembershipOrder;
