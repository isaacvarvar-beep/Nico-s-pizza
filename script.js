// =========================================================================
// 1. BASE DE DATOS RELACIONAL SIMULADA (USUARIOS, SUCURSALES, INSUMOS, PEDIDOS)
// =========================================================================
const USERS = [
  { username: 'suc_centro', password: '1234', name: 'Carlos Méndez', role: 'SUCURSAL', id_sucursal: 'SUC-01', sede_nombre: 'Sucursal Centro' },
  { username: 'suc_norte',  password: '1234', name: 'Ana Sofía Ruiz', role: 'SUCURSAL', id_sucursal: 'SUC-02', sede_nombre: 'Sucursal Norte' },
  { username: 'suc_sur',    password: '1234', name: 'Roberto Gómez', role: 'SUCURSAL', id_sucursal: 'SUC-03', sede_nombre: 'Sucursal Sur' },
  { username: 'almacen',    password: '1234', name: 'Jefe de Logística', role: 'ALMACEN', id_sucursal: 'ALM-00', sede_nombre: 'Almacén Central' }
];

const CATALOGO_INSUMOS = [
  { id: 'INS-001', nombre: 'Harina de Trigo Fuerza (Masa Madre)', categoria: 'Secos', unidad: 'kg', disponible: true },
  { id: 'INS-002', nombre: 'Queso Mozzarella Fresco Rallado', categoria: 'Lácteos', unidad: 'kg', disponible: true },
  { id: 'INS-003', nombre: 'Salsa de Tomate San Marzano Condimentada', categoria: 'Salsas', unidad: 'L', disponible: true },
  { id: 'INS-004', nombre: 'Pepperoni Artesanal Rebanado', categoria: 'Carnes Frías', unidad: 'kg', disponible: true },
  { id: 'INS-005', nombre: 'Aceite de Oliva Extra Virgen', categoria: 'Abarrotes', unidad: 'L', disponible: true },
  { id: 'INS-006', nombre: 'Levadura Fresca Panadera', categoria: 'Secos', unidad: 'kg', disponible: true },
  { id: 'INS-007', nombre: 'Caja de Cartón Kraft 14" (Nico\'s Pizza)', categoria: 'Empaque', unidad: 'pzas', disponible: true },
  { id: 'INS-008', nombre: 'Albahaca Fresca Seleccionada', categoria: 'Vegetales', unidad: 'kg', disponible: true },
  { id: 'INS-009', nombre: 'Champiñón Blanco Laminado', categoria: 'Vegetales', unidad: 'kg', disponible: false }
];

const INITIAL_ORDERS = [
  {
    folio: 'ORD-2026-101',
    id_sucursal: 'SUC-01',
    sede_nombre: 'Sucursal Centro',
    fecha: '2026-11-23 08:30',
    estatus: 'Pendiente de Surtido',
    notas: 'Urgente para turno vespertino',
    items: [
      { id: 'INS-001', nombre: 'Harina de Trigo Fuerza (Masa Madre)', unidad: 'kg', cantidad: 50 },
      { id: 'INS-002', nombre: 'Queso Mozzarella Fresco Rallado', unidad: 'kg', cantidad: 25 },
      { id: 'INS-007', nombre: 'Caja de Cartón Kraft 14" (Nico\'s Pizza)', unidad: 'pzas', cantidad: 150 }
    ]
  },
  {
    folio: 'ORD-2026-102',
    id_sucursal: 'SUC-02',
    sede_nombre: 'Sucursal Norte',
    fecha: '2026-11-23 09:15',
    estatus: 'En Empaque',
    notas: 'Entregar en puerta trasera',
    items: [
      { id: 'INS-003', nombre: 'Salsa de Tomate San Marzano Condimentada', unidad: 'L', cantidad: 30 },
      { id: 'INS-004', nombre: 'Pepperoni Artesanal Rebanado', unidad: 'kg', cantidad: 15 }
    ]
  },
  {
    folio: 'ORD-2026-103',
    id_sucursal: 'SUC-03',
    sede_nombre: 'Sucursal Sur',
    fecha: '2026-11-22 17:40',
    estatus: 'Enviado',
    notas: 'Sin observaciones',
    items: [
      { id: 'INS-001', nombre: 'Harina de Trigo Fuerza (Masa Madre)', unidad: 'kg', cantidad: 40 },
      { id: 'INS-005', nombre: 'Aceite de Oliva Extra Virgen', unidad: 'L', cantidad: 10 },
      { id: 'INS-008', nombre: 'Albahaca Fresca Seleccionada', unidad: 'kg', cantidad: 4 }
    ]
  }
];

