import type { ReactNode } from 'react';
import { I18nProvider } from '@/locales';
import { AppLayout } from '@/layouts/AppLayout';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { BusinessProvider, useBusiness } from '@/contexts/BusinessContext';
import { AuthShell } from '@/components/AuthShell';
import { useRouter } from '@/hooks/useRouter';
import { useOrders } from '@/hooks/useOrders';
import { useProducts } from '@/hooks/useProducts';
import { useCustomers } from '@/hooks/useCustomers';
import { OnboardingTour } from '@/components/OnboardingTour';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { OnboardingPage } from '@/pages/OnboardingPage';
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

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <BusinessProvider>
          <AppShell />
        </BusinessProvider>
      </AuthProvider>
    </I18nProvider>
  );
}

function LoadingScreen() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface-1">
      <div className="flex flex-col items-center gap-3">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-md text-base font-bold text-white"
          style={{ background: 'var(--accent)' }}
        >
          S
        </div>
        <p className="text-[13px]" style={{ color: 'var(--content-tertiary)' }}>SellerOS</p>
      </div>
    </div>
  );
}

/** Routes that are only accessible when authenticated. */
const protectedRoutes = new Set([
  'dashboard', 'inbox', 'orders', 'order-detail', 'create-order',
  'products', 'product-detail', 'inventory', 'customers', 'customer-detail',
  'shipping', 'invoices', 'reports', 'integrations', 'settings', 'onboarding',
]);

function AppShell() {
  const { route, navigate } = useRouter();
  const auth = useAuth();
  const biz = useBusiness();
  const orders = useOrders();
  const products = useProducts();
  const customers = useCustomers();

  // Auth + membership state must settle before rendering anything —
  // the app must never assume the user is authenticated.
  const booting = auth.status === 'loading' || (auth.status === 'signed-in' && biz.status === 'loading');
  if (booting) return <LoadingScreen />;

  const authed = auth.status === 'signed-in';

  // Redirect authenticated users away from landing page to dashboard
  if (authed && route.name === 'landing') {
    navigate({ name: 'dashboard' });
    return <LoadingScreen />;
  }

  // Redirect unauthenticated users away from protected routes
  if (!authed && protectedRoutes.has(route.name)) {
    // Show loading briefly then redirect to landing
    if (auth.status === 'loading') return <LoadingScreen />;
    navigate({ name: 'landing' });
    return <LoadingScreen />;
  }

  // ─── Public: Landing page (default for unauthenticated) ───
  if (!authed) {
    let page: ReactNode;
    switch (route.name) {
      case 'register': page = <RegisterPage navigate={navigate} />; break;
      case 'forgot-password': page = <ForgotPasswordPage navigate={navigate} />; break;
      case 'reset-password': page = <ResetPasswordPage />; break;
      case 'login': page = <LoginPage navigate={navigate} />; break;
      default: page = <LandingPage navigate={navigate} />;
    }
    // Auth pages use AuthShell, landing page does not
    if (route.name === 'landing') return page;
    return <AuthShell>{page}</AuthShell>;
  }

  // Password-recovery session: only the reset screen is available.
  if (auth.recoveryActive) {
    return (
      <AuthShell>
        <ResetPasswordPage />
      </AuthShell>
    );
  }

  // ─── Onboarding: signed in but no business yet ───
  if (!biz.business) {
    return (
      <AuthShell>
        <OnboardingPage />
      </AuthShell>
    );
  }

  // ─── Authenticated app ───
  let page: ReactNode;
  switch (route.name) {
    case 'inbox': page = <InboxPage navigate={navigate} />; break;
    case 'orders': page = <OrdersPage navigate={navigate} orders={orders.orders} />; break;
    case 'order-detail':
      page = (
        <OrderDetailPage
          key={route.id}
          orderId={route.id}
          navigate={navigate}
          orders={orders.orders}
          customers={customers.customers}
          onStatusChange={orders.changeStatus}
        />
      );
      break;
    case 'create-order':
      page = (
        <CreateOrderPage
          navigate={navigate}
          onCreate={orders.createOrder}
          products={products.products}
          customers={customers.customers}
        />
      );
      break;
    case 'products':
      page = (
        <ProductsPage
          navigate={navigate}
          products={products.products}
          onCreate={products.createProduct}
          onDelete={products.deleteProduct}
        />
      );
      break;
    case 'product-detail':
      page = (
        <ProductDetailPage
          productId={route.id}
          navigate={navigate}
          products={products.products}
          onDelete={products.deleteProduct}
        />
      );
      break;
    case 'inventory': page = <InventoryPage />; break;
    case 'customers':
      page = (
        <CustomersPage
          navigate={navigate}
          customers={customers.customers}
          onCreate={customers.createCustomer}
          onDelete={customers.deleteCustomer}
        />
      );
      break;
    case 'customer-detail':
      page = (
        <CustomerDetailPage
          customerId={route.id}
          navigate={navigate}
          customers={customers.customers}
          orders={orders.orders}
        />
      );
      break;
    case 'shipping': page = <ShippingPage />; break;
    case 'invoices': page = <InvoicesPage />; break;
    case 'reports': page = <ReportsPage />; break;
    case 'integrations': page = <IntegrationsPage />; break;
    case 'settings': page = <SettingsPage />; break;
    default: page = <DashboardPage navigate={navigate} orders={orders.orders} />;
  }

  return (
    <AppLayout route={route} navigate={navigate}>
      {page}
      <OnboardingTour />
    </AppLayout>
  );
}
