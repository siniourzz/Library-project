from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt

from .database import engine, get_db
from . import models, schemas, auth, seed_data

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Kütüphane Yönetim Sistemi API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

@app.on_event("startup")
def startup_event():
    db = next(get_db())
    seed_data.clean_and_seed_data(db)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Kimlik bilgileri doğrulanamadı",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

# --- USER ACTIONS ---
@app.post("/register", response_model=schemas.UserResponse)
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="E-posta zaten kayıtlı")
    hashed = auth.hash_password(user_data.password)
    new_user = models.User(email=user_data.email, hashed_password=hashed, role=user_data.role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/token", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Hatalı e-posta veya şifre")
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users", response_model=List[schemas.UserResponse])
def get_all_users(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Bu veri için yetkiniz yok")
    return db.query(models.User).all()

# --- BOOK MANAGEMENT (CRUD) ---
@app.get("/books", response_model=List[schemas.BookResponse])
def get_books(search: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Book)
    if search:
        query = query.filter(
            models.Book.title.ilike(f"%{search}%") |
            models.Book.author.ilike(f"%{search}%") |
            models.Book.isbn.ilike(f"%{search}%") |
            models.Book.publisher.ilike(f"%{search}%")
        )
    return query.all()

@app.post("/books", response_model=schemas.BookResponse)
def add_book(book: schemas.BookCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.LIBRARIAN]:
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    db_book = models.Book(**book.dict())
    db.add(db_book)
    db.commit()
    db.refresh(db_book)
    return db_book

@app.put("/books/{isbn}", response_model=schemas.BookResponse)
def update_book(isbn: str, updated_fields: schemas.BookCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.LIBRARIAN]:
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok")
    book = db.query(models.Book).filter(models.Book.isbn == isbn).first()
    if not book:
        raise HTTPException(status_code=404, detail="Kitap bulunamadı")
    for key, value in updated_fields.dict().items():
        setattr(book, key, value)
    db.commit()
    db.refresh(book)
    return book

@app.delete("/books/{isbn}")
def delete_book(isbn: str, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in [models.UserRole.ADMIN, models.UserRole.LIBRARIAN]:
        raise HTTPException(status_code=403, detail="Bu işlem için yetkiniz yok. Sadece Yönetici ve Kütüphaneciler kitap silebilir.")
    
    book = db.query(models.Book).filter(models.Book.isbn == isbn).first()
    if not book:
        raise HTTPException(status_code=404, detail="Kitap bulunamadı")
    
    if not book.is_available:
        raise HTTPException(status_code=400, detail="Bu kitap şu anda ödünç alınmış durumda. İade edilmeden sistemden silinemez.")
        
    db.delete(book)
    db.commit()
    return {"message": "Kitap sistemden başarıyla silindi"}

# --- BORROW & RETURN ---
@app.post("/borrow")
def borrow_book(req: schemas.BorrowRequest, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    book = db.query(models.Book).filter(models.Book.isbn == req.isbn).first()
    if not book:
        raise HTTPException(status_code=404, detail="Kitap bulunamadı")
    if not book.is_available:
        raise HTTPException(status_code=400, detail="Kitap şu an ödünçte, rezervasyon yapabilirsiniz")
    
    book.is_available = False
    transaction = models.BorrowTransaction(
        user_id=current_user.user_id,
        isbn=book.isbn,
        due_date=datetime.utcnow() + timedelta(days=14),
        status=models.TransactionStatus.BORROWED
    )
    db.add(transaction)
    db.commit()
    return {"message": "Kitap başarıyla ödünç alındı", "due_date": transaction.due_date}

@app.post("/return")
def return_book(req: schemas.ReturnRequest, db: Session = Depends(get_db)):
    tx = db.query(models.BorrowTransaction).filter(models.BorrowTransaction.transaction_id == req.transaction_id).first()
    if not tx or tx.status == models.TransactionStatus.RETURNED:
        raise HTTPException(status_code=400, detail="Geçersiz veya zaten tamamlanmış işlem")
    
    tx.status = models.TransactionStatus.RETURNED
    tx.return_date = datetime.utcnow()
    book = db.query(models.Book).filter(models.Book.isbn == tx.isbn).first()
    if book:
        book.is_available = True
    db.commit()
    return {"message": "Kitap başarıyla iade edildi"}

# --- RESERVATION ---
@app.post("/reserve")
def reserve_book(req: schemas.BorrowRequest, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    book = db.query(models.Book).filter(models.Book.isbn == req.isbn).first()
    if not book:
        raise HTTPException(status_code=404, detail="Kitap bulunamadı")
    
    if book.is_available == True:
        raise HTTPException(status_code=400, detail="Kitap şu an müsait durumda. Doğrudan ödünç alabilirsiniz!")
    
    existing = db.query(models.Reservation).filter(
        models.Reservation.user_id == current_user.user_id,
        models.Reservation.isbn == req.isbn,
        models.Reservation.status == models.ReservationStatus.PENDING
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bu kitap için zaten aktif bir rezervasyonunuz bulunmaktadır.")

    res = models.Reservation(user_id=current_user.user_id, isbn=req.isbn, status=models.ReservationStatus.PENDING)
    db.add(res)
    db.commit()
    return {"message": "Rezervasyon kaydınız başarıyla oluşturuldu! Kitap iade edildiğinde size atanacaktır."}

# --- REPORTING & ANALYTICS ---
@app.get("/reports", response_model=schemas.ReportResponse)
def get_reports(db: Session = Depends(get_db)):
    total_books = db.query(models.Book).count()
    active_loans = db.query(models.BorrowTransaction).filter(models.BorrowTransaction.status == models.TransactionStatus.BORROWED).count()
    overdue_books = db.query(models.BorrowTransaction).filter(models.BorrowTransaction.due_date < datetime.utcnow(), models.BorrowTransaction.status == models.TransactionStatus.BORROWED).count()

    popular = db.query(models.Book.title, func.count(models.BorrowTransaction.transaction_id).label("count"))\
        .join(models.BorrowTransaction).group_by(models.Book.title).order_by(func.count(models.BorrowTransaction.transaction_id).desc()).limit(3).all()
    popular_list = [{"title": p[0], "count": p[1]} for p in popular]

    return {
        "total_books": total_books,
        "active_loans": active_loans,
        "overdue_books": overdue_books,
        "popular_books": popular_list,
        "monthly_stats": [{"month": "Haziran", "loans": active_loans}]
    }

@app.get("/users/me/history", response_model=List[schemas.TransactionResponse])
def get_history(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.BorrowTransaction).filter(models.BorrowTransaction.user_id == current_user.user_id).all()