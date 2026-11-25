import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { DataTable } from '@/components/data/DataTable';
import { Modal } from '@/components/ui/Modal';
import { RootState, AppDispatch } from '@/state/store';
import { addMenuMaster, updateMenuMaster, deleteMenuMaster, getAllMenuMasters } from '@/state/menuMasterSlice';

interface MenuMasterForm {
  id?: number;
  screenName: string;
  menuUrl: string;
}

export default function MenuMasterPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { list } = useSelector((s: RootState) => s.menuMaster);
  const [rows, setRows] = useState<MenuMasterForm[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [current, setCurrent] = useState<MenuMasterForm | null>(null);

  const isDuplicateField = (field: keyof Omit<MenuMasterForm, 'id'>, value?: string) => {
    const trimmed = value?.trim();
    if (!trimmed) return false;
    const normalized = trimmed.toLowerCase();
    return rows.some((row) => {
      const rowValue = (row[field] || '').trim().toLowerCase();
      if (!rowValue) return false;
      const isSameRow = current?.id !== undefined && row.id === current.id;
      return rowValue === normalized && !isSameRow;
    });
  };

  const validateScreenName = (value: string) => {
    if (isDuplicateField('screenName', value)) return 'Screen name already exists';
    return true;
  };

  const validateMenuUrl = (value: string) => {
    if (isDuplicateField('menuUrl', value)) return 'Menu URL already exists';
    return true;
  };

  const { register, handleSubmit, reset, formState: { errors } } = useForm<MenuMasterForm>({ mode: 'onBlur' });

  useEffect(() => {
    dispatch(getAllMenuMasters());
  }, [dispatch]);

  useEffect(() => {
    setRows([...(list || [])].sort((a: any, b: any) => (a.id || 0) - (b.id || 0)));
  }, [list]);

  const processedRows = useMemo(() => {
    return rows.map((row, index) => ({
      ...row,
      serialNo: index + 1,
    }));
  }, [rows]);

  const columns = useMemo(() => ([
    { Header: 'Sl No', accessor: 'serialNo', disableFilters: true },
    { Header: 'Screen Name', accessor: 'screenName' },
    { Header: 'URL', accessor: 'menuUrl' },
  ]), []);

  const openAdd = () => {
    setIsEditing(false);
    setCurrent(null);
    reset({ screenName: '', menuUrl: '' });
    setIsModalOpen(true);
  };

  const onEdit = (row: MenuMasterForm) => {
    setIsEditing(true);
    setCurrent(row);
    reset(row);
    setIsModalOpen(true);
  };

  const onDelete = (row: MenuMasterForm) => {
    if (row.id) {
      dispatch(deleteMenuMaster(row.id) as any).then(() => dispatch(getAllMenuMasters() as any));
    }
  };

  const onSubmit = (data: MenuMasterForm) => {
    if (isEditing && current?.id) {
      (dispatch(updateMenuMaster({ ...data, id: current.id }) as any) as any).then(() => dispatch(getAllMenuMasters() as any));
    } else {
      (dispatch(addMenuMaster(data) as any) as any).then(() => dispatch(getAllMenuMasters() as any));
    }
    setIsModalOpen(false);
    reset();
  };

  return (
    <div className="p-6 pt-16">

      <DataTable
        columns={columns}
        data={processedRows}
        title="Menu Master List"
        onAdd={openAdd}
        onEdit={onEdit}
        // onDelete={onDelete}
        showActions={true}
        showColumnFilters={true}
        filterPlaceholder="Search Screen/URL..."
        disableFullDataFetch={true}
      />

      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={isEditing ? 'Update Menu Master' : 'Add Menu Master'}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <section>
              <div className="space-y-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Screen Name <span className="text-red-600">*</span></label>
                  <input className="input mt-1" {...register('screenName', { required: 'Required', validate: validateScreenName })} />
                  {errors.screenName && <p className="text-red-500 text-sm">{errors.screenName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Menu URL <span className="text-red-600">*</span></label>
                  <input className="input mt-1" {...register('menuUrl', { required: 'Required', validate: validateMenuUrl })} />
                  {errors.menuUrl && <p className="text-red-500 text-sm">{errors.menuUrl.message}</p>}
                </div>
              </div>
            </section>
            <div className="flex justify-end space-x-3 pt-4">
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancel</button>
              <button type="submit" className="btn btn-primary">{isEditing ? 'Update' : 'Save'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
