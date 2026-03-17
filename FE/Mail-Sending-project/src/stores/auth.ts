import { computed, reactive } from 'vue'
import { mockApi, type MockUser, type MockApiError } from '../api/mockApi'

type AuthState = {
  token: string | null
  user: MockUser | null
  isReady: boolean
  isLoading: boolean
  error: string | null
}

const LS_TOKEN = 'auth.token.v1'

function readToken(): string | null {
  try {
    return localStorage.getItem(LS_TOKEN)
  } catch {
    return null
  }
}

function writeToken(token: string | null) {
  try {
    if (!token) localStorage.removeItem(LS_TOKEN)
    else localStorage.setItem(LS_TOKEN, token)
  } catch {
    // ignore
  }
}

function getErrorMessage(err: unknown) {
  if (err && typeof err === 'object' && 'message' in err && typeof (err as any).message === 'string') {
    return (err as any).message as string
  }
  return 'Something went wrong'
}

const state = reactive<AuthState>({
  token: readToken(),
  user: null,
  isReady: false,
  isLoading: false,
  error: null,
})

const isAuthenticated = computed(() => !!state.token && !!state.user)

async function restore() {
  state.isLoading = true
  state.error = null
  try {
    const token = readToken()
    state.token = token
    if (!token) {
      state.user = null
      return
    }
    state.user = await mockApi.me(token)
  } catch (e) {
    state.user = null
    state.token = null
    writeToken(null)
    state.error = getErrorMessage(e)
  } finally {
    state.isLoading = false
    state.isReady = true
  }
}

async function login(payload: { email: string; password: string }) {
  state.isLoading = true
  state.error = null
  try {
    const res = await mockApi.login(payload)
    state.token = res.token
    state.user = res.user
    writeToken(res.token)
    return res.user
  } catch (e) {
    state.error = getErrorMessage(e)
    throw e as MockApiError
  } finally {
    state.isLoading = false
    state.isReady = true
  }
}

async function register(payload: { name: string; email: string; password: string }) {
  state.isLoading = true
  state.error = null
  try {
    const res = await mockApi.register(payload)
    state.token = res.token
    state.user = res.user
    writeToken(res.token)
    return res.user
  } catch (e) {
    state.error = getErrorMessage(e)
    throw e as MockApiError
  } finally {
    state.isLoading = false
    state.isReady = true
  }
}

async function logout() {
  const token = state.token
  state.isLoading = true
  state.error = null
  try {
    if (token) await mockApi.logout(token)
  } finally {
    state.token = null
    state.user = null
    writeToken(null)
    state.isLoading = false
    state.isReady = true
  }
}

async function changePassword(payload: { currentPassword: string; newPassword: string }) {
  state.isLoading = true
  state.error = null
  try {
    if (!state.token) throw new Error('Unauthorized')
    await mockApi.changePassword({ token: state.token, ...payload })
  } catch (e) {
    state.error = getErrorMessage(e)
    throw e
  } finally {
    state.isLoading = false
  }
}

async function updateProfile(payload: { name: string }) {
  state.isLoading = true
  state.error = null
  try {
    if (!state.token) throw new Error('Unauthorized')
    const user = await mockApi.updateProfile({ token: state.token, ...payload })
    state.user = user
    return user
  } catch (e) {
    state.error = getErrorMessage(e)
    throw e
  } finally {
    state.isLoading = false
  }
}

export const auth = {
  state,
  isAuthenticated,
  restore,
  login,
  register,
  logout,
  changePassword,
  updateProfile,
}

