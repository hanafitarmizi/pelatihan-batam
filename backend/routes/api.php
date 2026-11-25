<?php

use App\Http\Controllers\Api\BarangController;
use App\Http\Controllers\Api\KategoriController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get(
    'kategoris/{kategori}/kode-berikutnya',
    [KategoriController::class, 'kodeBerikutnya']
);

Route::apiResource('kategoris', KategoriController::class);
Route::apiResource('barangs', BarangController::class);
