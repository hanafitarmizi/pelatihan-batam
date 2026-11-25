import { useState } from 'react';
import BarangPage from './pages/BarangPage';
import KategoriPage from './pages/KategoriPage';

const menus = [
    { key: 'barang', label: 'Barang' },
    { key: 'kategori', label: 'Kategori' }
];

export default function App() {

    const [halaman, setHalaman] = useState('barang');

    return (
        <div className="min-h-screen bg-gray-100">

            {/* HEADER */}
            <header className="bg-blue-700 text-white shadow">
                <div className="w-full px-6 pt-5">
                    <h1 className="text-2xl font-bold">
                        Aplikasi Manajemen Barang
                    </h1>

                    <p className="text-blue-100 text-sm mt-1">
                        Laravel 13 + React + Tailwind CSS
                    </p>

                    {/* MENU */}
                    <nav className="flex gap-1 mt-4">
                        {menus.map(menu => (
                            <button
                                key={menu.key}
                                onClick={() => setHalaman(menu.key)}
                                className={`px-5 py-2 rounded-t-lg text-sm
                                    font-medium ${halaman === menu.key
                                        ? 'bg-gray-100 text-blue-700'
                                        : 'text-blue-100 hover:bg-blue-600'}`}
                            >
                                {menu.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </header>

            <main className="w-full p-6">
                {halaman === 'barang' ? (
                    <BarangPage
                        onKelolaKategori={() => setHalaman('kategori')}
                    />
                ) : (
                    <KategoriPage />
                )}
            </main>

        </div>
    );
}
