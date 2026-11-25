<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Barang extends Model
{
    protected $fillable = [
        'kategori_id',
        'kode_barang',
        'nama_barang',
        'deskripsi',
        'harga_beli',
        'harga_jual',
        'stok',
        'satuan',
        'gambar'
    ];

    public function kategori(): BelongsTo
    {
        return $this->belongsTo(Kategori::class);
    }

    /**
     * Membuat kode barang berikutnya untuk sebuah kategori:
     * kode kategori (3 huruf) + nomor urut 3 digit, mis. MKN001.
     *
     * Panggil di dalam DB::transaction() saat menyimpan agar
     * lockForUpdate() mencegah dua request mendapat nomor yang sama.
     */
    public static function generateKode(Kategori $kategori): string
    {
        $prefix = $kategori->kode;

        $kodeTerakhir = static::where('kode_barang', 'like', $prefix . '%')
            ->lockForUpdate()
            ->orderByRaw('LENGTH(kode_barang) DESC')
            ->orderByDesc('kode_barang')
            ->value('kode_barang');

        $nomor = $kodeTerakhir
            ? (int) substr($kodeTerakhir, strlen($prefix)) + 1
            : 1;

        return $prefix . str_pad($nomor, 3, '0', STR_PAD_LEFT);
    }
}
