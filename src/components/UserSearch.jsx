import React, { useState } from 'react';
import { Search, Package, MapPin, Calendar, Receipt, User, Clock, ArrowRight } from 'lucide-react';

const UserSearch = ({ orders }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [result, setResult] = useState(null);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = () => {
        if (!searchQuery.trim()) return;
        const found = orders.find(o => o.id.toLowerCase() === searchQuery.trim().toLowerCase());
        setResult(found || null);
        setHasSearched(true);
    };

    return (
        <div className="container" style={{ maxWidth: '800px' }}>
            <div className="card" style={{ textAlign: 'center', padding: '4rem 3rem' }}>
                <div style={{
                    display: 'inline-flex',
                    padding: '16px',
                    background: 'var(--bg-glass)',
                    borderRadius: '24px',
                    marginBottom: '2rem',
                    border: '1px solid var(--border-glass)',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.03)'
                }}>
                    <Search size={36} color="var(--accent-teal)" />
                </div>
                <h1 style={{ marginBottom: '1.25rem', fontSize: 'clamp(2rem, 8vw, 3.2rem)', letterSpacing: '-0.05em' }}>주문번호 조회</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '3.5rem', fontSize: '1.15rem', lineHeight: 1.8 }}>
                    발급받으신 주문번호 (예: UNR-2026...)를 입력하여<br />실시간 주문 상태를 확인하실 수 있습니다.
                </p>

                <div className="search-box-container" style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        placeholder="주문번호를 입력하세요"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ margin: 0, paddingLeft: '1.5rem', height: '60px', fontSize: '1.1rem', flex: '1 1 300px' }}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button onClick={handleSearch} className="btn-primary" style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        height: '60px',
                        padding: '0 2rem',
                        color: '#ffffff',
                        background: 'linear-gradient(135deg, var(--accent-teal), var(--accent-cyan))',
                        fontWeight: 900,
                        flex: '1 1 auto'
                    }}>
                        조회하기 <ArrowRight size={20} />
                    </button>
                </div>

                {hasSearched && (
                    <div style={{
                        marginTop: '4rem',
                        textAlign: 'left',
                        borderTop: '1px solid var(--border-glass)',
                        paddingTop: '3rem',
                        animation: 'fadeIn 0.5s ease-out'
                    }}>
                        {result ? (
                            <div className="order-detail" style={{ borderRadius: '24px', background: 'var(--bg-glass)', padding: '2.5rem', border: '1px solid var(--border-glass)' }}>
                                <div className="order-header-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
                                    <div>
                                        <div style={{ padding: '6px 14px', background: 'var(--accent-teal)', color: '#fff', borderRadius: '10px', display: 'inline-block', marginBottom: '0.75rem', fontSize: '0.8rem', fontWeight: 800 }}>
                                            조회 성공
                                        </div>
                                        <h2 style={{ fontSize: '1.8rem', letterSpacing: '-0.05em', margin: 0, wordBreak: 'keep-all' }}>{result.item}</h2>
                                    </div>
                                    <div style={{ textAlign: 'right', minWidth: '120px' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                            <span className={`badge ${result.payment_status === '완료' ? 'badge-teal' : result.payment_status === '대기' ? 'badge-orange' : 'badge-red'}`} style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
                                                {result.payment_status === '대기' ? '입금대기' : result.payment_status === '완료' ? '입금완료' : '주문취소'}
                                            </span>
                                            <span className={`badge ${result.delivery_status === '배송완료' ? 'badge-teal' : 'badge-gray'}`} style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
                                                {result.delivery_status}
                                            </span>
                                        </div>
                                        <p style={{ color: 'var(--text-muted)', fontFamily: 'monospace', margin: 0, fontSize: '0.85rem' }}>#{result.id}</p>
                                    </div>
                                </div>

                                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                                    {[
                                        { label: '주문자', value: result.customer, icon: <User size={20} /> },
                                        { label: '결제금액', value: (result.amount?.toLocaleString() || '0') + '원', icon: <Receipt size={20} /> },
                                        { label: '주문일시', value: result.date, icon: <Calendar size={20} /> },
                                        { label: '증빙구분', value: result.receipt_type, icon: <MapPin size={20} /> }
                                    ].map((info, idx) => (
                                        <div key={idx} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                            <div style={{ color: 'var(--accent-teal)', padding: '0.6rem', background: 'var(--bg-card)', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', border: '1px solid var(--border-glass)', flexShrink: 0 }}>
                                                {info.icon}
                                            </div>
                                            <div style={{ overflow: 'hidden' }}>
                                                <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.15rem', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{info.label}</small>
                                                <p style={{ fontWeight: 800, fontSize: '1rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{info.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{
                                    marginTop: '3rem',
                                    padding: '1.25rem 2rem',
                                    background: 'var(--bg-card)',
                                    borderRadius: '16px',
                                    border: '1px solid var(--border-glass)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    boxShadow: '0 4px 6px rgba(0,0,0,0.02)'
                                }}>
                                    <Clock size={18} color="var(--accent-teal)" />
                                    <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', margin: 0, fontWeight: 500 }}>
                                        상세 배송 정보는 카카오 채널을 통해 실시간으로 발송됩니다.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                                <div style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                                    <Clock size={48} style={{ opacity: 0.3 }} />
                                </div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                                    일치하는 주문 정보가 없습니다.<br />주문번호를 다시 확인해 주세요.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default UserSearch;
