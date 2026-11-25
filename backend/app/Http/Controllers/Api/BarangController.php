<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Barang;
use App\Models\Kategori;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class BarangController extends Controller
{
    // Menampilkan semua barang
    public function index(Request $request)
    {
        $query = Barang::with('kategori');

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where(
                    'nama_barang',
                    'like',
                    '%' . $request->search . '%'
                )->orWhere(
                    'kode_barang',
                    'like',
                    '%' . $request->search . '%'
                )->orWhereHas('kategori', function ($k) use ($request) {
                    $k->where('nama', 'like', '%' . $request->search . '%');
                });
            });
        }

        if ($request->kategori_id) {
            $query->where('kategori_id', $request->kategori_id);
        }

        $barangs = $query
            ->latest()
            ->paginate(10);

        $barangs->through(function ($barang) {
            return $this->formatBarang($barang);
        });

        return response()->json($barangs);
    }

    // Menyimpan barang (kode barang dibuat otomatis dari kategori)
    public function store(Request $request)
    {
        $validated = $request->validate($this->rules());

        if ($request->hasFile('gambar')) {
            $validated['gambar'] = $request
                ->file('gambar')
                ->store('barangs', 'public');
        }

        $barang = DB::transaction(function () use ($validated) {
            $kategori = Kategori::findOrFail($validated['kategori_id']);

            $validated['kode_barang'] = Barang::generateKode($kategori);

            return Barang::create($validated);
        });

        return response()->json([
            'message' => 'Barang berhasil ditambahkan',
            'data' => $this->formatBarang($barang->load('kategori'))
        ], 201);
    }

    // Menampilkan detail barang
    public function show($id)
    {
        $barang = Barang::with('kategori')->findOrFail($id);

        return response()->json([
            'data' => $this->formatBarang($barang)
        ]);
    }

    // Mengubah barang
    public function update(Request $request, $id)
    {
        $barang = Barang::findOrFail($id);

        $validated = $request->validate($this->rules());

        if ($request->hasFile('gambar')) {

            // Hapus gambar lama
            if ($barang->gambar) {
                Storage::disk('public')->delete($barang->gambar);
            }

            // Simpan gambar baru
            $validated['gambar'] = $request
                ->file('gambar')
                ->store('barangs', 'public');
        } else {
            // Pertahankan gambar lama jika tidak ada file baru
            unset($validated['gambar']);
        }

        DB::transaction(function () use ($barang, $validated) {
            // Jika kategori diganti, kode barang dibuat ulang
            // mengikuti kode kategori yang baru
            if ((int) $validated['kategori_id'] !== $barang->kategori_id) {
                $kategori = Kategori::findOrFail($validated['kategori_id']);

                $validated['kode_barang'] = Barang::generateKode($kategori);
            }

            $barang->update($validated);
        });

        return response()->json([
            'message' => 'Barang berhasil diperbarui',
            'data' => $this->formatBarang($barang->fresh('kategori'))
        ]);
    }

    // Menghapus barang
    public function destroy($id)
    {
        $barang = Barang::findOrFail($id);

        if ($barang->gambar) {
            Storage::disk('public')->delete($barang->gambar);
        }

        $barang->delete();

        return response()->json([
            'message' => 'Barang berhasil dihapus'
        ]);
    }

    // Aturan validasi tambah & ubah (kode_barang tidak diinput user)
    private function rules(): array
    {
        return [
            'kategori_id' => 'required|integer|exists:kategoris,id',
            'nama_barang' => 'required|string|max:150',
            'deskripsi' => 'nullable|string',
            'harga_beli' => 'required|numeric|min:0',
            'harga_jual' => 'required|numeric|min:0',
            'stok' => 'required|integer|min:0',
            'satuan' => 'required|string|max:30',
            'gambar' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
        ];
    }

    // Format data response
    private function formatBarang($barang)
    {
        return [
            'id' => $barang->id,
            'kode_barang' => $barang->kode_barang,
            'nama_barang' => $barang->nama_barang,
            'kategori_id' => $barang->kategori_id,
            'kategori' => $barang->kategori?->nama,
            'kode_kategori' => $barang->kategori?->kode,
            'deskripsi' => $barang->deskripsi,
            'harga_beli' => $barang->harga_beli,
            'harga_jual' => $barang->harga_jual,
            'stok' => $barang->stok,
            'satuan' => $barang->satuan,
            'gambar' => $barang->gambar,
            'gambar_url' => $barang->gambar
                ? asset('storage/' . $barang->gambar)
                : null,
            'created_at' => $barang->created_at,
            'updated_at' => $barang->updated_at
        ];
    }
}