// Estado global de la aplicación
let currentUser = null;
let cart = [];
let almacenFilter = 'ALL';

function getOrders() {
  const saved = localStorage.getItem('nicos_pizza_orders');
  if (!saved) {
    localStorage.setItem('nicos_pizza_orders', JSON.stringify(INITIAL_ORDERS));
    return INITIAL_ORDERS;
  }
  return JSON.parse(saved);
}

function saveOrders(orders) {
  localStorage.setItem('nicos_pizza_orders', JSON.stringify(orders));
}

function resetDemoData() {
  localStorage.setItem('nicos_pizza_orders', JSON.stringify(INITIAL_ORDERS));
  renderAlmacenOrders();
  renderAuditReport();
  alert('Datos de demostración restaurados.');
}

// =========================================================================
// 2. AUTENTICACIÓN Y ASIGNACIÓN INMUTABLE DE ID_Sucursal
// =========================================================================
function quickLogin(user, pass) {
  document.getElementById('username').value = user;
  document.getElementById('password').value = pass;
  handleLogin(new Event('submit'));
}

function handleLogin(e) {
  e.preventDefault();
  const u = document.getElementById('username').value.trim();
  const p = document.getElementById('password').value.trim();
  const found = USERS.find(x => x.username === u && x.password === p);

  if (!found) {
    document.getElementById('loginError').classList.remove('hidden');
    return;
  }

  document.getElementById('loginError').classList.add('hidden');
  currentUser = found;
  cart = [];

  // Actualizar Header
  document.getElementById('loginView').classList.add('hidden');
  document.getElementById('userHeaderControls').classList.remove('hidden');
  document.getElementById('headerUserName').textContent = `${found.name}`;
  document.getElementById('headerSedeBadge').textContent = `${found.sede_nombre} (${found.id_sucursal})`;

  if (found.role === 'SUCURSAL') {
    document.getElementById('sucursalView').classList.remove('hidden');
    document.getElementById('almacenView').classList.add('hidden');
    document.getElementById('cartSedeTag').textContent = `Destino fijo: ${found.id_sucursal}`;
    renderCatalog();
    renderCart();
    renderSucursalOrders();
  } else {
    document.getElementById('almacenView').classList.remove('hidden');
    document.getElementById('sucursalView').classList.add('hidden');
    renderAlmacenOrders();
    renderAuditReport();
  }
}

function logout() {
  currentUser = null;
  cart = [];
  document.getElementById('loginView').classList.remove('hidden');
  document.getElementById('sucursalView').classList.add('hidden');
  document.getElementById('almacenView').classList.add('hidden');
  document.getElementById('userHeaderControls').classList.add('hidden');
  document.getElementById('loginForm').reset();
}

