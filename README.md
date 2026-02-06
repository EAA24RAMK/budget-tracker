# Budget Tracker

En simpel webapp til at holde styr på ens personlige økonomi. Bygget med **Python (FastAPI)** backend og **Vanilla JavaScript** frontend.

## Funktionalitet

- **Brugerregistrering & Login**: Hver bruger har sin egen isolerede data (JWT Authentication).
- **Indtægter & Udgifter**: Tilføj poster med kategori, dato og beskrivelse.
- **Dashboard**: Se din nuværende saldo, samt totale indtægter og udgifter.
- **Data Visualisering**: 
  - Grafer over forbrug fordelt på poster.
  - Udvikling af saldo over tid.
- **Responsivt Design**: Virker på både desktop og mobil med et moderne banking-app look.

## Teknologier

- **Backend**: Python 3.13, FastAPI, SQLAlchemy, SQLite, Passlib (Argon2 kryptering).
- **Frontend**: HTML, CSS, JavaScript, Chart.js.

## Installation

1.  **Klon projektet:**
    ```bash
    git clone https://github.com/DIT_BRUGERNAVN/budget-tracker.git
    cd budget-tracker
    ```

2.  **Opsæt Backend:**
    ```bash
    cd backend
    python3 -m venv .venv
    source .venv/bin/activate  # På Windows: .venv\Scripts\activate
    pip install fastapi uvicorn sqlalchemy passlib argon2-cffi python-jose[cryptography] python-multipart
    ```

3.  **Kør Serveren:**
    ```bash
    uvicorn main:app --reload
    ```
    Serveren kører nu på `http://127.0.0.1:8000`.

4.  **Åben Frontend:**
    Åben `frontend/index.html` direkte i din browser, eller brug "Live Server" extension i VS Code.

    Evt. brug python -m http.server 5050 i frontend mappen, til at starte frontend serveren, hvis det ikke virker.

## Sikkerhed

Dette er et hobbyprojekt. `SECRET_KEY` i `security.py` er hardcoded til udvikling. I en rigtig produktion skal denne flyttes til Environment Variables.

## Licens

MIT License. Fri til at kopiere og bruge.
