import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserMenuData, MenuActionPermissions } from '../types/menu';

interface PermissionState {
  userMenu: UserMenuData | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: PermissionState = {
  userMenu: null,
  isAdmin: false,
  loading: false,
  error: null,
};

const permissionSlice = createSlice({
  name: 'permission',
  initialState,
  reducers: {
    setUserMenu: (state, action: PayloadAction<UserMenuData>) => {
      state.userMenu = action.payload;
      const role = action.payload?.userRole || (action.payload as any)?.role || '';
      state.isAdmin = role.toLowerCase() === 'admin';
    },
    clearUserMenu: (state) => {
      state.userMenu = null;
      state.isAdmin = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setUserMenu, clearUserMenu, setLoading, setError } = permissionSlice.actions;

// Selectors
const EMPTY_MENUS: any[] = [];
export const selectUserMenu = (state: any) => state.permission?.userMenu;
export const selectIsAdmin = (state: any) => state.permission?.isAdmin;
export const selectMenus = (state: any) => {
  const menus: any[] = state.permission?.userMenu?.menus || EMPTY_MENUS;
  return [...menus]
    .sort((a, b) => (Number(a.menuOrder) || 0) - (Number(b.menuOrder) || 0))
    .map((menu) => ({
      ...menu,
      subMenus: [...(menu.subMenus || [])].sort(
        (a, b) => (Number(a.subMenuOrder) || 0) - (Number(b.subMenuOrder) || 0)
      ),
    }));
};

// Permission check selector factory
export const selectHasPermission = (path: string, action: keyof MenuActionPermissions) => 
  (state: any) => {
    if (state.permission?.isAdmin) return true;
    if (!state.permission?.userMenu) return true;
    
    // Normalize path: remove trailing slash
    const normalizedPath = path.endsWith('/') ? path.slice(0, -1) : path;
    const basePaths = [
      normalizedPath,
      normalizedPath.replace(/-view$/, ''),
      normalizedPath.replace(/-details$/, ''),
      normalizedPath.replace(/-management$/, ''),
    ];
    
    const menus = state.permission?.userMenu?.menus || [];
    for (const menu of menus) {
      const subMenu = (menu.subMenus || []).find((sm: any) => {
        const smPath = sm.subMenuPath.endsWith('/') ? sm.subMenuPath.slice(0, -1) : sm.subMenuPath;
        return basePaths.includes(smPath);
      });
      if (subMenu) {
        return !!subMenu.actions[action];
      }
    }
    return false;
  };

export default permissionSlice.reducer;
