<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Barang;
use App\Models\Kategori;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class KategoriController extends Controller
{
    // Menampilkan semua kategori (tanpa pagination, dipakai juga untuk dropdown)
    public function index(Request $request)
    {
        $kategoris = Kategori::withCount('barangs')
            ->when($request->search, function ($query, $search) {
                $query->where('nama', 'like', '%' . $search . '%')
                    ->orWhere('kode', 'like', '%' . $search . '%');
            })
            ->orderBy('nama')
            ->get();

        return response()->json([
            'data' => $kategoris
        ]);
    }

    // Menyimpan kategori
    public function store(Request $request)
    {
        $this->normalisasiKode($request);

        $validated = $request->validate([
            'kode' => 'required|regex:/^[A-Z]{3}$/|unique:kategoris,kode',
            'nama' => 'required|string|max:100|unique:kategoris,nama',
        ], $this->pesanValidasi());

        $kategori = Kategori::create($validated);

        return response()->json([
            'message' => 'Kategori berhasil ditambahkan',
            'data' => $kategori
        ], 201);
    }

    // Menampilkan detail kategori
    public function show(Kategori $kategori)
    {
        return response()->json([
            'data' => $kategori->loadCount('barangs')
        ]);
    }

    // Mengubah kategori
    public function update(Request $request, Kategori $kategori)
    {
        $this->normalisasiKode($request);

        $validated = $request->validate([
            'kode' => [
                'required',
                'regex:/^[A-Z]{3}$/',
                Rule::unique('kategoris', 'kode')->ignore($kategori->id)
            ],
            'nama' => [
                'required',
                'string',
                'max:100',
                Rule::unique('kategoris', 'nama')->ignore($kategori->id)
            ],
        ], $this->pesanValidasi());

        // Kode tidak boleh diganti jika sudah dipakai sebagai awalan kode barang
        if ($validated['kode'] !== $kategori->kode && $kategori->barangs()->exists()) {
            return response()->json([
                'message' => 'Kode kategori tidak dapat diubah karena sudah dipakai oleh barang',
                'errors' => [
                    'kode' => ['Kode sudah dipakai oleh barang, tidak dapat diubah']
                ]
            ], 422);
        }

        $kategori->update($validated);

        return response()->json([
            'message' => 'Kategori berhasil diperbarui',
            'data' => $kategori->fresh()
        ]);
    }

    // Menghapus kategori
    public function destroy(Kategori $kategori)
    {
        if ($kategori->barangs()->exists()) {
            return response()->json([
                'message' => 'Kategori tidak dapat dihapus karena masih memiliki barang'
            ], 422);
        }

        $kategori->delete();

        return response()->json([
            'message' => 'Kategori berhasil dihapus'
        ]);
    }

    // Pratinjau kode barang berikutnya untuk kategori ini
    public function kodeBerikutnya(Kategori $kategori)
    {
        return response()->json([
            'kode_barang' => Barang::generateKode($kategori)
        ]);
    }

    // Kode kategori selalu disimpan huruf besar
    private function normalisasiKode(Request $request): void
    {
        if (is_string($request->kode)) {
            $request->merge([
                'kode' => strtoupper(trim($request->kode))
            ]);
        }
    }

    private function pesanValidasi(): array
    {
        return [
            'kode.regex' => 'Kode kategori harus tepat 3 huruf (A-Z)',
            'kode.unique' => 'Kode kategori sudah digunakan',
            'nama.unique' => 'Nama kategori sudah digunakan',
        ];
    }
}
