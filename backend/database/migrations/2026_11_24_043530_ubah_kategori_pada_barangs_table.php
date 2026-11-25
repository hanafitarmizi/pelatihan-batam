<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('barangs', function (Blueprint $table) {
            // Kategori teks bebas diganti relasi ke tabel kategoris
            $table->dropColumn('kategori');

            $table->foreignId('kategori_id')
                ->after('id')
                ->constrained('kategoris')
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('barangs', function (Blueprint $table) {
            $table->dropConstrainedForeignId('kategori_id');

            $table->string('kategori', 100)
                ->nullable()
                ->after('nama_barang');
        });
    }
};
