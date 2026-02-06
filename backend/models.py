from sqlalchemy import Column, Integer, String, Float, Date
from database import Base
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    category = Column(String, nullable=False)
    description = Column(String)
    date = Column(Date, nullable=False)
    type = Column(String, nullable=False) # 'income' eller 'expense'
    user_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)