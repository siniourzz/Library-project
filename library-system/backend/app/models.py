import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class UserRole(str, enum.Enum):
    ADMIN = "Yönetici"
    LIBRARIAN = "Kütüphaneci"
    STUDENT = "Öğrenci"

class TransactionStatus(str, enum.Enum):
    BORROWED = "Ödünç Alındı"
    RETURNED = "İade Edildi"
    OVERDUE = "Gecikti"

class ReservationStatus(str, enum.Enum):
    PENDING = "Beklemede"
    COMPLETED = "Tamamlandı"
    CANCELLED = "İptal Edildi"

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.STUDENT, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    transactions = relationship("BorrowTransaction", back_populates="user")
    reservations = relationship("Reservation", back_populates="user")

class Book(Base):
    __tablename__ = "books"

    isbn = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    author = Column(String, nullable=False, index=True)
    publisher = Column(String, nullable=False)
    year_of_publication = Column(Integer, nullable=False)
    is_available = Column(Boolean, default=True)

    transactions = relationship("BorrowTransaction", back_populates="book")
    reservations = relationship("Reservation", back_populates="book")

class BorrowTransaction(Base):
    __tablename__ = "borrow_transactions"

    transaction_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    isbn = Column(String, ForeignKey("books.isbn"), nullable=False)
    borrow_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    due_date = Column(DateTime, nullable=False)
    return_date = Column(DateTime, nullable=True)
    status = Column(SQLEnum(TransactionStatus), default=TransactionStatus.BORROWED, nullable=False)

    user = relationship("User", back_populates="transactions")
    book = relationship("Book", back_populates="transactions")

class Reservation(Base):
    __tablename__ = "reservations"

    reservation_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    isbn = Column(String, ForeignKey("books.isbn"), nullable=False)
    reservation_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(SQLEnum(ReservationStatus), default=ReservationStatus.PENDING, nullable=False)

    user = relationship("User", back_populates="reservations")
    book = relationship("Book", back_populates="reservations")