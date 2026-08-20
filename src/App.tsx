import { useState } from 'react';
import { I18nProvider } from '@/locales';
import { AppLayout } from '@/layouts/AppLayout';
import { useRouter } from '@/hooks/useRouter';
import { DashboardPage } from '@/pages/DashboardPage';
import { InboxPage } from '@/pages/InboxPage';
import { OrdersPage } from '@/pages/OrdersPage';
import { OrderDetailPage } from '@/pages/OrderDetailPage';
import { CreateOrderPage } from '@/pages/CreateOrderPage';
import { ProductsPage } from '@/pages/ProductsPage';
import { ProductDetailPage } from '@/pages/ProductDetailPage';
import { InventoryPage } from '@/pages/InventoryPage';
import { CustomersPage } from '@/pages/CustomersPage';
import { CustomerDetailPage } from '@/pages/CustomerDetailPage';
import { ShippingPage } from '@/pages/ShippingPage';
import { InvoicesPage } from '@/pages/InvoicesPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { IntegrationsPage } from '@/pages/IntegrationsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { mockOrders } from '@/data/orders';
import { mockProducts } from '@/data/products';
import { mockCustomers } from '@/data/customers';
import type { Order, Product, Customer } from '@/types';

export default function App() {
  const { route, navigate } = useRouter();
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);

  const handleCreateOrder = (order: Order) => {
    setOrders((prev) => [order, ...prev]);
  };

  const handleCreateProduct = (product: Product) => {
    setProducts((prev) => [product, ...prev]);
  };

  const handleDeleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleCreateCustomer = (customer: Customer) => {
    setCustomers((prev) => [customer, ...prev]);
  };

  const handleDeleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  let page: React.ReactNode;
  switch (route.name) {
    case 'dashboard': page = <DashboardPage navigate={navigate} orders={orders} />; break;
    case 'inbox': page = <InboxPage navigate={navigate} />; break;
    case 'orders': page = <OrdersPage navigate={navigate} orders={orders} />; break;
    case 'order-detail': page = <OrderDetailPage key={route.id} orderId={route.id} navigate={navigate} orders={orders} />; break;
    case 'create-order': page = <CreateOrderPage navigate={navigate} onCreate={handleCreateOrder} />; break;
    case 'products': page = <ProductsPage navigate={navigate} products={products} onCreate={handleCreateProduct} onDelete={handleDeleteProduct} />; break;
    case 'product-detail': page = <ProductDetailPage productId={route.id} navigate={navigate} products={products} onDelete={handleDeleteProduct} />; break;
    case 'inventory': page = <InventoryPage products={products} setProducts={setProducts} />; break;
    case 'customers': page = <CustomersPage navigate={navigate} customers={customers} onCreate={handleCreateCustomer} onDelete={handleDeleteCustomer} />; break;
    case 'customer-detail': page = <CustomerDetailPage customerId={route.id} navigate={navigate} customers={customers} />; break;
    case 'shipping': page = <ShippingPage />; break;
    case 'invoices': page = <InvoicesPage />; break;
    case 'reports': page = <ReportsPage />; break;
    case 'integrations': page = <IntegrationsPage />; break;
    case 'settings': page = <SettingsPage />; break;
    default: page = <DashboardPage navigate={navigate} orders={orders} />;
  }

  return (
    <I18nProvider>
      <AppLayout route={route} navigate={navigate} orders={orders} products={products} customers={customers}>
        {page}
      </AppLayout>
    </I18nProvider>
  );
}
