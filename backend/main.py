from fastapi import FastAPI, Depends, Query, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from security import verify_password, create_access_token
from datetime import datetime, date
from sqlalchemy.orm import Session
from security import hash_password, get_current_user

from database import engine, get_db
from models import Base, Expense, User
from schemas import ExpenseCreate, ExpenseResponse, UserCreate, UserResponse, Token

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

# Root endpoint til at tjekke om API'en kører
@app.get("/")
def root():
    return {"message": "Budget Tracker API is running"}

# Opretter en ny udgift/indtægt i databasen for den loggede ind bruger
@app.post("/expenses", response_model=ExpenseResponse)
def create_expense(
    expense: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_expense = Expense(**expense.dict(), user_id=current_user.id)
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)
    return new_expense

# Henter alle udgifter for en bruger, evt. filtreret på måned
@app.get("/expenses", response_model=list[ExpenseResponse])
def get_expenses(
    month: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Expense).filter(Expense.user_id == current_user.id)

    if month:
        start_date = datetime.strptime(month + "-01", "%Y-%m-%d").date()

        if start_date.month == 12:
            end_date = datetime(start_date.year + 1, 1, 1).date()
        else:
            end_date = datetime(start_date.year, start_date.month + 1, 1).date()

        query = query.filter(
            Expense.date >= start_date,
            Expense.date < end_date
        )

    return query.order_by(Expense.date).all()

# Beregner samlet indtægt, udgift og balance for en periode
@app.get("/summary")
def get_summary(
    month: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Expense).filter(Expense.user_id == current_user.id)

    if month:
        start_date = datetime.strptime(month + "-01", "%Y-%m-%d").date()
        if start_date.month == 12:
            end_date = date(start_date.year + 1, 1, 1)
        else:
            end_date = date(start_date.year, start_date.month + 1, 1)

        query = query.filter(
            Expense.date >= start_date,
            Expense.date < end_date
        )

    expenses = query.all()

    total_income = sum(e.amount for e in expenses if e.type == "income")
    total_expense = sum(e.amount for e in expenses if e.type == "expense")

    return {
        "total_income": total_income,
        "total_expense": total_expense,
        "balance": total_income - total_expense
    }

# Grupperer udgifter pr. kategori for at vise i grafer
@app.get("/summary/category")
def summary_by_category(
    month: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Expense).filter(
        Expense.user_id == current_user.id,
        Expense.type == "expense"
    )

    if month:
        start_date = datetime.strptime(month + "-01", "%Y-%m-%d").date()
        if start_date.month == 12:
            end_date = date(start_date.year + 1, 1, 1)
        else:
            end_date = date(start_date.year, start_date.month + 1, 1)

        query = query.filter(
            Expense.date >= start_date,
            Expense.date < end_date
        )

    result = {}
    for e in query.all():
        result[e.category] = result.get(e.category, 0) + e.amount

    return result

# Grupperer udgifter pr. måned over tid
@app.get("/summary/month")
def summary_by_month(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    expenses = db.query(Expense).filter(
        Expense.user_id == current_user.id,
        Expense.type == "expense"
    ).all()

    result = {}
    for e in expenses:
        month = e.date.strftime("%Y-%m")
        result[month] = result.get(month, 0) + e.amount

    return result

# Sletter en specifik udgift baseret på ID
@app.delete("/expenses/{expense_id}")
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == current_user.id
    ).first()

    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    db.delete(expense)
    db.commit()

    return {"message": "Expense deleted"}

# Opretter en ny bruger og hasher adgangskoden
@app.post("/signup", response_model=UserResponse)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    existing  = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        email=user.email,
        hashed_password=hash_password(user.password)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

# Logger brugeren ind og returnerer en JWT access token
@app.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}
