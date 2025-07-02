// script.js
let masterData = [];

const spinner = document.getElementById('spinner');
const toggleMode = document.getElementById('toggleMode');

document.addEventListener('DOMContentLoaded', () => {
    showSpinner();
    fetch('data/masterlist_tabel_mblb.csv')
        .then(r => {
            if (!r.ok) throw new Error(`status ${r.status}`);
            return r.text();
        })
        .then(text => {
            const rows = text.split('\n').map(r => r.trim()).filter(r => r);
            const headers = rows[0].split(',').map(h => h.trim());
            masterData = rows.slice(1).map(row => {
                const vals = row.split(',').map(v => v.trim());
                const obj = {};
                headers.forEach((h,i) => obj[h] = vals[i] || '');
                return obj;
            });
        })
        .catch(err => alert('Gagal muat data master'))
        .finally(hideSpinner);
});

function showSpinner() {
    spinner.classList.remove('hidden');
}

function hideSpinner() {
    spinner.classList.add('hidden');
}

function loadSubComponents() {
    const jenis = document.getElementById('jenisPekerjaan').value;
    const sub = document.getElementById('subKomponen');
    sub.innerHTML = '<option value="">Pilih Sub Komponen</option>';
    document.getElementById('material').innerHTML = '<option value="">Pilih Material</option>';
    if (!jenis) return;
    const filtered = masterData.filter(item => item.Pekerjaan.split(' - ')[0] === jenis);
    new Set(filtered.map(i => i.Sub_Komponen))
        .forEach(s => sub.appendChild(new Option(s, s)));
}

function loadMaterials() {
    const jenis = document.getElementById('jenisPekerjaan').value;
    const sub = document.getElementById('subKomponen').value;
    const mat = document.getElementById('material');
    mat.innerHTML = '<option value="">Pilih Material</option>';
    if (!jenis || !sub) return;
    const filtered = masterData.filter(item =>
        item.Pekerjaan.split(' - ')[0] === jenis &&
        item.Sub_Komponen === sub
    );
    new Set(filtered.map(i => i.Material))
        .forEach(m => mat.appendChild(new Option(m, m)));
}

function addItem() {
    const jenis = document.getElementById('jenisPekerjaan').value;
    const sub = document.getElementById('subKomponen').value;
    const material = document.getElementById('material').value;
    const volume = parseFloat(document.getElementById('volume').value);
    if (!jenis || !sub || !material || isNaN(volume) || volume <= 0) {
        return alert('Lengkapi semua field');
    }
    const data = masterData.find(item =>
        item.Pekerjaan.split(' - ')[0] === jenis &&
        item.Sub_Komponen === sub &&
        item.Material === material
    );
    if (!data) return alert('Data tidak ditemukan');
    const harga = parseFloat(data.Harga_Material_per_m3);
    const pct = parseFloat(data.Tarif_Pajak_Persen) / 100;
    const total = volume * harga * pct;
    const tbody = document.querySelector('#resultTable tbody');
    const row = tbody.insertRow();
    [jenis, sub, material,
     volume.toLocaleString('id-ID',{minimumFractionDigits:2,maximumFractionDigits:2}),
     harga.toLocaleString('id-ID'),
     (pct*100)+'%',
     total.toLocaleString('id-ID',{style:'currency',currency:'IDR'})
    ].forEach((txt,i)=> row.insertCell(i).textContent = txt);
    const del = row.insertCell(7);
    const btn = document.createElement('button');
    btn.innerHTML = '<i class="fa fa-trash"></i>';
    btn.onclick = () => deleteRow(row);
    del.appendChild(btn);
    updateTotalPajak();
    document.getElementById('jenisPekerjaan').disabled = true;
    ['volume','catatan','subKomponen','material'].forEach(id=> document.getElementById(id).value = '');
    loadSubComponents();
}

function deleteRow(row) {
    if (!confirm('Hapus baris ini?')) return;
    row.remove();
    updateTotalPajak();
    if (!document.querySelector('#resultTable tbody tr')) {
        document.getElementById('jenisPekerjaan').disabled = false;
    }
}

function updateTotalPajak() {
    let sum = 0;
    document.querySelectorAll('#resultTable tbody tr').forEach(r=>{
        const txt = r.cells[6].textContent.replace(/Rp\s?|\./g,'').replace(',','.');
        sum += parseFloat(txt) || 0;
    });
    document.getElementById('totalPajak').textContent =
        'Total Pajak: '+ sum.toLocaleString('id-ID',{style:'currency',currency:'IDR'});
}

function resetTable() {
    document.querySelector('#resultTable tbody').innerHTML = '';
    updateTotalPajak();
    const sel = document.getElementById('jenisPekerjaan');
    sel.disabled = false;
    sel.value = '';
    loadSubComponents();
}

function printPDF() {
    alert('Cetak halaman ini');
    window.print();
}

toggleMode.addEventListener('click',()=>{
    document.body.classList.toggle('dark');
    toggleMode.innerHTML = document.body.classList.contains('dark')
        ? '<i class="fa fa-sun"></i>'
        : '<i class="fa fa-moon"></i>';
});

/* mode gelap */
const darkStyles = document.createElement('style');
darkStyles.textContent = `
body.dark {
    background: #222;
    color: #ddd;
}
body.dark .container {
    background: #333;
    box-shadow: none;
}
body.dark input, body.dark select, body.dark textarea {
    background: #444;
    color: #eee;
    border: 1px solid #555;
}
body.dark table, body.dark th, body.dark td {
    background: #333;
    color: #eee;
    border-color: #555;
}
body.dark th {
    background: #555;
}
body.dark .print-header, body.dark .identitas-usaha {
    background: #444;
    border-color: #555;
}`;
document.head.appendChild(darkStyles);
