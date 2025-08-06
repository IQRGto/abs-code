// Data siswa
const students = [
{ id: "001", name: "AFDAL IBRAHIM", barcode: "STD001" },
{ id: "002", name: "AFDIL SETIYAWAN IBRAHIM", barcode: "STD002" },
{ id: "003", name: "ALFI ISMAIL", barcode: "STD003" },
{ id: "004", name: "BALGIS R. GUBALI", barcode: "STD004" },
{ id: "005", name: "FRENDIANSYAH H. ANWAR", barcode: "STD005" },
{ id: "006", name: "GALANG F. HASAN", barcode: "STD006" },
{ id: "007", name: "MARWAN SALEH", barcode: "STD007" },
{ id: "008", name: "MOHAMAD ARUL KASIM", barcode: "STD008" },
{ id: "009", name: "ZUNZUNRISKA ISMAIL", barcode: "STD009" },
{ id: "010", name: "MOHAMAT SAIPUL ABDULLAH", barcode: "STD010" },
{ id: "011", name: "MUH.ALIF PAULAJI", barcode: "STD011" },
{ id: "012", name: "SRY YANI B. MAHMUD", barcode: "STD012" },
{ id: "013", name: "RIVAI.M.BAKARI", barcode: "STD013" },
{ id: "014", name: "ADELIYANTI HAIRUN NISA NTYEA", barcode: "STD014" },
{ id: "015", name: "SALSABILA J. SUDAI", barcode: "STD015" },
{ id: "016", name: "DESRI OTOLUWA", barcode: "STD016" },
{ id: "017", name: "ASRIYA LIHAWALO", barcode: "STD017" },
{ id: "018", name: "DEYA LAMAJI", barcode: "STD018" },
{ id: "019", name: "EGI SAPUTRA HARUN", barcode: "STD019" },
{ id: "020", name: "REVALINA LAGANI", barcode: "STD020" },
{ id: "021", name: "MAYMUN BOHUSANGE", barcode: "STD021" },
{ id: "022", name: "NACA LIPUTO", barcode: "STD022" },
{ id: "023", name: "RISKA I DJOLE", barcode: "STD023" },
{ id: "024", name: "SANDRA AULIA RAHMAN", barcode: "STD024" },
{ id: "025", name: "SRI ANNISA KADIR", barcode: "STD025" },
{ id: "026", name: "SRI NATALIA HARUN", barcode: "STD026" },
{ id: "027", name: "WISYA HUDI", barcode: "STD027" },
{ id: "028", name: "M.ADIMANSYAH PUTRA ARFA", barcode: "STD028" },
{ id: "029", name: "MUHAMMAD REZEKI DERMAWAN", barcode: "STD029" },
{ id: "030", name: "REVALINA LAGANI", barcode: "STD030" },
];


// Struktur data absensi
let attendanceData = {};
let currentDate = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
let html5QrCodeScanner = null;
let isScanning = false;

// Inisialisasi aplikasi
document.addEventListener('DOMContentLoaded', function() {
  initDatePicker();
  initAttendanceData();
  renderStudentList();
  updateStatistics();
  setupEventListeners();
});

// Fungsi inisialisasi
function initDatePicker() {
  const dateInput = document.getElementById('attendanceDate');
  dateInput.value = currentDate;
  dateInput.max = currentDate; // Tidak boleh memilih tanggal setelah hari ini
  
  // Format tampilan tanggal
  document.getElementById('currentDate').textContent = formatIndonesianDate(currentDate);
}

function initAttendanceData() {
  // Cek localStorage untuk data yang sudah tersimpan
  const savedData = localStorage.getItem('attendanceData');
  if (savedData) {
    attendanceData = JSON.parse(savedData);
  }
  
  // Inisialisasi jika belum ada data untuk tanggal terpilih
  if (!attendanceData[currentDate]) {
    attendanceData[currentDate] = {};
  }
}

