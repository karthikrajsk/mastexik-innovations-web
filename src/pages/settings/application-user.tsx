// import React, { useMemo, useState, useEffect } from 'react';
// import { useForm, Controller } from 'react-hook-form';
// import { useDispatch, useSelector } from 'react-redux';
// import { DataTable } from '@/components/data/DataTable';
// import { RootState, AppDispatch } from '@/state/store';
// import {
//   getAllApplicationUsers,
//   createApplicationUser,
//   updateApplicationUser,
//   deleteApplicationUser,
//   searchApplicationUsers
// } from '@/state/application-user-slice';
// import {
//   getAllCompanies
// } from '@/state/company-master-slice';

// // Types
// interface ApplicationUserData {
//   id?: number;
//   userName: string;
//   password?: string;
//   role: 'Sales' | 'PPC' | 'Inventory';
//   companies: number[];
//   activeFlag?: boolean;
// }

// export default function ApplicationUserPage() {
//   const dispatch = useDispatch<AppDispatch>();
//   const { applicationUserList, loading } = useSelector((state: RootState) => state.applicationUser);
//   const { companyMasterList: companies, loading: companyLoading } = useSelector((state: RootState) => state.companyMaster);

//   // Local state for application users (keeping your existing state)
//   const [users, setUsers] = useState<ApplicationUserData[]>([]);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [isEditing, setIsEditing] = useState(false);
//   const [current, setCurrent] = useState<ApplicationUserData | null>(null);
//   const [showPassword, setShowPassword] = useState(false);
//   const [isChangingPassword, setIsChangingPassword] = useState(false);

//   // Form
//   const { register, handleSubmit, reset, setValue, watch, control, formState: { errors } } = useForm<ApplicationUserData>({ mode: 'onBlur' });

//   // Sync Redux state with local state when data loads
//   useEffect(() => {
//     if (applicationUserList && applicationUserList.length > 0) {
//       setUsers([...applicationUserList].sort((a: ApplicationUserData, b: ApplicationUserData) => (a.id || 0) - (b.id || 0)));
//     }
//   }, [applicationUserList]);

//   // Fetch users and companies on component mount
//   useEffect(() => {
//     dispatch(getAllApplicationUsers({}));
//     dispatch(getAllCompanies({}));
//   }, [dispatch]);

//   // Companies list source
//   const companiesFromCompanyMaster: { id: number; name: string }[] = React.useMemo(() => {
//     const list = companies || [];
//     if (Array.isArray(list) && list.length > 0) {
//       return list
//         .filter((c) => c && (c.id || c.companyId) && (c.companyName || c.name))
//         .map((c) => ({ id: Number(c.id ?? c.companyId), name: String(c.companyName ?? c.name) }));
//     }
//     return [
//       { id: 1, name: 'Company A' },
//       { id: 2, name: 'Company B' },
//       { id: 3, name: 'Company C' },
//       { id: 4, name: 'Company D' },
//       { id: 5, name: 'Company E' },
//     ];
//   }, [companies]);

//   // Columns (your existing code)
//   const columns = useMemo(() => ([
//     { Header: 'Sl No', accessor: 'id', Cell: ({ row }: any) => row.index + 1 },
//     { Header: 'User Name', accessor: 'userName' },
//     { Header: 'Role', accessor: 'role' },
//     // { Header: 'Companies', accessor: (row: ApplicationUserData) => row.companies?.length ?? 0 },
//   ]), []);

//   // Handlers - keeping your existing flow but adding API calls
//   const openAdd = () => {
//     setIsEditing(false);
//     setCurrent(null);
//     setShowPassword(false);
//     setIsChangingPassword(false);
//     reset({ userName: '', password: '', role: 'Sales', companies: [] });
//     setIsModalOpen(true);
//   };

