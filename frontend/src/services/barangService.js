import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: {
        Accept: 'application/json'
    }
});

const barangService = {

    // Mengambil data barang
    getAll: (params = {}) => {
        return api.get('/barangs', { params });
    },

    // Menampilkan detail barang
    getById: (id) => {
        return api.get(`/barangs/${id}`);
    },

    // Menambah barang
    create: (data) => {
        return api.post('/barangs', data);
    },

    // Mengubah barang (POST + _method=PUT agar upload file terbaca PHP)
    update: (id, data) => {
        return api.post(`/barangs/${id}`, data);
    },

    // Menghapus barang
    delete: (id) => {
        return api.delete(`/barangs/${id}`);
    }
};

export default barangService;
