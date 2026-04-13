from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# React (Frontend) tarafının bu backend'e bağlanabilmesi için gerekli izinler
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"status": "success", "message": "Duty Cycle API aktif ve Burak'ın komutlarını bekliyor!"}

# İleride personel verilerini buraya ekleyeceğiz
@app.get("/personel")
def get_personel():
    return {"data": []}