//   const onEdit = (row: ApplicationUserData) => {
//     setIsEditing(true);
//     setCurrent(row);
//     setShowPassword(false);
//     setIsChangingPassword(false);
//     reset(row);
//     setIsModalOpen(true);
//   };

//   const onDelete = async (row: ApplicationUserData) => {
//     if (row.id && window.confirm('Are you sure you want to delete this user?')) {
//       try {
//         // Call API through Redux
//         await dispatch(deleteApplicationUser(row.id)).unwrap();

//         // Update local state for immediate UI update
//         setUsers((prev) => prev.filter((u) => u.id !== row.id));

//         // Refresh from server to ensure consistency
//         dispatch(getAllApplicationUsers({}));
//       } catch (error) {
//         console.error('Failed to delete user:', error);
//         // Error is already handled by the slice with toast notifications
//       }
//     }
//   };

//   const onSubmit = async (data: ApplicationUserData) => {
//     try {
//       if (isEditing && current?.id) {
//         // For updates, only send password if it was changed
//         const updateData = {
//           id: current.id,
//           ...data,
//           activeFlag: data.activeFlag ?? true
//         };

//         // If password is empty in edit mode, remove it from the payload
//         if (!data.password) {
//           delete updateData.password;
//         }

//         await dispatch(updateApplicationUser(updateData)).unwrap();
//         setUsers((prev) => prev.map((u) => u.id === current.id ? { ...data, id: current.id } : u));
//       } else {
//         // For new users, password is required
//         await dispatch(createApplicationUser({
//           ...data,
//           activeFlag: true
//         })).unwrap();

//         // Refresh the list to get the actual user from backend
//         dispatch(getAllApplicationUsers({}));
//       }

//       setIsModalOpen(false);
//       reset();
//     } catch (error) {
//       console.error('Failed to save user:', error);
//     }
//   };

//   // Search handler
//   const onSearch = (query: string) => {
//     if (query.trim()) {
//       dispatch(searchApplicationUsers({ query }));
//     } else {
//       dispatch(getAllApplicationUsers({}));
//     }
//   };

//   return (
//     <div className="p-6 pt-16">
//       <h1 className="text-2xl font-semibold mb-6">Application User</h1>

//       <DataTable
//         columns={columns}
//         data={users} // Still using local users state for display
//         title="Application User List"
//         onAdd={openAdd}
//         onEdit={onEdit}
//         onDelete={onDelete}
//         showActions={true}
//         filterPlaceholder="Search User or Role..."
//       />

//       {isModalOpen && (
//         <div className="fixed inset-0 flex items-center justify-end z-50 bg-gray-800 bg-opacity-50">
//           <div className="bg-white p-8 shadow-lg w-3/4 h-full max-h-full overflow-y-auto">
//             <h2 className="text-xl font-semibold mb-6 text-gray-800 flex justify-between">
//               {isEditing ? 'Update User' : 'Add User'}
//               <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" onClick={() => setIsModalOpen(false)} className="bi bi-x cursor-pointer" viewBox="0 0 16 16">
//                 <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
//               </svg>
//             </h2>

