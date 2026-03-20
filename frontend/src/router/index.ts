import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue')
  },
  {
    path: '/farming',
    name: 'FarmingActivity',
    component: () => import('../views/FarmingActivity.vue')
  },
  {
    path: '/verify',
    name: 'IdentityVerify',
    component: () => import('../views/IdentityVerify.vue')
  },
  {
    path: '/allocate',
    name: 'AllocateLand',
    component: () => import('../views/AllocateLand.vue')
  },
  {
    path: '/credentials',
    name: 'Credentials',
    component: () => import('../views/Credentials.vue')
  },
  {
    path: '/rights',
    name: 'Rights',
    component: () => import('../views/Rights.vue')
  },
  {
    path: '/rights/detail',
    name: 'RightDetail',
    component: () => import('../views/RightDetail.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
