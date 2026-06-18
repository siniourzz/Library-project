# 📚 Shadi's Library - Kütüphane Yönetim Sistemi

Shadi's Library, kütüphaneciler ve öğrencilerin web tabanlı bir arayüz üzerinden kitap kataloglarını keşfetmelerine, ödünç alma/iade süreçlerini takip etmelerine ve gelişmiş rezervasyon sıraları ile analitik raporlar oluşturmalarına olanak tanıyan, full-stack dinamik bir **Kütüphane Yönetim Sistemi** uygulamasıdır. 

Bu proje, **IYD 328 - İş Yeri Deneyimi** dersi kapsamında, başlangıç veri kümesi olarak temizlenmiş Kaggle Books veri setini entegre ederek geliştirilmiştir.

---

## 🛠️ Teknolojik Altyapı (Seçenek 2)

Proje, birbirleriyle izole ve Docker container'ları üzerinde haberleşen 3 katmanlı mikroservis mimarisine sahiptir:

* **Arayüz (Frontend):** React.js (Vite) — 
* **Sunucu Katmanı (Backend API):** Python 3.10 — **FastAPI** Framework
* **Veritabanı Katmanı (Database):** SQL Tabanlı İlişkisel Veritabanı — **SQLAlchemy ORM**
* **Konteynerleştirme ve Dağıtım:** **Docker & Docker Compose**

---

## ✨ Temel Özellikler & İş Mantığı Kuralları

1.  **Kullanıcı Kayıt ve Güvenli Giriş Sistemi:**
    * Kullanıcı şifreleri veritabanında düz metin olarak değil, güvenli `hashlib.pbkdf2_hmac` SHA-256 algoritmasıyla şifrelenerek saklanır.
    * Oturum yönetimi **JWT (JSON Web Token)** tabanlı yürütülür.
2.  **Rol Tabanlı Erişim Kontrolü (RBAC):**
    * **Öğrenci (Student):** Kataloğu arayabilir, uygun kitapları ödünç alabilir veya rezervasyon oluşturabilir. Kitap silme yetkisi yoktur (`🔒 Locked`).
    * **Kütüphaneci & Yönetici (Librarian/Admin):** Kataloğa yeni kitap ekleyebilir ve **yalnızca rafta (müsait) olan** kitapları kalıcı olarak silebilir.
3.  **Akıllı Ödünç Alma & Rezervasyon Sistemi:**
    * Mevcut (Available) bir kitap tek tıkla 14 gün süreyle ödünç alınabilir.
    * Eğer bir kitap ödünç verilmişse (`🎀 Checked Out`), arayüzde dinamik olarak **Reserve** butonu belirir. Kullanıcılar mükerrer (üst üste) rezervasyon oluşturamaz.
4.  **Raporlama ve Analitik:**
    * Toplam kitap envanteri, aktif ödünçteki kitap sayısı ve gecikmiş teslimatların anlık takibi.
    * Sistemde en çok talep gören (popüler) kitapların istatistiksel dökümü.

---

## 🚀 Projeyi Ayağa Kaldırma (Quick Start Guide)

Sistem tamamen Dockerize edildiğinden, bilgisayarınızda yerel Python, Node.js veya SQL kurulumuna **ihtiyaç duymaz**. Sadece Docker'ın çalışır durumda olması yeterlidir.

### 1. Proje Klasörüne Gidin
Terminal uygulamasını açın ve projenin ana dizinine (içinde `docker-compose.yml` bulunan dizin) geçiş yapın:
```bash



-----------------------------------------------------
1. Docker Container Yapılarını Temizleyin ve Başlatın

Eski veritabanı kalıntılarını temizlemek, güncellenmiş FastAPI kaynak kodlarını derlemek ve tüm servisleri ayağa kaldırmak için aşağıdaki komut dizisini çalıştırın:
Bash

# Eski volume yapılarını temizle, önbelleksiz yeniden derle ve başlat
docker compose down -v
docker compose build --no-cache
docker compose up

2. Uygulamaya Erişin

Container'lar başarıyla ayağa kalktığında terminalinizde INFO: Uvicorn server running on http://0.0.0.0:8000 yazısını göreceksiniz. Tarayıcınızdan (Firefox/Chrome) aşağıdaki adreslere gidebilirsiniz:

    Frontend Arayüzü: http://localhost:3000

    Backend API (Swagger Docs): http://localhost:8000/docs



** Yönetici (Admin)	admin@library.com	admin123	Kitap ekleyebilir, Müsait kitapları silebilir, Raporları inceler. **

** Kütüphaneci (Librarian)	librarian@library.com	lib123	Kitap yönetimi ve CRUD işlemlerini yürütür.** 

** Öğrenci (Student)	student@library.com	student123	Kitap ödünç alır/iade eder, Rezervasyon yapar. Silme yetkisi kilitlidir. **


------------------------------------------------

📡 REST API Uç Noktaları (Endpoints)

Proje mimarisinde projenin isterlerine tam uyumlu şu REST uç noktaları sağlanmıştır:

    POST /register - Yeni kullanıcı kaydı.

    POST /token - Giriş yapma ve JWT token alma.

    GET /books - Kitapları listeleme, filtreleme ve arama.

    POST /books - Yeni kitap envanteri ekleme (Admin/Librarian).

    DELETE /books/{isbn} - Mevcut kitabı sistemden silme (Admin/Librarian).

    POST /borrow - Kitap ödünç alma işlemi.

    POST /return - Kitap iade etme işlemi.

    POST /reserve - Mevcut olmayan kitap için rezervasyon sırası açma.

    GET /reports - Toplam veri, aktif ödünç ve popüler kitap analitiği.

    GET /users/me/history - Giriş yapmış kullanıcının kendi geçmiş işlem logları.



    ------------------------------------------
    

    ├── backend
│   ├── app
│   │   ├── auth.py         # Güvenli parola hashleme ve JWT üreteçleri
│   │   ├── database.py     # SQLAlchemy Engine ve Session ayarları
│   │   ├── main.py         # FastAPI Core Router ve İş Mantığı kuralları
│   │   ├── models.py       # SQL Tablo yapıları (Books, Users, BorrowTransactions, Reservations)
│   │   ├── schemas.py      # Pydantic DTO Veri Doğrulama Şemaları
│   │   └── seed_data.py    # Kaggle Books veri seti temizleme ve yükleme betiği
│   └── Dockerfile
├── frontend
│   ├── src
│   │   ├── App.jsx         # Soft/Aesthetic Arayüz Yapısı (Shadi's Library UI)
│   │   └── main.jsx
│   └── Dockerfile
└── docker-compose.yml      # Multi-container orkestrasyon dosyası