//             <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
//               {/* User Details */}
//               <section>
//                 <h3 className="text-lg font-semibold mb-4">User Details</h3>
//                 <div className="grid grid-cols-3 gap-4">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700">User Name <span className="text-red-600">*</span></label>
//                     <input
//                       className="input mt-1"
//                       placeholder="VENKATESH"
//                       autoComplete='off'
//                       {...register('userName', { required: 'User Name is required', pattern: { value: /^[A-Za-z0-9]+$/, message: 'Alphanumeric only' } })}
//                     />
//                     {errors.userName && <p className="text-red-500 text-sm">{errors.userName.message}</p>}
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-gray-700">
//                       {isEditing ? (isChangingPassword ? 'New Password' : 'Password') : 'Password'}
//                       {((!isEditing) || (isEditing && isChangingPassword)) && <span className="text-red-600">*</span>}
//                       {isEditing && !isChangingPassword && <span className="text-gray-500 text-xs ml-1">(Click Change Password to update)</span>}
//                     </label>
//                     <div className="relative">
//                       <input
//                         className="input mt-1 pr-10"
//                         type={showPassword ? 'text' : 'password'}
//                         placeholder={isEditing ? (isChangingPassword ? "Enter new password" : "") : "Venkatesh@123"}
//                         autoComplete='off'
//                         readOnly={isEditing && !isChangingPassword}
//                         {...register('password', {
//                           required: isEditing ? isChangingPassword : true,
//                           pattern: isEditing ? (isChangingPassword ? {
//                             value: /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])(?=.*[0-9])[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{6,}$/,
//                             message: 'Password must contain at least one uppercase, one special character, one number, and be at least 6 characters long.'
//                           } : undefined) : {
//                             value: /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])(?=.*[0-9])[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{6,}$/,
//                             message: 'Password must contain at least one uppercase, one special character, one number, and be at least 6 characters long.'
//                           }
//                         })}
//                       />
//                       {(isEditing && isChangingPassword) || !isEditing ? (
//                         <button
//                           type="button"
//                           className="absolute inset-y-0 right-0 pr-3 flex items-center"
//                           onClick={() => setShowPassword(!showPassword)}
//                         >
//                           {showPassword ? (
//                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
//                               <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 2.25c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243zm-10.607 0a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
//                             </svg>
//                           ) : (
//                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
//                               <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.638 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
//                               <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//                             </svg>
//                           )}
//                         </button>
//                       ) : null}
//                     </div>
//                     {isEditing && !isChangingPassword && (
//                       <button
//                         type="button"
//                         className="mt-2 text-blue-600 underline"
//                         onClick={() => {
//                           setIsChangingPassword(true);
//                           setValue('password', '');
//                         }}
//                       >
//                         Change Password
//                       </button>
//                     )}
//                     {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-gray-700">Role <span className="text-red-600">*</span></label>
//                     <select className="input mt-1" {...register('role', { required: true })}>
//                       <option value="Sales">Sales</option>
//                       <option value="PPC">PPC</option>
//                       <option value="Inventory">Inventory</option>
//                     </select>
//                   </div>
//                 </div>
//               </section>

//               {/* Company Assignment */}
//               <section>
//                 <h3 className="text-lg font-semibold mb-4">Company Name <span className="text-red-600">*</span></h3>
//                 <div>
//                   <div className="grid grid-cols-3 gap-2">
//                     {companiesFromCompanyMaster.map((c) => (
//                       <label key={c.id} className="inline-flex items-center space-x-2">
//                         <Controller
//                           name="companies"
//                           control={control}
//                           rules={{
//                             validate: (value) => (Array.isArray(value) && value.length > 0) || 'Please select at least one company'
//                           }}
//                           render={({ field }) => (
//                             <input
//                               type="checkbox"
//                               checked={field.value?.includes(c.id) || false}
//                               className="w-6 h-6 accent-blue-600"
//                               onChange={(e) => {
//                                 const current = field.value || [];
//                                 if (e.target.checked) {
//                                   field.onChange([...current, c.id]);
//                                 } else {
//                                   field.onChange(current.filter(id => id !== c.id));
//                                 }
//                               }}
//                             />
//                           )}
//                         />
//                         <span>{c.name}</span>
//                       </label>
//                     ))}
//                   </div>
//                   {errors.companies && <p className="text-red-500 text-sm mt-2">{errors.companies.message}</p>}
//                 </div>
//               </section>