// Fungsi Scanner
function startScanning() {
  if (isScanning) return;

  const readerElement = document.getElementById('reader');
  readerElement.classList.remove('hidden');
  
  html5QrCodeScanner = new Html5Qrcode("reader");
  
  const config = {
    fps: 10,
    qrbox: { width: 250, height: 250 },
    aspectRatio: 1.0
  };

  html5QrCodeScanner.start(
    { facingMode: "environment" }, // Use back camera
    config,
    onScanSuccess,
    onScanFailure
  ).then(() => {
    isScanning = true;
    document.getElementById('startScanBtn').classList.add('hidden');
    document.getElementById('stopScanBtn').classList.remove('hidden');
    readerElement.classList.add('scan-animation');
  }).catch(err => {
    console.error('Error starting scanner:', err);
    showResultMessage('❌ Gagal memulai scanner. Pastikan kamera diizinkan.', 'error');
  });
}

function stopScanning() {
  if (!isScanning || !html5QrCodeScanner) return;

  html5QrCodeScanner.stop().then(() => {
    isScanning = false;
    document.getElementById('reader').classList.add('hidden');
    document.getElementById('reader').classList.remove('scan-animation');
    document.getElementById('startScanBtn').classList.remove('hidden');
    document.getElementById('stopScanBtn').classList.add('hidden');
  }).catch(err => {
    console.error('Error stopping scanner:', err);
  });
}

function onScanSuccess(decodedText, decodedResult) {
  // Find student by barcode
  const student = students.find(s => s.barcode === decodedText);
  
  if (student) {
    if (attendanceData[currentDate][student.barcode]) {
      showResultMessage(`⚠️ ${student.name} sudah absen sebelumnya!`, 'warning');
    } else {
      recordAttendance(student.barcode, '1');
      showResultMessage(`✅ ${student.name} berhasil absen!`, 'success');
      
      // Auto stop scanning after successful scan
      setTimeout(() => {
        stopScanning();
      }, 2000);
    }
  } else {
    showResultMessage('❌ Barcode tidak dikenali!', 'error');
  }
}

function onScanFailure(error) {
  // Handle scan failure silently - this is normal during scanning
}

function recordAttendance(barcode, status) {
  if (!attendanceData[currentDate]) {
    attendanceData[currentDate] = {};
  }
  
  attendanceData[currentDate][barcode] = { 
    status: status,
    timestamp: new Date().toISOString() 
  };
  
  // Simpan ke localStorage
  localStorage.setItem('attendanceData', JSON.stringify(attendanceData));
  
  renderStudentList();
  updateStatistics();
}

// Fungsi tampilan
function renderStudentList() {
  const listContainer = document.getElementById('studentList');
  listContainer.innerHTML = '';

  const todayAttendance = attendanceData[currentDate] || {};

  students.forEach(student => {
    const statusInfo = todayAttendance[student.barcode] || { status: 'A' };
    const statusClass = getStatusClass(statusInfo.status);
    const statusText = getStatusText(statusInfo.status);
    
    const studentElement = document.createElement('div');
    studentElement.className = `student-item ${statusClass}`;
    studentElement.innerHTML = `
      <div class="student-info">
        <div>
          <div class="student-name">${student.name}</div>
          <div class="student-id">ID: ${student.id} | Barcode: ${student.barcode}</div>
        </div>
        <div>
          <span class="status-badge ${statusClass}">${statusText}</span>
          <select class="status-select" data-barcode="${student.barcode}">
            <option value="1" ${statusInfo.status === '1' ? 'selected' : ''}>Hadir</option>
            <option value="A" ${statusInfo.status === 'A' ? 'selected' : ''}>Alpa</option>
            <option value="S" ${statusInfo.status === 'S' ? 'selected' : ''}>Sakit</option>
            <option value="I" ${statusInfo.status === 'I' ? 'selected' : ''}>Izin</option>
          </select>
        </div>
      </div>
    `;
    
    listContainer.appendChild(studentElement);
  });

  // Set event listeners untuk dropdown
  document.querySelectorAll('.status-select').forEach(select => {
    select.addEventListener('change', function() {
      const barcode = this.dataset.barcode;
      recordAttendance(barcode, this.value);
    });
  });
}

