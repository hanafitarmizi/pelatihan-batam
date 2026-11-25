import { useEffect, useState } from 'react';
import kategoriService from '../services/kategoriService';
import Notifikasi from '../components/Notifikasi';

const initialForm = {
    kode: '',
    nama: ''
};

// Saran kode: 3 huruf pertama dari nama kategori
const saranKode = (nama) => {
    return nama
        .replace(/[^a-zA-Z]/g, '')
        .slice(0, 3)
        .toUpperCase();
};

export default function KategoriPage() {

    const [kategoris, setKategoris] = useState([]);
    const [form, setForm] = useState(initialForm);
    const [editingId, setEditingId] = useState(null);

    // true jika user sudah mengetik kode sendiri
    const [kodeManual, setKodeManual] = useState(false);

    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [notice, setNotice] = useState(null);

    const fetchKategoris = async () => {
        try {
            setLoading(true);

            const response = await kategoriService.getAll();

            setKategoris(response.data.data);

        } catch (error) {
            console.error(error);
            setNotice({ type: 'error', text: 'Gagal mengambil data kategori' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKategoris();
    }, []);

    const handleNama = (e) => {
        const nama = e.target.value;

        setForm(prev => ({
            ...prev,
            nama,
            kode: kodeManual ? prev.kode : saranKode(nama)
        }));
    };

    const handleKode = (e) => {
        setKodeManual(true);

        setForm(prev => ({
            ...prev,
            kode: e.target.value
                .replace(/[^a-zA-Z]/g, '')
                .slice(0, 3)
                .toUpperCase()
        }));
    };

    const resetForm = () => {
        setForm(initialForm);
        setEditingId(null);
        setKodeManual(false);
        setErrors({});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            setErrors({});
            setNotice(null);

            if (editingId) {
                await kategoriService.update(editingId, form);
                setNotice({ type: 'success', text: 'Kategori berhasil diperbarui' });
            } else {
                await kategoriService.create(form);
                setNotice({ type: 'success', text: 'Kategori berhasil ditambahkan' });
            }

            resetForm();
            await fetchKategoris();

        } catch (error) {
            if (error.response?.status === 422 && error.response.data.errors) {
                setErrors(error.response.data.errors);
            } else {
                setNotice({
                    type: 'error',
                    text: error.response?.data?.message ||
                        'Terjadi kesalahan pada server'
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (kategori) => {
        setEditingId(kategori.id);
        setKodeManual(true);
        setErrors({});

        setForm({
            kode: kategori.kode,
            nama: kategori.nama
        });
    };

    const handleDelete = async (kategori) => {
        const confirmDelete = window.confirm(
            `Hapus kategori "${kategori.nama}"?`
        );

        if (!confirmDelete) return;

        try {
            await kategoriService.delete(kategori.id);

            setNotice({ type: 'success', text: 'Kategori berhasil dihapus' });

            if (editingId === kategori.id) resetForm();

            await fetchKategoris();

        } catch (error) {
            setNotice({
                type: 'error',
                text: error.response?.data?.message || 'Gagal menghapus kategori'
            });
        }
    };

    const kataKunci = search.trim().toLowerCase();

    const kategoriTampil = kategoris.filter(k =>
        k.nama.toLowerCase().includes(kataKunci) ||
        k.kode.toLowerCase().includes(kataKunci)
    );

    return (
        <>
            <Notifikasi notice={notice} onClose={() => setNotice(null)} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6
                items-start">

                {/* FORM KATEGORI (kanan) */}
                <div className="bg-white rounded-xl shadow p-4
                    lg:col-span-4 lg:order-2 lg:sticky lg:top-6">

                    <h2 className="text-base font-bold mb-3">
                        {editingId ? 'Edit Kategori' : 'Tambah Kategori'}
                    </h2>

                    <form onSubmit={handleSubmit}>

                        <div className="grid grid-cols-1 gap-3">

                            <div>
                                <label className="block text-xs font-medium mb-1">
                                    Nama Kategori
                                </label>

                                <input
                                    name="nama"
                                    value={form.nama}
                                    onChange={handleNama}
                                    className="w-full border rounded-lg px-3 py-1.5 text-sm"
                                    placeholder="Makanan"
                                    required
                                />

                                {errors.nama && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {errors.nama[0]}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-medium mb-1">
                                    Kode Kategori (3 huruf)
                                </label>

                                <input
                                    name="kode"
                                    value={form.kode}
                                    onChange={handleKode}
                                    className="w-full border rounded-lg px-3 py-1.5 text-sm
                                        font-mono uppercase tracking-widest"
                                    placeholder="MKN"
                                    minLength={3}
                                    maxLength={3}
                                    required
                                />

                                <p className="text-gray-500 text-xs mt-1">
                                    Dipakai sebagai awalan kode barang,
                                    mis. {form.kode || 'MKN'}001,
                                    {' '}{form.kode || 'MKN'}002
                                </p>

                                {errors.kode && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {errors.kode[0]}
                                    </p>
                                )}
                            </div>

                        </div>

                        <div className="flex gap-2 mt-4">

                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-700
                                    text-white px-4 py-2 text-sm rounded-lg
                                    disabled:opacity-50"
                            >
                                {loading
                                    ? 'Menyimpan...'
                                    : editingId
                                        ? 'Update Kategori'
                                        : 'Simpan Kategori'
                                }
                            </button>

                            <button
                                type="button"
                                onClick={resetForm}
                                className="bg-gray-500 hover:bg-gray-600
                                    text-white px-4 py-2 text-sm rounded-lg"
                            >
                                Reset
                            </button>

                        </div>

                    </form>
                </div>

                {/* DAFTAR KATEGORI (kiri) */}
                <div className="bg-white rounded-xl shadow p-6
                    lg:col-span-8 lg:order-1">

                    <div className="flex flex-col md:flex-row
                        justify-between gap-4 mb-6">

                        <h2 className="text-xl font-bold">
                            Daftar Kategori
                        </h2>

                        <input
                            type="text"
                            placeholder="Cari kode atau nama kategori..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="border rounded-lg px-4 py-2
                                w-full md:w-80"
                        />

                    </div>

                    <div className="overflow-x-auto">

                        <table className="w-full text-sm text-left">

                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-3">Kode</th>
                                    <th className="p-3">Nama Kategori</th>
                                    <th className="p-3">Jumlah Barang</th>
                                    <th className="p-3">Aksi</th>
                                </tr>
                            </thead>

                            <tbody>

                                {loading && kategoris.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="p-5 text-center">
                                            Memuat data...
                                        </td>
                                    </tr>
                                ) : kategoriTampil.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="p-5 text-center">
                                            Data kategori belum tersedia
                                        </td>
                                    </tr>
                                ) : (
                                    kategoriTampil.map((kategori) => (

                                        <tr
                                            key={kategori.id}
                                            className="border-b hover:bg-gray-50"
                                        >
                                            <td className="p-3">
                                                <span className="font-mono
                                                    bg-blue-100 text-blue-700
                                                    px-2 py-1 rounded">
                                                    {kategori.kode}
                                                </span>
                                            </td>

                                            <td className="p-3 font-medium">
                                                {kategori.nama}
                                            </td>

                                            <td className="p-3">
                                                {kategori.barangs_count} barang
                                            </td>

                                            <td className="p-3">
                                                <div className="flex gap-2">

                                                    <button
                                                        onClick={() =>
                                                            handleEdit(kategori)
                                                        }
                                                        className="bg-yellow-500
                                                            text-white px-3 py-2
                                                            rounded-lg"
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            handleDelete(kategori)
                                                        }
                                                        className="bg-red-600
                                                            text-white px-3 py-2
                                                            rounded-lg"
                                                    >
                                                        Hapus
                                                    </button>

                                                </div>
                                            </td>
                                        </tr>

                                    ))
                                )}

                            </tbody>

                        </table>

                    </div>

                </div>

            </div>
        </>
    );
}
