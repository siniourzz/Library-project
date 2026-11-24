# 📚  Library - Kütüphane Yönetim Sistemi

Shadi's Library, kütüphaneciler ve öğrencilerin web tabanlı bir arayüz üzerinden kitap kataloglarını keşfetmelerine, ödünç alma/iade süreçlerini takip etmelerine ve gelişmiş rezervasyon sıraları ile analitik raporlar oluşturmalarına olanak tanıyan, full-stack dinamik bir **Kütüphane Yönetim Sistemi** uygulamasıdır. 

Bu proje, **IYD 328 - İş Yeri Deneyimi** dersi kapsamında, başlangıç veri kümesi olarak temizlenmiş Kaggle Books veri setini entegre ederek geliştirilmiştir.

---

## 🚀 Teknolojik Altyapı (Tech Stack)

### Backend
* **Dil/Framework:** Python 3.10+ / FastAPI (Asenkron, yüksek performanslı REST API)
* **Veritabanı & ORM:** PostgreSQL / SQLAlchemy
* **Güvenlik:** JWT (JSON Web Tokens) ile rol tabanlı yetkilendirme (`ADMIN`, `LIBRARIAN`, `STUDENT`)
* **Veri Doğrulama:** Pydantic DTO şemaları

### Frontend
* **Dil/Framework:** JavaScript / React.js (Vite altyapısı)
* **Arayüz Tasarımı:** Tailwind CSS (Soft/Aesthetic Modern UI)

### DevOps & Konteynerleştirme
* **Docker:** Backend ve Frontend servisleri için optimize edilmiş `Dockerfile` mimarisi
* **Docker Compose:** Tek komutla tüm sistemi (Veritabanı, Backend, Frontend) ayağa kaldıran orkestrasyon

---

## 🛠️ Temel Özellikler (Features)

* **Rol Tabanlı Kimlik Doğrulama:** Kullanıcılar rollerine göre dinamik olarak filtrelenmiş arayüzlere erişir.
* **Gelişmiş Kitap Kataloğu:** ISBN, başlık, yazar ve yayınevine göre anlık arama ve listeleme.
* **Ödünç Alma & İade Döngüsü:** Süreç takibi, stok kontrolü ve aktif işlem logları.
* **Akıllı Rezervasyon Sistemi:** Ödünç alınmış kitaplar için dinamik rezervasyon sırası oluşturma.
* **Otomatik Veri Besleme (Seeding):** Temizlenmiş Kaggle veri setinin sistem ilk açıldığında otomatik olarak veritabanına yüklenmesi.

---

## 📦 Proje Yapısı (Project Structure)

```text
├── backend
│   ├── app
│   │   ├── auth.py          # Güvenli parola hashleme ve JWT üreteçleri
│   │   ├── database.py      # SQLAlchemy Engine ve Session ayarları
│   │   ├── main.py          # FastAPI Core Router ve İş Mantığı kuralları
│   │   ├── models.py        # SQL Tablo yapıları (Books, Users, Borrow, Reservations)
│   │   ├── schemas.py       # Pydantic DTO Veri Doğrulama Şemaları
│   │   └── seed_data.py     # Kaggle Books veri seti temizleme ve yükleme betiği
│   ├── Dockerfile
│   └── requirements.txt
├── frontend
│   ├── src
│   │   ├── App.jsx          # Soft/Aesthetic Arayüz Yapısı
│   │   └── main.jsx
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml
