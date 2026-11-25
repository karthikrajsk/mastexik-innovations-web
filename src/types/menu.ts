export interface MenuActionPermissions {
  add?: boolean;
  edit?: boolean;
  delete?: boolean;
  view?: boolean;
  export?: boolean;
  print?: boolean;
  approve?: boolean;
  reject?: boolean;
  process?: boolean;
  share?: boolean;
  duplicate?: boolean;
  schedule?: boolean;
  [key: string]: boolean | undefined;
}

export interface SubMenuItem {
  subMenuId: string;
  subMenuName: string;
  subMenuPath: string;
  subMenuOrder: number;
  active: boolean;
  actions: MenuActionPermissions;
}

export interface MenuItem {
  menuId: string;
  menuName: string;
  menuIcon: string;
  menuOrder: number;
  active: boolean;
  subMenus: SubMenuItem[];
}

export interface UserMenuData {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  userStatus: string;
  lastLogin: string;
  menus: MenuItem[];
}
