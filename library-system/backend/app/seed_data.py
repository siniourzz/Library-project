from sqlalchemy.orm import Session
from .models import Book, User, UserRole
from .auth import hash_password

def clean_and_seed_data(db: Session):
    # Başlangıç Kullanıcı Rolleri Tanımlama
    if not db.query(User).filter(User.email == "admin@library.com").first():
        db.add_all([
            User(email="admin@library.com", hashed_password=hash_password("admin123"), role=UserRole.ADMIN),
            User(email="librarian@library.com", hashed_password=hash_password("lib123"), role=UserRole.LIBRARIAN),
            User(email="student@library.com", hashed_password=hash_password("student123"), role=UserRole.STUDENT)
        ])
    
    if db.query(Book).first() is not None:
        db.commit()
        return

    # Kaggle Veri Kümesi Yapısı
    raw_kaggle = [
        {"isbn": "0195153448", "title": "Classical Mythology", "author": "Mark Morford", "publisher": "Oxford Press", "year": 2002},
        {"isbn": "0002005018", "title": "Clara Callan", "author": "Richard Wright", "publisher": "Harper", "year": 2001},
        {"isbn": "0399135782", "title": "The Kitchen God's Wife", "author": "Amy Tan", "publisher": "Putnam", "year": 1991},
        {"isbn": "0440234743", "title": "The Testament", "author": "John Grisham", "publisher": "Dell", "year": 1999},
        {"isbn": "0671870432", "title": "Primal Fear", "author": "William Diehl", "publisher": "Ballantine", "year": 1993}
    ]
    
    for r in raw_kaggle:
        book = Book(
            isbn=r["isbn"],
            title=r["title"],
            author=r["author"],
            publisher=r["publisher"],
            year_of_publication=r["year"],
            is_available=True
        )
        db.add(book)
    db.commit()

    