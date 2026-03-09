import React, { useState, useEffect } from 'react';
import UserSearch from './components/UserSearch';
import AdminPanel from './components/AdminPanel';
import MembershipOrder from './components/MembershipOrder';
import { Settings, ShieldCheck, List, Users, BarChart3, LogOut, Search, Package, Plus, Sun, Moon, StickyNote, Key } from 'lucide-react';

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('orders'); // orders, manual_order, customers, memberships, stats, products, memos
  const [userView, setUserView] = useState('search'); // search, membership
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('csm17_products');
    if (saved) return JSON.parse(saved);
    return [
      { id: 1, name: '유니온 R (시즌1)', price: 150000, discount: 0 },
      { id: 2, name: '유니온 X (시즌1)', price: 180000, discount: 10 },
      { id: 3, name: '약술형 논술 기본서', price: 32000, discount: 5 }
    ];
  });

  // Admin Panel states moved here for Hook stability
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductDiscount, setNewProductDiscount] = useState('0');
  const [editingProductId, setEditingProductId] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [editDiscount, setEditDiscount] = useState('');
  const [customer, setCustomer] = useState('');
  const [item, setItem] = useState('');
  const [type, setType] = useState('UNR');
  const [copied, setCopied] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [checklists, setChecklists] = useState(() => {
    const saved = localStorage.getItem('csm_checklists');
    return saved ? JSON.parse(saved) : {};
  });
  const [memos, setMemos] = useState(() => {
    const saved = localStorage.getItem('csm_memos');
    return saved ? JSON.parse(saved) : [];
  });
  const [members, setMembers] = useState(() => {
    const saved = localStorage.getItem('csm_members');
    return saved ? JSON.parse(saved) : [];
  });
  const [memberships, setMemberships] = useState(() => {
    const saved = localStorage.getItem('csm_memberships');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: '김성민', phone: '010-1234-5678', membershipKey: '김성민x17', joinDate: '2026-03-08', note: '초기 멤버' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('csm_members', JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem('csm_memberships', JSON.stringify(memberships));
  }, [memberships]);

  // Sync state across multiple tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'csm_memberships' && e.newValue) {
        setMemberships(JSON.parse(e.newValue));
      }
      if (e.key === 'csm17_orders' && e.newValue) {
        setOrders(JSON.parse(e.newValue));
      }
      if (e.key === 'csm17_products' && e.newValue) {
        setProducts(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    localStorage.setItem('csm_checklists', JSON.stringify(checklists));
  }, [checklists]);

  useEffect(() => {
    localStorage.setItem('csm_memos', JSON.stringify(memos));
  }, [memos]);

  // Handle URL routing for direct access to order page
  useEffect(() => {
    const path = window.location.pathname;
    const search = window.location.search;
    if (path.includes('/membership') || path.includes('/order') || search.includes('view=membership')) {
      setUserView('membership');
    }
  }, []);

  const navItemStyle = (isActive) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1.2rem 1.5rem',
    width: '100%',
    borderRadius: '14px',
    color: isActive ? 'var(--accent-teal)' : 'var(--text-secondary)',
    background: isActive ? 'rgba(0, 242, 254, 0.08)' : 'transparent',
    border: isActive ? '1px solid rgba(0, 242, 254, 0.25)' : '1px solid transparent',
    fontWeight: 700,
    fontSize: '0.95rem',
    marginBottom: '0.5rem',
    cursor: 'pointer',
    textAlign: 'left',
    transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  });


  // Load orders from localStorage
  useEffect(() => {
    const savedOrders = localStorage.getItem('csm17_orders');
    if (savedOrders) {
      setOrders(JSON.parse(savedOrders));
    } else {
      const initialOrders = [
        {
          id: 'UNR-20260227-102030',
          type: 'UNR',
          customer: '홍길동',
          phone: '010-1234-5678',
          item: '유니온 R 시즌1',
          payment_status: '대기',
          delivery_status: '배송전',
          receipt_type: '현금영수증',
          receipt_status: '발행전',
          biz_number: '010-1234-5678',
          date: '2026-02-27 10:20:30',
          amount: 55000,
          quantity: 1
        }
      ];
      setOrders(initialOrders);
      localStorage.setItem('csm17_orders', JSON.stringify(initialOrders));
    }
  }, []);

  const addOrder = (newOrder) => {
    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    localStorage.setItem('csm17_orders', JSON.stringify(updatedOrders));
  };

  const updateOrder = (orderId, updates) => {
    const updatedOrders = orders.map(o => o.id === orderId ? { ...o, ...updates } : o);
    setOrders(updatedOrders);
    localStorage.setItem('csm17_orders', JSON.stringify(updatedOrders));
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setIsAdmin(false);
  };

  const deleteMembership = (id) => {
    const updated = memberships.filter(m => m.id !== id);
    setMemberships(updated);
  };

  const updateMembership = (id, updates) => {
    const updated = memberships.map(m => m.id === id ? { ...m, ...updates } : m);
    setMemberships(updated);
  };

  const updateProducts = (newProducts) => {
    // Filter out potential duplicates by name to handle retry logic gracefully
    const unique = Array.from(new Map(newProducts.map(p => [p.name, p])).values());
    setProducts(unique);
    localStorage.setItem('csm17_products', JSON.stringify(unique));
  };

  return (
    <div className="order-center-app" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-deep)', color: 'var(--text-primary)' }}>
      {!isAdmin ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <header style={{
            padding: '1.5rem 2rem',
            background: 'var(--bg-panel)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid var(--border-glass)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            zIndex: 1000
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <img src="/images/logo.png" alt="CSM17 Logo" style={{ width: '100px', height: 'auto' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div
                onClick={() => setIsAdmin(true)}
                style={{
                  width: '32px',
                  height: '32px',
                  opacity: 0.15,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'opacity 0.2s',
                  borderRadius: '6px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.5'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.15'}
              >
                <ShieldCheck size={18} />
              </div>
            </div>
          </header>

          <nav style={{
            padding: '1rem 2rem',
            display: 'flex',
            gap: '1.5rem',
            justifyContent: 'center',
            background: 'var(--bg-glass)',
            borderBottom: '1px solid var(--border-glass)'
          }}>
            <button
              onClick={() => setUserView('search')}
              style={{
                background: 'none',
                border: 'none',
                color: userView === 'search' ? 'var(--accent-teal)' : 'var(--text-secondary)',
                fontWeight: 700,
                padding: '0.5rem 1rem',
                borderBottom: userView === 'search' ? '2px solid var(--accent-teal)' : '2px solid transparent',
                cursor: 'pointer'
              }}
            >
              주문번호 조회
            </button>
            <button
              onClick={() => setUserView('membership')}
              style={{
                background: 'none',
                border: 'none',
                color: userView === 'membership' ? 'var(--accent-teal)' : 'var(--text-secondary)',
                fontWeight: 700,
                padding: '0.5rem 1rem',
                borderBottom: userView === 'membership' ? '2px solid var(--accent-teal)' : '2px solid transparent',
                cursor: 'pointer'
              }}
            >
              멤버십 주문하기
            </button>
          </nav>

          <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem' }}>

            {userView === 'search' ? (
              <UserSearch orders={orders} />
            ) : (
              <MembershipOrder products={products} onAddOrder={addOrder} memberships={memberships} />
            )}
          </main>
        </div >
      ) : (
        <div className="admin-layout" style={{ display: 'flex', flex: 1 }}>
          <aside style={{
            width: '280px',
            borderRight: '1px solid var(--border-glass)',
            background: 'var(--bg-panel)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            flexDirection: 'column',
            position: 'fixed',
            height: '100vh',
            zIndex: 100
          }}>
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-glass)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <img src="/images/logo.png" alt="CSM17 Logo" style={{ width: '90px', height: 'auto' }} />
              </div>
            </div>

            <button
              onClick={() => setActiveTab('orders')}
              className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
              style={navItemStyle(activeTab === 'orders')}
            >
              <List size={20} /> 종합 주문 목록
            </button>
            <button
              onClick={() => setActiveTab('manual_order')}
              className={`nav-item ${activeTab === 'manual_order' ? 'active' : ''}`}
              style={navItemStyle(activeTab === 'manual_order')}
            >
              <Plus size={20} /> 수동 주문 등록
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`nav-item ${activeTab === 'customers' ? 'active' : ''}`}
              style={navItemStyle(activeTab === 'customers')}
            >
              <Users size={20} /> 주문자별 보기
            </button>
            <button
              onClick={() => setActiveTab('memberships')}
              className={`nav-item ${activeTab === 'memberships' ? 'active' : ''}`}
              style={navItemStyle(activeTab === 'memberships')}
            >
              <Key size={20} /> 멤버십 발급 관리
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`nav-item ${activeTab === 'stats' ? 'active' : ''}`}
              style={navItemStyle(activeTab === 'stats')}
            >
              <BarChart3 size={20} /> 매출 통계
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`nav-item ${activeTab === 'products' ? 'active' : ''}`}
              style={navItemStyle(activeTab === 'products')}
            >
              <Package size={20} /> 상품 관리
            </button>
            <button
              onClick={() => setActiveTab('memos')}
              className={`nav-item ${activeTab === 'memos' ? 'active' : ''}`}
              style={navItemStyle(activeTab === 'memos')}
            >
              <StickyNote size={20} /> 메모장
            </button>

            <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button onClick={handleAdminLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '1rem', borderRadius: '12px', color: '#ff4d4d', background: 'rgba(255, 77, 77, 0.05)', border: '1px solid rgba(255, 77, 77, 0.2)', fontWeight: 700, cursor: 'pointer' }}>
                <LogOut size={18} /> 관리자 로그아웃
              </button>
            </div>
          </aside>

          <main style={{ marginLeft: '280px', flex: 1, padding: '2rem' }}>
            <AdminPanel
              orders={orders}
              onAddOrder={addOrder}
              onUpdateOrder={updateOrder}
              activeTab={activeTab}
              products={products}
              onUpdateProducts={updateProducts}
              newProductName={newProductName}
              setNewProductName={setNewProductName}
              newProductPrice={newProductPrice}
              setNewProductPrice={setNewProductPrice}
              newProductDiscount={newProductDiscount}
              setNewProductDiscount={setNewProductDiscount}
              editingProductId={editingProductId}
              setEditingProductId={setEditingProductId}
              editPrice={editPrice}
              setEditPrice={setEditPrice}
              editDiscount={editDiscount}
              setEditDiscount={setEditDiscount}
              customer={customer}
              setCustomer={setCustomer}
              item={item}
              setItem={setItem}
              type={type}
              setType={setType}
              copied={copied}
              setCopied={setCopied}
              selectedCustomer={selectedCustomer}
              setSelectedCustomer={setSelectedCustomer}
              checklists={checklists}
              setChecklists={setChecklists}
              memos={memos}
              setMemos={setMemos}
              members={members}
              setMembers={setMembers}
              memberships={memberships}
              setMemberships={setMemberships}
              onDeleteMembership={deleteMembership}
              onUpdateMembership={updateMembership}
              isAuthenticated={isAdminAuthenticated}
              setIsAuthenticated={setIsAdminAuthenticated}
              onLogout={handleAdminLogout}
            />
          </main>
        </div>
      )
      }
    </div >
  );
}

export default App;
