import { useEffect, useState } from 'react';
import barangService from '../services/barangService';
import kategoriService from '../services/kategoriService';
import Notifikasi from '../components/Notifikasi';

// kode_barang tidak diinput: dibuat otomatis dari kode kategori
const initialForm = {
    kategori_id: '',
    nama_barang: '',
    deskripsi: '',
    harga_beli: '',
    harga_jual: '',
    stok: 0,
    satuan: 'pcs',
    gambar: null
};

export default function BarangPage({ onKelolaKategori }) {

    const [barangs, setBarangs] = useState([]);
    const [kategoris, setKategoris] = useState([]);
    const [form, setForm] = useState(initialForm);

    // Barang yang sedang diedit: { id, kode_barang }
    const [editingBarang, setEditingBarang] = useState(null);

    const [preview, setPreview] = useState(null);
    const [search, setSearch] = useState('');
    const [filterKategori, setFilterKategori] = useState('');

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [notice, setNotice] = useState(null);

    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    // Mengambil data barang
    const fetchBarangs = async (currentPage = page) => {
        try {
            setLoading(true);

            const response = await barangService.getAll({
                search,
                kategori_id: filterKategori || undefined,
                page: currentPage
            });

            setBarangs(response.data.data);
            setPage(response.data.current_page);
            setLastPage(response.data.last_page);

        } catch (error) {
            console.error(error);
            setNotice({ type: 'error', text: 'Gagal mengambil data barang' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBarangs(page);
    }, [search, filterKategori, page]);

    // Mengambil daftar kategori untuk dropdown
    useEffect(() => {
        kategoriService.getAll()
            .then(response => setKategoris(response.data.data))
            .catch(() => setNotice({
                type: 'error',
                text: 'Gagal mengambil data kategori'
            }));
    }, []);

    // Mengubah input form
    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Input harga: simpan angka murni, tampilkan dengan pemisah ribuan
    const handleHarga = (e) => {
        const { name, value } = e.target;

        setForm(prev => ({
            ...prev,
            [name]: value.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
        }));
    };

    const formatAngka = (value) => {
        if (value === '' || value === null || value === undefined) return '';

        return new Intl.NumberFormat('id-ID').format(value);
    };

    // Upload dan preview gambar
    const handleImage = (e) => {
        const file = e.target.files[0];

        if (!file) return;

        setForm(prev => ({
            ...prev,
            gambar: file
        }));

        setPreview(URL.createObjectURL(file));
    };

    // Reset form
    const resetForm = () => {
        setForm(initialForm);
        setEditingBarang(null);
        setPreview(null);
        setErrors({});

        const input = document.getElementById('gambar');

        if (input) input.value = '';
    };

    // Submit tambah atau edit
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            setErrors({});
            setNotice(null);

            const formData = new FormData();

            Object.keys(form).forEach(key => {
                if (form[key] !== null) {
                    formData.append(key, form[key]);
                }
            });

            let response;

            if (editingBarang) {
                formData.append('_method', 'PUT');

                response = await barangService.update(
                    editingBarang.id,
                    formData
                );
            } else {
                response = await barangService.create(formData);
            }

            setNotice({
                type: 'success',
                text: `${response.data.message} (kode: ${response.data.data.kode_barang})`
            });

            resetForm();
            setPage(1);
            await fetchBarangs(1);

        } catch (error) {
            if (error.response?.status === 422) {
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

    // Mengambil data untuk edit
    const handleEdit = async (id) => {
        try {
            const response = await barangService.getById(id);

            const barang = response.data.data;

            setEditingBarang({
                id: barang.id,
                kode_barang: barang.kode_barang
            });

            setErrors({});

            setForm({
                kategori_id: String(barang.kategori_id),
                nama_barang: barang.nama_barang,
                deskripsi: barang.deskripsi || '',
                // "50000.00" dari API -> "50000"
                harga_beli: String(Math.round(Number(barang.harga_beli))),
                harga_jual: String(Math.round(Number(barang.harga_jual))),
                stok: barang.stok,
                satuan: barang.satuan,
                gambar: null
            });

            setPreview(barang.gambar_url);

            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });

        } catch (error) {
            setNotice({ type: 'error', text: 'Gagal mengambil detail barang' });
        }
    };

    // Menghapus barang
    const handleDelete = async (id) => {
        const confirmDelete = window.confirm(
            'Apakah Anda yakin ingin menghapus barang ini?'
        );

        if (!confirmDelete) return;

        try {
            await barangService.delete(id);

            setNotice({ type: 'success', text: 'Barang berhasil dihapus' });

            await fetchBarangs();

        } catch (error) {
            setNotice({ type: 'error', text: 'Gagal menghapus barang' });
        }
    };

    const formatRupiah = (value) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
        }).format(value || 0);
    };

    return (
        <>
            <Notifikasi notice={notice} onClose={() => setNotice(null)} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6
                items-start">

                {/* FORM BARANG (kanan) */}
                <div className="bg-white rounded-xl shadow p-4
                    lg:col-span-4 lg:order-2 lg:sticky lg:top-6">

                    <h2 className="text-base font-bold mb-3">
                        {editingBarang ? 'Edit Barang' : 'Tambah Barang'}
                    </h2>

                    {kategoris.length === 0 && (
                        <div className="mb-3 rounded-lg bg-yellow-100 text-yellow-800 p-2 text-xs">
                            Belum ada kategori.{' '}
                            <button
                                type="button"
                                onClick={onKelolaKategori}
                                className="underline font-medium"
                            >
                                Buat kategori dulu
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>

                        <div className="grid grid-cols-1 gap-3">

                            <div>
                                <label className="block text-xs font-medium mb-1">
                                    Kategori
                                </label>

                                <select
                                    name="kategori_id"
                                    value={form.kategori_id}
                                    onChange={handleChange}
                                    className="w-full border rounded-lg px-3 py-1.5 text-sm"
                                    required
                                >
                                    <option value="">-- Pilih kategori --</option>

                                    {kategoris.map(kategori => (
                                        <option key={kategori.id} value={kategori.id}>
                                            {kategori.kode} - {kategori.nama}
                                        </option>
                                    ))}
                                </select>

                                {errors.kategori_id && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {errors.kategori_id[0]}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-medium mb-1">
                                    Nama Barang
                                </label>

                                <input
                                    name="nama_barang"
                                    value={form.nama_barang}
                                    onChange={handleChange}
                                    className="w-full border rounded-lg px-3 py-1.5 text-sm"
                                    placeholder="Nama barang"
                                    required
                                />

                                {errors.nama_barang && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {errors.nama_barang[0]}
                                    </p>
                                )}
                            </div>

                            {/* HARGA BELI & HARGA JUAL (satu baris) */}
                            <div className="grid grid-cols-2 gap-3">

                                {[
                                    { name: 'harga_beli', label: 'Harga Beli' },
                                    { name: 'harga_jual', label: 'Harga Jual' }
                                ].map(field => (
                                    <div key={field.name}>
                                        <label className="block text-xs font-medium mb-1">
                                            {field.label}
                                        </label>

                                        <div className="flex items-center border
                                            rounded-lg focus-within:ring-2
                                            focus-within:ring-blue-500">
                                            <span className="pl-3 text-gray-500 text-xs">
                                                Rp
                                            </span>

                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                name={field.name}
                                                value={formatAngka(form[field.name])}
                                                onChange={handleHarga}
                                                className="w-full min-w-0 px-3 py-1.5 text-sm
                                                    text-right outline-none
                                                    rounded-lg"
                                                placeholder="0"
                                                required
                                            />
                                        </div>

                                        {errors[field.name] && (
                                            <p className="text-red-500 text-xs mt-1">
                                                {errors[field.name][0]}
                                            </p>
                                        )}
                                    </div>
                                ))}

                            </div>

                            {/* STOK & SATUAN (satu baris) */}
                            <div className="grid grid-cols-2 gap-3">

                                <div>
                                    <label className="block text-xs font-medium mb-1">
                                        Stok
                                    </label>

                                    <input
                                        type="number"
                                        name="stok"
                                        value={form.stok}
                                        onChange={handleChange}
                                        className="w-full border rounded-lg px-3 py-1.5 text-sm"
                                        min="0"
                                        required
                                    />

                                    {errors.stok && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {errors.stok[0]}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-medium mb-1">
                                        Satuan
                                    </label>

                                    <select
                                        name="satuan"
                                        value={form.satuan}
                                        onChange={handleChange}
                                        className="w-full border rounded-lg px-3 py-1.5 text-sm"
                                    >
                                        <option value="pcs">Pcs</option>
                                        <option value="unit">Unit</option>
                                        <option value="box">Box</option>
                                        <option value="kg">Kg</option>
                                        <option value="liter">Liter</option>
                                    </select>
                                </div>

                            </div>

                            <div>
                                <label className="block text-xs font-medium mb-1">
                                    Gambar Barang
                                </label>

                                <input
                                    id="gambar"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleImage}
                                    className="w-full border rounded-lg px-3 py-1.5 text-sm"
                                />

                                {errors.gambar && (
                                    <p className="text-red-500 text-xs mt-1">
                                        {errors.gambar[0]}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-medium mb-1">
                                    Deskripsi
                                </label>

                                <textarea
                                    name="deskripsi"
                                    value={form.deskripsi}
                                    onChange={handleChange}
                                    rows="3"
                                    className="w-full border rounded-lg px-3 py-1.5 text-sm"
                                />
                            </div>

                            {/* PREVIEW GAMBAR */}
                            {preview && (
                                <div>
                                    <p className="text-xs font-medium mb-1">
                                        Preview Gambar
                                    </p>

                                    <img
                                        src={preview}
                                        alt="Preview barang"
                                        className="w-24 h-24 object-cover
                                            rounded-lg border"
                                    />
                                </div>
                            )}

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
                                    : editingBarang
                                        ? 'Update Barang'
                                        : 'Simpan Barang'
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

                {/* DAFTAR BARANG (kiri) */}
                <div className="bg-white rounded-xl shadow p-6
                    lg:col-span-8 lg:order-1">

                    <div className="flex flex-col md:flex-row
                        justify-between gap-4 mb-6">

                        <h2 className="text-xl font-bold">
                            Daftar Barang
                        </h2>

                        <div className="flex flex-col sm:flex-row gap-3">

                            <select
                                value={filterKategori}
                                onChange={(e) => {
                                    setPage(1);
                                    setFilterKategori(e.target.value);
                                }}
                                className="border rounded-lg px-4 py-2"
                            >
                                <option value="">Semua kategori</option>

                                {kategoris.map(kategori => (
                                    <option key={kategori.id} value={kategori.id}>
                                        {kategori.nama}
                                    </option>
                                ))}
                            </select>

                            <input
                                type="text"
                                placeholder="Cari kode atau nama barang..."
                                value={search}
                                onChange={(e) => {
                                    setPage(1);
                                    setSearch(e.target.value);
                                }}
                                className="border rounded-lg px-4 py-2
                                    w-full md:w-80"
                            />

                        </div>

                    </div>

                    <div className="overflow-x-auto">

                        <table className="w-full text-sm text-left">

                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-3">Gambar</th>
                                    <th className="p-3">Kode</th>
                                    <th className="p-3">Nama Barang</th>
                                    <th className="p-3">Kategori</th>
                                    <th className="p-3">Harga Jual</th>
                                    <th className="p-3">Stok</th>
                                    <th className="p-3">Aksi</th>
                                </tr>
                            </thead>

                            <tbody>

                                {loading && barangs.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="p-5 text-center">
                                            Memuat data...
                                        </td>
                                    </tr>
                                ) : barangs.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="p-5 text-center">
                                            Data barang belum tersedia
                                        </td>
                                    </tr>
                                ) : (
                                    barangs.map((barang) => (

                                        <tr
                                            key={barang.id}
                                            className="border-b hover:bg-gray-50"
                                        >

                                            <td className="p-3">
                                                {barang.gambar_url ? (
                                                    <img
                                                        src={barang.gambar_url}
                                                        alt={barang.nama_barang}
                                                        className="w-14 h-14 object-cover
                                                            rounded-lg"
                                                    />
                                                ) : (
                                                    <div className="w-14 h-14
                                                        bg-gray-200 rounded-lg
                                                        flex items-center
                                                        justify-center">
                                                        <span className="text-xs">
                                                            No Image
                                                        </span>
                                                    </div>
                                                )}
                                            </td>

                                            <td className="p-3 font-mono">
                                                {barang.kode_barang}
                                            </td>

                                            <td className="p-3 font-medium">
                                                {barang.nama_barang}
                                            </td>

                                            <td className="p-3">
                                                {barang.kategori}
                                            </td>

                                            <td className="p-3">
                                                {formatRupiah(barang.harga_jual)}
                                            </td>

                                            <td className="p-3">
                                                {barang.stok} {barang.satuan}
                                            </td>

                                            <td className="p-3">
                                                <div className="flex gap-2">

                                                    <button
                                                        onClick={() =>
                                                            handleEdit(barang.id)
                                                        }
                                                        className="bg-yellow-500
                                                            text-white px-3 py-2
                                                            rounded-lg"
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        onClick={() =>
                                                            handleDelete(barang.id)
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

                    {/* PAGINATION */}
                    <div className="flex justify-between items-center mt-6">

                        <button
                            disabled={page <= 1 || loading}
                            onClick={() => setPage(page - 1)}
                            className="bg-gray-200 px-4 py-2 rounded-lg
                                disabled:opacity-40"
                        >
                            Previous
                        </button>

                        <span className="text-sm">
                            Halaman {page} dari {lastPage}
                        </span>

                        <button
                            disabled={page >= lastPage || loading}
                            onClick={() => setPage(page + 1)}
                            className="bg-gray-200 px-4 py-2 rounded-lg
                                disabled:opacity-40"
                        >
                            Next
                        </button>

                    </div>

                </div>

            </div>
        </>
    );
}
