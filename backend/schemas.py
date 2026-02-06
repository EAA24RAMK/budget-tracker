from pydantic import BaseModel, EmailStr
from datetime import date

class ExpenseBase(BaseModel):
    amount: float
    category: str
    description: str | None = None
    date: date
    type: str # income / expense

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseResponse(ExpenseBase):
    id: int

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"