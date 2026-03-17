import { createRouter, createWebHistory } from 'vue-router'
import { auth } from '../stores/auth'
import AppLayout from '../layouts/AppLayout.vue'

const routes = [
  {
    path: '/login',
    name: 'login',
    meta: { public: true, title: 'Login' },
    component: () => import('../views/AuthLoginView.vue'),
  },
  {
    path: '/',
    component: AppLayout,
    children: [
      {
        path: '',
        name: 'dashboard',
        meta: { title: 'Dashboard', breadcrumb: 'Dashboard' },
        component: () => import('../views/DashboardView.vue'),
      },
      {
        path: 'instant-campaign',
        name: 'instant-campaign',
        meta: { title: 'Instant Campaign', breadcrumb: 'Dashboard > Instant Campaign' },
        component: () => import('../views/InstantCampaignView.vue'),
      },
      {
        path: 'individual-emails',
        name: 'individual-emails',
        meta: { title: 'Individual Emails', breadcrumb: 'Dashboard > Individual Emails' },
        component: () => import('../views/IndividualEmailsView.vue'),
      },
      {
        path: 'individual-emails/compose',
        name: 'individual-emails-compose',
        meta: { title: 'Compose Email', breadcrumb: 'Dashboard > Individual Emails > Compose' },
        component: () => import('../views/IndividualEmailsComposeView.vue'),
      },
      {
        path: 'email-templates',
        name: 'email-templates',
        meta: { title: 'Email Templates', breadcrumb: 'Dashboard > Email Templates' },
        component: () => import('../views/EmailTemplatesView.vue'),
      },
      {
        path: 'email-contacts',
        name: 'email-contacts',
        meta: { title: 'Email Contacts', breadcrumb: 'Dashboard > Email Contacts' },
        component: () => import('../views/EmailContactsView.vue'),
      },
      {
        path: 'contact-tags',
        name: 'contact-tags',
        meta: { title: 'Contact Tags', breadcrumb: 'Dashboard > Contact Tags' },
        component: () => import('../views/ContactTagsView.vue'),
      },
      {
        path: 'email-accounts',
        name: 'email-accounts',
        meta: { title: 'Email Accounts', breadcrumb: 'Dashboard > Email Accounts' },
        component: () => import('../views/EmailAccountsView.vue'),
      },
      {
        path: 'payment',
        name: 'payment',
        meta: { title: 'Payment Integration', breadcrumb: 'Dashboard > Payment' },
        component: () => import('../views/PaymentIntegrationView.vue'),
      },
      {
        path: 'profile',
        name: 'profile',
        meta: { title: 'Profile', breadcrumb: 'Dashboard > Profile' },
        component: () => import('../views/ProfileView.vue'),
      },
      {
        path: 'security',
        name: 'security',
        meta: { title: 'Security', breadcrumb: 'Dashboard > Security' },
        component: () => import('../views/SecurityView.vue'),
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, from, next) => {
  if (!auth.state.isReady) {
    await auth.restore()
  }

  if (to.meta.public) {
    if (auth.isAuthenticated.value && to.name === 'login') {
      next({ name: 'dashboard' })
      return
    }
    next()
    return
  }

  if (!auth.isAuthenticated.value) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }

  next()
})

export default router
