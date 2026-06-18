from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    role: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    user_id: int
    created_at: datetime
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class BookBase(BaseModel):
    isbn: str
    title: str
    author: str
    publisher: str
    year_of_publication: int

class BookCreate(BookBase):
    pass

class BookResponse(BookBase):
    is_available: bool
    class Config:
        from_attributes = True

class BorrowRequest(BaseModel):
    isbn: str

class ReturnRequest(BaseModel):
    transaction_id: int

class TransactionResponse(BaseModel):
    transaction_id: int
    user_id: int
    isbn: str
    borrow_date: datetime
    due_date: datetime
    return_date: Optional[datetime]
    status: str
    class Config:
        from_attributes = True

class ReservationResponse(BaseModel):
    reservation_id: int
    user_id: int
    isbn: str
    reservation_date: datetime
    status: str
    class Config:
        from_attributes = True

class ReportResponse(BaseModel):
    total_books: int
    active_loans: int
    overdue_books: int
    popular_books: List[dict]
    monthly_stats: List[dict]