function updateStatistics() {
  const todayAttendance = attendanceData[currentDate] || {};
  let present = 0, absent = 0, sick = 0, permission = 0;

  students.forEach(student => {
    const status = todayAttendance[student.barcode]?.status || 'A';
    switch(status) {
      case '1': present++; break;
      case 'A': absent++; break;
      case 'S': sick++; break;
      case 'I': permission++; break;
    }
  });

  document.getElementById('totalStudents').textContent = students.length;
  document.getElementById('presentCount').textContent = present;
  document.getElementById('absentCount').textContent = absent;
  document.getElementById('sickCount').textContent = sick;
  document.getElementById('permissionCount').textContent = permission;
}

// Fungsi utilitas
function getStatusClass(status) {
  const statusClasses = {
    '1': 'present',
    'A': 'absent',
    'S': 'sick',
    'I': 'permission'
  };
  return statusClasses[status] || '';
}

function getStatusText(status) {
  const statusTexts = {
    '1': '✅ Hadir',
    'A': '❌ Alpa',
    'S': '🤒 Sakit',
    'I': '📝 Izin'
  };
  return statusTexts[status] || '❓ Unknown';
}

function formatIndonesianDate(dateStr) {
  const date = new Date(dateStr);
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('id-ID', options);
}

function showResultMessage(message, type) {
  const resultDiv = document.getElementById('scanResult');
  const messageP = resultDiv.querySelector('.result-text');
  
  messageP.textContent = message;
  resultDiv.className = `result-${type}`;
  resultDiv.classList.remove('hidden');
  
  setTimeout(() => {
    resultDiv.classList.add('hidden');
  }, 3000);
}

// Event Listeners
function setupEventListeners() {
  // Tombol scanner
  document.getElementById('startScanBtn').addEventListener('click', startScanning);
  document.getElementById('stopScanBtn').addEventListener('click', stopScanning);
  
  // Tombol ganti tanggal
  document.getElementById('changeDateBtn').addEventListener('click', function() {
    const newDate = document.getElementById('attendanceDate').value;
    if (newDate !== currentDate) {
      currentDate = newDate;
      document.getElementById('currentDate').textContent = formatIndonesianDate(currentDate);
      
      // Inisialisasi data jika belum ada
      if (!attendanceData[currentDate]) {
        attendanceData[currentDate] = {};
      }
      
      renderStudentList();
      updateStatistics();
      showResultMessage(`Tanggal absensi diubah ke: ${formatIndonesianDate(currentDate)}`, 'success');
    }
  });
  
  // Tombol export
  document.getElementById('exportBtn').addEventListener('click', exportAttendanceData);
}

// Fungsi export
function exportAttendanceData() {
  const wb = XLSX.utils.book_new();
  
  // Sheet 1: Rekap Harian
  const dailyData = [
    ["REKAP ABSENSI HARIAN"],
    [`Kelas: XII IPA 1 | Tanggal: ${formatIndonesianDate(currentDate)}`],
    [],
    ["No", "Nama Siswa", "ID", "Barcode", "Status", "Waktu Absen"]
  ];

  const todayRecords = attendanceData[currentDate] || {};
  
  students.forEach((student, index) => {
    const record = todayRecords[student.barcode] || { status: 'A' };
    dailyData.push([
      index + 1,
      student.name,
      student.id,
      student.barcode,
      getStatusText(record.status).replace(/[^a-zA-Z]/g, ''),
      record.timestamp ? new Date(record.timestamp).toLocaleTimeString('id-ID') : '-'
    ]);
  });

  const wsDaily = XLSX.utils.aoa_to_sheet(dailyData);
  XLSX.utils.book_append_sheet(wb, wsDaily, "Rekap Harian");
  
  const fileName = `Absensi_${currentDate.replace(/-/g, '')}.xlsx`;
  XLSX.writeFile(wb, fileName);
  
  showResultMessage(`📊 Data berhasil diekspor ke ${fileName}`, 'success');
}
