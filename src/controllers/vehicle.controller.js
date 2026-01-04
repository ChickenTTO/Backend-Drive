import React, { useState, useEffect } from 'react';
import './VehicleList.css';
import { StatusIcon, LoadingSpinner, XIcon } from '../../components/icons';
import vehicleApi from '../../api/vehicleApi';

// --- Modal Thêm/Sửa Xe ---
const VehicleModal = ({ isOpen, onClose, vehicle, onSave }) => {
  const [form, setForm] = useState({
    licensePlate: '',
    type: '',
    seats: 4,
    status: 'available',
    imageUrl: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (vehicle) setForm(vehicle);
    else setForm({ licensePlate: '', type: '', seats: 4, status: 'available', imageUrl: '' });
  }, [vehicle]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let res;
      if (vehicle) res = await vehicleApi.update(vehicle.id, form);
      else res = await vehicleApi.create(form);

      onSave(res.data);
      onClose();
    } catch (err) {
      alert('Lưu xe thất bại');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-header">
          <h3>{vehicle ? 'Sửa xe' : 'Thêm xe mới'}</h3>
          <button onClick={onClose}><XIcon /></button>
        </div>
        <div className="modal-body">
          <label>Biển số</label>
          <input value={form.licensePlate} onChange={e => setForm({...form, licensePlate: e.target.value})} />
          <label>Loại xe</label>
          <input value={form.type} onChange={e => setForm({...form, type: e.target.value})} />
          <label>Số ghế</label>
          <input type="number" value={form.seats} onChange={e => setForm({...form, seats: parseInt(e.target.value)||4})} />
          <label>Ảnh</label>
          <input value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} />
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">Hủy</button>
          <button onClick={handleSubmit} className="btn-primary" disabled={loading}>
            {loading ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Modal Xóa ---
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, vehicle, loading }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-header">
          <h3>Xác nhận xóa xe</h3>
          <button onClick={onClose}><XIcon /></button>
        </div>
        <div className="modal-body">
          <p>Bạn có chắc muốn xóa xe {vehicle?.licensePlate} không?</p>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">Hủy</button>
          <button onClick={onConfirm} className="btn-primary" disabled={loading}>
            {loading ? 'Đang xóa...' : 'Xóa'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Giữ nguyên modal Bảo dưỡng và Doanh thu ---
import { VehicleStatsModal, MaintenanceModal } from './VehicleModals';

// --- Main Component ---
const VehicleList = ({ onViewOnMap }) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await vehicleApi.getAll();
      setVehicles(res.data || []);
    } catch (err) {
      console.error('Lấy danh sách xe thất bại', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVehicles(); }, []);

  const handleDelete = async () => {
    if (!selectedVehicle) return;
    setDeleting(true);
    try {
      await vehicleApi.delete(selectedVehicle.id);
      setVehicles(prev => prev.filter(v => v.id !== selectedVehicle.id));
      setDeleteOpen(false);
    } catch (err) {
      alert('Xóa thất bại');
    } finally { setDeleting(false); }
  };

  return (
    <div className="vehicle-page">
      {/* Thêm/Sửa xe */}
      <VehicleModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        vehicle={selectedVehicle}
        onSave={(v) => {
          if (selectedVehicle) setVehicles(prev => prev.map(x => x.id === v.id ? v : x));
          else setVehicles(prev => [v, ...prev]);
        }}
      />

      {/* Xóa xe */}
      <DeleteConfirmModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        vehicle={selectedVehicle}
        loading={deleting}
      />

      {/* Bảo dưỡng & Doanh thu */}
      <VehicleStatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        vehicle={selectedVehicle}
      />
      <MaintenanceModal
        isOpen={isMaintenanceOpen}
        onClose={() => setIsMaintenanceOpen(false)}
        vehicleId={selectedVehicle?.id}
        onSave={(record) => {
          setVehicles(prev => prev.map(v => v.id === selectedVehicle.id ? {...v, maintenanceHistory: [record, ...(v.maintenanceHistory||[])]} : v));
        }}
      />

      <div className="page-header">
        <h2>Quản lý Xe công ty</h2>
        <button className="btn-primary" onClick={() => { setSelectedVehicle(null); setModalOpen(true); }}>
          Thêm xe
        </button>
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="vehicle-grid">
          {vehicles.map(vehicle => (
            <div key={vehicle.id} className="vehicle-card">
              <img src={vehicle.imageUrl || 'https://via.placeholder.com/400x300'} alt={vehicle.type} />
              <h3>{vehicle.licensePlate}</h3>
              <p>{vehicle.type} - {vehicle.seats} ghế</p>
              <div className="vehicle-status">
                <StatusIcon status={vehicle.status} />
                <span>{vehicle.status}</span>
              </div>
              <div className="vehicle-actions">
                <button onClick={() => { setSelectedVehicle(vehicle); setModalOpen(true); }}>Sửa</button>
                <button onClick={() => { setSelectedVehicle(vehicle); setDeleteOpen(true); }}>Xóa</button>
                <button onClick={() => { setSelectedVehicle(vehicle); setIsMaintenanceOpen(true); }}>Bảo dưỡng</button>
                <button onClick={() => { setSelectedVehicle(vehicle); setIsStatsModalOpen(true); }}>Doanh thu</button>
                <button onClick={() => onViewOnMap(vehicle.id)}>Vị trí</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VehicleList;
