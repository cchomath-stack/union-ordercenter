import React, { useState, useEffect } from 'react';
import UserSearch from './components/UserSearch';
import AdminPanel from './components/AdminPanel';
import MembershipOrder from './components/MembershipOrder';
import { Settings, ShieldCheck, List, Users, BarChart3, LogOut, Search, Package, Plus, Sun, Moon, StickyNote, Key } from 'lucide-react';
import { db, doc, setDoc, onSnapshot } from './firebaseClient';

// Version: 2026.03.09.v2 - Mobile Overhaul & Multi-Cart System
function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('orders'); // orders, manual_order, customers, memberships, stats, products, memos
  const [userView, setUserView] = useState('search'); // search, union_order, yak_order
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('csm17_products');
    if (saved) return JSON.parse(saved);
    return [
      { id: 1, name: '유니온 R (시즌1)', price: 150000, discount: 0, category: 'union' },
      { id: 2, name: '유니온 X (시즌1)', price: 180000, discount: 10, category: 'union' },
      { id: 3, name: '약술형 논술 기본서', price: 32000, discount: 5, category: 'yak' }
    ];
  });

  // Admin Panel states moved here for Hook stability
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductDiscount, setNewProductDiscount] = useState('0');
  const [newProductCategory, setNewProductCategory] = useState('union');
  const [editingProductId, setEditingProductId] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [editDiscount, setEditDiscount] = useState('');
  const [editCategory, setEditCategory] = useState('union');
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

  // Firebase Cloud Sync Setup
  useEffect(() => {
    if (!db) {
      // Local fallbacks
      const handleStorageChange = (e) => {
        if (e.key === 'csm_memberships' && e.newValue) setMemberships(JSON.parse(e.newValue));
        if (e.key === 'csm17_orders' && e.newValue) setOrders(JSON.parse(e.newValue));
        if (e.key === 'csm17_products' && e.newValue) setProducts(JSON.parse(e.newValue));
      };
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }

    const unsubOrders = onSnapshot(doc(db, 'csm17', 'orders'), (snap) => {
      if (snap.exists()) { setOrders(snap.data().data); localStorage.setItem('csm17_orders', JSON.stringify(snap.data().data)); }
    });
    const unsubProducts = onSnapshot(doc(db, 'csm17', 'products'), (snap) => {
      if (snap.exists()) { setProducts(snap.data().data); localStorage.setItem('csm17_products', JSON.stringify(snap.data().data)); }
    });
    const unsubMemberships = onSnapshot(doc(db, 'csm17', 'memberships'), (snap) => {
      if (snap.exists()) { setMemberships(snap.data().data); localStorage.setItem('csm_memberships', JSON.stringify(snap.data().data)); }
    });
    const unsubChecklists = onSnapshot(doc(db, 'csm17', 'checklists'), (snap) => {
      if (snap.exists()) { setChecklists(snap.data().data); localStorage.setItem('csm_checklists', JSON.stringify(snap.data().data)); }
    });
    const unsubMemos = onSnapshot(doc(db, 'csm17', 'memos'), (snap) => {
      if (snap.exists()) { setMemos(snap.data().data); localStorage.setItem('csm_memos', JSON.stringify(snap.data().data)); }
    });
    const unsubMembers = onSnapshot(doc(db, 'csm17', 'members'), (snap) => {
      if (snap.exists()) { setMembers(snap.data().data); localStorage.setItem('csm_members', JSON.stringify(snap.data().data)); }
    });

    return () => {
      unsubOrders(); unsubProducts(); unsubMemberships();
      unsubChecklists(); unsubMemos(); unsubMembers();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('csm_members', JSON.stringify(members));
    if (db && members.length > 0) setDoc(doc(db, 'csm17', 'members'), { data: members });
  }, [members]);

  useEffect(() => {
    localStorage.setItem('csm_memberships', JSON.stringify(memberships));
    if (db && memberships.length > 0) setDoc(doc(db, 'csm17', 'memberships'), { data: memberships });
  }, [memberships]);

  useEffect(() => {
    localStorage.setItem('csm_checklists', JSON.stringify(checklists));
    if (db && Object.keys(checklists).length > 0) setDoc(doc(db, 'csm17', 'checklists'), { data: checklists });
  }, [checklists]);

  useEffect(() => {
    localStorage.setItem('csm_memos', JSON.stringify(memos));
    if (db && memos.length > 0) setDoc(doc(db, 'csm17', 'memos'), { data: memos });
  }, [memos]);

  // Handle URL routing for direct access to order page
  useEffect(() => {
    const path = window.location.pathname;
    const search = window.location.search;
    if (path.includes('/membership') || path.includes('/order') || search.includes('view=membership')) {
      setUserView('union_order');
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
    if (db) setDoc(doc(db, 'csm17', 'orders'), { data: updatedOrders });
  };

  const updateOrder = (orderId, updates) => {
    const updatedOrders = orders.map(o => o.id === orderId ? { ...o, ...updates } : o);
    setOrders(updatedOrders);
    localStorage.setItem('csm17_orders', JSON.stringify(updatedOrders));
    if (db) setDoc(doc(db, 'csm17', 'orders'), { data: updatedOrders });
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setIsAdmin(false);
  };

  const deleteOrder = (orderId) => {
    const updatedOrders = orders.filter(o => o.id !== orderId);
    setOrders(updatedOrders);
    localStorage.setItem('csm17_orders', JSON.stringify(updatedOrders));
    if (db) setDoc(doc(db, 'csm17', 'orders'), { data: updatedOrders });
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
    if (db) setDoc(doc(db, 'csm17', 'products'), { data: unique });
  };

  return (
    <div className="order-center-app" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-deep)', color: 'var(--text-primary)' }}>
      {!isAdmin ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <header style={{
            padding: '1rem 1.5rem',
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <img src="/images/logo.png" alt="CSM17 Logo" style={{ width: '80px', height: 'auto' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
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
            padding: '0 1rem',
            display: 'flex',
            gap: '0.5rem',
            justifyContent: 'flex-start',
            overflowX: 'auto',
            whiteSpace: 'nowrap',
            background: 'var(--bg-panel)',
            borderBottom: '1px solid var(--border-glass)',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}>
            {[
              { id: 'search', label: '주문조회' },
              { id: 'union_order', label: '유니온 멤버십 주문' },
              { id: 'yak_order', label: '약술 주문' },
              { id: 'union_channel', label: '유니온 채널', link: 'https://pf.kakao.com/_pqQCn' },
              { id: 'yak_channel', label: '약술 채널', link: 'https://pf.kakao.com/_kWwJn' }
            ].map(item => (
              item.link ? (
                <a
                  key={item.id}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    textDecoration: 'none',
                    color: 'var(--text-secondary)',
                    fontWeight: 700,
                    padding: '1rem 0.75rem',
                    fontSize: '0.85rem',
                    display: 'inline-block'
                  }}
                >
                  {item.label}
                </a>
              ) : (
                <button
                  key={item.id}
                  onClick={() => setUserView(item.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: userView === item.id ? 'var(--accent-teal)' : 'var(--text-secondary)',
                    fontWeight: 700,
                    padding: '1rem 0.75rem',
                    borderBottom: userView === item.id ? '2px solid var(--accent-teal)' : '2px solid transparent',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {item.label}
                </button>
              )
            ))}
          </nav>

          <main style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '1.5rem 1rem' }}>
            {userView === 'search' && <UserSearch orders={orders} />}
            {(userView === 'union_order' || userView === 'yak_order') && (
              <MembershipOrder
                key={userView}
                viewType={userView}
                products={products}
                onAddOrder={addOrder}
                memberships={memberships}
              />
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
              onDeleteOrder={deleteOrder}
              activeTab={activeTab}
              products={products}
              onUpdateProducts={updateProducts}
              newProductName={newProductName}
              setNewProductName={setNewProductName}
              newProductPrice={newProductPrice}
              setNewProductPrice={setNewProductPrice}
              newProductDiscount={newProductDiscount}
              setNewProductDiscount={setNewProductDiscount}
              newProductCategory={newProductCategory}
              setNewProductCategory={setNewProductCategory}
              editingProductId={editingProductId}
              setEditingProductId={setEditingProductId}
              editPrice={editPrice}
              setEditPrice={setEditPrice}
              editDiscount={editDiscount}
              setEditDiscount={setEditDiscount}
              editCategory={editCategory}
              setEditCategory={setEditCategory}
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