// =========================================================================
// 3. FUNCIONES VISTA SUCURSAL (CATÁLOGO, CARRITO E HISTORIAL AISLADO)
// =========================================================================
function switchSucursalTab(tabName, btn) {
  document.querySelectorAll('#sucursalView .tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('tabNuevoPedido').classList.toggle('hidden', tabName !== 'nuevoPedido');
  document.getElementById('tabHistorialSucursal').classList.toggle('hidden', tabName !== 'historialSucursal');
  if (tabName === 'historialSucursal') renderSucursalOrders();
}

function renderCatalog() {
  const query = document.getElementById('searchInsumo').value.toLowerCase();
  const tbody = document.getElementById('catalogTableBody');
  tbody.innerHTML = '';

  CATALOGO_INSUMOS
    .filter(item => item.nombre.toLowerCase().includes(query) || item.id.toLowerCase().includes(query))
    .forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${item.id}</strong></td>
        <td>${item.nombre}</td>
        <td>${item.categoria}</td>
        <td>${item.unidad}</td>
        <td>${item.disponible
          ? '<span class="status-available">● Disponible</span>'
          : '<span class="status-unavailable">● Agotado</span>'}</td>
        <td>
          <input type="number" min="1" max="500" value="1" id="qty_${item.id}" class="qty-input" ${!item.disponible ? 'disabled' : ''}>
        </td>
        <td>
          <button class="btn btn-primary btn-sm ${!item.disponible ? 'btn-disabled' : ''}" onclick="addToCart('${item.id}')" ${!item.disponible ? 'disabled' : ''}>
            + Agregar
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
}

function addToCart(insumoId) {
  const insumo = CATALOGO_INSUMOS.find(i => i.id === insumoId);
  const qtyInput = document.getElementById(`qty_${insumoId}`);
  const cantidad = parseInt(qtyInput.value, 10);

  if (!cantidad || cantidad <= 0) return;

  const existing = cart.find(c => c.id === insumoId);
  if (existing) {
    existing.cantidad += cantidad;
  } else {
    cart.push({ id: insumo.id, nombre: insumo.nombre, unidad: insumo.unidad, cantidad });
  }
  qtyInput.value = 1;
  renderCart();
}

function removeFromCart(insumoId) {
  cart = cart.filter(c => c.id !== insumoId);
  renderCart();
}

function renderCart() {
  const container = document.getElementById('cartItemsContainer');
  const footer = document.getElementById('cartFooter');

  if (cart.length === 0) {
    container.innerHTML = '<div class="cart-empty">Aún no has agregado insumos a la orden de tu sucursal.</div>';
    footer.classList.add('hidden');
    return;
  }

  footer.classList.remove('hidden');
  container.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div>
        <div class="cart-item-title">${item.nombre}</div>
        <div class="cart-item-meta">${item.id} • <strong>${item.cantidad} ${item.unidad}</strong></div>
      </div>
      <button class="btn btn-outline btn-sm btn-remove" onclick="removeFromCart('${item.id}')">✕</button>
    </div>
  `).join('');
}

function openConfirmOrderModal() {
  document.getElementById('confirmSedeSubtitle').textContent = `Sede Solicitante: ${currentUser.sede_nombre} (${currentUser.id_sucursal})`;
  const list = document.getElementById('confirmSummaryList');
  list.innerHTML = `
    <table>
      <thead>
        <tr><th>Clave</th><th>Insumo</th><th>Cantidad</th></tr>
      </thead>
      <tbody>
        ${cart.map(i => `<tr><td>${i.id}</td><td>${i.nombre}</td><td><strong>${i.cantidad} ${i.unidad}</strong></td></tr>`).join('')}
      </tbody>
    </table>
  `;
  document.getElementById('confirmOrderModal').classList.add('open');
}

function submitOrder() {
  const orders = getOrders();
  const now = new Date();
  const fechaStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const newOrder = {
    folio: `ORD-2026-${100 + orders.length + 1}`,
    id_sucursal: currentUser.id_sucursal,
    sede_nombre: currentUser.sede_nombre,
    fecha: fechaStr,
    estatus: 'Pendiente de Surtido',
    notas: document.getElementById('orderNotes').value.trim() || 'Sin observaciones',
    items: [...cart]
  };

  orders.unshift(newOrder);
  saveOrders(orders);

  cart = [];
  document.getElementById('orderNotes').value = '';
  closeModal('confirmOrderModal');
  renderCart();
  renderSucursalOrders();
  alert(`¡Orden ${newOrder.folio} enviada con éxito! Vinculada automáticamente a ${currentUser.id_sucursal}.`);
}

function renderSucursalOrders() {
  const myOrders = getOrders().filter(o => o.id_sucursal === currentUser.id_sucursal);
  const tbody = document.getElementById('sucursalOrdersBody');

  if (myOrders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: var(--text-muted);">No hay pedidos registrados para esta sede.</td></tr>';
    return;
  }

  tbody.innerHTML = myOrders.map(o => `
    <tr>
      <td><strong>${o.folio}</strong></td>
      <td>${o.fecha}</td>
      <td>${o.items.length} insumos</td>
      <td><button class="btn btn-outline btn-sm" onclick="openPickingModal('${o.folio}')">Ver Orden</button></td>
      <td>${getStatusBadge(o.estatus)}</td>
      <td>
        ${o.estatus === 'Enviado'
          ? `<button class="btn btn-primary btn-sm" onclick="confirmReception('${o.folio}')">Confirmar Recepción</button>`
          : '<span class="subtitle-muted">—</span>'}
      </td>
    </tr>
  `).join('');
}

function confirmReception(folio) {
  const orders = getOrders();
  const target = orders.find(o => o.folio === folio);
  if (target) {
    target.estatus = 'Entregado';
    saveOrders(orders);
    renderSucursalOrders();
  }
}

// =========================================================================
// 4. FUNCIONES ALMACÉN CENTRAL (PICKING LISTS SEGMENTADAS Y REPORTES)
// =========================================================================
function switchAlmacenTab(tabName, btn) {
  document.querySelectorAll('#almacenView .tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('tabConsolaPicking').classList.toggle('hidden', tabName !== 'consolaPicking');
  document.getElementById('tabReportesAuditoria').classList.toggle('hidden', tabName !== 'reportesAuditoria');
  if (tabName === 'reportesAuditoria') renderAuditReport();
}

function filterAlmacenOrders(sedeId, btn) {
  almacenFilter = sedeId;
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  renderAlmacenOrders();
}

function renderAlmacenOrders() {
  let orders = getOrders();
  if (almacenFilter !== 'ALL') {
    orders = orders.filter(o => o.id_sucursal === almacenFilter);
  }

  const tbody = document.getElementById('almacenOrdersBody');
  tbody.innerHTML = orders.map(o => `
    <tr>
      <td><strong>${o.folio}</strong></td>
      <td><span class="sede-highlight">${o.id_sucursal}</span> — ${o.sede_nombre}</td>
      <td>${o.fecha}</td>
      <td>${o.items.length} productos</td>
      <td>${getStatusBadge(o.estatus)}</td>
      <td class="logistics-actions">
        <button class="btn btn-secondary btn-sm" onclick="openPickingModal('${o.folio}')">📋 Lista Picking</button>
        <select class="form-control status-select" onchange="updateOrderStatus('${o.folio}', this.value)">
          <option value="Pendiente de Surtido" ${o.estatus === 'Pendiente de Surtido' ? 'selected' : ''}>Pendiente</option>
          <option value="En Empaque" ${o.estatus === 'En Empaque' ? 'selected' : ''}>En Empaque</option>
          <option value="Enviado" ${o.estatus === 'Enviado' ? 'selected' : ''}>Enviado</option>
          <option value="Entregado" ${o.estatus === 'Entregado' ? 'selected' : ''}>Entregado</option>
        </select>
      </td>
    </tr>
  `).join('');
}

function updateOrderStatus(folio, newStatus) {
  const orders = getOrders();
  const order = orders.find(o => o.folio === folio);
  if (order) {
    order.estatus = newStatus;
    saveOrders(orders);
    renderAlmacenOrders();
  }
}

function openPickingModal(folio) {
  const order = getOrders().find(o => o.folio === folio);
  if (!order) return;

  document.getElementById('pickingOrderMeta').textContent = `Folio: ${order.folio} | Fecha: ${order.fecha} | Estatus: ${order.estatus}`;
  document.getElementById('pickingSedeBox').textContent = `${order.id_sucursal}: ${order.sede_nombre.toUpperCase()}`;
  document.getElementById('pickingNotesText').innerHTML = `<strong>Notas de entrega:</strong> ${order.notas}`;

  document.getElementById('pickingTableBody').innerHTML = order.items.map(item => `
    <tr>
      <td><strong>${item.id}</strong></td>
      <td>${item.nombre}</td>
      <td>${item.unidad}</td>
      <td><strong>${item.cantidad}</strong></td>
      <td class="no-print"><input type="checkbox"></td>
    </tr>
  `).join('');

  document.getElementById('pickingModal').classList.add('open');
}

function renderAuditReport() {
  const orders = getOrders();
  const sedes = [
    { id: 'SUC-01', nombre: 'Sucursal Centro' },
    { id: 'SUC-02', nombre: 'Sucursal Norte' },
    { id: 'SUC-03', nombre: 'Sucursal Sur' }
  ];

  const tbody = document.getElementById('auditReportBody');
  tbody.innerHTML = sedes.map(sede => {
    const sedeOrders = orders.filter(o => o.id_sucursal === sede.id);
    let totalUnidades = 0;
    const resumenInsumos = {};

    sedeOrders.forEach(o => {
      o.items.forEach(it => {
        totalUnidades += it.cantidad;
        resumenInsumos[it.nombre] = (resumenInsumos[it.nombre] || 0) + it.cantidad;
      });
    });

    const detalleTexto = Object.entries(resumenInsumos)
      .map(([k, v]) => `${k} (${v})`)
      .join(', ') || 'Sin movimientos';

    return `
      <tr>
        <td><strong>${sede.id}</strong> — ${sede.nombre}</td>
        <td>${sedeOrders.length} órdenes</td>
        <td><strong>${totalUnidades}</strong> unidades</td>
        <td class="subtitle-muted">${detalleTexto}</td>
      </tr>
    `;
  }).join('');
}

// =========================================================================
// UTILIDADES
// =========================================================================
function getStatusBadge(status) {
  if (status === 'Pendiente de Surtido') return `<span class="badge badge-pendiente">${status}</span>`;
  if (status === 'En Empaque') return `<span class="badge badge-empaque">${status}</span>`;
  if (status === 'Enviado') return `<span class="badge badge-enviado">${status}</span>`;
  return `<span class="badge badge-entregado">${status}</span>`;
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}