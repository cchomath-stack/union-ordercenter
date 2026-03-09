import React from 'react';
import {
    Plus, List, Database, Copy, Check, Filter, User, Users, Package,
    Briefcase, TrendingUp, BarChart3, Search, Phone, CreditCard,
    ChevronRight, ShoppingBag, Calendar, Truck, FileText, X,
    ArrowUpDown, Hash, MoreHorizontal, Trash2, StickyNote, ShieldCheck
} from 'lucide-react';

const AdminPanel = ({
    orders = [], onAddOrder, onUpdateOrder, activeTab, products = [], onUpdateProducts,
    newProductName, setNewProductName, newProductPrice, setNewProductPrice,
    newProductDiscount, setNewProductDiscount,
    editingProductId, setEditingProductId, editPrice, setEditPrice,
    editDiscount, setEditDiscount,
    customer, setCustomer, item, setItem, type, setType, copied, setCopied,
    selectedCustomer, setSelectedCustomer, checklists = {}, setChecklists,
    memos = [], setMemos, members = [], setMembers, memberships = [], setMemberships,
    onDeleteMembership, onUpdateMembership,
    isAuthenticated, setIsAuthenticated,
    onLogout
}) => {
    const [loginPassword, setLoginPassword] = React.useState('');
    const [loginError, setLoginError] = React.useState(false);

    const autoHyphen = (value) => {
        return value
            .replace(/[^0-9]/g, '')
            .replace(/^(\d{0,3})(\d{0,4})(\d{0,4})$/g, "$1-$2-$3")
            .replace(/(\-{1,2})$/g, "");
    };

    const handleLogin = (e) => {
        e.preventDefault();
        if (loginPassword === 'csm17admin') {
            setIsAuthenticated(true);
            setLoginError(false);
        } else {
            setLoginError(true);
        }
    };
    // All states are now passed as props from App.jsx to ensure Hook stability.
    // AdminPanel is now a stateless component.

    const [searchTerm, setSearchTerm] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState('전체');
    const [dateFilter, setDateFilter] = React.useState('전체');

    // Member Management States (Moved to top level to avoid Hook violations)
    // Membership Management States
    const [showAddMembershipForm, setShowAddMembershipForm] = React.useState(false);
    const [newMembershipName, setNewMembershipName] = React.useState('');
    const [newMembershipPhone, setNewMembershipPhone] = React.useState('');
    const [newMembershipKey, setNewMembershipKey] = React.useState('');
    const [membershipType, setMembershipType] = React.useState('X'); // X, R, Y (약술)
    const [editingMembership, setEditingMembership] = React.useState(null);

    // Auto-generate membership key
    React.useEffect(() => {
        if (!newMembershipName.trim()) {
            setNewMembershipKey('');
            return;
        }
        const suffix = membershipType === 'X' ? 'x17' : membershipType === 'R' ? 'r17' : 'y17';
        setNewMembershipKey(`${newMembershipName}${suffix}`);
    }, [newMembershipName, membershipType]);

    // ESC key listener to close modals
    React.useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setSelectedCustomer(null);
                setShowAddMembershipForm(false);
                setEditingMembership(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setSelectedCustomer, setShowAddMembershipForm]);

    const handleAddCheckItem = (customerKey, text) => {
        if (!text.trim()) return;
        setChecklists(prev => ({
            ...prev,
            [customerKey]: [...(prev[customerKey] || []), { id: Date.now(), text, completed: false }]
        }));
    };

    const handleToggleCheckItem = (customerKey, itemId) => {
        setChecklists(prev => ({
            ...prev,
            [customerKey]: prev[customerKey].map(item =>
                item.id === itemId ? { ...item, completed: !item.completed } : item
            )
        }));
    };

    const handleRemoveCheckItem = (customerKey, itemId) => {
        setChecklists(prev => ({
            ...prev,
            [customerKey]: prev[customerKey].filter(item => item.id !== itemId)
        }));
    };

    const generateOrderNumber = (brandType) => {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const timeStr = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `${brandType}-${dateStr}-${timeStr}`;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!customer || !item) return;

        const newOrder = {
            id: generateOrderNumber(type),
            type,
            customer,
            phone: '000-0000-0000', // Default for manual
            item: `${item} (수동)`,
            payment_status: '완료',
            delivery_status: '배송전',
            receipt_type: '없음',
            receipt_status: '-',
            date: new Date().toISOString().slice(0, 19).replace('T', ' '),
            amount: 50000, // Default for manual
            quantity: 1
        };

        onAddOrder(newOrder);
        setCustomer('');
        setItem('');
    };

    const handleCopy = (id) => {
        navigator.clipboard.writeText(id);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const stats = [
        { label: '전체 주문', value: orders.length, icon: Database, color: 'var(--accent-teal)' },
        { label: '전체 매출', value: `${orders.reduce((acc, o) => acc + (Number(o.amount) || 0), 0).toLocaleString()}원`, icon: CreditCard, color: 'var(--accent-purple)' },
        { label: '배송 대기', value: orders.filter(o => o.delivery_status === '배송전').length, icon: Package, color: 'var(--accent-cyan)' }
    ];

    const renderManualOrder = () => {
        return (
            <div className="card" style={{ maxWidth: '600px', margin: '0 auto', border: '1px solid var(--accent-teal)', background: 'var(--bg-glass)' }}>
                <h3 className="flex items-center gap-2 mb-4" style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                    <Plus size={28} color="var(--accent-teal)" strokeWidth={3} /> 신규 수동 주문 생성
                </h3>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="form-label">브랜드 선택</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            {['UNR', 'UNX', 'YAK'].map(b => (
                                <button
                                    key={b}
                                    type="button"
                                    onClick={() => setType(b)}
                                    style={{
                                        padding: '1rem',
                                        borderRadius: '12px',
                                        background: type === b ? 'rgba(0, 242, 254, 0.1)' : 'var(--bg-glass)',
                                        border: type === b ? '2px solid var(--accent-teal)' : '1px solid var(--border-glass)',
                                        color: type === b ? 'var(--accent-teal)' : 'var(--text-secondary)',
                                        fontWeight: 800,
                                        fontSize: '1rem',
                                        transition: '0.2s'
                                    }}
                                >
                                    {b === 'UNR' ? 'Union R' : b === 'UNX' ? 'Union X' : 'Yak-sul'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="form-label">고객명</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={customer}
                                onChange={(e) => setCustomer(e.target.value)}
                                placeholder="성함을 입력하세요"
                                style={{ paddingLeft: '3rem', height: '56px', fontSize: '1.1rem' }}
                            />
                            <User size={22} className="icon-input" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                        </div>
                    </div>
                    <div className="mb-5">
                        <label className="form-label">주문 상품 정보</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={item}
                                onChange={(e) => setItem(e.target.value)}
                                placeholder="상품명 또는 상세 내용을 입력하세요"
                                style={{ paddingLeft: '3rem', height: '56px', fontSize: '1.1rem' }}
                            />
                            <Briefcase size={22} className="icon-input" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                        </div>
                    </div>
                    <button type="submit" className="btn btn-teal w-100 py-4" style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '0.05em' }}>
                        주문 생성 및 주문번호 확정
                    </button>
                    <p className="small color-muted text-center mt-4">
                        * 수동 생성 시 입금 상태는 기본 '완료'로 설정됩니다.
                    </p>
                </form>
            </div>
        );
    };

    const renderOrders = () => {
        return (
            <div className="card p-0 overflow-hidden" style={{ border: '1px solid var(--border-glass)', background: 'var(--bg-card)', borderRadius: '32px' }}>
                <div className="p-4 border-bottom flex items-center justify-between" style={{ display: 'flex', justifyContent: 'space-between', padding: '2.5rem 3rem', borderBottom: '1px solid var(--border-glass)', background: 'var(--bg-glass)' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                            <List className="icon-box" size={30} color="var(--accent-teal)" />
                            <h2 style={{ fontSize: '1.8rem', margin: 0, letterSpacing: '-0.04em', fontWeight: 900 }}>종합 주문 통합 내역</h2>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '1.1rem', letterSpacing: '-0.01em' }}>CSM17의 실시간 주문 현황을 관리합니다.</p>
                    </div>
                    <div className="flex items-center gap-4" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div className="relative" style={{ position: 'relative', width: '250px' }}>
                            <input
                                type="text"
                                placeholder="고객명, 상품명 검색..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="py-2"
                                style={{ height: '44px', marginTop: 0, paddingLeft: '2.8rem', borderRadius: '12px' }}
                            />
                            <Search size={18} className="icon-input" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                        </div>
                        <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            style={{ height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', padding: '0 1rem', color: 'var(--text-secondary)' }}
                        >
                            <option value="전체">기간 (전체)</option>
                            <option value="오늘">오늘</option>
                            <option value="이번달">이번 달</option>
                        </select>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{ height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', padding: '0 1rem', color: 'var(--text-secondary)' }}
                        >
                            <option value="전체">상태 (전체)</option>
                            <option value="대기">결제대기</option>
                            <option value="완료">결제완료</option>
                            <option value="취소">주문취소</option>
                        </select>
                    </div>
                </div>
                <div className="overflow-auto" style={{ maxHeight: '720px', padding: '1rem 1.5rem' }}>
                    <table className="admin-table luxury-table">
                        <thead>
                            <tr>
                                <th style={{ width: '130px' }}>주문일자</th>
                                <th style={{ width: '130px', textAlign: 'center' }}>결제상태</th>
                                <th style={{ width: '140px', textAlign: 'center' }}>배송상태</th>
                                <th style={{ width: '120px' }}>고객명</th>
                                <th style={{ width: 'auto' }}>주문상품</th>
                                <th style={{ width: '130px', textAlign: 'right' }}>금액</th>
                                <th style={{ width: '160px', textAlign: 'center' }}>증빙구분</th>
                                <th style={{ width: '110px', textAlign: 'center' }}>발행</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...orders].filter(order => {
                                const term = searchTerm.toLowerCase();
                                const matchesSearch = (order.customer || '').toLowerCase().includes(term) || (order.item || '').toLowerCase().includes(term);

                                const matchesStatus = statusFilter === '전체' || order.payment_status === statusFilter;

                                let matchesDate = true;
                                if (dateFilter === '오늘') {
                                    const today = new Date().toISOString().slice(0, 10);
                                    matchesDate = order.date && order.date.startsWith(today);
                                } else if (dateFilter === '이번달') {
                                    const thisMonth = new Date().toISOString().slice(0, 7);
                                    matchesDate = order.date && order.date.startsWith(thisMonth);
                                }

                                return matchesSearch && matchesStatus && matchesDate;
                            }).reverse().map((order) => (
                                <tr key={order.id} style={{ transition: '0.2s', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                    <td className="small" style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                                        {order.date ? `${order.date.slice(2, 4)}.${order.date.slice(5, 7)}.${order.date.slice(8, 10)}` : '-'}
                                    </td>
                                    <td>
                                        <select
                                            value={order.payment_status}
                                            onChange={(e) => onUpdateOrder(order.id, { payment_status: e.target.value })}
                                            className={`status-select ${order.payment_status === '대기' ? 'color-yellow' : order.payment_status === '완료' ? 'color-blue' : 'color-red'}`}
                                            style={{
                                                padding: '8px 12px',
                                                fontSize: '0.85rem',
                                                fontWeight: 800,
                                                borderRadius: '10px',
                                                background: 'var(--bg-card)',
                                                border: '2px solid var(--border-glass)',
                                                width: '110px',
                                                height: '40px'
                                            }}
                                        >
                                            <option value="대기">결제대기</option>
                                            <option value="완료">결제완료</option>
                                            <option value="취소">주문취소</option>
                                        </select>
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => onUpdateOrder(order.id, { delivery_status: order.delivery_status === '배송전' ? '배송완료' : '배송전' })}
                                            className={`badge ${order.delivery_status === '배송완료' ? 'badge-teal' : 'badge-gray'}`}
                                            style={{
                                                fontSize: '0.85rem',
                                                padding: '8px 12px',
                                                width: '110px',
                                                textAlign: 'center',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                height: '40px',
                                                gap: '6px',
                                                color: order.delivery_status === '배송완료' ? '#ffffff' : 'var(--text-secondary)',
                                                background: order.delivery_status === '배송완료' ? 'var(--accent-teal)' : 'var(--bg-glass)'
                                            }}
                                        >
                                            {order.delivery_status === '배송완료' ? <Check size={16} /> : <Truck size={16} />}
                                            {order.delivery_status === '배송완료' ? '배송완료' : '배송준비'}
                                        </button>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span className="fw-bold" style={{ fontSize: '0.95rem', whiteSpace: 'nowrap' }}>{order.customer || "미지정"}</span>
                                            {order.phone && order.phone !== "000-0000-0000" && (
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>({order.phone})</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="small" style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                        {order.item}
                                    </td>
                                    <td className="color-teal fw-800" style={{ textAlign: 'right', fontSize: '1rem' }}>
                                        {order.amount?.toLocaleString()}원
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        {order.receipt_type !== '없음' ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                <span className="badge badge-gray" style={{ fontSize: '0.75rem', fontWeight: 700 }}>{order.receipt_type}</span>
                                                {order.biz_number && <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{order.biz_number}</span>}
                                            </div>
                                        ) : <span style={{ opacity: 0.3 }}>-</span>}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        {order.receipt_type !== '없음' ? (
                                            <button
                                                onClick={() => onUpdateOrder(order.id, { receipt_status: order.receipt_status === '발행완료' ? '발행전' : '발행완료' })}
                                                className={`badge ${order.receipt_status === '발행완료' ? 'badge-teal' : 'badge-gray'}`}
                                                style={{
                                                    fontSize: '0.85rem',
                                                    width: '80px',
                                                    padding: '10px 0',
                                                    height: '40px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: order.receipt_status === '발행완료' ? '#ffffff' : 'var(--text-secondary)',
                                                    background: order.receipt_status === '발행완료' ? 'var(--accent-teal)' : 'var(--bg-glass)',
                                                    border: '1px solid var(--border-glass)'
                                                }}
                                            >
                                                {order.receipt_status === '발행완료' ? '발행완료' : '발행전'}
                                            </button>
                                        ) : <span style={{ opacity: 0.3 }}>-</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div >
        );
    };

    const renderMembers = () => {
        // Group orders by customer and phone
        const customerMap = {};
        orders.forEach(order => {
            if (!order.customer) return;
            const key = `${order.customer}_${order.phone}`;
            if (!customerMap[key]) {
                customerMap[key] = {
                    id: key,
                    name: order.customer,
                    phone: order.phone,
                    orderCount: 0,
                    totalAmount: 0,
                    lastOrderDate: order.date
                };
            }
            customerMap[key].orderCount += 1;
            customerMap[key].totalAmount += Number(order.amount) || 0;
            if (order.date > customerMap[key].lastOrderDate) {
                customerMap[key].lastOrderDate = order.date;
            }
        });
        const customerList = Object.values(customerMap);

        const filteredCustomers = customerList.filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone.includes(searchTerm)
        );

        return (
            <div className="card p-0 overflow-hidden" style={{ minHeight: '600px' }}>
                <div className="p-4 border-bottom flex items-center justify-between" style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5rem', borderBottom: '1px solid var(--border-glass)', background: 'var(--bg-panel)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <h3 className="flex items-center gap-2 m-0" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                            <Users size={24} color="var(--accent-teal)" /> 주문자별 보기
                        </h3>
                        <span className="badge badge-teal" style={{ borderRadius: '20px', padding: '4px 12px' }}>Total {customerList.length}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div className="relative" style={{ width: '250px' }}>
                            <input
                                type="text"
                                placeholder="주문자 이름 또는 연락처 검색..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ height: '40px', marginTop: 0, paddingLeft: '2.5rem' }}
                            />
                            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                        </div>
                    </div>
                </div>

                <div className="p-0">
                    <table className="admin-table luxury-table" style={{ borderSpacing: 0 }}>
                        <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <tr>
                                <th style={{ paddingLeft: '2rem' }}>주문자 정보</th>
                                <th style={{ textAlign: 'center' }}>총 주문 횟수</th>
                                <th style={{ textAlign: 'right' }}>총 누적 결제액</th>
                                <th>최근 주문일</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.map((c) => (
                                <tr key={c.id}>
                                    <td style={{ padding: '1.2rem 2rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span className="fw-bold" style={{ fontSize: '1rem' }}>{c.name}</span>
                                            <span className="small color-muted">{c.phone}</span>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span className="badge badge-gray" style={{ borderRadius: '12px' }}>{c.orderCount}건</span>
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--accent-teal)' }}>
                                        {c.totalAmount.toLocaleString()}원
                                    </td>
                                    <td className="small color-muted">{c.lastOrderDate ? c.lastOrderDate.slice(0, 10) : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredCustomers.length === 0 && (
                        <div className="text-center py-5">
                            <Users size={48} className="mb-3" style={{ opacity: 0.2 }} />
                            <p className="color-muted font-bold">주문 내역이 없거나 검색 결과가 없습니다.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderMemberships = () => {

        const handleAddMembership = (e) => {
            e.preventDefault();
            if (!newMembershipName || !newMembershipPhone) return;
            const newM = {
                id: Date.now(),
                name: newMembershipName,
                phone: newMembershipPhone,
                membershipKey: newMembershipKey || `${newMembershipName}x17`,
                type: membershipType,
                joinDate: new Date().toISOString(),
                note: ''
            };
            setMemberships([...memberships, newM]);
            setNewMembershipName('');
            setNewMembershipPhone('');
            setNewMembershipKey('');
            setShowAddMembershipForm(false);
        };

        const filteredMemberships = memberships.filter(m =>
            m?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m?.phone?.includes(searchTerm)
        );

        return (
            <div className="card p-0 overflow-hidden" style={{ minHeight: '600px' }}>
                <div className="p-4 border-bottom flex items-center justify-between" style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5rem', borderBottom: '1px solid var(--border-glass)', background: 'var(--bg-panel)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <h3 className="flex items-center gap-2 m-0" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                            <CreditCard size={24} color="var(--accent-teal)" /> 멤버십 발급 관리
                        </h3>
                        <span className="badge badge-teal" style={{ borderRadius: '20px', padding: '4px 12px' }}>Total {memberships.length}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div className="relative" style={{ width: '250px' }}>
                            <input
                                type="text"
                                placeholder="회원 이름 또는 연락처 검색..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ height: '40px', marginTop: 0, paddingLeft: '2.5rem' }}
                            />
                            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                        </div>
                        <button
                            onClick={() => setShowAddMembershipForm(!showAddMembershipForm)}
                            className="btn btn-teal"
                            style={{ height: '40px', padding: '0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Plus size={18} /> 멤버십 수동 발급
                        </button>
                    </div>
                </div>

                {showAddMembershipForm && (
                    <div className="p-4 border-bottom" style={{ background: 'rgba(0, 242, 254, 0.03)', borderBottom: '1px solid var(--border-glass)' }}>
                        <form onSubmit={handleAddMembership} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 150px', gap: '1rem', alignItems: 'flex-end' }}>
                            <div>
                                <label className="small color-muted mb-2 d-block">가입자명</label>
                                <input type="text" value={newMembershipName} onChange={(e) => setNewMembershipName(e.target.value)} placeholder="실명 입력" style={{ height: '40px' }} />
                            </div>
                            <div>
                                <label className="small color-muted mb-2 d-block">연락처</label>
                                <input
                                    type="text"
                                    value={newMembershipPhone}
                                    onChange={(e) => setNewMembershipPhone(autoHyphen(e.target.value))}
                                    maxLength={13}
                                    placeholder="010-0000-0000"
                                    style={{ height: '40px' }}
                                />
                            </div>
                            <div>
                                <label className="small color-muted mb-2 d-block">멤버십 고유 키 (미입력시 이름+x17 생성)</label>
                                <input type="text" value={newMembershipKey} onChange={(e) => setNewMembershipKey(e.target.value)} placeholder="예: 김성민x17" style={{ height: '40px' }} />
                            </div>
                            <div>
                                <label className="small color-muted mb-2 d-block">종류</label>
                                <select
                                    value={membershipType}
                                    onChange={(e) => setMembershipType(e.target.value)}
                                    style={{ height: '40px', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff', width: '100%', padding: '0 10px' }}
                                >
                                    <option value="X">X멤버십 (x17)</option>
                                    <option value="R">R멤버십 (r17)</option>
                                    <option value="Y">약술학원 (y17)</option>
                                </select>
                            </div>
                            <button type="submit" className="btn btn-teal" style={{ height: '40px', fontWeight: 700 }}>등록 및 발급</button>
                        </form>
                    </div>
                )}

                <div className="p-0">
                    <table className="admin-table luxury-table" style={{ borderSpacing: 0 }}>
                        <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <tr>
                                <th style={{ paddingLeft: '2rem' }}>회원 정보</th>
                                <th>멤버십 키</th>
                                <th>가입일</th>
                                <th>메모/상태</th>
                                <th style={{ textAlign: 'center' }}>상세</th>
                                <th style={{ textAlign: 'center' }}>관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMemberships.map((m) => (
                                <tr key={m.id}>
                                    <td style={{ padding: '1.2rem 2rem' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span className="fw-bold" style={{ fontSize: '1rem' }}>{m.name}</span>
                                            <span className="small color-muted">{m.phone}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge badge-teal" style={{ fontWeight: 800 }}>{m.membershipKey}</span>
                                    </td>
                                    <td className="small color-muted">{m.joinDate}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                            {checklists[`${m?.name}_${m?.phone}`]?.map(item => (
                                                <span key={item.id} className={`badge ${item.completed ? 'badge-teal' : 'badge-gray'}`} style={{ fontSize: '0.6rem' }}>
                                                    {item.text}
                                                </span>
                                            ))}
                                            {(!checklists[`${m?.name}_${m?.phone}`] || checklists[`${m?.name}_${m?.phone}`].length === 0) && (
                                                <span className="small color-muted">-</span>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button
                                            onClick={() => setSelectedCustomer(m)}
                                            className="btn-glass p-2"
                                            style={{ borderRadius: '8px' }}
                                        >
                                            <ChevronRight size={18} />
                                        </button>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                            <button
                                                onClick={() => setEditingMembership(m)}
                                                className="btn-glass"
                                                style={{ padding: '6px 12px', fontSize: '0.85rem', background: 'rgba(255,255,255,0.05)' }}
                                            >
                                                수정
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (confirm('정말 삭제하시겠습니까?')) onDeleteMembership(m.id);
                                                }}
                                                className="btn-glass"
                                                style={{ padding: '6px 12px', fontSize: '0.85rem', background: 'rgba(255, 77, 77, 0.1)', color: '#ff4d4d' }}
                                            >
                                                삭제
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredMemberships.length === 0 && (
                        <div className="text-center py-5">
                            <CreditCard size={48} className="mb-3" style={{ opacity: 0.2 }} />
                            <p className="color-muted font-bold">발급된 멤버십이 없습니다.</p>
                        </div>
                    )}
                </div>

                {/* Customer Modal */}
                {selectedCustomer && (
                    <div className="modal-overlay" onClick={() => setSelectedCustomer(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
                        <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: '450px', padding: 0, border: '1px solid var(--accent-teal)' }}>
                            <div className="p-4 border-bottom flex justify-between items-center" style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-glass)' }}>
                                <h3 className="m-0" style={{ fontSize: '1.1rem' }}>{selectedCustomer.name} 고객 메모</h3>
                                <button onClick={() => setSelectedCustomer(null)} style={{ background: 'none', border: 'none', color: '#fff' }}><X size={20} /></button>
                            </div>
                            <div className="p-4">
                                <div className="mb-4">
                                    <label className="small color-muted mb-2 d-block">새 항목 추가 (Enter)</label>
                                    <input
                                        type="text"
                                        placeholder="상담 완료, 우수 고객 등..."
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                handleAddCheckItem(`${selectedCustomer.name}_${selectedCustomer.phone}`, e.target.value);
                                                e.target.value = '';
                                            }
                                        }}
                                    />
                                </div>
                                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    {checklists[`${selectedCustomer.name}_${selectedCustomer.phone}`]?.map(item => (
                                        <div key={item.id} className="flex items-center justify-between p-2 mb-2 rounded" style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '8px', marginBottom: '0.5rem' }}>
                                            <div className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => handleToggleCheckItem(`${selectedCustomer.name}_${selectedCustomer.phone}`, item.id)}>
                                                <div style={{ width: '18px', height: '18px', border: '2px solid var(--accent-teal)', borderRadius: '4px', background: item.completed ? 'var(--accent-teal)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {item.completed && <Check size={14} color="#000" strokeWidth={4} />}
                                                </div>
                                                <span style={{ fontSize: '0.9rem', textDecoration: item.completed ? 'line-through' : 'none', color: item.completed ? 'var(--text-muted)' : 'var(--text-primary)' }}>{item.text}</span>
                                            </div>
                                            <button onClick={() => handleRemoveCheckItem(`${selectedCustomer.name}_${selectedCustomer.phone}`, item.id)} style={{ background: 'none', border: 'none', color: '#ff6b6b' }}><Trash2 size={16} /></button>
                                        </div>
                                    ))}
                                    {(!checklists[`${selectedCustomer.name}_${selectedCustomer.phone}`] || checklists[`${selectedCustomer.name}_${selectedCustomer.phone}`].length === 0) && (
                                        <p className="small color-muted text-center py-4">등록된 메모가 없습니다.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Membership Edit Modal */}
                {editingMembership && (
                    <div className="modal-overlay" onClick={() => setEditingMembership(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
                        <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: '500px', padding: '2rem', border: '1px solid var(--accent-teal)' }}>
                            <h3 className="mb-4">멤버십 정보 수정</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <label className="small color-muted mb-2 d-block">이름</label>
                                    <input
                                        type="text"
                                        value={editingMembership.name}
                                        onChange={(e) => setEditingMembership({ ...editingMembership, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="small color-muted mb-2 d-block">연락처</label>
                                    <input
                                        type="text"
                                        value={editingMembership.phone}
                                        onChange={(e) => setEditingMembership({ ...editingMembership, phone: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="small color-muted mb-2 d-block">멤버십 고유 키</label>
                                    <input
                                        type="text"
                                        value={editingMembership.membershipKey}
                                        onChange={(e) => setEditingMembership({ ...editingMembership, membershipKey: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="small color-muted mb-2 d-block">메모</label>
                                    <textarea
                                        value={editingMembership.note || ''}
                                        onChange={(e) => setEditingMembership({ ...editingMembership, note: e.target.value })}
                                        style={{ width: '100%', padding: '10px', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: '#fff', minHeight: '80px' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    <button
                                        className="btn btn-teal"
                                        style={{ flex: 1, fontWeight: 700 }}
                                        onClick={() => {
                                            onUpdateMembership(editingMembership.id, editingMembership);
                                            setEditingMembership(null);
                                        }}
                                    >
                                        변경사항 저장
                                    </button>
                                    <button
                                        className="btn-glass"
                                        style={{ flex: 1 }}
                                        onClick={() => setEditingMembership(null)}
                                    >
                                        취소
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderProducts = () => {
        const handleSaveProduct = (id) => {
            const updated = products.map(p => p.id === id ? { ...p, price: Number(editPrice), discount: Number(editDiscount) } : p);
            onUpdateProducts(updated);
            setEditingProductId(null);
        };

        const handleAddProduct = (e) => {
            e.preventDefault();
            if (!newProductName || !newProductPrice) return;
            const newProduct = {
                id: Date.now(),
                name: newProductName,
                price: Number(newProductPrice),
                discount: Number(newProductDiscount) || 0
            };
            onUpdateProducts([...products, newProduct]);
            setNewProductName('');
            setNewProductPrice('');
            setNewProductDiscount('0');
        };

        const handleDeleteProduct = (id) => {
            onUpdateProducts(products.filter(p => p.id !== id));
        };

        return (
            <div className="admin-container" style={{ animation: 'none' }}>
                <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
                    <div className="card p-0 overflow-hidden">
                        <div className="p-4 border-bottom" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-glass)', background: 'var(--bg-glass)' }}>
                            <h3 className="m-0" style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Package size={22} color="var(--accent-teal)" /> 상품 마스터 리스트
                            </h3>
                        </div>
                        <div className="p-4">
                            <table className="admin-table luxury-table">
                                <thead>
                                    <tr>
                                        <th>상품명</th>
                                        <th style={{ textAlign: 'right' }}>보급가</th>
                                        <th style={{ textAlign: 'center' }}>할인율</th>
                                        <th style={{ textAlign: 'right' }}>판매가</th>
                                        <th style={{ textAlign: 'center' }}>관리</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map(p => {
                                        const discountedPrice = p.price - (p.price * (p.discount || 0) / 100);
                                        return (
                                            <tr key={p.id}>
                                                <td className="fw-bold">{p.name}</td>
                                                <td style={{ textAlign: 'right' }}>
                                                    {editingProductId === p.id ? (
                                                        <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} style={{ width: '100px', height: '36px', marginTop: 0, textAlign: 'right' }} />
                                                    ) : (
                                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textDecoration: p.discount > 0 ? 'line-through' : 'none' }}>{p.price.toLocaleString()}원</span>
                                                    )}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    {editingProductId === p.id ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                                            <input type="number" value={editDiscount} onChange={(e) => setEditDiscount(e.target.value)} style={{ width: '60px', height: '36px', marginTop: 0, textAlign: 'center' }} />
                                                            <span style={{ fontSize: '0.8rem' }}>%</span>
                                                        </div>
                                                    ) : (
                                                        <span className={p.discount > 0 ? 'badge badge-teal' : ''} style={{ fontSize: '0.8rem' }}>{p.discount || 0}%</span>
                                                    )}
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <span className="fw-bold color-teal" style={{ fontSize: '1.1rem' }}>{Math.floor(discountedPrice).toLocaleString()}원</span>
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                                        {editingProductId === p.id ? (
                                                            <button onClick={() => handleSaveProduct(p.id)} className="btn btn-teal py-2 px-4" style={{ height: 'auto' }}>저장</button>
                                                        ) : (
                                                            <>
                                                                <button onClick={() => { setEditingProductId(p.id); setEditPrice(p.price); setEditDiscount(p.discount || 0); }} className="btn-glass py-2 px-4" style={{ height: 'auto', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>수정</button>
                                                                <button onClick={() => handleDeleteProduct(p.id)} className="btn-glass py-2 px-4" style={{ height: 'auto', background: 'rgba(255, 77, 77, 0.1)', color: '#ff4d4d', borderRadius: '8px' }}><Trash2 size={16} /></button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="card" style={{ height: 'fit-content', border: '1px solid var(--accent-teal)', background: 'var(--bg-glass)' }}>
                        <h3 className="mb-4" style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Plus size={20} color="var(--accent-teal)" /> 신규 상품 등록
                        </h3>
                        <form onSubmit={handleAddProduct}>
                            <div className="mb-4">
                                <label className="small color-muted mb-2 d-block">상품명</label>
                                <input
                                    type="text"
                                    value={newProductName}
                                    onChange={(e) => setNewProductName(e.target.value)}
                                    placeholder="예: 유니온 R 시즌2"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="small color-muted mb-2 d-block">기본 보급가 (원)</label>
                                <input
                                    type="number"
                                    value={newProductPrice}
                                    onChange={(e) => setNewProductPrice(e.target.value)}
                                    placeholder="150000"
                                />
                            </div>
                            <div className="mb-5">
                                <label className="small color-muted mb-2 d-block">할인율 (%)</label>
                                <input
                                    type="number"
                                    value={newProductDiscount}
                                    onChange={(e) => setNewProductDiscount(e.target.value)}
                                    placeholder="0"
                                />
                            </div>
                            <button type="submit" className="btn btn-teal w-100 py-3" style={{ fontWeight: 800 }}>상품 추가하기</button>
                        </form>
                    </div>
                </div>
            </div>
        );
    };

    const renderMemos = () => {
        const handleAddMemo = (e) => {
            e.preventDefault();
            const text = e.target.memoText.value.trim();
            if (!text) return;
            const newMemo = {
                id: Date.now(),
                text,
                date: new Date().toISOString()
            };
            setMemos([newMemo, ...memos]);
            e.target.memoText.value = '';
        };

        const handleDeleteMemo = (id) => {
            setMemos(memos.filter(m => m.id !== id));
        };

        return (
            <div className="admin-container" style={{ animation: 'none' }}>
                <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem' }}>
                    <div className="card p-0 overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)' }}>
                        <div className="p-4 border-bottom" style={{ padding: '2rem', borderBottom: '1px solid var(--border-glass)', background: 'var(--bg-glass)' }}>
                            <h3 className="m-0" style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 900 }}>
                                <StickyNote size={28} color="var(--accent-teal)" strokeWidth={2.5} /> 전체 공유 메모장
                            </h3>
                            <p className="small color-muted mt-2 mb-0">관리자들끼리 공유할 계좌번호, 아이디어, 공지사항 등을 자유롭게 남기세요.</p>
                        </div>
                        <div className="p-4" style={{ maxHeight: '700px', overflowY: 'auto', padding: '2rem' }}>
                            {memos.length === 0 ? (
                                <div className="text-center py-5" style={{ opacity: 0.5 }}>
                                    <StickyNote size={48} className="mb-3 mx-auto" />
                                    <p>등록된 메모가 없습니다. 우측에서 첫 메모를 작성해보세요!</p>
                                </div>
                            ) : (
                                <div className="memo-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    {[...memos].map(memo => (
                                        <div key={memo.id} className="memo-card luxury-card" style={{
                                            padding: '1.5rem',
                                            background: 'var(--bg-glass)',
                                            border: '1px solid var(--border-glass)',
                                            borderRadius: '20px',
                                            position: 'relative',
                                            transition: '0.3s'
                                        }}>
                                            <button onClick={() => handleDeleteMemo(memo.id)} style={{
                                                position: 'absolute',
                                                top: '1rem',
                                                right: '1rem',
                                                background: 'none',
                                                border: 'none',
                                                color: 'var(--text-muted)',
                                                cursor: 'pointer',
                                                padding: '4px'
                                            }}><Trash2 size={16} /></button>
                                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Calendar size={12} /> {new Date(memo.date).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '0.95rem' }}>{memo.text}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card" style={{ height: 'fit-content', border: '1px solid var(--accent-teal)', background: 'var(--bg-panel)', position: 'sticky', top: '2rem' }}>
                        <h3 className="mb-4" style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
                            <Plus size={20} color="var(--accent-teal)" /> 새 메모 추가
                        </h3>
                        <form onSubmit={handleAddMemo}>
                            <textarea
                                name="memoText"
                                placeholder="관리자들과 공유할 내용을 입력하세요... (예: 기업은행 123-45678-01-012 홍길동)"
                                style={{
                                    width: '100%',
                                    height: '200px',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid var(--border-glass)',
                                    borderRadius: '16px',
                                    padding: '1.5rem',
                                    color: 'white',
                                    fontSize: '1rem',
                                    fontFamily: 'inherit',
                                    resize: 'none',
                                    marginBottom: '1.5rem'
                                }}
                            ></textarea>
                            <button type="submit" className="btn btn-teal w-100 py-3" style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                                메모 등록하기
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    };

    const renderStats = () => {
        // Data Processing for Charts
        const last14Days = [...Array(14)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (13 - i));
            return d.toISOString().slice(0, 10);
        });

        const revenueByDay = last14Days.map(date => {
            return orders
                .filter(o => o.date && o.date.startsWith(date))
                .reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
        });

        const ordersByDay = last14Days.map(date => {
            return orders.filter(o => o.date && o.date.startsWith(date)).length;
        });

        // Brand distribution
        const brandCounts = {
            UNR: orders.filter(o => o.type === 'UNR').length,
            UNX: orders.filter(o => o.type === 'UNX').length,
            YAK: orders.filter(o => o.type === 'YAK').length
        };
        const totalBrandOrders = Object.values(brandCounts).reduce((a, b) => a + b, 0) || 1;

        const maxRevenue = Math.max(...revenueByDay, 100000);
        const maxOrders = Math.max(...ordersByDay, 5);

        // SVG Chart Helpers
        const getPolylinePoints = (data, width, height, maxValue) => {
            return data.map((val, i) => {
                const x = (i / (data.length - 1)) * width;
                const y = height - (val / maxValue) * height;
                return `${x},${y}`;
            }).join(' ');
        };

        return (
            <div className="stats-dashboard" style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                {/* Main Revenue Chart */}
                <div className="card luxury-card" style={{ padding: '2.5rem', background: 'var(--bg-panel)', border: '1px solid var(--border-glass)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
                        <div>
                            <h3 className="flex items-center gap-2 m-0" style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
                                <TrendingUp size={24} color="var(--accent-teal)" /> 최근 14일 매출 추이
                            </h3>
                            <p className="small color-muted mt-1">일별 매출액 변동 현황입니다.</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span className="small color-muted d-block">최고 매출액</span>
                            <span className="fw-900 color-teal" style={{ fontSize: '1.2rem' }}>{Math.max(...revenueByDay).toLocaleString()}원</span>
                        </div>
                    </div>

                    <div style={{ height: '300px', width: '100%', position: 'relative', marginTop: '1rem' }}>
                        <svg width="100%" height="100%" viewBox="0 0 1000 300" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                            {/* Grid Lines */}
                            {[0, 1, 2, 3].map(i => (
                                <line key={i} x1="0" y1={i * 100} x2="1000" y2={i * 100} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                            ))}

                            {/* Area Fill */}
                            <polyline
                                points={`0,300 ${getPolylinePoints(revenueByDay, 1000, 300, maxRevenue)} 1000,300`}
                                fill="url(#revenueGradient)"
                                opacity="0.2"
                            />

                            {/* Line */}
                            <polyline
                                points={getPolylinePoints(revenueByDay, 1000, 300, maxRevenue)}
                                fill="none"
                                stroke="var(--accent-teal)"
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                style={{ filter: 'drop-shadow(0 0 8px var(--accent-teal))' }}
                            />

                            {/* Data Points */}
                            {revenueByDay.map((val, i) => {
                                const x = (i / (revenueByDay.length - 1)) * 1000;
                                const y = 300 - (val / maxRevenue) * 300;
                                return (
                                    <g key={i}>
                                        <circle cx={x} cy={y} r="6" fill="var(--bg-deep)" stroke="var(--accent-teal)" strokeWidth="3" />
                                        {val > 0 && (
                                            <text x={x} y={y - 15} textAnchor="middle" fill="var(--text-secondary)" fontSize="10" fontWeight="bold">
                                                {(val / 10000).toFixed(1)}만
                                            </text>
                                        )}
                                    </g>
                                );
                            })}

                            <defs>
                                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="var(--accent-teal)" />
                                    <stop offset="100%" stopColor="transparent" />
                                </linearGradient>
                            </defs>
                        </svg>

                        {/* X-Axis Labels */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', padding: '0 5px' }}>
                            {last14Days.map((date, i) => (
                                <span key={i} style={{ fontSize: '0.7rem', color: 'var(--text-muted)', transform: 'rotate(-45deg)', transformOrigin: 'top left' }}>
                                    {date.slice(5)}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
                    {/* Brand Mix Donut Chart */}
                    <div className="card luxury-card" style={{ padding: '2.5rem' }}>
                        <h3 className="mb-4" style={{ fontSize: '1.2rem', fontWeight: 800 }}>브랜드별 비율 (건수)</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                            <div style={{ position: 'relative', width: '180px', height: '180px' }}>
                                <svg width="180" height="180" viewBox="0 0 100 100">
                                    {/* Donut Segments Calculations */}
                                    {(() => {
                                        let currentAngle = 0;
                                        const radius = 40;
                                        const center = 50;
                                        const brands = [
                                            { key: 'UNR', color: 'var(--accent-teal)', label: 'Union R' },
                                            { key: 'UNX', color: 'var(--accent-purple)', label: 'Union X' },
                                            { key: 'YAK', color: 'var(--accent-cyan)', label: 'Yak-sul' }
                                        ];

                                        return brands.map((brand, i) => {
                                            const percent = (brandCounts[brand.key] / totalBrandOrders);
                                            const angle = percent * 360;

                                            if (percent === 0) return null;

                                            const x1 = center + radius * Math.cos(Math.PI * currentAngle / 180);
                                            const y1 = center + radius * Math.sin(Math.PI * currentAngle / 180);

                                            currentAngle += angle;

                                            const x2 = center + radius * Math.cos(Math.PI * currentAngle / 180);
                                            const y2 = center + radius * Math.sin(Math.PI * currentAngle / 180);

                                            const largeArcFlag = angle > 180 ? 1 : 0;

                                            return (
                                                <path
                                                    key={i}
                                                    d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`}
                                                    fill="none"
                                                    stroke={brand.color}
                                                    strokeWidth="12"
                                                    strokeLinecap="round"
                                                />
                                            );
                                        });
                                    })()}
                                </svg>
                                <div style={{ position: 'absolute', top: '0', left: '0', width: '180px', height: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>TOTAL</span>
                                    <span style={{ fontSize: '1.8rem', fontWeight: 900 }}>{orders.length}</span>
                                </div>
                            </div>

                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {[
                                    { label: 'Union R', key: 'UNR', color: 'var(--accent-teal)' },
                                    { label: 'Union X', key: 'UNX', color: 'var(--accent-purple)' },
                                    { label: 'Yak-sul', key: 'YAK', color: 'var(--accent-cyan)' }
                                ].map((b, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: b.color }}></div>
                                            <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{b.label}</span>
                                        </div>
                                        <span style={{ fontWeight: 800 }}>{brandCounts[b.key]}건</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Order Volume Bar Chart */}
                    <div className="card luxury-card" style={{ padding: '2.5rem' }}>
                        <h3 className="mb-4" style={{ fontSize: '1.2rem', fontWeight: 800 }}>일별 주문량 (건수)</h3>
                        <div style={{ height: '180px', display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                            {ordersByDay.map((count, i) => {
                                const height = (count / maxOrders) * 100;
                                return (
                                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                        <div style={{
                                            width: '100%',
                                            height: `${height}%`,
                                            maxHeight: '100%',
                                            background: count > 0 ? 'var(--accent-teal)' : 'rgba(255,255,255,0.05)',
                                            borderRadius: '6px 6px 0 0',
                                            transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            minHeight: count > 0 ? '4px' : '2px',
                                            position: 'relative'
                                        }}>
                                            {count > 0 && <span style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-teal)' }}>{count}</span>}
                                        </div>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', transform: 'rotate(-45deg)', marginTop: '5px' }}>{last14Days[i].slice(8)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderLogin = () => (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-deep)' }}>
            <div className="card luxury-card" style={{ width: '400px', padding: '3rem', border: '1px solid var(--accent-teal)' }}>
                <div className="text-center mb-5">
                    <ShieldCheck size={48} color="var(--accent-teal)" className="mb-3" />
                    <h2 style={{ fontWeight: 900, fontSize: '1.75rem' }}>Admin Access</h2>
                    <p className="color-muted">관리자 암호를 입력해주세요.</p>
                </div>
                <form onSubmit={handleLogin}>
                    <input
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        style={{
                            height: '50px',
                            textAlign: 'center',
                            fontSize: '1.2rem',
                            letterSpacing: '0.5em',
                            border: loginError ? '1px solid #ff6b6b' : '1px solid var(--border-glass)'
                        }}
                    />
                    {loginError && <p style={{ color: '#ff6b6b', fontSize: '0.8rem', marginTop: '0.5rem', textAlign: 'center' }}>암호가 일치하지 않습니다.</p>}
                    <button type="submit" className="btn btn-teal w-100 py-3 mt-4" style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                        서버 접속 인증
                    </button>
                </form>
            </div>
        </div>
    );

    if (!isAuthenticated) return renderLogin();

    return (
        <div className="admin-container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
            <div className="mb-5 flex items-end justify-between" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                        {activeTab === 'orders' ? '종합 주문 관리' :
                            activeTab === 'manual_order' ? '수동 주문 등록' :
                                activeTab === 'customers' ? '정회원 명부 관리' :
                                    activeTab === 'products' ? '상품 마스터 설정' :
                                        activeTab === 'memos' ? '기타 메모장' : '실적 통계 분석'}
                    </h2>
                    <div className="flex items-center gap-2 color-muted" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-teal)', boxShadow: '0 0 10px var(--accent-teal)' }}></div>
                        CSM17 Intelligence Admin v1.6
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <span className="small color-muted d-block mb-1">Last Sync: Today 02:45 AM</span>
                    <span className="badge badge-teal" style={{ padding: '6px 12px', borderRadius: '20px' }}>Admin Verified</span>
                </div>
            </div>

            {/* Stats Summary Area */}
            <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', marginBottom: '4rem' }}>
                {stats.map((s, i) => (
                    <div key={i} className="card flex items-center justify-between luxury-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2.5rem 3rem', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)' }}>
                        <div>
                            <span className="small color-muted mb-2 d-block" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</span>
                            <h3 className="m-0" style={{ fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-0.02em', wordBreak: 'keep-all' }}>{s.value}</h3>
                        </div>
                        <div className="icon-box" style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '24px', border: '1px solid var(--border-glass)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}>
                            <s.icon size={36} color={s.color} />
                        </div>
                    </div>
                ))}
            </div>

            {activeTab === 'orders' && renderOrders()}
            {activeTab === 'manual_order' && renderManualOrder()}
            {activeTab === 'customers' && renderMembers()}
            {activeTab === 'memberships' && renderMemberships()}
            {activeTab === 'products' && renderProducts()}
            {activeTab === 'memos' && renderMemos()}
            {activeTab === 'stats' && renderStats()}
        </div>
    );
};

export default AdminPanel;
