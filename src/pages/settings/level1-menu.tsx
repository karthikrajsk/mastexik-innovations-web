
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { RootState, AppDispatch } from '@/state/store';
import { saveLevel1ByUser, getAllLevel1Menus } from '@/state/level1MenuSlice';
import { getAllApplicationUsers } from '@/state/application-user-slice';
import CommonSearchableSelect from '@/components/ui/CommonSearchableSelect';
import { Plus, Trash, GripVertical } from 'lucide-react';
import { toast } from 'react-toastify';

interface Level1ItemRow {
  id?: number;
  name: string;
  sequence: number | string;
}

interface Level1Form {
  id?: number;
  userId: string | number;
  userType?: number | string;
  isCloneEnabled?: boolean;
  cloneFromUserId?: string | number;
  items: Level1ItemRow[];
}

const USER_TYPE_LABELS: Record<number, string> = {
  1: 'Data Entry Operator',
  2: 'Department Head',
  3: 'Approver',
};

interface SortableRowProps {
  fieldId: string;
  index: number;
  register: any;
  errors: any;
  onAdd: (idx: number) => void;
  onRemove: (idx: number) => void;
}

function SortableRow({ fieldId, index, register, errors, onAdd, onRemove }: SortableRowProps) {
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
      <td className="p-3 border-r border-gray-200 text-gray-800">{index + 1}</td>
      <td className="p-3 border-r border-gray-200 text-gray-800">
        <input
          className="input"
          {...register(`items.${index}.name`, { required: 'Required' })}
        />
        {errors.items?.[index]?.name && (
          <p className="text-red-500 text-sm mt-1">{errors.items[index]?.name?.message}</p>
        )}
      </td>
      <td className="p-3 border-r border-gray-200 text-center text-sm text-gray-600 font-medium">
        {index + 1}
      </td>
      <td className="p-3 border-r border-gray-200 last:border-r-0 text-gray-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onAdd(index)}
            className="p-2 rounded-full text-green-600 hover:bg-green-100"
            title="Add another row"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-red-600 hover:text-red-800"
            title="Remove"
          >
            <Trash className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function Level1MenuPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { list, pagination } = useSelector((s: RootState) => s.level1Menu);
  const { applicationUserList } = useSelector((s: RootState) => s.applicationUser);
  const { refreshUserMenu } = useAuth();

  const [rows, setRows] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [current, setCurrent] = useState<any | null>(null);

  const {
    currentPage,
    itemsPerPage,
    handlePageChange,
    getOffset,
    setItemsPerPage,
  } = usePagination({ itemsPerPage: 10 });

  const refreshLevel1Menus = useCallback(() => {
    dispatch(getAllLevel1Menus({ fetchAll: true }) as any);
  }, [dispatch]);

  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors } } = useForm<Level1Form>({
    mode: 'onBlur',
  });

  const { fields, append, insert, remove, move } = useFieldArray({ control, name: 'items' });

  const watchedUserId = watch('userId');
  const isCloneEnabled = watch('isCloneEnabled');
  const cloneFromUserId = watch('cloneFromUserId');
  const items = watch('items') as Level1ItemRow[] | undefined;

  const [serverLevel1Error, setServerLevel1Error] = useState<string | null>(null);

  const clearServerValidationError = () => {
    if (serverLevel1Error) setServerLevel1Error(null);
  };

  const showServerValidationError = (message?: string) => {
    setServerLevel1Error(message || 'Save failed');
  };

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
    if (watchedUserId) {
      const user = (applicationUserList || []).find((u: any) => String(u.id) === String(watchedUserId));
      if (user) {
        setValue('userType', user.userType);
      }
    } else {
      setValue('userType', '');
    }
  }, [watchedUserId, applicationUserList, setValue, isCloneEnabled, cloneFromUserId]);

  useEffect(() => {
    if (isCloneEnabled && cloneFromUserId) {
      const sourceUserAggregate = (list || []).find((u: any) => String(u.userId) === String(cloneFromUserId));
      if (sourceUserAggregate && Array.isArray(sourceUserAggregate.items)) {
        const clonedItems = sourceUserAggregate.items.map((it: any, i: number) => ({
          name: it?.['Level 1 Name'] ?? it?.name ?? '',
          sequence: i + 1,
        }));
        setValue('items', clonedItems, { shouldDirty: true });
      }
    }
  }, [cloneFromUserId, isCloneEnabled, list, setValue]);

  useEffect(() => {
    const baseOffset = Number(pagination?.offset ?? 0);
    const arr = (list || []).map((u: any, idx: number) => {
      const uid = u?.userId ?? '';
      return {
        sno: baseOffset + idx + 1,
        userId: uid,
        userName: '',
        items: Array.isArray(u?.items) ? u.items : [],
        names: (Array.isArray(u?.items) ? u.items : [])
          .map((it: any) => it?.['Level 1 Name'] ?? it?.name)
          .filter(Boolean),
      };
    });
    setRows(arr);
  }, [list, pagination]);

  const userIdToName = useMemo(() => {
    const map: Record<string, string> = {};
    (applicationUserList || []).forEach((u: any) => {
      if (u?.id != null) map[String(u.id)] = u.userName ?? '';
    });
    return map;
  }, [applicationUserList]);

  const userIdToType = useMemo(() => {
    const map: Record<string, string> = {};
    (applicationUserList || []).forEach((u: any) => {
      if (u?.id != null) {
        const typeId = Number(u.userType);
        map[String(u.id)] = USER_TYPE_LABELS[typeId] || String(u.userType || '-');
      }
    });
    return map;
  }, [applicationUserList]);

  const columns = useMemo(
    () => [
      { Header: 'S. No', accessor: (r: any) => r.sno },
      { Header: 'User', accessor: (r: any) => r.userName || userIdToName[String(r.userId)] || '' },
      { Header: 'User Type', accessor: (r: any) => userIdToType[String(r.userId)] || '-' },
      { Header: 'Level 1 Name(s)', accessor: (r: any) => (r.names || []).join(', ') },
    ],
    [userIdToName, userIdToType]
  );

  const openAdd = () => {
    clearServerValidationError();
    setIsEditing(false);
    setCurrent(null);
    reset({ userId: '', userType: '', items: [{ name: '', sequence: 1 }] });
    setIsModalOpen(true);
  };

  const onEdit = (row: any) => {
    clearServerValidationError();
    setIsEditing(true);
    setCurrent(row);

    const itemsForUser = Array.isArray(row.items) ? row.items : [];
    const user = (applicationUserList || []).find((u: any) => String(u.id) === String(row.userId));

    const sorted = [...itemsForUser].sort((a: any, b: any) => (Number(a.sequence) || 0) - (Number(b.sequence) || 0));

    reset({
      userId: String(row.userId || ''),
      userType: user?.userType || '',
      items: sorted.length > 0
        ? sorted.map((x: any, i: number) => ({
            id: x.id,
            name: x['Level 1 Name'] ?? x.name ?? '',
            sequence: i + 1,
          }))
        : [{ name: '', sequence: 1 }],
    });
    setIsModalOpen(true);
  };

  const handleAddRow = (index?: number) => {
    clearServerValidationError();
    const currentItems = items || [];
    const newSeq = currentItems.length + 1;
    const newRow = { name: '', sequence: newSeq };

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

  const handleRemoveRow = (index: number) => {
    remove(index);
    setTimeout(() => {
      const updated = watch('items') || [];
      updated.forEach((_, i) => setValue(`items.${i}.sequence`, i + 1, { shouldDirty: true }));
    }, 0);
  };

  const onSubmit = async (data: Level1Form) => {
    clearServerValidationError();

    const filteredItems = (data.items || []).filter(it => String(it.name || '').trim());
    const nameSet = new Set<string>();
    for (const it of filteredItems) {
      const normalized = String(it.name).trim().toLowerCase();
      if (nameSet.has(normalized)) {
        toast.error(`Duplicate Level 1 Name: "${String(it.name).trim()}" already exists in the list.`);
        return;
      }
      nameSet.add(normalized);
    }

    try {
      const userIdNum = Number(data.userId);

      const payload: any = {
        userId: userIdNum,
        userType: Number(data.userType),
        items: filteredItems.map((it, index) => ({
          id: it.id || undefined,
          name: String(it.name || '').trim(),
          sequence: index + 1,
        })),
      };

      const result = await dispatch(saveLevel1ByUser(payload));
      if (saveLevel1ByUser.fulfilled.match(result)) {
        await refreshLevel1Menus();
        await refreshUserMenu();
        setIsModalOpen(false);
        reset();
        return;
      }

      if (saveLevel1ByUser.rejected.match(result)) {
        const message = (result.payload as string) || result.error?.message;
        showServerValidationError(message);
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message;
      showServerValidationError(message);
      console.error('Save failed:', error);
    }
  };

  useEffect(() => {
    dispatch(getAllApplicationUsers({ fetchAll: true }) as any);
  }, [dispatch]);

  useEffect(() => {
    refreshLevel1Menus();
  }, [refreshLevel1Menus]);

  useEffect(() => {
    refreshUserMenu();
  }, []);

  return (
    <div className="p-6 pt-16">
   
      <DataTable
        columns={columns}
        data={rows}
        title="Level 1 Menu List"
        onAdd={openAdd}
        onEdit={onEdit}
        showActions={true}
        showColumnFilters={true}
        filterPlaceholder="Search Level 1..."
        disableFullDataFetch={true}
        // initialPageSize={itemsPerPage}
        // onPageSizeChange={setItemsPerPage}
        // totalCount={pagination?.total || 0}
        // currentPage={currentPage}
        // onPageChange={handlePageChange}
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
            <h2 className="text-xl font-semibold mb-6 text-gray-800 flex justify-between items-center">
              {isEditing ? 'Update Level 1 Menu' : 'Add Level 1 Menu'}
              <button onClick={() => setIsModalOpen(false)}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="30"
                  height="30"
                  fill="currentColor"
                  className="cursor-pointer"
                  viewBox="0 0 16 16"
                >
                  <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
                </svg>
              </button>
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <section>
                <h3 className="text-lg font-semibold mb-4">Details</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      User <span className="text-red-600">*</span>
                    </label>

                    <CommonSearchableSelect
                      className="min-w-[220px] mt-1"
                      placeholder="Select"
                      options={(applicationUserList || []).map((u: any) => ({
                        value: String(u.id),
                        label: `${u.userName} (${USER_TYPE_LABELS[Number(u.userType)] || u.userType || '-'})`,
                      }))}
                      onValueChange={() => {
                        clearServerValidationError();
                      }}
                      {...register('userId', {
                        required: 'Required',
                        validate: (v) => {
                          const sv = String(v || '');
                          if (!sv) return true;
                          const existing = new Set((list || []).map((u: any) => String(u?.userId ?? '')));
                          if (isEditing && String(current?.userId ?? '') === sv) return true;
                          return !existing.has(sv) || 'This user already exists';
                        },
                      })}
                      error={errors.userId?.message}
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
                              String(u.id) !== String(watchedUserId) &&
                              Number(u.userType) === Number(watch('userType'))
                          )
                          .map((u: any) => ({
                            value: String(u.id),
                            label: `${u.userName} (${USER_TYPE_LABELS[Number(u.userType)] || u.userType || '-'})`,
                          }))}
                        {...register('cloneFromUserId', {
                          required: isCloneEnabled ? 'Required' : false,
                        })}
                        error={errors.cloneFromUserId?.message}
                      />
                    </div>
                  )}
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-4">Level 1 Items</h3>

                {serverLevel1Error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded text-red-700 text-sm">
                    {serverLevel1Error}
                  </div>
                )}

                {fields.length === 0 && (
                  <div className="mb-4">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => handleAddRow()}
                    >
                      Add Row
                    </button>
                  </div>
                )}

                <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                      <table className="w-full border-collapse text-sm popup-table">
                        <thead className="text-sm font-semibold uppercase tracking-wide text-white">
                          <tr className="border-b border-gray-200">
                            <th className="p-3 border-r border-gray-200 w-8"></th>
                            <th className="p-3 text-left border-r border-gray-200">S. No</th>
                            <th className="p-3 text-left border-r border-gray-200">Level 1 Name *</th>
                            <th className="p-3 text-left border-r border-gray-200">Sequence</th>
                            <th className="p-3 text-left border-r border-gray-200 last:border-r-0">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {fields.map((f, idx) => (
                            <SortableRow
                              key={f.id}
                              fieldId={f.id}
                              index={idx}
                              register={register}
                              errors={errors}
                              onAdd={handleAddRow}
                              onRemove={handleRemoveRow}
                            />
                          ))}
                        </tbody>
                      </table>
                    </SortableContext>
                  </DndContext>
                </div>
              </section>

              <div className="flex justify-end space-x-3 pt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  {isEditing ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
