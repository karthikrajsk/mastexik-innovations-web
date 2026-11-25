import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm, useFieldArray } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DataTable } from '@/components/data/DataTable';
import { Pagination, usePagination } from '@/components/common/Pagination';
import { CommonSearchableSelect } from '@/components/ui/CommonSearchableSelect';
import { RootState, AppDispatch } from '@/state/store';
import { addLevel2, updateLevel2, deleteLevel2, getAllLevel2Menus } from '@/state/level2MenuSlice';
import { getAllApplicationUsers } from '@/state/application-user-slice';
import { getAllLevel1Menus } from '@/state/level1MenuSlice';
import { getAllMenuMasters } from '@/state/menuMasterSlice';
import { Plus, Trash, GripVertical, Loader2 } from 'lucide-react';

interface Level2ItemRow {
  id?: number;
  level1Id: string | number;
  menuMasterId: string | number;
  url: string;
  sequence: number | string;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canView: boolean;
  canExport: boolean;
  canPrint: boolean;
  canApprove: boolean;
}

interface Level2Form {
  id?: number;
  userId: string | number;
  userType?: number | string;
  isCloneEnabled?: boolean;
  cloneFromUserId?: string | number;
  items: Level2ItemRow[];
}

const USER_TYPE_LABELS: Record<number, string> = {
  1: 'Data Entry Operator',
  2: 'Department Head',
  3: 'Approver',
};

interface SortableLevel2RowProps {
  fieldId: string;
  index: number;
  register: any;
  errors: any;
  allLevel1Items: any[];
  sortedMenuMasterList: any[];
  items: Level2ItemRow[] | undefined;
  currentUserType: any;
  setValue: any;
  onAdd: (idx: number) => void;
  onRemove: (idx: number) => void;
}