//               <div className="flex justify-end space-x-3 pt-4">
//                 <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
//                   Cancel
//                 </button>
//                 <button type="submit" className="btn btn-primary" disabled={loading || companyLoading}>
//                   {loading ? 'Saving...' : (isEditing ? 'Update' : 'Save')}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { DataTable } from '@/components/data/DataTable';
import { Pagination, usePagination } from '@/components/common/Pagination';
import { RootState, AppDispatch } from '@/state/store';
import {
  getAllApplicationUsers,
  createApplicationUser,
  updateApplicationUser,
  deleteApplicationUser,
  searchApplicationUsers
} from '@/state/application-user-slice';
import {
  getAllCompanies
} from '@/state/company-master-slice';
import UserPermissionAssignment from '@/components/settings/UserPermissionAssignment';
import CommonSearchableSelect from '@/components/ui/CommonSearchableSelect';

// Types
interface ApplicationUserData {
  id?: number;
  userName: string;
  password?: string;
  role: 'Sales' | 'PPC' | 'Inventory' | 'Admin' | 'Technical Team' | 'Merchant' | 'Sizing' | 'Weaving' | 'Brushing';  // NEW ROLES
  roleDisplayName?: string;  // NEW FIELD
  companies: number[];
  moduleId?: number;
  userType?: number;
  activeFlag?: boolean;
}

const USER_TYPE_OPTIONS = [
  { value: 1, label: 'Data Entry Operator' },
  { value: 2, label: 'Department Head' },
  { value: 3, label: 'Approver' },
];

