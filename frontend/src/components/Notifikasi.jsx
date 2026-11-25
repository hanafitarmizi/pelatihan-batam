// Kotak notifikasi: hijau untuk sukses, merah untuk error
export default function Notifikasi({ notice, onClose }) {
    if (!notice) return null;

    const warna = notice.type === 'error'
        ? 'bg-red-100 text-red-700'
        : 'bg-green-100 text-green-700';

    return (
        <div className={`mb-5 rounded-lg p-4 flex justify-between
            items-start gap-4 ${warna}`}>
            <span>{notice.text}</span>

            <button
                type="button"
                onClick={onClose}
                className="font-bold leading-none"
                aria-label="Tutup notifikasi"
            >
                ×
            </button>
        </div>
    );
}
