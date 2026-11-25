import React, { useState, useEffect } from 'react';
import apiService from '@/services/ApiService';
import { toast } from 'react-toastify';

interface SubMenu {
  id: number;
  name: string;
  path: string;
}

interface Menu {
  id: number;
  name: string;
  icon: string;
  subMenus: SubMenu[];
}

interface Permission {
  subMenu: { id: number };
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canView: boolean;
  canExport: boolean;
  canPrint: boolean;
  canApprove: boolean;
  canReject: boolean;
  canProcess: boolean;
  canShare: boolean;
  canDuplicate: boolean;
  canSchedule: boolean;
}

interface UserPermissionAssignmentProps {
  userId: number;
  userName: string;
  userType: number;
  onClose: () => void;
}

const UserPermissionAssignment: React.FC<UserPermissionAssignmentProps> = ({ userId, userName, userType, onClose }) => {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [userPermissions, setUserPermissions] = useState<Record<number, Permission>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [menusRes, permissionsRes] = await Promise.all([
        apiService.get('/admin/menus'),
        apiService.get(`/admin/menus/permissions/${userId}`)
      ]);

      setMenus(menusRes.data);
      
      const permissionsMap: Record<number, Permission> = {};
      permissionsRes.data.forEach((p: any) => {
        permissionsMap[p.subMenu.id] = p;
      });
      setUserPermissions(permissionsMap);
    } catch (error) {
      toast.error('Failed to load permission data');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (subMenuId: number, field: keyof Omit<Permission, 'subMenu'>, checked: boolean) => {
    setUserPermissions(prev => {
      const existing = prev[subMenuId] || {
        subMenu: { id: subMenuId },
        canAdd: false,
        canEdit: false,
        canDelete: false,
        canView: true,
        canExport: true,
        canPrint: true,
        canApprove: false,
        canReject: false,
        canProcess: false,
        canShare: false,
        canDuplicate: false,
        canSchedule: false
      };
      
      return {
        ...prev,
        [subMenuId]: { ...existing, [field]: checked }
      };
    });
  };

  const handleSave = async () => {
    try {
      const permissionsList = Object.values(userPermissions).map(p => ({
        ...p,
        canView: true,
        canExport: true,
        canPrint: true,
        canApprove: !!p.canApprove
      }));
      await apiService.post(`/admin/menus/permissions/${userId}`, permissionsList);
      toast.success('Permissions updated successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to save permissions');
    }
  };

  if (loading) return <div className="p-4">Loading permissions...</div>;

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Assign Permissions for {userName}</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 font-bold text-2xl">×</button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        {menus.map(menu => (
          <div key={menu.id} className="mb-6 border rounded-lg overflow-hidden">
            <div className="bg-gray-50 p-3 font-semibold border-b flex items-center">
               <span className="mr-2">{menu.name}</span>
            </div>
            <div className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 text-left w-1/4">Sub-Menu</th>
                    <th className="p-2 text-center">Add</th>
                    <th className="p-2 text-center">Edit</th>
                    <th className="p-2 text-center">Del</th>
                    {userType === 3 && <th className="p-2 text-center">Appr</th>}
                  </tr>
                </thead>
                <tbody>
                  {menu.subMenus.map(subMenu => {
                    const perm = userPermissions[subMenu.id] || {};
                    return (
                      <tr key={subMenu.id} className="border-t hover:bg-gray-50">
                        <td className="p-2 font-medium">{subMenu.name}</td>
                        <td className="p-2 text-center">
                          <input 
                            type="checkbox"
                            checked={perm.canAdd ?? false}
                            onChange={(e) => handlePermissionChange(subMenu.id, 'canAdd', e.target.checked)}
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input 
                            type="checkbox"
                            checked={perm.canEdit ?? false}
                            onChange={(e) => handlePermissionChange(subMenu.id, 'canEdit', e.target.checked)}
                          />
                        </td>
                        <td className="p-2 text-center">
                          <input 
                            type="checkbox"
                            checked={perm.canDelete ?? false}
                            onChange={(e) => handlePermissionChange(subMenu.id, 'canDelete', e.target.checked)}
                          />
                        </td>
                        {userType === 3 && (
                          <td className="p-2 text-center">
                            <input 
                              type="checkbox"
                              checked={perm.canApprove ?? false}
                              onChange={(e) => handlePermissionChange(subMenu.id, 'canApprove', e.target.checked)}
                            />
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
        <button onClick={onClose} className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100 transition">Cancel</button>
        <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Save Permissions</button>
      </div>
    </div>
  );
};

export default UserPermissionAssignment;