export default function ApplicationUserPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { applicationUserList, loading, pagination } = useSelector((state: RootState) => state.applicationUser);
  const { companyMasterList: companies, loading: companyLoading } = useSelector((state: RootState) => state.companyMaster);

  // Local state for modal controls
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [permissionUser, setPermissionUser] = useState<ApplicationUserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [current, setCurrent] = useState<ApplicationUserData | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [applicationUsers, setApplicationUsers] = useState<ApplicationUserData[]>([]);
  const {
    currentPage,
    itemsPerPage,
    setItemsPerPage,
    handlePageChange,
    resetPage,
    getOffset
  } = usePagination({ itemsPerPage: 10 });

  // Form
  const { register, handleSubmit, reset, setValue, control, formState: { errors } } = useForm<ApplicationUserData>({ mode: 'onBlur' });

  useEffect(() => {
      const sortedUsers = [...(applicationUserList || [])]
        .sort((a: ApplicationUserData, b: ApplicationUserData) => (b.id || 0) - (a.id || 0))
        .map((user, index) => ({
          ...user,
          serialNo: (pagination.offset || 0) + index + 1
        }));
      setApplicationUsers(sortedUsers);
    }, [applicationUserList, pagination.offset]);

  // const applicationUsers = useMemo(() => {
  //   const list = Array.isArray(applicationUserList) ? applicationUserList : [];
  //   return [...list].sort((a: ApplicationUserData, b: ApplicationUserData) => (a.id || 0) - (b.id || 0));
  // }, [applicationUserList]);

  const fetchPage = useCallback(
    (offset: number) => dispatch(getAllApplicationUsers({ fetchAll:true})),
    [dispatch, currentPage, getOffset, itemsPerPage]
  );

  useEffect(() => {
    fetchPage(getOffset());
  }, [fetchPage, getOffset]);

  useEffect(() => {
    dispatch(getAllCompanies({ fetchAll: true }));
  }, [dispatch]);

  // Companies list source
  const companiesFromCompanyMaster: { id: number; name: string }[] = React.useMemo(() => {
    const list = companies || [];
    if (Array.isArray(list) && list.length > 0) {
      const uniqueCompanies = new Map();
      list.forEach((c) => {
        if (c) {
          const id = Number(c.id ?? c.companyId);
          const name = String(c.companyName ?? (c.name || c.company_name));
          if (id && name && !uniqueCompanies.has(id)) {
            uniqueCompanies.set(id, { id, name });
          }
        }
      });
      return Array.from(uniqueCompanies.values());
    }
    return [
      { id: 1, name: 'Company A' },
      { id: 2, name: 'Company B' },
      { id: 3, name: 'Company C' },
      { id: 4, name: 'Company D' },
      { id: 5, name: 'Company E' },
    ];
  }, [companies]);

  const companyMap = useMemo(() => {
    const map = new Map<number, string>();
    (companies || []).forEach((company: { id: any; companyId: any; companyName: any; name: any; company_name: any; }) => {
      if (!company) return;
      const id = Number(company.id ?? company.companyId);
      const name = company.companyName ?? company.name ?? company.company_name ?? '';
      if (id && name) {
        map.set(id, String(name));
      }
    });
    return map;
  }, [companies]);

  // Static modules list
  const modules = React.useMemo(() => [
    { id: 1, name: 'Trading' },
    { id: 2, name: 'Factory' },
    { id: 3, name: 'Sizing' },
    { id: 4, name: 'Processing' },
    { id: 5, name: 'Garment' },
    { id: 6, name: 'Spining' },
  ], []);

  // Columns (your existing code)
  const columns = useMemo(() => ([
      { Header: 'Sl No', accessor: 'serialNo' },
    { Header: 'User Name', accessor: 'userName' },
    // { Header: 'Role', accessor: 'role' },
    
{
  Header: 'Role',
  accessor: 'role',
  Cell: ({ row }: any) => row.original.roleDisplayName || row.original.role  // NEW: Use display name
},
    {
      Header: 'Companies',
      accessor: 'companies',
      Cell: ({ value }: any) => {
        const ids = Array.isArray(value) ? value : [];
        const names = ids
          .map((id) => companyMap.get(Number(id)))
          .filter(Boolean) as string[];
        return names.length ? names.join(', ') : '-';
      },
    },
    { 
      Header: 'User Type', 
      accessor: 'userType',
      Cell: ({ value }: any) => USER_TYPE_OPTIONS.find(opt => opt.value === Number(value))?.label || value || '-'
    },
    {
      id: 'permissions',
      Header: 'Permissions',
      accessor: 'id',
      Cell: ({ row }: any) => {
        const user = row.original;
        if (user.role?.toUpperCase() === 'ADMIN') {
          return <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">Full Access</span>;
        }
        return (
          <button
            onClick={() => {
              // setPermissionUser(user);
              // setIsPermissionModalOpen(true);
            }}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded border border-blue-200 transition"
          >
            Manage Permissions
          </button>
        );
      }
    }
    // { Header: 'Companies', accessor: (row: ApplicationUserData) => row.companies?.length ?? 0 },
  ]), [companyMap]);

  // Handlers - keeping your existing flow but adding API calls
  const openAdd = () => {
    setIsEditing(false);
    setCurrent(null);
    setShowPassword(false);
    setIsChangingPassword(false);
    reset({ userName: '', password: '', role: 'Sales', companies: [], moduleId: 1, userType: 1 });
    setIsModalOpen(true);
  };

  const onEdit = (row: ApplicationUserData) => {
    setIsEditing(true);
    setCurrent(row);
    setShowPassword(false);
    setIsChangingPassword(false);
    reset(row);
    setIsModalOpen(true);
  };

  const onDelete = async (row: ApplicationUserData) => {
    if (row.id && window.confirm('Are you sure you want to delete this user?')) {
      try {
        await dispatch(deleteApplicationUser(row.id)).unwrap();
        await fetchPage(getOffset());
      } catch (error) {
        console.error('Failed to delete user:', error);
      }
    }
  };

  const onSubmit = async (data: ApplicationUserData) => {
    try {
      if (isEditing && current?.id) {
        // For updates, only send password if it was changed
        const updateData = {
          id: current.id,
          ...data,
          activeFlag: data.activeFlag ?? true
        };

        if (!data.password) {
          delete updateData.password;
        }

        await dispatch(updateApplicationUser(updateData)).unwrap();
        await fetchPage(getOffset());
      } else {
        await dispatch(createApplicationUser({
          ...data,
          activeFlag: true
        })).unwrap();

        resetPage();
        await fetchPage(0);
      }

      setIsModalOpen(false);
      reset();
    } catch (error) {
      console.error('Failed to save user:', error);
    }
  };

  // Search handler
  const onSearch = (query: string) => {
    if (query.trim()) {
      dispatch(searchApplicationUsers({ query }));
    } else {
      resetPage();
      fetchPage(0);
    }
  };

  return (
    <div className="p-6 pt-16">

      <DataTable
        columns={columns}
        data={applicationUsers}
        title="Application User List"
        onAdd={openAdd}
        onEdit={onEdit}
        // onDelete={onDelete}
        showActions={true}
        filterPlaceholder="Search User or Role..."
        // initialPageSize={itemsPerPage}
        // onPageSizeChange={setItemsPerPage}
        //  totalCount={pagination?.total || 0}
        // currentPage={currentPage}
        // onPageChange={handlePageChange}
        disableFullDataFetch={true}
      />

      {/* <Pagination
        currentPage={currentPage}
        totalItems={pagination?.total || 0}
        itemsPerPage={itemsPerPage}
        offset={pagination?.offset || 0}
        hasNext={!!pagination?.next}
        hasPrev={!!pagination?.prev}
        onPageChange={handlePageChange}
      /> */}

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-end z-50 bg-gray-800 bg-opacity-50">
          <div className="bg-white p-8 shadow-lg w-3/4 h-full max-h-full overflow-y-auto">
            <h2 className="text-xl font-semibold mb-6 text-gray-800 flex justify-between">
              {isEditing ? 'Update User' : 'Add User'}
              <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" onClick={() => setIsModalOpen(false)} className="bi bi-x cursor-pointer" viewBox="0 0 16 16">
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
              </svg>
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* User Details */}
              <section>
                <h3 className="text-lg font-semibold mb-4">User Details</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">User Name <span className="text-red-600">*</span></label>
                    <input
                      className="input mt-1"
                      placeholder="VENKATESH"
                      autoComplete='off'
                      {...register('userName', { required: 'User Name is required', pattern: { value: /^[A-Za-z0-9]+$/, message: 'Alphanumeric only' } })}
                    />
                    {errors.userName && <p className="text-red-500 text-sm">{errors.userName.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {isEditing ? (isChangingPassword ? 'New Password' : 'Password') : 'Password'}
                      {((!isEditing) || (isEditing && isChangingPassword)) && <span className="text-red-600">*</span>}
                      {isEditing && !isChangingPassword && <span className="text-gray-500 text-xs ml-1">(Click Change Password to update)</span>}
                    </label>
                    <div className="relative">
                      <input
                        className="input mt-1 pr-10"
                        type={showPassword ? 'text' : 'password'}
                        placeholder={isEditing ? (isChangingPassword ? "Enter new password" : "") : "Venkatesh@123"}
                        autoComplete='off'
                        readOnly={isEditing && !isChangingPassword}
                        {...register('password', {
                          required: isEditing ? isChangingPassword : true,
                          pattern: isEditing ? (isChangingPassword ? {
                            value: /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])(?=.*[0-9])[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{6,}$/,
                            message: 'Password must contain at least one uppercase, one special character, one number, and be at least 6 characters long.'
                          } : undefined) : {
                            value: /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])(?=.*[0-9])[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{6,}$/,
                            message: 'Password must contain at least one uppercase, one special character, one number, and be at least 6 characters long.'
                          }
                        })}
                      />
                      {(isEditing && isChangingPassword) || !isEditing ? (
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 2.25c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243zm-10.607 0a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.638 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          )}
                        </button>
                      ) : null}
                    </div>
                    {isEditing && !isChangingPassword && (
                      <button
                        type="button"
                        className="mt-2 text-blue-600 underline"
                        onClick={() => {
                          setIsChangingPassword(true);
                          setValue('password', '');
                        }}
                      >
                        Change Password
                      </button>
                    )}
                    {errors.password && <p className="text-red-500 text-sm">{errors.password.message}</p>}
                  </div>

                  {/* <div>
                    <label className="block text-sm font-medium text-gray-700">Role <span className="text-red-600">*</span></label>
                    <select className="input mt-1" {...register('role', { required: true })}>
                      <option value="Admin">Admin</option>
                      <option value="Sales">Sales</option>
                      <option value="PPC">PPC</option>
                      <option value="Inventory">Inventory</option>
                    </select>
                  </div> */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role <span className="text-red-600">*</span></label>
                    <Controller
                      name="role"
                      control={control}
                      rules={{ required: 'Role is required' }}
                      render={({ field }) => (
                        <CommonSearchableSelect
                          {...field}
                          options={[
                            { value: 'Admin', label: 'Admin' },
                            { value: 'Sales', label: 'Sales' },
                            { value: 'Technical Team', label: 'Technical Team' },
                            { value: 'Merchant', label: 'Merchant' },
                            { value: 'Sizing', label: 'Sizing' },
                            { value: 'Weaving', label: 'Weaving' },
                            { value: 'Brushing', label: 'Brushing' },
                          ]}
                          placeholder="Select Role"
                          error={errors.role?.message}
                        />
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Module <span className="text-red-600">*</span></label>
                    <select className="input mt-1" {...register('moduleId', { required: 'Module is required', valueAsNumber: true })}>
                      {modules.map((module) => (
                        <option key={module.id} value={module.id}>
                          {module.name}
                        </option>
                      ))}
                    </select>
                    {errors.moduleId && <p className="text-red-500 text-sm">{errors.moduleId.message}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">User Type <span className="text-red-600">*</span></label>
                    <select className="input mt-1" {...register('userType', { required: 'User Type is required', valueAsNumber: true })}>
                      <option value="">Select User Type</option>
                      {USER_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {errors.userType && <p className="text-red-500 text-sm">{errors.userType.message}</p>}
                  </div>
                </div>
              </section>

              {/* Company Assignment */}
              <section>
                <h3 className="text-lg font-semibold mb-4">Company Name <span className="text-red-600">*</span></h3>
                <div>
                  <div className="grid grid-cols-3 gap-2">
                    {companiesFromCompanyMaster.map((c) => (
                      <label key={c.id} className="inline-flex items-center space-x-2">
                        <Controller
                          name="companies"
                          control={control}
                          rules={{
                            validate: (value) => (Array.isArray(value) && value.length > 0) || 'Please select at least one company'
                          }}
                          render={({ field }) => (
                            <input
                              type="checkbox"
                              checked={field.value?.includes(c.id) || false}
                              className="w-6 h-6 accent-blue-600"
                              onChange={(e) => {
                                const current = field.value || [];
                                if (e.target.checked) {
                                  field.onChange([...current, c.id]);
                                } else {
                                  field.onChange(current.filter(id => id !== c.id));
                                }
                              }}
                            />
                          )}
                        />
                        <span>{c.name}</span>
                      </label>
                    ))}
                  </div>
                  {errors.companies && <p className="text-red-500 text-sm mt-2">{errors.companies.message}</p>}
                </div>
              </section>

              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading || companyLoading}>
                  {loading ? 'Saving...' : (isEditing ? 'Update' : 'Save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPermissionModalOpen && permissionUser && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-800 bg-opacity-50">
          <div className="bg-white p-8 shadow-lg w-2/3 max-h-[90vh] overflow-hidden rounded-xl">
            <UserPermissionAssignment 
              userId={permissionUser.id!} 
              userName={permissionUser.userName} 
              userType={Number(permissionUser.userType)} 
              onClose={() => {
                setIsPermissionModalOpen(false);
                setPermissionUser(null);
              }} 
            />
          </div>
        </div>
      )}
    </div>
  );
}