function SortableLevel2Row({
  fieldId,
  index,
  register,
  errors,
  allLevel1Items,
  sortedMenuMasterList,
  items,
  currentUserType,
  setValue,
  onAdd,
  onRemove,
}: SortableLevel2RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: fieldId });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    background: isDragging ? '#eff6ff' : undefined,
  };

  return (
    <tr ref={setNodeRef} style={style} className="hover:bg-slate-50 transition-colors odd:bg-white even:bg-slate-50/50">
      <td className="p-3 border-r border-gray-200 text-gray-800">
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 flex justify-center"
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </span>
      </td>

      <td className="p-3 border-r border-gray-200 text-center text-sm text-gray-600 font-medium">
        {index + 1}
      </td>

      <td className="p-3 whitespace-nowrap overflow-visible relative border-r border-gray-200">
        <CommonSearchableSelect
          className="min-w-[220px]"
          options={(allLevel1Items || []).map((l: any) => ({
            value: String(l.id ?? l.name),
            label: l.name,
          }))}
          placeholder="Select"
          onValueChange={(value) => {
            setValue(`items.${index}.level1Id` as const, value as any, { shouldValidate: true, shouldDirty: true });
          }}
          {...register(`items.${index}.level1Id` as const, { required: 'Required' })}
          error={errors.items?.[index]?.level1Id?.message as string}
        />
      </td>

      <td className="p-3 whitespace-nowrap overflow-visible relative border-r border-gray-200">
        <CommonSearchableSelect
          className="min-w-[220px]"
          options={(sortedMenuMasterList || [])
            .filter((m: any) => {
              const usedIds = (items || [])
                .filter((_, i) => i !== index)
                .map((it) => String(it.menuMasterId))
                .filter(Boolean);
              return !usedIds.includes(String(m.id));
            })
            .map((m: any) => ({
              value: String(m.id),
              label: m.screenName,
            }))}
          placeholder="Select"
          {...register(`items.${index}.menuMasterId` as const, { required: 'Required' })}
          onChange={(value: any) => {
            const v = value?.target ? value.target.value : value;
            setValue(`items.${index}.menuMasterId` as const, v as any, { shouldDirty: true });
            const mm = (sortedMenuMasterList || []).find((x: any) => String(x.id) === String(v));
            if (mm?.menuUrl) {
              setValue(`items.${index}.url` as const, mm.menuUrl as any, { shouldDirty: true });
            }
          }}
          error={errors.items?.[index]?.menuMasterId?.message as string}
        />
      </td>

      <td className="p-3 whitespace-nowrap border-r border-gray-200">
        <input
          className="input"
          {...register(`items.${index}.url` as const, { required: 'Required' })}
        />
        {errors.items?.[index]?.url && (
          <p className="text-red-500 text-sm mt-1">{errors.items[index]?.url?.message}</p>
        )}
      </td>

      <td className="p-3 whitespace-nowrap border-r border-gray-200 text-center text-sm text-gray-600 font-medium">
        {index + 1}
      </td>

      <td className="p-3 whitespace-nowrap border-r border-gray-200">
        <div className="flex items-center justify-center gap-x-3 whitespace-nowrap">
          <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              {...register(`items.${index}.canView` as const)}
            />
            <span>View</span>
          </label>
          <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              {...register(`items.${index}.canAdd` as const)}
            />
            <span>Add</span>
          </label>
          <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              {...register(`items.${index}.canEdit` as const)}
            />
            <span>Edit</span>
          </label>
          <label className={`inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 cursor-pointer ${Number(currentUserType) < 2 ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <input
              type="checkbox"
              className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              disabled={Number(currentUserType) < 2}
              {...register(`items.${index}.canDelete` as const)}
            />
            <span>Delete</span>
          </label>
          <label className={`inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 cursor-pointer ${Number(currentUserType) !== 3 ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <input
              type="checkbox"
              className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              disabled={Number(currentUserType) !== 3}
              {...register(`items.${index}.canApprove` as const)}
            />
            <span>Approve</span>
          </label>
        </div>
      </td>

      <td className="p-3 whitespace-nowrap text-sm font-medium border-r border-gray-200 last:border-r-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onAdd(index)}
            className="p-2 rounded-full text-green-600 hover:bg-green-100"
            title="Add another row"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-red-600 hover:text-red-900"
          >
            <Trash className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function Level2MenuPage() {
  const dispatch = useDispatch<AppDispatch>();
  const isInitialEditLoad = useRef(false);
  const { list: level2List, pagination: level2Pagination } = useSelector((s: RootState) => s.level2Menu);
  const { allList: level1AllList } = useSelector((s: RootState) => s.level1Menu);
  const { list: menuMasterList } = useSelector((s: RootState) => s.menuMaster);
  const { applicationUserList } = useSelector((s: RootState) => s.applicationUser);
  const { refreshUserMenu } = useAuth();

  const sortedMenuMasterList = useMemo(() => {
    return [...(menuMasterList || [])].sort((a: any, b: any) =>
      String(a.screenName || '').localeCompare(String(b.screenName || ''))
    );
  }, [menuMasterList]);

  const [rows, setRows] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [current, setCurrent] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    currentPage: level2CurrentPage,
    itemsPerPage: level2ItemsPerPage,
    handlePageChange: handleLevel2PageChange,
    getOffset: getLevel2Offset,
    setItemsPerPage: setLevel2ItemsPerPage,
  } = usePagination({ itemsPerPage: 10 });

  const refreshLevel2Menus = useCallback(() => {
    dispatch(getAllLevel2Menus({fetchAll:true }) as any);
  }, [dispatch, getLevel2Offset, level2ItemsPerPage]);

  const { register, handleSubmit, reset, control, setValue, watch, formState: { errors } } = useForm<Level2Form>({ mode: 'onBlur' });
  const { fields, append, insert, remove, move } = useFieldArray({ control, name: 'items' });
  const selectedUserId = watch('userId') as any;
  const isCloneEnabled = watch('isCloneEnabled');
  const cloneFromUserId = watch('cloneFromUserId');
  const currentUserType = watch('userType');
  const items = watch('items') as Level2ItemRow[] | undefined;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = fields.findIndex((f) => f.id === active.id);
    const newIndex = fields.findIndex((f) => f.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    move(oldIndex, newIndex);

    const currentItems = watch('items') || [];
    const reordered = arrayMove(currentItems, oldIndex, newIndex);
    reordered.forEach((_, i) => {
      setValue(`items.${i}.sequence`, i + 1, { shouldDirty: true });
    });
  };

  useEffect(() => {
    if (selectedUserId) {
      const user = (applicationUserList || []).find((u: any) => String(u.id) === String(selectedUserId));
      if (user) {
        const type = Number(user.userType);
        setValue('userType', user.userType);

        if (!isEditing && (!isCloneEnabled || !cloneFromUserId)) {
          const currentItems = watch('items') || [];
          currentItems.forEach((_, index) => {
            setValue(`items.${index}.canView`, true, { shouldDirty: true });
            setValue(`items.${index}.canAdd`, true, { shouldDirty: true });
            setValue(`items.${index}.canEdit`, true, { shouldDirty: true });
            setValue(`items.${index}.canDelete`, type >= 2, { shouldDirty: true });
            setValue(`items.${index}.canApprove`, type >= 3, { shouldDirty: true });
          });
        }
      }
    } else {
      setValue('userType', '');
    }
  }, [selectedUserId, applicationUserList, setValue, isEditing, isCloneEnabled, cloneFromUserId]);

  useEffect(() => {
    if (isInitialEditLoad.current) {
      isInitialEditLoad.current = false;
      return;
    }

    if (isCloneEnabled && cloneFromUserId) {
      const sourceUserAggregate = (level2List || []).find((u: any) => String(u.userId) === String(cloneFromUserId));
      if (sourceUserAggregate && Array.isArray(sourceUserAggregate.items)) {
        const clonedItems = sourceUserAggregate.items.map((it: any, i: number) => ({
          level1Id: it.level1Id,
          menuMasterId: it.menuMasterId,
          url: it.url,
          sequence: i + 1,
          canAdd: !!it.canAdd,
          canEdit: !!it.canEdit,
          canDelete: !!it.canDelete,
          canView: !!it.canView,
          canExport: !!it.canExport,
          canPrint: !!it.canPrint,
          canApprove: !!it.canApprove,
        }));
        setValue('items', clonedItems as any, { shouldDirty: true });
      }
    }
  }, [cloneFromUserId, isCloneEnabled, level2List, setValue]);

  const allLevel1Items = useMemo(() => {
    if (!selectedUserId) {
      return [];
    }

    const byId = new Map<string, any>();
    const byName = new Map<string, any>();

    const targetUserIds = [String(selectedUserId)];
    if (isCloneEnabled && cloneFromUserId) {
      targetUserIds.push(String(cloneFromUserId));
    }

    // Collect referenced Level 1 IDs from the current form items
    const referencedLevel1Ids = new Set(
      (items || [])
        .map((it) => String(it.level1Id))
        .filter(Boolean)
    );

    const filteredAggregates = (level1AllList || []).filter((agg: any) =>
      targetUserIds.includes(String(agg?.userId))
    );

    // Helper to add an item
    const addItem = (it: any) => {
      if (it?.id != null) {
        const key = String(it.id);
        if (!byId.has(key)) {
          byId.set(key, { ...it, name: it.name || it['Level 1 Name'] });
        }
      } else {
        const nameValue = it?.name || it?.['Level 1 Name'];
        if (nameValue) {
          const key = String(nameValue).toLowerCase();
          if (!byName.has(key)) {
            byName.set(key, { ...it, name: nameValue });
          }
        }
      }
    };

    // 1. Add all Level 1 menus from the target users (selected user + clone source)
    filteredAggregates.forEach((agg: any) => {
      (agg?.items || []).forEach(addItem);
    });

    // 2. Add any other Level 1 menus that are currently referenced by the form items
    if (referencedLevel1Ids.size > 0) {
      (level1AllList || []).forEach((agg: any) => {
        (agg?.items || []).forEach((it: any) => {
          if (it?.id != null && referencedLevel1Ids.has(String(it.id))) {
            addItem(it);
          }
        });
      });
    }

    const merged = [...byId.values(), ...byName.values()];
    merged.sort((a: any, b: any) => String(a?.name || '').localeCompare(String(b?.name || '')));
    return merged;
  }, [level1AllList, selectedUserId, isCloneEnabled, cloneFromUserId, items]);

  useEffect(() => {
    dispatch(getAllLevel1Menus({ fetchAll: true }) as any);
    if (!applicationUserList || applicationUserList.length === 0) {
      dispatch(getAllApplicationUsers({ fetchAll: true } as any));
    }
    if (!menuMasterList || menuMasterList.length === 0) {
      dispatch(getAllMenuMasters() as any);
    }
  }, [dispatch, applicationUserList?.length, menuMasterList?.length]);

  useEffect(() => {
    refreshLevel2Menus();
  }, [refreshLevel2Menus]);

  useEffect(() => {
    refreshUserMenu();
  }, []);

  useEffect(() => {
    const baseOffset = Number(level2Pagination?.offset ?? 0);
    const list = level2List || [];
    let grouped: any[] = [];
    if (Array.isArray(list) && list.length > 0 && Array.isArray((list as any)[0]?.items)) {
      grouped = list.map((u: any, idx: number) => ({
        sno: baseOffset + idx + 1,
        id: u.id ?? u.userId,
        userId: u.userId ?? u.id,
        items: Array.isArray(u.items) ? [...u.items].sort((a: any, b: any) => (Number(a.sequence) || 0) - (Number(b.sequence) || 0)) : [],
      }));
    } else {
      const map = new Map<string, any>();
      (list as any[]).forEach((x: any) => {
        const key = String(x.userId || '');
        if (!map.has(key)) map.set(key, { id: key, userId: x.userId, items: [] });
        map.get(key).items.push({
          id: x.id,
          level1Id: x.level1Id,
          menuMasterId: x.menuMasterId,
          url: x.url,
          sequence: x.sequence,
          canAdd: x.canAdd,
          canEdit: x.canEdit,
          canDelete: x.canDelete,
          canView: x.canView,
          canExport: x.canExport,
          canPrint: x.canPrint,
          canApprove: x.canApprove,
        });
      });
      grouped = Array.from(map.values()).map((g: any, idx: number) => ({
        ...g,
        sno: baseOffset + idx + 1,
        items: (g.items || []).sort((a: any, b: any) => (Number(a.sequence) || 0) - (Number(b.sequence) || 0)),
      }));
    }
    setRows(grouped as any);
  }, [level2List, level2Pagination]);

  const columns = useMemo(() => ([
    { Header: 'Sl No', accessor: (r: any) => r.sno },
    {
      Header: 'User',
      accessor: (r: any) => {
        const user = (applicationUserList || []).find((x: any) => String(x.id) === String(r.userId));
        if (!user) return r.userId;
        const typeLabel = USER_TYPE_LABELS[Number(user.userType)] || user.userType || '-';
        return `${user.userName} (${typeLabel})`;
      },
    },
    {
      Header: 'Screens',
      accessor: (r: any) => {
        const names = (r.items || []).map((it: any) =>
          (menuMasterList || []).find((x: any) => String(x.id) === String(it.menuMasterId))?.screenName || it.menuMasterId
        );
        return names.filter(Boolean).join(', ');
      },
    },
    { Header: 'Count', accessor: (r: any) => (r.items || []).length },
  ]), [applicationUserList, menuMasterList]);

  const openAdd = () => {
    isInitialEditLoad.current = false;
    setIsEditing(false);
    setCurrent(null);
    reset({
      userId: '',
      userType: '',
      items: [{
        level1Id: '',
        menuMasterId: '',
        url: '',
        sequence: 1,
        canAdd: true,
        canEdit: true,
        canDelete: false,
        canView: true,
        canExport: true,
        canPrint: true,
        canApprove: false,
      }],
    });
    setIsModalOpen(true);
  };

  const onEdit = (row: any) => {
    isInitialEditLoad.current = true;
    setIsEditing(true);
    setCurrent(row);

    const user = (applicationUserList || []).find((u: any) => String(u.id) === String(row.userId));
    const userTypeNum = Number(user?.userType || 0);

    const userRows = [...(Array.isArray(row.items) ? row.items : [])]
      .sort((a: any, b: any) => (Number(a.sequence) || 0) - (Number(b.sequence) || 0))
      .map((l: any, i: number) => ({
        id: l.id,
        level1Id: l.level1Id,
        menuMasterId: l.menuMasterId,
        url: l.url,
        sequence: i + 1,
        canAdd: !!l.canAdd,
        canEdit: !!l.canEdit,
        canDelete: userTypeNum >= 2 ? !!l.canDelete : false,
        canView: !!l.canView,
        canExport: !!l.canExport,
        canPrint: !!l.canPrint,
        canApprove: userTypeNum === 3 ? !!l.canApprove : false,
      })) as Level2ItemRow[];

    // Auto-detect clone state
    let isCloned = false;
    let detectedCloneFromUserId = '';

    if (userRows.length > 0) {
      const sampleLevel1Id = userRows[0].level1Id;
      if (sampleLevel1Id) {
        const foundLevel1Agg = (level1AllList || []).find((agg: any) =>
          (agg.items || []).some((item: any) => String(item.id) === String(sampleLevel1Id))
        );
        if (foundLevel1Agg && String(foundLevel1Agg.userId) !== String(row.userId)) {
          isCloned = true;
          detectedCloneFromUserId = String(foundLevel1Agg.userId);
        }
      }
    }

    reset({
      userId: String(row.userId || ''),
      userType: user?.userType || '',
      isCloneEnabled: isCloned,
      cloneFromUserId: detectedCloneFromUserId,
      items: userRows,
    } as any);

    setIsModalOpen(true);
  };

  const onDelete = (row: Level2Form) => {
    if (row.id) {
      dispatch(deleteLevel2(row.id) as any).then(() => refreshLevel2Menus());
    }
  };

  const addNewRow = (index?: number) => {
    const currentItems = items || [];
    const baseItem = typeof index === 'number' ? currentItems[index] : currentItems[currentItems.length - 1];
    const newSeq = currentItems.length + 1;
    const type = Number(currentUserType);

    const newRow = {
      level1Id: baseItem?.level1Id || '',
      menuMasterId: '',
      url: '',
      sequence: newSeq,
      canAdd: true,
      canEdit: true,
      canDelete: type >= 2,
      canView: true,
      canExport: true,
      canPrint: true,
      canApprove: type >= 3,
    } as any;

    if (typeof index === 'number') {
      insert(index + 1, newRow);
      setTimeout(() => {
        const updated = watch('items') || [];
        updated.forEach((_, i) => setValue(`items.${i}.sequence`, i + 1, { shouldDirty: true }));
      }, 0);
    } else {
      append(newRow);
    }
  };

  const removeRow = (index: number) => {
    remove(index);
    setTimeout(() => {
      const updated = watch('items') || [];
      updated.forEach((_, i) => setValue(`items.${i}.sequence`, i + 1, { shouldDirty: true }));
    }, 0);
  };

  const onSubmit = (data: Level2Form) => {
    if (!data.userId) return;
    if (!data.items || data.items.length === 0) return;

    const userIdNum = Number(data.userId);
    const dto: any = {
      userId: userIdNum,
      userType: Number(data.userType),
      items: (data.items || []).map((r, idx) => {
        const raw = (r as any).level1Id;
        let resolvedId = Number(raw);
        if (!resolvedId || Number.isNaN(resolvedId)) {
          const found = (allLevel1Items || []).find(
            (it: any) => String(it.id) === String(raw) || String(it.name) === String(raw)
          );
          resolvedId = Number(found?.id) || 0;
        }
        return {
          id: (r as any).id,
          level1Id: resolvedId,
          menuMasterId: Number(r.menuMasterId),
          url: r.url ?? '',
          sequence: idx + 1,
          canAdd: !!r.canAdd,
          canEdit: !!r.canEdit,
          canDelete: Number(data.userType) >= 2 ? !!r.canDelete : false,
          canView: !!r.canView,
          canExport: true,
          canPrint: true,
          canApprove: Number(data.userType) === 3 ? !!r.canApprove : false,
        };
      }),
    };

    const action = isEditing ? updateLevel2 : addLevel2;
    const payload = isEditing ? { ...dto, id: Number(current?.id ?? userIdNum) } : dto;

    setIsSubmitting(true);
    (dispatch(action(payload) as any) as any)
      .then(() => {
        refreshLevel2Menus();
        refreshUserMenu();
        setIsModalOpen(false);
        reset({ userId: '', items: [] } as any);
        setIsEditing(false);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <div className="p-6 pt-16">
 
      <DataTable
        columns={columns}
        data={rows}
        title="Level 2 Menu List"
        onAdd={openAdd}
        onEdit={onEdit}
        // onDelete={onDelete}
        showActions={true}
        showColumnFilters={true}
        filterPlaceholder="Search..."
        disableFullDataFetch={true}
        // initialPageSize={level2ItemsPerPage}
        // onPageSizeChange={setLevel2ItemsPerPage}
        // totalCount={level2Pagination?.total || 0}
        // currentPage={level2CurrentPage + 1}
      />
{/* 
      <Pagination
        currentPage={level2CurrentPage}
        totalItems={level2Pagination?.total || 0}
        itemsPerPage={level2ItemsPerPage}
        offset={level2Pagination?.offset || 0}
        hasNext={!!level2Pagination?.next}
        hasPrev={!!level2Pagination?.prev}
        onPageChange={handleLevel2PageChange}
      /> */}

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-end z-50 bg-gray-800 bg-opacity-50">
          <div className="bg-white p-8 shadow-lg w-3/4 h-full max-h-full overflow-y-auto">
            <h2 className="text-xl font-semibold mb-6 text-gray-800 flex justify-between">
              {isEditing ? 'Update Level 2 Menus' : 'Add Level 2 Menus'}
              <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" onClick={() => setIsModalOpen(false)} className="bi bi-x cursor-pointer" viewBox="0 0 16 16">
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
              </svg>
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <section>
                <h3 className="text-lg font-semibold mb-4">Details</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">User <span className="text-red-600">*</span></label>
                    <CommonSearchableSelect
                      options={(applicationUserList || []).map((u: any) => ({
                        value: String(u.id),
                        label: `${u.userName} (${USER_TYPE_LABELS[Number(u.userType)] || u.userType || '-'})`,
                      }))}
                      placeholder="Select User"
                      {...register('userId', {
                        required: 'Required',
                        validate: (v) => {
                          const sv = String(v || '');
                          if (!sv) return true;
                          const existing = new Set(((rows || []) as any[]).map((r: any) => String(r?.userId ?? '')));
                          if (isEditing && String(current?.userId ?? current?.id ?? '') === sv) return true;
                          return !existing.has(sv) || 'This user already exists';
                        },
                      })}
                      error={errors.userId?.message as string}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">User Type</label>
                    <input
                      className="input mt-1 bg-gray-100"
                      value={USER_TYPE_LABELS[Number(watch('userType'))] || watch('userType') || ''}
                      readOnly
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <input
                      id="isCloneEnabled"
                      type="checkbox"
                      className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      {...register('isCloneEnabled')}
                    />
                    <label htmlFor="isCloneEnabled" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Clone
                    </label>
                  </div>

                  {isCloneEnabled && (
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Clone From User <span className="text-red-600">*</span>
                      </label>
                      <CommonSearchableSelect
                        className="min-w-[220px] mt-1"
                        placeholder="Select User to Clone"
                        options={(applicationUserList || [])
                          .filter(
                            (u: any) =>
                              String(u.id) !== String(selectedUserId) &&
                              Number(u.userType) === Number(currentUserType)
                          )
                          .map((u: any) => ({
                            value: String(u.id),
                            label: `${u.userName} (${USER_TYPE_LABELS[Number(u.userType)] || u.userType || '-'})`,
                          }))}
                        {...register('cloneFromUserId', {
                          required: isCloneEnabled ? 'Required' : false,
                        })}
                        error={errors.cloneFromUserId?.message as string}
                      />
                    </div>
                  )}
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-4">Level 2 Menu Items</h3>

                {fields.length === 0 && (
                  <button
                    type="button"
                    onClick={() => addNewRow()}
                    className="btn btn-primary mb-4"
                  >
                    Add Row
                  </button>
                )}

                <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                      <table className="w-full border-collapse text-sm popup-table">
                        <thead className="text-sm font-semibold uppercase tracking-wide text-white">
                          <tr className="border-b border-gray-200">
                            <th className="p-3 border-r border-gray-200 w-8"></th>
                            <th className="p-3 text-left border-r border-gray-200">
                              Seq
                            </th>
                            <th className="p-3 text-left border-r border-gray-200">
                              Level 1 Menu
                            </th>
                            <th className="p-3 text-left border-r border-gray-200">
                              Menu Master
                            </th>
                            <th className="p-3 text-left border-r border-gray-200">
                              URL
                            </th>
                            <th className="p-3 text-left border-r border-gray-200">
                              Sequence
                            </th>
                            <th className="p-3 text-left border-r border-gray-200">
                              Permissions
                            </th>
                            <th className="p-3 text-left border-r border-gray-200 last:border-r-0">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {fields.map((f, index) => (
                            <SortableLevel2Row
                              key={f.id}
                              fieldId={f.id}
                              index={index}
                              register={register}
                              errors={errors}
                              allLevel1Items={allLevel1Items}
                              sortedMenuMasterList={sortedMenuMasterList}
                              items={items}
                              currentUserType={currentUserType}
                              setValue={setValue}
                              onAdd={addNewRow}
                              onRemove={removeRow}
                            />
                          ))}
                        </tbody>
                      </table>
                    </SortableContext>
                  </DndContext>
                </div>
              </section>

              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary" disabled={isSubmitting}>Cancel</button>
                <button
                  type="submit"
                  disabled={!selectedUserId || fields.length === 0 || isSubmitting}
                  className={`btn btn-primary inline-flex items-center gap-2 ${!selectedUserId || fields.length === 0 || isSubmitting ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSubmitting ? (isEditing ? 'Updating...' : 'Saving...') : (isEditing ? 'Update' : 'Save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
